alter table public.products
add column if not exists detail_content jsonb not null default '[]'::jsonb;

comment on column public.products.detail_content is
'Ordered product detail blocks; each block is text or an uploaded image URL.';
