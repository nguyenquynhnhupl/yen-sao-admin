alter table public.products
add column if not exists quick_info jsonb not null default '[]'::jsonb;
