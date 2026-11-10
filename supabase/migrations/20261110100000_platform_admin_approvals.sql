-- Platform admin (admin@elixirpay.in) can decide leave/WFH org-wide.

create or replace function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and lower(email) = 'admin@elixirpay.in'
      and status = 'approved'
  );
$function$;

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

  if req.approver_id is distinct from caller and not private.is_platform_admin() then
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

create or replace function private.decide_wfh_request(target uuid, next_status text)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  caller uuid := auth.uid();
  req public.wfh_requests%rowtype;
begin
  if caller is null then
    raise exception 'not authenticated';
  end if;

  if next_status not in ('approved', 'rejected') then
    raise exception 'invalid status';
  end if;

  select * into req from public.wfh_requests where id = target for update;
  if not found then
    raise exception 'request not found';
  end if;

  if req.status <> 'pending' then
    raise exception 'request already decided';
  end if;

  if req.approver_id is distinct from caller and not private.is_platform_admin() then
    raise exception 'not allowed';
  end if;

  update public.wfh_requests
  set status = next_status::public.request_status,
      decided_at = now(),
      decided_by = caller
  where id = target;
end;
$function$;

create or replace function private.revise_leave_request(target uuid, next_status text)
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

  if req.approver_id is distinct from caller and not private.is_platform_admin() then
    raise exception 'not allowed';
  end if;

  if req.status = 'pending' then
    raise exception 'use decide for pending';
  end if;

  if req.status = next_status::public.request_status then
    return;
  end if;

  if next_status = 'approved' then
    if exists (
      select 1
      from public.leave_requests lr
      where lr.user_id = req.user_id
        and lr.id <> req.id
        and lr.status in ('pending', 'approved')
        and lr.start_date <= req.end_date
        and lr.end_date >= req.start_date
    ) then
      raise exception 'overlapping leave';
    end if;
  end if;

  if req.status = 'approved' and req.leave_kind in ('casual', 'earned') then
    if req.leave_kind = 'casual' then
      update public.profiles
      set casual_leave = casual_leave + req.day_count
      where id = req.user_id;
    else
      update public.profiles
      set earned_leave = earned_leave + req.day_count
      where id = req.user_id;
    end if;
  end if;

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

  update public.leave_requests
  set status = next_status::public.request_status,
      decided_at = now(),
      decided_by = caller
  where id = target;
end;
$function$;

create or replace function private.revise_wfh_request(target uuid, next_status text)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  caller uuid := auth.uid();
  req public.wfh_requests%rowtype;
begin
  if caller is null then
    raise exception 'not authenticated';
  end if;

  if next_status not in ('approved', 'rejected') then
    raise exception 'invalid status';
  end if;

  select * into req from public.wfh_requests where id = target for update;
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
    from public.wfh_requests w
    where w.user_id = req.user_id
      and w.id <> req.id
      and w.work_date = req.work_date
      and w.status in ('pending', 'approved')
  ) then
    raise exception 'wfh already exists';
  end if;

  update public.wfh_requests
  set status = next_status::public.request_status,
      decided_at = now(),
      decided_by = caller
  where id = target;
end;
$function$;

create or replace function private.delete_leave_request_as_approver(target uuid)
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

  select * into req from public.leave_requests where id = target for update;
  if not found then
    raise exception 'request not found';
  end if;

  if req.approver_id is distinct from caller and not private.is_platform_admin() then
    raise exception 'not allowed';
  end if;

  if req.status = 'approved' and req.leave_kind in ('casual', 'earned') then
    if req.leave_kind = 'casual' then
      update public.profiles
      set casual_leave = casual_leave + req.day_count
      where id = req.user_id;
    else
      update public.profiles
      set earned_leave = earned_leave + req.day_count
      where id = req.user_id;
    end if;
  end if;

  delete from public.leave_requests where id = target;
end;
$function$;

create or replace function private.delete_wfh_request_as_approver(target uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  caller uuid := auth.uid();
  req public.wfh_requests%rowtype;
begin
  if caller is null then
    raise exception 'not authenticated';
  end if;

  select * into req from public.wfh_requests where id = target for update;
  if not found then
    raise exception 'request not found';
  end if;

  if req.approver_id is distinct from caller and not private.is_platform_admin() then
    raise exception 'not allowed';
  end if;

  delete from public.wfh_requests where id = target;
end;
$function$;
