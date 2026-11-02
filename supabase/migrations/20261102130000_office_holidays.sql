-- Company-wide office holidays for timesheet differentiation.

create table if not exists public.office_holidays (
  id uuid primary key default gen_random_uuid(),
  holiday_date date not null unique,
  name text not null default '',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists office_holidays_date_idx
  on public.office_holidays (holiday_date);

alter table public.office_holidays enable row level security;

drop policy if exists "Approved staff can read office holidays" on public.office_holidays;
create policy "Approved staff can read office holidays"
on public.office_holidays
for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid()
      and status = 'approved'
  )
);

drop policy if exists "Admins can insert office holidays" on public.office_holidays;
create policy "Admins can insert office holidays"
on public.office_holidays
for insert
to authenticated
with check (private.is_approved_admin());

drop policy if exists "Admins can update office holidays" on public.office_holidays;
create policy "Admins can update office holidays"
on public.office_holidays
for update
to authenticated
using (private.is_approved_admin())
with check (private.is_approved_admin());

drop policy if exists "Admins can delete office holidays" on public.office_holidays;
create policy "Admins can delete office holidays"
on public.office_holidays
for delete
to authenticated
using (private.is_approved_admin());

grant select on public.office_holidays to authenticated;
grant insert, update, delete on public.office_holidays to authenticated;
