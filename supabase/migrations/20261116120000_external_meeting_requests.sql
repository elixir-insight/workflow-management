-- External Meeting (EM) requests — mirrors WFH: one active request per date,
-- optional manager approval, timesheet pill when approved.

create table if not exists public.em_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  work_date date not null,
  reason text not null default '',
  status public.request_status not null default 'pending',
  approver_id uuid references public.profiles (id) on delete set null,
  decided_at timestamptz,
  decided_by uuid references public.profiles (id) on delete set null,
  email_body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists em_requests_user_id_idx
  on public.em_requests (user_id, created_at desc);

create index if not exists em_requests_approver_status_idx
  on public.em_requests (approver_id, status);

create unique index if not exists em_requests_user_date_active_idx
  on public.em_requests (user_id, work_date)
  where status in ('pending', 'approved');

drop trigger if exists em_requests_set_updated_at on public.em_requests;
create trigger em_requests_set_updated_at
before update on public.em_requests
for each row execute function private.touch_updated_at();

create or replace function private.log_em_request_audit()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  subject text;
  changes jsonb := '{}'::jsonb;
begin
  select email into subject from public.profiles where id = coalesce(new.user_id, old.user_id);
  subject := coalesce(subject, coalesce(new.user_id, old.user_id)::text);

  if tg_op = 'INSERT' then
    perform private.write_audit_log(
      'em.create',
      'em_request',
      new.id,
      subject,
      format('External meeting requested by %s for %s', subject, new.work_date::text),
      jsonb_build_object(
        'work_date', jsonb_build_object('from', null, 'to', to_jsonb(new.work_date::text)),
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

drop trigger if exists em_requests_audit_log on public.em_requests;
create trigger em_requests_audit_log
after insert or update on public.em_requests
for each row execute function private.log_em_request_audit();

alter table public.em_requests enable row level security;

grant select on table public.em_requests to authenticated, service_role;

drop policy if exists "Approved staff can read em requests" on public.em_requests;
create policy "Approved staff can read em requests"
on public.em_requests
for select
to authenticated
using (
  user_id = (select auth.uid())
  or approver_id = (select auth.uid())
  or private.is_approved_staff()
);

create or replace function private.apply_em_request(
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
    from public.em_requests
    where user_id = caller
      and work_date = next_work_date
      and status in ('pending', 'approved')
  ) then
    raise exception 'em already exists';
  end if;

  if manager is null then
    initial_status := 'approved';
  else
    initial_status := 'pending';
  end if;

  insert into public.em_requests (
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

create or replace function public.apply_em_request(
  next_work_date date,
  next_reason text,
  next_email_body text default ''
)
returns uuid
language sql
set search_path to ''
as $function$
  select private.apply_em_request(next_work_date, next_reason, next_email_body);
$function$;

grant execute on function public.apply_em_request(date, text, text) to authenticated;

create or replace function private.decide_em_request(target uuid, next_status text)
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

  if req.status <> 'pending' then
    raise exception 'request already decided';
  end if;

  if req.approver_id is distinct from caller and not private.is_platform_admin() then
    raise exception 'not allowed';
  end if;

  update public.em_requests
  set status = next_status::public.request_status,
      decided_at = now(),
      decided_by = caller
  where id = target;
end;
$function$;

create or replace function public.decide_em_request(target uuid, next_status text)
returns void
language sql
set search_path to ''
as $function$
  select private.decide_em_request(target, next_status);
$function$;

grant execute on function public.decide_em_request(uuid, text) to authenticated;

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
      and e.work_date = req.work_date
      and e.status in ('pending', 'approved')
  ) then
    raise exception 'em already exists';
  end if;

  update public.em_requests
  set status = next_status::public.request_status,
      decided_at = now(),
      decided_by = caller
  where id = target;
end;
$function$;

create or replace function public.revise_em_request(target uuid, next_status text)
returns void
language sql
set search_path to ''
as $function$
  select private.revise_em_request(target, next_status);
$function$;

grant execute on function public.revise_em_request(uuid, text) to authenticated;

create or replace function private.delete_em_request_as_approver(target uuid)
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

  select * into req from public.em_requests where id = target for update;
  if not found then
    raise exception 'request not found';
  end if;

  if req.approver_id is distinct from caller and not private.is_platform_admin() then
    raise exception 'not allowed';
  end if;

  delete from public.em_requests where id = target;
end;
$function$;

create or replace function public.delete_em_request_as_approver(target uuid)
returns void
language sql
set search_path to ''
as $function$
  select private.delete_em_request_as_approver(target);
$function$;

grant execute on function public.delete_em_request_as_approver(uuid) to authenticated;
