-- Admin-only audit trail for profile, vertical, leave, WFH, and attendance changes.
-- Applied remotely via Supabase; kept here for source control.

create or replace function private.is_admin()
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
      and role = 'admin'
      and status = 'approved'
  );
$function$;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  actor_email text not null default '',
  action text not null,
  entity_type text not null,
  entity_id uuid,
  entity_label text not null default '',
  summary text not null,
  changes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

alter table public.audit_logs enable row level security;

drop policy if exists "Admins can read audit logs" on public.audit_logs;
create policy "Admins can read audit logs"
on public.audit_logs
for select
to authenticated
using (private.is_admin());

grant select on table public.audit_logs to authenticated;
