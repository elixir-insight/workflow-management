-- Allow approved employees to delete their own attendance day entry
-- (clears bad in/out times from the timesheet).

create or replace function private.log_attendance_day_audit()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  subject text;
  changes jsonb := '{}'::jsonb;
  parts text[] := array[]::text[];
begin
  select email into subject from public.profiles where id = coalesce(new.user_id, old.user_id);
  subject := coalesce(subject, coalesce(new.user_id, old.user_id)::text);

  if tg_op = 'INSERT' then
    perform private.write_audit_log(
      'attendance.create',
      'attendance_day',
      new.id,
      subject,
      format(
        'Attendance logged for %s on %s (in %s, out %s)',
        subject,
        new.work_date::text,
        coalesce(new.in_time::text, '—'),
        coalesce(new.out_time::text, '—')
      ),
      jsonb_build_object(
        'work_date', jsonb_build_object('from', null, 'to', to_jsonb(new.work_date::text)),
        'in_time', jsonb_build_object('from', null, 'to', to_jsonb(new.in_time::text)),
        'out_time', jsonb_build_object('from', null, 'to', to_jsonb(new.out_time::text))
      )
    );
    return new;
  end if;

  if tg_op = 'DELETE' then
    perform private.write_audit_log(
      'attendance.delete',
      'attendance_day',
      old.id,
      subject,
      format(
        'Attendance deleted for %s on %s (was in %s, out %s)',
        subject,
        old.work_date::text,
        coalesce(old.in_time::text, '—'),
        coalesce(old.out_time::text, '—')
      ),
      jsonb_build_object(
        'work_date', jsonb_build_object('from', to_jsonb(old.work_date::text), 'to', null),
        'in_time', jsonb_build_object('from', to_jsonb(old.in_time::text), 'to', null),
        'out_time', jsonb_build_object('from', to_jsonb(old.out_time::text), 'to', null)
      )
    );
    return old;
  end if;

  changes := private.audit_change(changes, 'in_time', old.in_time::text, new.in_time::text);
  if old.in_time is distinct from new.in_time then
    parts := array_append(
      parts,
      format('in %s → %s', coalesce(old.in_time::text, '—'), coalesce(new.in_time::text, '—'))
    );
  end if;

  changes := private.audit_change(changes, 'out_time', old.out_time::text, new.out_time::text);
  if old.out_time is distinct from new.out_time then
    parts := array_append(
      parts,
      format('out %s → %s', coalesce(old.out_time::text, '—'), coalesce(new.out_time::text, '—'))
    );
  end if;

  if changes = '{}'::jsonb then
    return new;
  end if;

  perform private.write_audit_log(
    'attendance.update',
    'attendance_day',
    new.id,
    subject,
    format('Attendance updated for %s on %s: %s', subject, new.work_date::text, array_to_string(parts, '; ')),
    changes
  );

  return new;
end;
$function$;

drop trigger if exists attendance_days_audit_log on public.attendance_days;
create trigger attendance_days_audit_log
after insert or update or delete on public.attendance_days
for each row execute function private.log_attendance_day_audit();

create or replace function private.delete_attendance_day(next_work_date date)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'not authenticated';
  end if;

  if not exists (
    select 1 from public.profiles where id = caller and status = 'approved'
  ) then
    raise exception 'not allowed';
  end if;

  if next_work_date is null then
    raise exception 'invalid work date';
  end if;

  if next_work_date > (timezone('utc', now()))::date then
    raise exception 'invalid work date';
  end if;

  delete from public.attendance_days
  where user_id = caller
    and work_date = next_work_date;

  if not found then
    raise exception 'attendance not found';
  end if;
end;
$function$;

create or replace function public.delete_attendance_day(next_work_date date)
returns void
language sql
security invoker
set search_path to ''
as $function$
  select private.delete_attendance_day(next_work_date);
$function$;

grant execute on function public.delete_attendance_day(date) to authenticated;
