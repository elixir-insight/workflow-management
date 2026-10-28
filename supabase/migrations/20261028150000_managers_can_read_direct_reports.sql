-- Allow reporting leads to see their direct reports' names/emails on approvals.

create policy "Managers can read direct reports"
on public.profiles
for select
to authenticated
using (reports_to = (select auth.uid()));
