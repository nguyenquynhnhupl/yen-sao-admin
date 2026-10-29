-- Yen Sao Admin CMS schema
-- Run this migration in the Supabase SQL Editor for the SAME project used by the public website.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_active boolean not null default true,
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.categories add column if not exists image_url text;

-- Per-product Flash Sale visibility and schedule.
alter table public.products add column if not exists is_flash_sale boolean not null default false;
alter table public.products add column if not exists flash_sale_start_at timestamptz;
alter table public.products add column if not exists flash_sale_end_at timestamptz;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price numeric(14,0) not null default 0 check (price >= 0),
  compare_at_price numeric(14,0) check (compare_at_price is null or compare_at_price >= 0),
  image_url text,
  category_id uuid references public.categories(id) on delete set null,
  stock integer not null default 0 check (stock >= 0),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null,
  link_url text,
  position text not null default 'home_hero',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text,
  image_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  shipping_address text,
  total numeric(14,0) not null default 0 check (total >= 0),
  status text not null default 'pending'
    check (status in ('pending','confirmed','shipping','completed','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(14,0) not null check (unit_price >= 0),
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.banners enable row level security;
alter table public.articles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Admin membership is not publicly readable. Admin management should be done by trusted project owner only.
drop policy if exists "admin can read own membership" on public.admin_users;
create policy "admin can read own membership" on public.admin_users
for select to authenticated using (user_id = (select auth.uid()));

-- Public website may read active categories and published products/articles/active banners.
drop policy if exists "public read active categories" on public.categories;
create policy "public read active categories" on public.categories
for select to anon, authenticated using (is_active = true or public.is_admin());

drop policy if exists "public read published products" on public.products;
create policy "public read published products" on public.products
for select to anon, authenticated using (is_published = true or public.is_admin());

drop policy if exists "public read active banners" on public.banners;
create policy "public read active banners" on public.banners
for select to anon, authenticated using (is_active = true or public.is_admin());

drop policy if exists "public read published articles" on public.articles;
create policy "public read published articles" on public.articles
for select to anon, authenticated using (is_published = true or public.is_admin());

-- Only explicitly allowlisted admins can write CMS data.
do $$
declare t text;
begin
  foreach t in array array['categories','products','banners','articles'] loop
    execute format('drop policy if exists %I on public.%I', 'admin full access ' || t, t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', 'admin full access ' || t, t);
  end loop;
end $$;

-- Orders are private to admins until a carefully validated public checkout endpoint is implemented.
drop policy if exists "admin read orders" on public.orders;
create policy "admin read orders" on public.orders for select to authenticated using (public.is_admin());
drop policy if exists "admin update orders" on public.orders;
create policy "admin update orders" on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin read order items" on public.order_items;
create policy "admin read order items" on public.order_items for select to authenticated using (public.is_admin());

grant select on public.categories, public.products, public.banners, public.articles to anon, authenticated;
grant insert, update, delete on public.categories, public.products, public.banners, public.articles to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items to authenticated;

-- After creating an admin user under Supabase Authentication, grant CMS access:
-- insert into public.admin_users (user_id) values ('PASTE_AUTH_USER_UUID_HERE');


-- Product promotions and optional Flash Deal schedule.
alter table public.products add column if not exists promotion_type text check (promotion_type is null or promotion_type in ('percent','amount'));
alter table public.products add column if not exists promotion_value numeric(14,0);
alter table public.products add column if not exists promotion_start_at timestamptz;
alter table public.products add column if not exists promotion_end_at timestamptz;
alter table public.products add column if not exists is_flash_deal boolean not null default false;
alter table public.products add column if not exists flash_deal_start_at timestamptz;
alter table public.products add column if not exists flash_deal_end_at timestamptz;
