-- Promo codes (자동) + manual grant audit. Credits go through apply_checkout_credit for idempotency.

create table if not exists public.promo_codes (
  code text primary key,
  label text not null default '',
  credits integer not null check (credits > 0),
  max_total_redemptions integer check (max_total_redemptions is null or max_total_redemptions > 0),
  max_per_user integer not null default 1 check (max_per_user > 0),
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.promo_codes enable row level security;

create table if not exists public.promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  promo_code text not null references public.promo_codes (code) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  grant_id text not null unique,
  credits integer not null check (credits > 0),
  created_at timestamptz not null default now(),
  unique (promo_code, user_id)
);

alter table public.promo_redemptions enable row level security;

create table if not exists public.manual_credit_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  grant_id text not null unique,
  credits integer not null check (credits > 0),
  note text not null default '',
  admin_email_hint text,
  created_at timestamptz not null default now()
);

alter table public.manual_credit_grants enable row level security;

create or replace function public.redeem_promo_code(p_code text, p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_row public.promo_codes%rowtype;
  v_total int;
  v_grant_id text;
  v_applied boolean;
begin
  v_code := upper(trim(p_code));
  if v_code = '' or p_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_input');
  end if;

  select * into v_row from public.promo_codes where code = v_code;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  if not v_row.active then
    return jsonb_build_object('ok', false, 'error', 'inactive');
  end if;
  if v_row.starts_at is not null and now() < v_row.starts_at then
    return jsonb_build_object('ok', false, 'error', 'not_started');
  end if;
  if v_row.ends_at is not null and now() > v_row.ends_at then
    return jsonb_build_object('ok', false, 'error', 'expired');
  end if;

  if exists (
    select 1 from public.promo_redemptions
    where promo_code = v_code and user_id = p_user_id
  ) then
    return jsonb_build_object('ok', false, 'error', 'already_redeemed');
  end if;

  if v_row.max_total_redemptions is not null then
    select count(*)::int into v_total from public.promo_redemptions where promo_code = v_code;
    if v_total >= v_row.max_total_redemptions then
      return jsonb_build_object('ok', false, 'error', 'sold_out');
    end if;
  end if;

  v_grant_id := 'promo_' || v_code || '_' || p_user_id::text;

  v_applied := public.apply_checkout_credit(v_grant_id, p_user_id, v_row.credits);
  if v_applied is not true then
    return jsonb_build_object('ok', false, 'error', 'already_redeemed');
  end if;

  insert into public.promo_redemptions (promo_code, user_id, grant_id, credits)
  values (v_code, p_user_id, v_grant_id, v_row.credits);

  return jsonb_build_object(
    'ok', true,
    'credits_added', v_row.credits,
    'code', v_code
  );
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'already_redeemed');
end;
$$;

create or replace function public.grant_manual_credit(
  p_user_id uuid,
  p_credits int,
  p_note text default '',
  p_admin_email_hint text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grant_id text;
  v_applied boolean;
  v_new int;
begin
  if p_user_id is null or p_credits is null or p_credits <= 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_input');
  end if;

  v_grant_id := 'manual_' || gen_random_uuid()::text;

  v_applied := public.apply_checkout_credit(v_grant_id, p_user_id, p_credits);
  if v_applied is not true then
    return jsonb_build_object('ok', false, 'error', 'grant_failed');
  end if;

  insert into public.manual_credit_grants (user_id, grant_id, credits, note, admin_email_hint)
  values (p_user_id, v_grant_id, p_credits, coalesce(p_note, ''), p_admin_email_hint);

  select credits into v_new from public.user_credits where user_id = p_user_id;

  return jsonb_build_object(
    'ok', true,
    'credits_added', p_credits,
    'balance', coalesce(v_new, p_credits),
    'grant_id', v_grant_id
  );
end;
$$;

revoke all on function public.redeem_promo_code(text, uuid) from public;
grant execute on function public.redeem_promo_code(text, uuid) to authenticated;

revoke all on function public.grant_manual_credit(uuid, int, text, text) from public;
grant execute on function public.grant_manual_credit(uuid, int, text, text) to service_role;
