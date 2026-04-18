# Checklist 77: ID doanh nghiệp trên link và kế thừa tài khoản cùng doanh nghiệp

## Mục tiêu
- Mỗi doanh nghiệp có một `organizationCode` ngẫu nhiên, không trùng nhau, dùng trên URL.
- Tài khoản đăng ký mới tạo ra một doanh nghiệp riêng.
- Tài khoản được tạo trong tab `Admin` phải kế thừa đúng doanh nghiệp hiện tại.
- Email phải duy nhất trên toàn hệ thống để tránh xung đột.

## Phạm vi
- Backend `auth`, `users`, `database migration`
- Frontend `App`, route, sidebar, header, các link nội bộ
- Đồng bộ dữ liệu người dùng trả về từ API

## Việc cần làm
- [x] Thêm `organizationCode` duy nhất ở backend và migration cho dữ liệu cũ.
- [x] Đảm bảo đăng ký mới tạo doanh nghiệp mới với mã doanh nghiệp ngẫu nhiên.
- [x] Đảm bảo tạo tài khoản trong `Admin` kế thừa đúng `organizationId` và `organizationCode`.
- [x] Giữ ràng buộc email không trùng trên toàn bộ tool.
- [x] Đưa `organizationCode` lên URL sau đăng nhập và khi điều hướng trong app.
- [x] Build và kiểm tra lại các luồng đăng nhập, tạo tài khoản, chia dữ liệu theo doanh nghiệp.
