-- Employees can cancel their own pending leave.
-- Employees can read their reporting lead's basic profile.

create or replace function private.my_reports_to()
returns uuid
language sql
stable
security definer
set search_path to ''
as $function$
  select reports_to from public.profiles where id = auth.uid();
$function$;

drop policy if exists "Users can read their reporting lead" on public.profiles;
create policy "Users can read their reporting lead"
on public.profiles
for select
to authenticated
using (id = private.my_reports_to());

create or replace function private.cancel_leave_request(target uuid)
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

  if req.user_id is distinct from caller then
    raise exception 'not allowed';
  end if;

  if req.status <> 'pending' then
    raise exception 'only pending leave can be cancelled';
  end if;

  delete from public.leave_requests where id = target;
end;
$function$;

create or replace function public.cancel_leave_request(target uuid)
returns void
language sql
set search_path to ''
as $function$
  select private.cancel_leave_request(target);
$function$;

grant execute on function public.cancel_leave_request(uuid) to authenticated;
