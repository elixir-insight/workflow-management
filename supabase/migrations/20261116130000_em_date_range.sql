-- External meeting requests: single work_date → inclusive start_date/end_date range
-- (same shape as leave_requests). Existing rows keep the same calendar day.

alter table public.em_requests
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists day_count numeric;

update public.em_requests
set
  start_date = coalesce(start_date, work_date),
  end_date = coalesce(end_date, work_date),
  day_count = coalesce(day_count, 1)
where start_date is null or end_date is null or day_count is null;

alter table public.em_requests
  alter column start_date set not null,
  alter column end_date set not null,
  alter column day_count set not null,
  alter column day_count set default 1;

alter table public.em_requests
  drop constraint if exists em_requests_date_range_check;

alter table public.em_requests
  add constraint em_requests_date_range_check
  check (end_date >= start_date and day_count > 0);

drop index if exists public.em_requests_user_date_active_idx;

create index if not exists em_requests_user_range_idx
  on public.em_requests (user_id, start_date, end_date);

alter table public.em_requests drop column if exists work_date;

create or replace function private.log_em_request_audit()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  subject text;
  changes jsonb := '{}'::jsonb;
  date_label text;
begin
  select email into subject from public.profiles where id = coalesce(new.user_id, old.user_id);
  subject := coalesce(subject, coalesce(new.user_id, old.user_id)::text);

  if tg_op = 'INSERT' then
    date_label := case
      when new.start_date = new.end_date then new.start_date::text
      else new.start_date::text || ' to ' || new.end_date::text
    end;
    perform private.write_audit_log(
      'em.create',
      'em_request',
      new.id,
      subject,
      format('External meeting requested by %s for %s', subject, date_label),
      jsonb_build_object(
        'start_date', jsonb_build_object('from', null, 'to', to_jsonb(new.start_date::text)),
        'end_date', jsonb_build_object('from', null, 'to', to_jsonb(new.end_date::text)),
        'status', jsonb_build_object('from', null, 'to', to_jsonb(new.status::text))
      )
    );
    return new;
  end if;

  if old.status is distinct from new.status then
    changes := private.audit_change(changes, 'status', old.status::text, new.status::text);
    perform private.write_audit_log(
      'em.decide',
      'em_request',
      new.id,
      subject,
      format('External meeting for %s marked %s', subject, new.status::text),
      changes
    );
  end if;

  return new;
end;
$function$;

drop function if exists public.apply_em_request(date, text, text);
drop function if exists private.apply_em_request(date, text, text);

create or replace function private.apply_em_request(
  next_start_date date,
  next_end_date date,
  next_day_count numeric,
  next_reason text,
  next_email_body text default ''
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  caller uuid := auth.uid();
  manager uuid;
  initial_status public.request_status;
  new_id uuid;
begin
  if caller is null then
    raise exception 'not authenticated';
  end if;

  select reports_to into manager
  from public.profiles
  where id = caller and status = 'approved';

  if not found then
    raise exception 'not allowed';
  end if;

  if next_end_date < next_start_date then
    raise exception 'invalid date range';
  end if;

  if next_day_count is null or next_day_count <= 0 then
    raise exception 'invalid day count';
  end if;

  if exists (
    select 1
    from public.em_requests e
    where e.user_id = caller
      and e.status in ('pending', 'approved')
      and e.start_date <= next_end_date
      and e.end_date >= next_start_date
  ) then
    raise exception 'overlapping em';
  end if;

  if manager is null then
    initial_status := 'approved';
  else
    initial_status := 'pending';
  end if;

  insert into public.em_requests (
    user_id, start_date, end_date, day_count, reason, status, approver_id, email_body, decided_at, decided_by
  ) values (
    caller,
    next_start_date,
    next_end_date,
    next_day_count,
    coalesce(btrim(next_reason), ''),
    initial_status,
    manager,
    coalesce(next_email_body, ''),
    case when initial_status = 'approved' then now() else null end,
    case when initial_status = 'approved' then caller else null end
  )
  returning id into new_id;

  return new_id;
end;
$function$;

create or replace function public.apply_em_request(
  next_start_date date,
  next_end_date date,
  next_day_count numeric,
  next_reason text,
  next_email_body text default ''
)
returns uuid
language sql
set search_path to ''
as $function$
  select private.apply_em_request(
    next_start_date,
    next_end_date,
    next_day_count,
    next_reason,
    next_email_body
  );
$function$;

grant execute on function public.apply_em_request(date, date, numeric, text, text) to authenticated;

create or replace function private.revise_em_request(target uuid, next_status text)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  caller uuid := auth.uid();
  req public.em_requests%rowtype;
begin
  if caller is null then
    raise exception 'not authenticated';
  end if;

  if next_status not in ('approved', 'rejected') then
    raise exception 'invalid status';
  end if;

  select * into req from public.em_requests where id = target for update;
  if not found then
    raise exception 'request not found';
  end if;

  if req.approver_id is distinct from caller and not private.is_platform_admin() then
    raise exception 'not allowed';
  end if;

  if req.status = 'pending' then
    raise exception 'use decide for pending';
  end if;

  if req.status = next_status::public.request_status then
    return;
  end if;

  if next_status = 'approved' and exists (
    select 1
    from public.em_requests e
    where e.user_id = req.user_id
      and e.id <> req.id
      and e.status in ('pending', 'approved')
      and e.start_date <= req.end_date
      and e.end_date >= req.start_date
  ) then
    raise exception 'overlapping em';
  end if;

  update public.em_requests
  set status = next_status::public.request_status,
      decided_at = now(),
      decided_by = caller
  where id = target;
end;
$function$;
