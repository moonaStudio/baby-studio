-- Account-wide monthly free generation count (Korea calendar month, YYYY-MM in Asia/Seoul).

create table if not exists public.user_monthly_free_generations (
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_month text not null check (usage_month ~ '^\d{4}-\d{2}$'),
  generation_count integer not null default 0 check (generation_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_month)
);

alter table public.user_monthly_free_generations enable row level security;

drop policy if exists "user_monthly_free_select_own" on public.user_monthly_free_generations;
create policy "user_monthly_free_select_own" on public.user_monthly_free_generations
  for select using (auth.uid() = user_id);

-- Inserts/updates only via RPC (security definer).

create or replace function public.increment_user_monthly_free_usage(p_month text)
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
  if p_month is null or p_month !~ '^\d{4}-\d{2}$' then
    raise exception 'invalid month';
  end if;

  insert into public.user_monthly_free_generations (user_id, usage_month, generation_count)
  values (v_uid, p_month, 1)
  on conflict (user_id, usage_month) do update
  set
    generation_count = public.user_monthly_free_generations.generation_count + 1,
    updated_at = now()
  returning public.user_monthly_free_generations.generation_count into v_new;

  return v_new;
end;
$$;

revoke all on function public.increment_user_monthly_free_usage(text) from public;
grant execute on function public.increment_user_monthly_free_usage(text) to authenticated;
