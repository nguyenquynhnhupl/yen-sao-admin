-- Homepage section configuration for Yen Sao CMS.
-- Run after 001_admin_cms_schema.sql in the same Supabase project.

create table if not exists public.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  title text not null default '',
  subtitle text,
  description text,
  image_url text,
  button_text text,
  button_url text,
  item_type text not null default 'none'
    check (item_type in ('none', 'category', 'product')),
  item_ids uuid[] not null default '{}',
  is_active boolean not null default true,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.homepage_sections enable row level security;

drop policy if exists "public read active homepage sections" on public.homepage_sections;
create policy "public read active homepage sections"
on public.homepage_sections
for select to anon, authenticated
using (is_active = true or public.is_admin());

drop policy if exists "admin full access homepage sections" on public.homepage_sections;
create policy "admin full access homepage sections"
on public.homepage_sections
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select on public.homepage_sections to anon, authenticated;
grant insert, update, delete on public.homepage_sections to authenticated;

insert into public.homepage_sections
  (section_key, title, subtitle, description, image_url, button_text, button_url, item_type, is_active, sort_order)
values
  ('announcement', 'Miễn phí giao hàng cho đơn hàng trên 2.000.000đ', 'Hotline: 1900 xxxx', '100% Yến Sào Tự Nhiên', null, null, null, 'none', true, 1),
  ('site_header', 'Yến Sào Khánh Hòa', '100% Yến Sào Tự Nhiên', 'Trang Chủ | Sản Phẩm | Giới Thiệu | Liên Hệ', null, null, null, 'none', true, 2),
  ('hero', 'Yến Sào Cao Cấp', '100% Yến Sào Tự Nhiên Khánh Hòa', 'Bồi Bổ Sức Khỏe. Khám phá bộ sưu tập yến sào tinh chế cao cấp, được khai thác từ các hang yến tự nhiên nổi tiếng tại Khánh Hòa. Cam kết 100% tự nhiên, không pha trộn.', null, 'Khám Phá Sản Phẩm', '/products', 'none', true, 3),
  ('trust_benefits', 'Cam kết chất lượng', 'An tâm chọn yến sào tự nhiên', '100% Tự Nhiên — Không pha trộn | Chứng Nhận CL — VSATTP đạt chuẩn | Giao Hàng Toàn Quốc — Miễn phí đơn trên 2 triệu | Tư Vấn Chuyên Gia — Hỗ trợ 24/7', null, null, null, 'none', true, 4),
  ('categories', 'Bộ Sưu Tập Yến Sào', 'Danh Mục', 'Khám phá các dòng sản phẩm yến sào.', null, null, '/products', 'category', true, 5),
  ('featured_products', 'Sản Phẩm Nổi Bật', 'Nổi Bật', 'Những sản phẩm được tuyển chọn dành cho bạn.', null, 'Xem Tất Cả', '/products', 'product', true, 6),
  ('gift_banner', 'Set Quà Yến Sào Sang Trọng & Ý Nghĩa', 'Quà Tặng Cao Cấp', 'Tặng yến sào là tặng sức khỏe và sự sang trọng. Set quà yến sào được đóng gói trong hộp gỗ cao cấp, kèm giấy chứng nhận chất lượng. Lý tưởng để biếu sếp, đối tác và người thân trong các dịp lễ Tết.', null, 'Xem Set Quà', '/products', 'none', true, 7),
  ('best_sellers', 'Sản Phẩm Bán Chạy Nhất', 'Bán Chạy', 'Các sản phẩm được khách hàng yêu thích.', null, 'Xem Tất Cả', '/products', 'product', true, 8),
  ('benefits_stats', 'Lợi ích yến sào', '50+', 'Axit amin thiết yếu', null, null, null, 'none', true, 9)
on conflict (section_key) do nothing;
