# Checklist Phase 42: Sửa lỗi chạy backend dev

- [x] Ghi nhận lỗi `spawn EINVAL` khi chạy `npm run dev`.
- [x] Xác định nguyên nhân do script dev spawn `npm.cmd` lồng trong npm trên Windows.
- [x] Sửa `scripts/dev.js` để chạy trực tiếp backend và Vite bằng `node`.
- [x] Thêm xử lý lỗi child process rõ ràng hơn.
- [x] Chạy lint và build.
- [x] Test script dev khởi động được cả `localhost:4000` và `localhost:5173`.
- [x] Đánh dấu hoàn tất Phase 42.
