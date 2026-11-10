-- When leave balances are granted/updated, convert approved LOP to casual/earned
-- if the employee now has enough balance (prefer casual, then earned).

create or replace function private.reclassify_lop_using_balance(target uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  r record;
  current_casual numeric;
  current_earned numeric;
begin
  if target is null then
    return;
  end if;

  for r in
    select
      lr.id,
      lr.user_id,
      lr.day_count::numeric as day_count
    from public.leave_requests lr
    where lr.user_id = target
      and lr.status = 'approved'
      and lr.leave_kind = 'lop'
    order by lr.start_date asc, lr.created_at asc
  loop
    select p.casual_leave::numeric, p.earned_leave::numeric
    into current_casual, current_earned
    from public.profiles p
    where p.id = r.user_id
    for update;

    if not found then
      return;
    end if;

    if current_casual >= r.day_count then
      update public.leave_requests
      set leave_kind = 'casual',
          updated_at = now()
      where id = r.id;

      update public.profiles
      set casual_leave = casual_leave - r.day_count,
          updated_at = now()
      where id = r.user_id;
    elsif current_earned >= r.day_count then
      update public.leave_requests
      set leave_kind = 'earned',
          updated_at = now()
      where id = r.id;

      update public.profiles
      set earned_leave = earned_leave - r.day_count,
          updated_at = now()
      where id = r.user_id;
    end if;
  end loop;
end;
$function$;

create or replace function private.update_leave_balances(
  target uuid,
  next_casual numeric,
  next_earned numeric
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if not private.is_profile_manager() then
    raise exception 'not allowed';
  end if;

  if next_casual is null or next_earned is null or next_casual < 0 or next_earned < 0 then
    raise exception 'invalid leave balance';
  end if;

  if not exists (select 1 from public.profiles where id = target) then
    raise exception 'profile not found';
  end if;

  if exists (
    select 1 from public.profiles
    where id = target and lower(email) = lower('admin@elixirpay.in')
  ) then
    raise exception 'platform admin protected';
  end if;

  update public.profiles
  set
    casual_leave = next_casual,
    earned_leave = next_earned,
    updated_at = now()
  where id = target;

  perform private.reclassify_lop_using_balance(target);
end;
$function$;

create or replace function private.manage_profile(
  target uuid,
  next_status text,
  next_role text,
  next_vertical_id uuid,
  next_reports_to uuid,
  next_designation text,
  next_casual numeric,
  next_earned numeric,
  next_employee_id text,
  next_first_name text default null,
  next_last_name text default null,
  next_phone text default null,
  next_present_address text default null,
  next_timesheet_exempt boolean default null
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  normalized_employee_id text;
begin
  if not private.is_approved_admin() then
    raise exception 'not allowed';
  end if;

  if next_status not in ('pending', 'approved', 'denied') then
    raise exception 'invalid status';
  end if;

  if not exists (select 1 from public.profiles where id = target) then
    raise exception 'profile not found';
  end if;

  if exists (
    select 1 from public.profiles
    where id = target and lower(email) = lower('admin@elixirpay.in')
  ) then
    raise exception 'platform admin protected';
  end if;

  normalized_employee_id := nullif(btrim(coalesce(next_employee_id, '')), '');

  if normalized_employee_id is not null and exists (
    select 1 from public.profiles
    where employee_id = normalized_employee_id and id <> target
  ) then
    raise exception 'employee id taken';
  end if;

  if next_status = 'approved' then
    if next_role not in ('admin', 'payroll', 'user') then
      raise exception 'invalid role';
    end if;

    if next_vertical_id is null or not exists (
      select 1 from public.verticals where id = next_vertical_id
    ) then
      raise exception 'vertical required';
    end if;

    if next_designation is null or length(btrim(next_designation)) = 0 then
      raise exception 'designation required';
    end if;

    if next_casual < 0 or next_earned < 0 then
      raise exception 'invalid leave balance';
    end if;

    if next_reports_to is not null then
      if next_reports_to = target or not exists (
        select 1 from public.profiles
        where id = next_reports_to and status = 'approved'
      ) then
        raise exception 'manager not found';
      end if;
    end if;

    update auth.users
    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', next_role)
    where id = target;

    update public.profiles
    set
      role = next_role::public.app_role,
      status = 'approved',
      vertical_id = next_vertical_id,
      reports_to = next_reports_to,
      designation = btrim(next_designation),
      casual_leave = next_casual,
      earned_leave = next_earned,
      employee_id = normalized_employee_id,
      first_name = case when next_first_name is null then first_name else coalesce(btrim(next_first_name), '') end,
      last_name = case when next_last_name is null then last_name else coalesce(btrim(next_last_name), '') end,
      phone = case when next_phone is null then phone else coalesce(btrim(next_phone), '') end,
      present_address = case when next_present_address is null then present_address else coalesce(btrim(next_present_address), '') end,
      timesheet_exempt = coalesce(next_timesheet_exempt, timesheet_exempt),
      updated_at = now()
    where id = target;

    perform private.reclassify_lop_using_balance(target);
  elsif next_status = 'denied' then
    update auth.users
    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) - 'role'
    where id = target;

    update public.profiles
    set
      role = null,
      status = 'denied',
      vertical_id = next_vertical_id,
      reports_to = null,
      designation = coalesce(btrim(next_designation), designation),
      casual_leave = coalesce(next_casual, casual_leave),
      earned_leave = coalesce(next_earned, earned_leave),
      employee_id = normalized_employee_id,
      first_name = case when next_first_name is null then first_name else coalesce(btrim(next_first_name), '') end,
      last_name = case when next_last_name is null then last_name else coalesce(btrim(next_last_name), '') end,
      phone = case when next_phone is null then phone else coalesce(btrim(next_phone), '') end,
      present_address = case when next_present_address is null then present_address else coalesce(btrim(next_present_address), '') end,
      timesheet_exempt = coalesce(next_timesheet_exempt, timesheet_exempt),
      updated_at = now()
    where id = target;
  else
    update auth.users
    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) - 'role'
    where id = target;

    update public.profiles
    set
      role = null,
      status = 'pending',
      vertical_id = next_vertical_id,
      reports_to = next_reports_to,
      designation = coalesce(nullif(btrim(coalesce(next_designation, '')), ''), designation),
      casual_leave = coalesce(next_casual, casual_leave),
      earned_leave = coalesce(next_earned, earned_leave),
      employee_id = normalized_employee_id,
      first_name = case when next_first_name is null then first_name else coalesce(btrim(next_first_name), '') end,
      last_name = case when next_last_name is null then last_name else coalesce(btrim(next_last_name), '') end,
      phone = case when next_phone is null then phone else coalesce(btrim(next_phone), '') end,
      present_address = case when next_present_address is null then present_address else coalesce(btrim(next_present_address), '') end,
      timesheet_exempt = coalesce(next_timesheet_exempt, timesheet_exempt),
      updated_at = now()
    where id = target;
  end if;
end;
$function$;
