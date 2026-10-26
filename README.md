# Yến Sào Admin CMS

Dự án React + TypeScript + Vite riêng cho giao diện quản trị. Website khách hàng nằm trong repository riêng.

## Chức năng
- Đăng nhập Supabase Auth và kiểm tra quyền trong `admin_users`.
- Dashboard thống kê sản phẩm, danh mục, bài viết và đơn hàng.
- **Trang chủ:** bật/tắt và sắp xếp khu vực; chỉnh tiêu đề, mô tả, ảnh và nút; chọn danh mục/sản phẩm từ Master Data.
- CRUD sản phẩm; quản lý danh mục và thứ tự hiển thị.
- Thêm/bật/tắt/xóa banner; quản lý bài viết.
- Xem đơn hàng và cập nhật trạng thái.
- Giao diện responsive, chạy mặc định ở cổng `5174`.

## 1. Chạy giao diện
Cần cài Node.js. Trong folder `yen-sao-admin`, chạy:

```bash
npm install
npm run dev
```

Mở `http://localhost:5174`.

## 2. Kết nối Supabase
Website và CMS cần dùng cùng một Supabase project để chia sẻ Master Data.

- Nếu đây là database CMS mới, mở Supabase **SQL Editor** và chạy `supabase/migrations/001_admin_cms_schema.sql`.
- Chạy tiếp `supabase/migrations/002_homepage_sections.sql` để tạo cấu hình các khu vực Trang chủ.
- Nếu database đã có bảng CMS và dữ liệu thật, **không chạy lại migration 001 một cách mù quáng**. Chỉ rà soát và chạy migration 002.
- Tạo file `.env` từ `.env.example`, điền Project URL và publishable/anon key:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

- Trong Supabase **Authentication → Users**, tạo user quản trị; sao chép UUID và cấp quyền bằng SQL:

```sql
insert into public.admin_users (user_id)
values ('UUID_CUA_USER_ADMIN');
```

Khởi động lại `npm run dev`, sau đó đăng nhập tại `http://localhost:5174`.

**Không đặt service-role/secret key trong biến `VITE_*` hoặc trong frontend.** Chỉ dùng publishable/anon key ở trình duyệt; RLS giới hạn quyền truy cập.

## 3. Quản lý Trang chủ
Admin → **Trang chủ** đọc cấu hình từ bảng `homepage_sections`. Migration `002_homepage_sections.sql` tạo sẵn các khu vực theo nội dung trang chủ hiện tại. Danh mục và sản phẩm chỉ lưu ID tham chiếu đến Master Data, không tạo bản sao dữ liệu.

Khi chỉnh sửa cấu hình trong Admin, dữ liệu được lưu vào Supabase. Để thay đổi đó thực sự xuất hiện trên website khách hàng, repository website cũng cần được cập nhật để đọc bảng `homepage_sections` và render theo `section_key`. Phần CMS này chưa tự sửa code website khách hàng.

## 4. Nối với Website
Cả hai app cần dùng cùng `VITE_SUPABASE_URL` và publishable/anon key. Website nên đọc:
- `products` với `is_published = true`
- `categories` với `is_active = true`
- `banners` với `is_active = true`
- `articles` với `is_published = true`

Các bảng cần policy RLS phù hợp. Chưa tích hợp upload file trực tiếp; phiên bản này nhận URL ảnh công khai.

## 5. Triển khai riêng
- Deploy website và Admin thành hai frontend project riêng.
- Có thể dùng `admin.tenmiencuaban.vn` cho CMS và `tenmiencuaban.vn` cho website.
- Vite build ra thư mục `dist`; cấu hình rewrite SPA nếu nền tảng deploy yêu cầu.

## Lưu ý
Đây là bộ khung CMS cần được kiểm thử với Supabase thực tế trước khi dùng production. Sao lưu database và đối chiếu schema trước khi chạy migration trên database đang có dữ liệu.
