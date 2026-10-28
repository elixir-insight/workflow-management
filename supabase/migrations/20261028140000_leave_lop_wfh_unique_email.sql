-- LOP leave kind, overlap/duplicate guards, WFH email body storage.

alter type public.leave_kind add value if not exists 'lop';

alter table public.wfh_requests
  add column if not exists email_body text not null default '';

create unique index if not exists wfh_requests_user_date_active_idx
  on public.wfh_requests (user_id, work_date)
  where status in ('pending', 'approved');

create or replace function private.apply_leave_request(
  next_leave_kind text,
  next_start_date date,
  next_end_date date,
  next_day_count numeric,
  next_reason text,
  next_email_body text
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
  balance numeric;
  effective_kind text;
begin
  if caller is null then
    raise exception 'not authenticated';
  end if;

  if next_leave_kind not in ('casual', 'earned', 'lop') then
    raise exception 'invalid leave kind';
  end if;

  if next_end_date < next_start_date then
    raise exception 'invalid date range';
  end if;

  if next_day_count is null or next_day_count <= 0 then
    raise exception 'invalid day count';
  end if;

  select reports_to,
    case when next_leave_kind = 'casual' then casual_leave
         when next_leave_kind = 'earned' then earned_leave
         else null end
  into manager, balance
  from public.profiles
  where id = caller and status = 'approved';

  if not found then
    raise exception 'not allowed';
  end if;

  if exists (
    select 1
    from public.leave_requests lr
    where lr.user_id = caller
      and lr.status in ('pending', 'approved')
      and lr.start_date <= next_end_date
      and lr.end_date >= next_start_date
  ) then
    raise exception 'overlapping leave';
  end if;

  effective_kind := next_leave_kind;
  if effective_kind in ('casual', 'earned') and (balance is null or balance < next_day_count) then
    effective_kind := 'lop';
  end if;

  if manager is null then
    initial_status := 'approved';
  else
    initial_status := 'pending';
  end if;

  insert into public.leave_requests (
    user_id, leave_kind, start_date, end_date, day_count, reason, status, approver_id, email_body,
    decided_at, decided_by
  ) values (
    caller,
    effective_kind::public.leave_kind,
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

  if initial_status = 'approved' and effective_kind in ('casual', 'earned') then
    if effective_kind = 'casual' then
      update public.profiles set casual_leave = casual_leave - next_day_count where id = caller;
    else
      update public.profiles set earned_leave = earned_leave - next_day_count where id = caller;
    end if;
  end if;

  return new_id;
end;
$function$;

create or replace function private.apply_wfh_request(
  next_work_date date,
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

  if exists (
    select 1
    from public.wfh_requests
    where user_id = caller
      and work_date = next_work_date
      and status in ('pending', 'approved')
  ) then
    raise exception 'wfh already exists';
  end if;

  if manager is null then
    initial_status := 'approved';
  else
    initial_status := 'pending';
  end if;

  insert into public.wfh_requests (
    user_id, work_date, reason, status, approver_id, email_body, decided_at, decided_by
  ) values (
    caller,
    next_work_date,
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

drop function if exists public.apply_wfh_request(date, text);

create or replace function public.apply_wfh_request(
  next_work_date date,
  next_reason text,
  next_email_body text default ''
)
returns uuid
language sql
set search_path to ''
as $function$
  select private.apply_wfh_request(next_work_date, next_reason, next_email_body);
$function$;

grant execute on function public.apply_wfh_request(date, text, text) to authenticated;

create or replace function private.decide_leave_request(target uuid, next_status text)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  caller uuid := auth.uid();
  req public.leave_requests%rowtype;
begin
  if caller is null then
    raise exception 'not authenticated';
  end if;

  if next_status not in ('approved', 'rejected') then
    raise exception 'invalid status';
  end if;

  select * into req from public.leave_requests where id = target for update;
  if not found then
    raise exception 'request not found';
  end if;

  if req.status <> 'pending' then
    raise exception 'request already decided';
  end if;

  if req.approver_id is distinct from caller then
    raise exception 'not allowed';
  end if;

  update public.leave_requests
  set status = next_status::public.request_status,
      decided_at = now(),
      decided_by = caller
  where id = target;

  if next_status = 'approved' and req.leave_kind in ('casual', 'earned') then
    if req.leave_kind = 'casual' then
      update public.profiles
      set casual_leave = casual_leave - req.day_count
      where id = req.user_id and casual_leave >= req.day_count;
      if not found then
        raise exception 'insufficient leave balance';
      end if;
    else
      update public.profiles
      set earned_leave = earned_leave - req.day_count
      where id = req.user_id and earned_leave >= req.day_count;
      if not found then
        raise exception 'insufficient leave balance';
      end if;
    end if;
  end if;
end;
$function$;
