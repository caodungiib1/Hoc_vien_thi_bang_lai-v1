# Checklist Phase 88: Fix tính năng "Ghi nhớ" trang đăng nhập

## Mô tả vấn đề
Form đăng nhập đang hardcode sẵn `email: 'admin@trungcau.vn'`, `password: 'admin123'` và `remember: true` làm giá trị mặc định.
Kết quả: Dù người dùng chưa đăng nhập lần nào, form vẫn luôn hiển thị thông tin tài khoản đó và checkbox "Ghi nhớ" luôn được tích sẵn.

## Yêu cầu đúng
- Nếu chưa từng đăng nhập và ghi nhớ: form hiển thị trống, checkbox không tích.
- Nếu đã đăng nhập và chọn "Ghi nhớ": lần sau mở trang tự điền đúng email đã ghi nhớ, checkbox tích sẵn.
- Nếu đăng nhập mà không chọn "Ghi nhớ": xóa email đã lưu (nếu có), form trống lần sau.

## Các thay đổi đã thực hiện

### `src/pages/Auth.jsx`
- [x] Xóa hardcode giá trị mặc định (`email`, `password`, `remember: true`) trong `LOGIN_FORM`
- [x] Thêm key `REMEMBER_EMAIL_KEY = 'qlhv.auth.remember.email'` để đọc/ghi từ `localStorage`
- [x] Khởi tạo state `loginForm` bằng cách đọc email đã lưu từ `localStorage` → nếu có thì điền email + bật checkbox, không có thì để trống
- [x] Cập nhật `handleLogin`: sau khi đăng nhập thành công, nếu `remember = true` thì lưu email vào localStorage, ngược lại thì xóa

## Cách kiểm tra
1. Xóa toàn bộ localStorage của trình duyệt (F12 > Application > Clear storage).
2. Mở trang đăng nhập → form phải trống hoàn toàn, checkbox không tích.
3. Nhập tài khoản A, tích "Ghi nhớ", đăng nhập thành công. Logout.
4. Mở lại trang đăng nhập → form tự điền email tài khoản A, checkbox được tích.
5. Nhập tài khoản B, bỏ tích "Ghi nhớ", đăng nhập thành công. Logout.
6. Mở lại trang đăng nhập → form trống, checkbox không tích.
