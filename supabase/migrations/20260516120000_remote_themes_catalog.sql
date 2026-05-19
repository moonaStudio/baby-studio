-- Remote theme catalog (background/preview URLs + face slot). Managed via admin API.

create table if not exists public.themes_catalog (
  slug text primary key,
  name text not null,
  category text not null default 'other',
  gender text not null default 'unisex' check (gender in ('girl', 'boy', 'unisex')),
  default_is_premium boolean not null default true,
  is_published boolean not null default false,
  preview_url text,
  background_url text not null,
  face_slot jsonb not null default '{"x":0.5,"y":0.4,"width":0.22,"height":0.28,"feather":0.1}'::jsonb,
  color_profile text not null default 'neutral' check (color_profile in ('warm', 'cool', 'neutral')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists themes_catalog_published_idx on public.themes_catalog (is_published, sort_order);

alter table public.themes_catalog enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'theme-assets',
  'theme-assets',
  true,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set public = true;

drop policy if exists "theme_assets_public_read" on storage.objects;
create policy "theme_assets_public_read" on storage.objects
  for select using (bucket_id = 'theme-assets');
