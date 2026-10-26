# Yến Sào Admin CMS

Dự án React + TypeScript + Vite riêng cho giao diện quản trị. Website khách hàng hiện tại được giữ nguyên trong folder/repository của nó.

## Chức năng hiện có
- Đăng nhập Supabase Auth và kiểm tra quyền trong `admin_users`.
- Dashboard thống kê sản phẩm, danh mục, bài viết và đơn hàng.\n- Quản lý Trang chủ: bật/tắt và sắp xếp các khu vực; chỉnh tiêu đề, mô tả, ảnh và nút; chọn danh mục/sản phẩm từ Master Data.
- CRUD sản phẩm (giá, ảnh URL, danh mục, tồn kho, xuất bản).
- Thêm/ẩn/xóa danh mục.
- Thêm/bật/tắt/xóa banner.
- Tạo bản nháp bài viết, xuất bản/ẩn và xóa.
- Xem đơn hàng và cập nhật trạng thái đơn.
- Giao diện responsive, chạy mặc định ở cổng `5174`.

## 1. Chạy giao diện
Cần cài Node.js LTS. Mở terminal trong folder `yen-sao-admin`, chạy:

```bash
npm install
npm run dev
```

Mở `http://localhost:5174`.

## 2. Kết nối Supabase
Hiện website cũ mới dùng mockup, nên CMS chưa có database thật. Tạo một project Supabase mới hoặc chọn project bạn sẽ dùng chung cho Website và CMS.

1. Trong Supabase, mở **SQL Editor**.
2. Chạy toàn bộ file `supabase/migrations/001_admin_cms_schema.sql`.
3. Vào **Project Settings → API** (hoặc Connect), lấy Project URL và publishable/anon key.
5. Sao chép `.env.example` thành `.env` trong folder này và điền:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

6. Trong Supabase **Authentication → Users**, tạo user quản trị bằng email và mật khẩu.
7. Sao chép UUID của user vừa tạo. Trong SQL Editor, chạy câu lệnh sau và thay UUID thật:

```sql
insert into public.admin_users (user_id)
values ('UUID_CUA_USER_ADMIN');
```

8. Khởi động lại `npm run dev`, sau đó đăng nhập tại `http://localhost:5174`.

**Không đặt service-role/secret key trong biến `VITE_*` hoặc trong frontend.** Chỉ dùng publishable/anon key ở trình duyệt; RLS sẽ giới hạn quyền truy cập.

## 3. Nối với Website
Cả hai app cần dùng cùng `VITE_SUPABASE_URL` và publishable/anon key. Khi Admin tạo sản phẩm và đánh dấu **Xuất bản**, website cần đọc bảng `products` với `is_published = true`; danh mục đọc `categories` với `is_active = true`; banner đọc `banners` với `is_active = true`; bài viết đọc `articles` với `is_published = true`.

Code website mockup hiện tại chưa tự chuyển sang dữ liệu Supabase chỉ bằng việc tạo CMS. Cần cập nhật từng hook/component lấy dữ liệu mockup trong dự án Website để truy vấn các bảng tương ứng, đồng thời map lại tên trường theo UI hiện tại.

## 4. Quản lý Trang chủ\nTrang **Admin → Trang chủ** đọc cấu hình từ bảng `homepage_sections`. Migration `002_homepage_sections.sql` tạo sẵn các khu vực theo trang chủ hiện tại. Các mục Danh mục và Sản phẩm chỉ lưu danh sách ID tham chiếu đến Master Data; thông tin sản phẩm/danh mục không bị sao chép. Sau khi cấu hình trong Admin, website khách hàng cũng cần được cập nhật để đọc `homepage_sections` và render theo `section_key`; migration và Admin CMS tự chúng chưa thay đổi giao diện website khách hàng.\n\n## 5. Ảnh sản phẩm/banner
Phiên bản starter nhận URL ảnh. Có thể dùng URL ảnh công khai trước; nên bổ sung Supabase Storage bucket và policy upload sau khi chốt yêu cầu quản lý file.

## 6. Triển khai 2 địa chỉ riêng
- Website: deploy project Website như hiện tại.
- Admin: deploy folder này thành một project frontend riêng trên Vercel/Netlify.
- Có thể dùng `admin.tenmiencuaban.vn` cho CMS và `tenmiencuaban.vn` cho Website.
- Thêm rewrite SPA cho `/` nếu nền tảng deploy yêu cầu. Vite mặc định build vào `dist`.

## Trạng thái / giới hạn
Đây là **bộ khung CMS độc lập**, chưa phải hệ thống production hoàn chỉnh. Chưa tích hợp upload file trực tiếp, thanh toán/checkout an toàn, phân quyền nhiều cấp, nhật ký thao tác hoặc kiểm thử trên Supabase thực tế. Migration cần được rà soát trước khi chạy trên project đang có dữ liệu. Không chạy migration này lên một database hiện hữu mà chưa backup/đối chiếu schema.
