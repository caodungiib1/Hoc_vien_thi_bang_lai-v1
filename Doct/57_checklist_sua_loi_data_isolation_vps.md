# Checklist Phase 57: Sửa lỗi dữ liệu dùng chung & quản lý tài khoản trên VPS

## Mô tả vấn đề
- User mới đăng ký thấy toàn bộ dữ liệu demo (học viên, đợt thi...) của tài khoản admin.
- Tài khoản mới không xuất hiện trong module Quản lý Tài khoản (/admin).

## Nguyên nhân & Fix

### Lỗi 1 — Dữ liệu dùng chung (localStorage key cố định)
- [x] Thêm `getUserScopedKey(baseKey)` vào `storageService.js` — prefix key theo userId.
- [x] `examService.js` — đổi sang user-scoped key.
- [x] `classService.js` — đổi sang user-scoped key.
- [x] `documentService.js` — đổi sang user-scoped key.
- [x] `referrerService.js` — đổi sang user-scoped key.
- [x] `taskService.js` — thêm localStorage persistence + user-scoped key.

### Lỗi 2 — Quản lý Tài khoản dùng mock hardcode
- [x] Thêm `GET /api/users` vào `server/index.js` (yêu cầu auth).
- [x] Thêm `PATCH /api/users/:id/status` vào `server/index.js` (khóa/mở tài khoản).
- [x] Viết lại `adminService.js` — `getAccounts()` gọi API thật, `toggleAccountLock()` gọi API thật.
- [x] Sửa `Admin.jsx` — `roleMap` lookup hỗ trợ cả label lẫn id, logic disabled nút khóa cũng cover cả 2 dạng.

## Kết quả kiểm tra
- [x] `npm run build` thành công — ✅ 63 modules, không có warning.

## Quy tắc localStorage sau fix
- Format key mới: `qlhv.u.<userId>.<baseKey>` (ví dụ: `qlhv.u.abc123.examBatches.v1`)
- Nếu chưa đăng nhập / không lấy được userId: fallback về `qlhv.<baseKey>` (an toàn)
