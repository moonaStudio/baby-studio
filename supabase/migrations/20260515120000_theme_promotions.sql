-- Remote theme free/premium flags per calendar month (Asia/Seoul YYYY-MM) + app-wide config.

create table if not exists public.theme_month_promotions (
  promo_month text not null check (promo_month ~ '^\d{4}-\d{2}$'),
  theme_slug text not null,
  is_premium boolean not null,
  updated_at timestamptz not null default now(),
  primary key (promo_month, theme_slug)
);

alter table public.theme_month_promotions enable row level security;

create table if not exists public.app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.app_config (key, value)
values ('monthly_free_limit', '5'::jsonb)
on conflict (key) do nothing;

-- Reads/writes only via backend service role (no client policies).
