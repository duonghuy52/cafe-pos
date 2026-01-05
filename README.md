# Cafe POS (PHP + XAMPP + MySQL)

Project mẫu POS cho quán cafe (PHP thuần) — chạy cục bộ với XAMPP.

Yêu cầu:
- XAMPP (Apache + MySQL) cài trên Windows
- PHP 7.4+ hoặc 8.x

Các bước nhanh để chạy (PowerShell):

1. Copy/di chuyển thư mục `cafe-pos` vào `C:\xampp\htdocs` (hoặc sửa VirtualHost Apache trỏ tới folder này).

```powershell
# ví dụ copy
cp -Recurse -Force "C:\Users\kienk\OneDrive\Máy tính\WEB\cafe-pos" "C:\xampp\htdocs\"
```

2. Start Apache và MySQL trong XAMPP Control Panel.
3. Tạo database (ví dụ: `cafe_pos`) và import file SQL `sql/db_init.sql` (sử dụng phpMyAdmin hoặc MySQL CLI).
4. Tạo tài khoản admin (hash mật khẩu an toàn):

	Sau khi import `sql/db_init.sql`, chạy script CLI để tạo user admin với mật khẩu an toàn.

	Ví dụ (PowerShell, khi đã cài XAMPP mặc định ở C:\xampp):

```powershell
& 'C:\xampp\php\php.exe' 'C:\xampp\htdocs\cafe-pos\tools\create_admin.php' admin123
```

	- `admin123` là mật khẩu ví dụ; thay bằng mật khẩu bạn muốn.
	- Script sẽ tạo user `admin` nếu chưa có, hoặc cập nhật mật khẩu nếu user đã tồn tại.

5. Mở trình duyệt: `http://localhost/cafe-pos/public/login.php` để đăng nhập và truy cập POS.

**Tài khoản mặc định demo (không mã hóa - cho bài tập lớp):**
- Tên đăng nhập: `admin` / Mật khẩu: `123456`
- Tên đăng nhập: `sinhvien` / Mật khẩu: `123456`

File quan trọng:
- `config.php` — cấu hình kết nối DB (cập nhật DB_USER/DB_PASS)
- `sql/db_init.sql` — schema và seed dữ liệu mẫu
- `public/login.php` — trang đăng nhập
- `public/index.php` — giao diện POS mẫu
- `public/admin.php` — quản trị sản phẩm
- `api/` — các endpoint xử lý (sản phẩm, đơn hàng, login, logout)

Ghi chú:
- **Hệ thống đăng nhập:** Session-based authentication với password hash an toàn (password_hash/password_verify).
- **Bảo mật:** Sử dụng prepared statements chống SQL injection. Nên thay đổi password user admin sau khi triển.

- In hóa đơn: trang in hóa đơn mẫu đã có tại `public/invoice.php`. Sau khi thanh toán trang POS sẽ mở cửa sổ in cho từng đơn.

- In nhiệt (ESC/POS): để in trực tiếp ra máy in hóa đơn nhiệt hoặc khổ 80mm, bạn có thể dùng thư viện PHP như `mike42/escpos-php` (https://github.com/mike42/escpos-php) hoặc in từ trang `invoice.php` qua trình duyệt rồi chọn máy in. Nếu in trực tiếp từ server tới máy in USB/Serial trên Windows có thể cần cấu hình printer sharing hoặc sử dụng bridge (ví dụ node-escpos hoặc escpos-php với driver phù hợp). Đây là phần mở rộng; nếu muốn, tôi có thể thêm ví dụ.

- Trang báo cáo doanh thu: `public/report.php` — chọn khoảng ngày, xem tóm tắt và xuất CSV.

- Thay logo: đặt file logo của bạn vào `assets/images/logo.svg` (thay thế file placeholder). SVG giữ chất lượng trên màn hình và khi in. Nếu bạn có PNG, thay đổi đường dẫn trong `public/index.php` và `public/invoice.php`.

Nếu bạn muốn, tôi sẽ tiếp tục triển khai các API chi tiết, UI đầy đủ và hướng dẫn import/seed tự động.
