# Checklist 76: Thêm phân trang cho các danh sách lớn

## Mục tiêu
- Rà toàn bộ tool để xác định các màn có thể phình dữ liệu.
- Thêm phân trang cho các bảng/list lớn để tránh render toàn bộ dữ liệu gây giật lag.
- Dùng chung một component phân trang để giao diện và hành vi nhất quán.

## Phạm vi
- Học viên
- Học phí
- Hồ sơ
- Admin
- Lớp học
- Lịch thi
- Người giới thiệu
- BOT thông báo
- Nhắc việc
- Kết quả KD

## Việc cần làm
- [x] Tạo hook phân trang dùng chung.
- [x] Tạo component điều hướng trang dùng chung.
- [x] Gắn phân trang vào các bảng/list dữ liệu lớn.
- [x] Tinh chỉnh CSS cho phần phân trang.
- [x] Build kiểm tra lại toàn bộ project.

## Kiểm tra sau khi xong
- [x] Các bảng lớn chỉ render một số dòng theo trang.
- [x] Đổi trang, đổi số dòng mỗi trang hoạt động ổn định.
- [x] Filter/sort không làm vỡ phân trang.
- [x] Build production thành công.
