-- Let every approved employee read timesheet source data.
-- Holiday create/update/delete stays admin-only via existing policies.

create or replace function private.is_approved_staff()
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
      and status = 'approved'
  );
$function$;

drop policy if exists "Profile managers can read verticals" on public.verticals;
create policy "Approved staff can read verticals"
on public.verticals
for select
to authenticated
using (private.is_approved_staff());

drop policy if exists "Approved staff can read profiles for timesheet" on public.profiles;
create policy "Approved staff can read profiles for timesheet"
on public.profiles
for select
to authenticated
using (private.is_approved_staff());

drop policy if exists "Users read own attendance days" on public.attendance_days;
create policy "Approved staff can read attendance days"
on public.attendance_days
for select
to authenticated
using (
  user_id = (select auth.uid())
  or private.is_approved_staff()
);

drop policy if exists "Users read own leave requests" on public.leave_requests;
create policy "Approved staff can read leave requests"
on public.leave_requests
for select
to authenticated
using (
  user_id = (select auth.uid())
  or approver_id = (select auth.uid())
  or private.is_approved_staff()
);

drop policy if exists "Users read own wfh requests" on public.wfh_requests;
create policy "Approved staff can read wfh requests"
on public.wfh_requests
for select
to authenticated
using (
  user_id = (select auth.uid())
  or approver_id = (select auth.uid())
  or private.is_approved_staff()
);
