alter table public.products
add column if not exists gallery_urls jsonb not null default '[]'::jsonb;

comment on column public.products.gallery_urls is 'Additional product image URLs; image_url remains the primary image.';
