-- Stripe Checkout 완료 시 크레딧 적립 (checkout_session_id 기준 멱등)
-- Supabase SQL Editor에서 한 번 실행하거나 `supabase db push`로 적용하세요.

create table if not exists public.billing_checkout_grants (
  checkout_session_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  credits integer not null check (credits > 0),
  created_at timestamptz not null default now()
);

alter table public.billing_checkout_grants enable row level security;

create table if not exists public.user_credits (
  user_id uuid primary key references auth.users (id) on delete cascade,
  credits integer not null default 0 check (credits >= 0),
  updated_at timestamptz not null default now()
);

alter table public.user_credits enable row level security;

drop policy if exists "user_credits_select_own" on public.user_credits;
create policy "user_credits_select_own" on public.user_credits for select using (auth.uid() = user_id);

create or replace function public.apply_checkout_credit(
  p_checkout_session_id text,
  p_user_id uuid,
  p_credits int
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.billing_checkout_grants (checkout_session_id, user_id, credits)
  values (p_checkout_session_id, p_user_id, p_credits);
  insert into public.user_credits (user_id, credits)
  values (p_user_id, p_credits)
  on conflict (user_id) do update
    set credits = public.user_credits.credits + excluded.credits,
        updated_at = now();
  return true;
exception
  when unique_violation then
    return false;
end;
$$;

revoke all on function public.apply_checkout_credit(text, uuid, int) from public;
grant execute on function public.apply_checkout_credit(text, uuid, int) to service_role;
