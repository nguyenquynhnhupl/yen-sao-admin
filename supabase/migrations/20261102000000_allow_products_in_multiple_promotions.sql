-- Allow a product to belong to multiple promotion programs.
-- Conflicts are validated by the admin app only when both programs are active
-- and their application date ranges overlap.
alter table public.promotion_products
  drop constraint if exists promotion_products_product_id_key;

create index if not exists promotion_products_product_id_idx
  on public.promotion_products(product_id);
