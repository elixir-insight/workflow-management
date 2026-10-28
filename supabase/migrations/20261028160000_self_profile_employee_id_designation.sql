-- Let employees update their own employee_id and designation from My profile.

drop function if exists public.update_my_profile(text, text, text, text, text);
drop function if exists private.update_my_profile(text, text, text, text, text);

create function private.update_my_profile(
  next_first_name text,
  next_last_name text,
  next_phone text,
  next_present_address text,
  next_avatar_path text default null,
  next_employee_id text default null,
  next_designation text default null
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  caller uuid := auth.uid();
  normalized_employee_id text;
begin
  if caller is null then
    raise exception 'not authenticated';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = caller and status = 'approved'
  ) then
    raise exception 'not allowed';
  end if;

  normalized_employee_id := nullif(btrim(coalesce(next_employee_id, '')), '');

  if normalized_employee_id is not null and exists (
    select 1 from public.profiles
    where employee_id = normalized_employee_id
      and id <> caller
  ) then
    raise exception 'employee id already in use';
  end if;

  update public.profiles
  set
    first_name = coalesce(btrim(next_first_name), ''),
    last_name = coalesce(btrim(next_last_name), ''),
    phone = coalesce(btrim(next_phone), ''),
    present_address = coalesce(btrim(next_present_address), ''),
    designation = coalesce(btrim(next_designation), ''),
    employee_id = normalized_employee_id,
    avatar_path = case
      when next_avatar_path is null then avatar_path
      when btrim(next_avatar_path) = '' then null
      else btrim(next_avatar_path)
    end
  where id = caller;
end;
$function$;

create function public.update_my_profile(
  next_first_name text,
  next_last_name text,
  next_phone text,
  next_present_address text,
  next_avatar_path text default null,
  next_employee_id text default null,
  next_designation text default null
)
returns void
language sql
set search_path to ''
as $function$
  select private.update_my_profile(
    next_first_name,
    next_last_name,
    next_phone,
    next_present_address,
    next_avatar_path,
    next_employee_id,
    next_designation
  );
$function$;

grant execute on function public.update_my_profile(text, text, text, text, text, text, text) to authenticated;
