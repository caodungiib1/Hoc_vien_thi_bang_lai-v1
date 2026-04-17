# Checklist Phase 60: Fix tạo tài khoản mới trong trang Admin không lưu

## Mô tả vấn đề
Khi Admin tạo tài khoản nhân viên mới trong tab "Quản lý TK" của phần Admin, tài khoản chỉ được hiển thị tạm thời trên giao diện và biến mất sau khi tải lại trang do hàm `createAccount` trong `adminService.js` đang dùng mock data trả về chứ không gọi API lưu vào cơ sở dữ liệu (`database.json`).

## Các thay đổi đã thực hiện

### 1. Backend (`server/index.js`)
- [x] Đã thêm endpoint mới `POST /api/users` chuyên xử lý logic Admin tạo tài khoản.
- [x] Đảm bảo tài khoản mới tạo sẽ có cùng `organizationId` với tài khoản Admin đang thực hiện lệnh (cùng chung 1 trung tâm / doanh nghiệp).
- [x] Kiểm tra kỹ tính hợp lệ của dữ liệu (email không trùng lặp, đầy đủ họ tên mật khẩu).
- [x] Lưu tài khoản mới vào `server/data/database.json`.

### 2. Frontend (`src/services/adminService.js`)
- [x] Cập nhật hàm `createAccount` thay vì trả về object giả `id: Date.now()` thì đổi sang gọi `apiRequest('/users', { method: 'POST', body: {...} })`.
- [x] Map dữ liệu backend trả về qua hàm `mapBackendUser` để đảm bảo định dạng hiển thị phù hợp với bảng trên UI.

## Cách kiểm tra
1. Tải lại trang để áp dụng code mới nhất.
2. Tại dashboard, vào tab Admin / Quản lý TK.
3. Bấm "+ Thêm tài khoản mới", điền thông tin và Lưu.
4. F5 Refresh lại trình duyệt.
5. Tài khoản mới tạo vẫn nằm trong danh sách bảng.
6. Có thể dùng tài khoản đó để đăng nhập.
