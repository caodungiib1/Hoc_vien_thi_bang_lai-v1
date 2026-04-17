# Checklist Phase 61: Phân quyền module theo vai trò

## Mô tả vấn đề
- [x] Rà soát quyền truy cập thực tế của các vai trò `admin`, `manager`, `sales`, `acct`, `care`.
- [x] Xác nhận các module nhạy cảm (`Học phí`, `Báo cáo KD`, `Cài đặt`, `Quản lý TK`) đang bị mở sai cho tài khoản không đủ quyền.
- [x] Kiểm tra thêm các module còn lại để tránh sót quyền truy cập trực tiếp bằng URL.

## Kế hoạch xử lý
- [x] Tạo lớp quyền dùng chung để chuẩn hóa role id/label và danh sách module được phép truy cập.
- [x] Áp dụng phân quyền hiển thị menu ở sidebar theo vai trò đăng nhập.
- [x] Áp dụng route guard để chặn truy cập trực tiếp bằng URL.
- [x] Đồng bộ lại bảng phân quyền trong module Admin theo đúng logic chạy thật.
- [x] Thêm màn hình/thông báo phù hợp khi người dùng không có quyền truy cập.

## Kiểm tra sau khi sửa
- [x] Tài khoản `sales` không vào được `Học phí`, `Báo cáo KD`, `Cài đặt`, `Quản lý TK`.
- [x] Tài khoản `acct` chỉ vào được các module đã cấp quyền.
- [x] Tài khoản `care` chỉ vào được các module đã cấp quyền.
- [x] Tài khoản `manager` không vào được `Cài đặt`, `Quản lý TK`.
- [x] Tài khoản `admin` vẫn truy cập được toàn bộ module.
- [x] Build hoặc kiểm tra runtime không phát sinh lỗi mới.
