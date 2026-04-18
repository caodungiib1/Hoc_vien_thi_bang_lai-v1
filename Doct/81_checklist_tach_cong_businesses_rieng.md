# Checklist tách cổng Businesses riêng

- [x] Tạo route riêng `http://localhost:5174/businesses`
- [x] Tách auth storage riêng cho system admin, không dùng chung với tool doanh nghiệp
- [x] Thêm endpoint đăng nhập system admin riêng ở backend
- [x] Chặn system admin đăng nhập qua màn auth chung của doanh nghiệp
- [x] Tạo giao diện đăng nhập riêng chỉ có tài khoản và mật khẩu
- [x] Tạo layout riêng cho cổng Businesses, không dùng sidebar của tool chính
- [x] Giữ đúng một tab điều hướng `Doanh nghiệp`
- [x] Build và kiểm tra lại luồng đăng nhập
