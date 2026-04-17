# Checklist Phase 59: Fix tất cả module không lưu dữ liệu (Persistence)

## Mô tả vấn đề
Tất cả các module (Học viên, Học phí, Cài đặt, Thông báo) đang dùng static array trong RAM — mọi thao tác tạo/sửa/xóa mất ngay khi reload trang. Đây là nguyên nhân sửa thông tin học viên không lưu được.

## Các thay đổi đã thực hiện

### `src/services/studentService.js` — QUAN TRỌNG NHẤT
- [x] Thêm `getUserScopedKey, readStorage, writeStorage` từ `storageService`.
- [x] Gộp `mockStudents` + `mockStudentProfiles` thành **1 store** duy nhất trong localStorage → key: `qlhv.org.<orgId>.students.v1`.
- [x] `getStudents()`: đọc từ localStorage, trả về dạng tóm tắt tương thích `Students.jsx`.
- [x] `getStudentById()`: đọc từ localStorage theo id.
- [x] `createStudent()`: thêm học viên mới vào localStorage.
- [x] `updateStudent()`: cập nhật đúng record trong localStorage → **sửa thông tin học viên giờ được lưu vĩnh viễn**.
- [x] `deleteStudent()`: xóa khỏi localStorage.

### `src/services/feeService.js`
- [x] `getFeeRecords()`: đọc từ localStorage (default = `mockFeeRecords`).
- [x] `getFeeOverview()`: tính toán từ records thực tế thay vì đọc từ `mockFeeOverview` cứng.
- [x] `collectFee()`: cập nhật record trong localStorage → thu học phí reload vẫn còn.
- [x] `getPaymentHistory()`: flatten từ records thực tế.

### `src/services/settingsService.js`
- [x] 5 store riêng: `licenses`, `regions`, `statuses`, `templates`, `sources` — mỗi store 1 localStorage key.
- [x] CRUD persist đầy đủ cho từng store.
- [x] Giữ backward compat: `createSettingItem/updateSettingItem/deleteSettingItem` tự detect kiểu gọi từ `Settings.jsx` (không truyền type).

### `src/services/notificationService.js`
- [x] `getNotificationHistory()`: đọc từ localStorage.
- [x] `createNotificationRecord()`: thêm vào localStorage.
- [x] `getNotificationTriggers()`: đọc từ localStorage.
- [x] `updateNotificationTrigger()`: persist bật/tắt trigger vào localStorage.

## Kết quả kiểm tra
- [x] Build thành công: ✅ 63 modules, built in 245ms — không có lỗi.

## Lưu ý kỹ thuật
- Tất cả storage key dùng format: `qlhv.org.<organizationId>.<baseKey>` → Mỗi doanh nghiệp có dữ liệu riêng hoàn toàn.
- Lần đầu đăng nhập sau khi deploy: dữ liệu demo (mockStudents, mockFees...) được tự động load làm default, sau đó mọi thay đổi được persist.
