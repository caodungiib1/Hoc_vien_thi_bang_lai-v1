# Checklist 78: Trang quản lý doanh nghiệp toàn hệ thống

## Mục tiêu
- Tạo trang `Doanh nghiệp` chỉ dành cho `system admin`.
- Hiển thị toàn bộ doanh nghiệp hiện có trong tool.
- Theo dõi số lượng tài khoản theo vai trò của từng doanh nghiệp.
- Theo dõi trạng thái hoạt động `15 phút` gần nhất và thời điểm doanh nghiệp offline.

## Phạm vi
- Backend: database migration, auth sanitize, API tổng hợp doanh nghiệp
- Frontend: quyền truy cập, menu sidebar, route, service, page mới
- UI: bảng doanh nghiệp, tìm kiếm, lọc trạng thái, phân trang, xem chi tiết tài khoản trong doanh nghiệp

## Việc cần làm
- [x] Thêm cờ `isSystemAdmin` và migrate dữ liệu cũ.
- [x] Tạo API tổng hợp danh sách doanh nghiệp toàn hệ thống.
- [x] Thêm module `Doanh nghiệp` chỉ cho `system admin`.
- [x] Tạo service frontend lấy dữ liệu doanh nghiệp.
- [x] Tạo page `Doanh nghiệp` với bảng, filter, phân trang.
- [x] Thêm xem chi tiết tài khoản theo từng doanh nghiệp.
- [x] Build và kiểm tra phân quyền, dữ liệu, điều hướng.
