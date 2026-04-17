# Checklist Phase 63: Sửa CRUD module Cài đặt bị lưu sai danh mục

## Mô tả vấn đề
- [x] Xác nhận lỗi tạo mới ở tab `Nguồn học viên` có thể bị lưu nhầm sang `Hạng bằng`.
- [x] Xác nhận các tab khác trong `Cài đặt` đang dùng hàm CRUD fallback có nguy cơ ghi/xóa sai store.
- [x] Ghi nhận cần rà soát lại toàn bộ 5 tab: `Hạng bằng`, `Khu vực`, `Trạng thái học viên`, `Mẫu thông báo`, `Nguồn học viên`.

## Kế hoạch xử lý
- [x] Tách rõ CRUD theo từng store trong `settingsService.js`.
- [x] Cập nhật `Settings.jsx` để mỗi tab gọi đúng hàm riêng, không dùng fallback mơ hồ.
- [x] Thêm logic phát hiện và dọn dữ liệu đã lưu sai chỗ trong phần `Cài đặt`.
- [x] Kiểm tra lại tạo/xóa/sửa ở từng tab sau khi fix.

## Kiểm tra sau khi sửa
- [x] Tạo `TikTok` ở `Nguồn học viên` không còn chui sang `Hạng bằng`.
- [x] Tạo mới ở `Khu vực` không bị ghi nhầm sang store khác.
- [x] Xóa item ở từng tab chỉ xóa đúng danh mục đó.
- [x] `Mẫu thông báo` vẫn sửa nội dung bình thường.
- [x] `Hạng bằng` không còn record lỗi kiểu thiếu `type`, `fee`, `duration`.
- [x] Build/runtime không phát sinh lỗi mới.
