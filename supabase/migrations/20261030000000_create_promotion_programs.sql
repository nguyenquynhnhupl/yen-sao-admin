-- Promotion programs: one shared discount and schedule for all linked products.
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  promotion_type text not null check (promotion_type in ('percent','amount')),
  promotion_value numeric(14,0) not null check (promotion_value > 0),
  start_at timestamptz not null,
  end_at timestamptz not null,
  is_flash_deal boolean not null default false,
  flash_start_at timestamptz,
  flash_end_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promotions_valid_period check (end_at > start_at),
  constraint promotions_valid_percent check (promotion_type <> 'percent' or promotion_value <= 100),
  constraint promotions_valid_flash_period check (
    not is_flash_deal or (flash_start_at is not null and flash_end_at is not null and flash_end_at > flash_start_at)
  )
);

create table if not exists public.promotion_products (
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references public.promotions(id) on delete cascade,
  product_id uuid not null unique references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (promotion_id, product_id)
);

create index if not exists promotion_products_promotion_id_idx on public.promotion_products(promotion_id);
create index if not exists promotions_active_period_idx on public.promotions(is_active, start_at, end_at);

alter table public.promotions enable row level security;
alter table public.promotion_products enable row level security;

drop policy if exists "public read active promotions" on public.promotions;
create policy "public read active promotions" on public.promotions
for select to anon, authenticated
using (is_active = true or public.is_admin());

drop policy if exists "admin full access promotions" on public.promotions;
create policy "admin full access promotions" on public.promotions
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read products in active promotions" on public.promotion_products;
create policy "public read products in active promotions" on public.promotion_products
for select to anon, authenticated
using (
  exists (
    select 1 from public.promotions p
    where p.id = promotion_id and (p.is_active = true or public.is_admin())
  )
);

drop policy if exists "admin full access promotion products" on public.promotion_products;
create policy "admin full access promotion products" on public.promotion_products
for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.promotions, public.promotion_products to anon, authenticated;
grant insert, update, delete on public.promotions, public.promotion_products to authenticated;
