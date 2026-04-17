# Checklist Phase 58: Multi-Tenant — Mỗi tài khoản là 1 doanh nghiệp độc lập

## Mô tả vấn đề
Phase 57 chỉ scope localStorage theo userId nhưng backend `GET /api/users` vẫn trả về toàn bộ user — dẫn đến Admin panel hiển thị tài khoản của doanh nghiệp khác.

Yêu cầu thật sự:
- `admin@trungcau.vn` = Doanh nghiệp 1 → chỉ thấy dữ liệu của DN1
- `newuser@example.vn` = Doanh nghiệp 2 → chỉ thấy dữ liệu của DN2
- Hai doanh nghiệp hoàn toàn độc lập, không thấy nhau

## Giải pháp: `organizationId`
Mỗi user đăng ký = chủ 1 tổ chức riêng (`organizationId = user.id`).

## Các thay đổi đã thực hiện

### Backend
- [x] `server/database.js` — Thêm `organizationId` vào user admin mặc định; thêm `migrateDatabase()` tự động upgrade DB cũ (version 1 → 2) mà không cần xóa tay.
- [x] `server/index.js` — `sanitizeUser()` expose thêm `organizationId`.
- [x] `server/index.js` — `POST /api/auth/register`: tạo UUID riêng cho userId, gán `organizationId = userId`.
- [x] `server/index.js` — `GET /api/users`: lọc chỉ trả về users cùng `organizationId`.
- [x] `server/index.js` — `PATCH /api/users/:id/status`: chỉ cho phép sửa user cùng tổ chức.
- [x] Xóa `server/data/database.json` cũ (tạo lại với cấu trúc v2 khi server khởi động).

### Frontend
- [x] `src/services/storageService.js` — `getUserScopedKey()` đổi sang dùng `organizationId` thay vì `userId`. Format key mới: `qlhv.org.<orgId>.<baseKey>`.

## Kết quả kiểm tra (screenshot đã xác nhận)
- [x] DN1 (`admin@trungcau.vn`): Admin panel hiển thị **1 tài khoản** — chỉ thấy của mình.
- [x] DN2 (`business2@example.vn`): Admin panel hiển thị **1 tài khoản** — chỉ thấy của mình.
- [x] Hai doanh nghiệp **KHÔNG thấy nhau** trong Admin panel.
- [x] Build thành công: ✅ 63 modules, built in 268ms.

## Lưu ý khi deploy VPS
- Xóa file `server/data/database.json` trên VPS trước khi deploy để migration tự động chạy sạch.
- Hoặc giữ file cũ — migration sẽ tự thêm `organizationId` cho các user cũ (version 1 → 2).
