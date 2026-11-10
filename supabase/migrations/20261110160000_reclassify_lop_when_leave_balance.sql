-- Reclassify approved LOP leave to casual/earned when the employee still has
-- enough leave balance, and deduct that balance. Process oldest first so
-- multiple LOP rows for the same person consume balance in chronological order.
-- Prefer casual leave, then earned leave.

do $$
declare
  r record;
  current_casual numeric;
  current_earned numeric;
begin
  for r in
    select
      lr.id,
      lr.user_id,
      lr.day_count::numeric as day_count,
      lr.start_date,
      lr.created_at
    from public.leave_requests lr
    where lr.status = 'approved'
      and lr.leave_kind = 'lop'
    order by lr.start_date asc, lr.created_at asc
  loop
    select p.casual_leave::numeric, p.earned_leave::numeric
    into current_casual, current_earned
    from public.profiles p
    where p.id = r.user_id
    for update;

    if not found then
      continue;
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
$$;
