# Checklist Phase 89: Fix header bị hiển thị lạ trên trang /businesses

## Mô tả vấn đề
Khi người dùng đã đăng nhập vào tool chính (có token lưu trong localStorage) và sau đó truy cập trang `/businesses`, một thanh header lạ xuất hiện ở trên cùng trang — đây là do `App.jsx` đang khởi tạo `currentUser` từ `localStorage` của tool chính ngay cả khi đang ở route `/businesses`, và `syncCurrentUser()` cũng chạy không cần thiết.

## Nguyên nhân
- `useState(getCurrentUser)` ở `App.jsx` đọc user từ localStorage ngay lúc khởi tạo, không phân biệt đang ở route nào.
- `syncCurrentUser()` trong `useEffect` chạy API `/auth/me` của tool chính ngay cả khi đang ở `/businesses`.
- Hai hành động này có thể gây ra render DashboardLayout hoặc flash giao diện của tool chính trên trang Businesses.

## Các thay đổi đã thực hiện

### `src/App.jsx`
- [x] Đổi `useState(getCurrentUser)` thành `useState(() => isSystemBusinessesRoute ? null : getCurrentUser())` → khi ở `/businesses`, `currentUser` khởi tạo là `null`, không load user của tool chính.
- [x] Thêm guard `if (isSystemBusinessesRoute) return;` vào `useEffect` chạy `syncCurrentUser()` → không gọi API `/auth/me` của tool chính khi đang ở cổng `/businesses`.
- [x] Dời khai báo `isSystemBusinessesRoute` lên trước `currentUser` để dùng được trong initializer.

## Cách kiểm tra
1. Đăng nhập tool chính, vào dashboard bình thường.
2. Mở tab mới, truy cập `/businesses`.
3. Trang hiển thị đúng: chỉ thấy form đăng nhập Businesses hoặc giao diện Businesses shell, không có header thừa của tool chính.
4. Đăng nhập Businesses → trang hiển thị đúng nội dung danh sách doanh nghiệp.
5. Quay lại tab tool chính → vẫn đang đăng nhập bình thường, không bị ảnh hưởng.
