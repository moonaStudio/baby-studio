create extension if not exists "uuid-ossp";

create table if not exists themes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  background_url text not null,
  thumbnail_url text not null,
  is_premium boolean default true,
  category text,
  template jsonb not null,
  is_active boolean default true,
  created_at timestamp default now()
);

create table if not exists generated_photos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users,
  theme_id uuid not null references themes,
  original_url text not null,
  result_url text not null,
  created_at timestamp default now()
);
