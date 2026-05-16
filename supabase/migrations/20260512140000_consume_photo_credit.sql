-- Atomic single-credit consumption for premium theme runs (caller: authenticated user JWT).

create or replace function public.consume_one_photo_credit()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_new integer;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  update public.user_credits
  set
    credits = credits - 1,
    updated_at = now()
  where user_id = v_uid and credits >= 1
  returning credits into v_new;

  if v_new is null then
    return -1;
  end if;

  return v_new;
end;
$$;

revoke all on function public.consume_one_photo_credit() from public;
grant execute on function public.consume_one_photo_credit() to authenticated;
