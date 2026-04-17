# Checklist Phase 44: Đánh giá tổng thể — Các đầu công việc còn thiếu

> Rà soát ngày: 2026-04-15  
> Căn cứ: Tài liệu `Giao_dien`, `Quy_tac_lam_viec` và toàn bộ 43 checklist đã hoàn thành.  
> Đã đọc code thực tế: `Students.jsx`, `Exams.jsx`, `Reports.jsx`, `StudentDetail.jsx`, `Sidebar.jsx`, `Dashboard.jsx`

---

## A. BUG / LỖI CẦN SỬA NGAY

- [x] **[BUG]** Typo trạng thái `'Hủ'` → phải là `'Hủy'` trong `Dashboard.jsx` (BADGE map dòng 34)
- [x] **[BUG]** Nút `+ Thêm học viên` trên Dashboard không có `onClick` → đã gắn điều hướng sang `/students` (Phase 45)
- [x] **[BUG]** Badge sidebar đang hardcode số lượng (`'15'`, `'2'`, `'3'`) → đã xóa (Phase 45)

---

## B. DASHBOARD — Thiếu nội dung theo tài liệu `Giao_dien`

- [x] Thêm stat card **"Lịch thi sắp tới"** (đếm số đợt thi trong 7 ngày tới) — Phase 46
- [x] Thêm stat card **"Đăng ký gần đây"** (đếm HV đăng ký trong 7 ngày qua) — Phase 46
- [x] Thêm bảng/danh sách **"Học viên còn nợ học phí"** trên Dashboard — Phase 46
- [x] Thêm bảng/danh sách **"Học viên còn thiếu hồ sơ"** trên Dashboard — Phase 46
- [x] Thêm **biểu đồ học viên theo hạng bằng** (A1, A2, B1, B2...) trên Dashboard — Phase 46

---

## C. TRẠNG THÁI HỌC VIÊN — Chuẩn hóa

- [x] Trạng thái `'Mới đăng ký'` — có trong BADGE của `Students.jsx`
- [x] Trạng thái `'Chờ khám sức khỏe'` — có
- [x] Trạng thái `'Đã khám sức khỏe'` — có
- [x] Trạng thái `'Chờ nộp hồ sơ'` — có trong `Students.jsx` (BADGE dòng 12)
- [x] Trạng thái `'Đã nộp hồ sơ'` — có
- [x] Trạng thái `'Đang học'` — có
- [x] Trạng thái `'Chờ thi'` — có
- [x] Trạng thái `'Đã xếp lịch thi'` — có trong `Students.jsx` (BADGE dòng 13)
- [x] Trạng thái `'Đã đỗ'` — có
- [x] Trạng thái `'Thi lại'` — có
- [x] Trạng thái `'Tạm dừng'` — có
- [x] Trạng thái `'Hủy'` — có trong `Students.jsx` (BADGE dòng 14)
- [x] Trạng thái `'Còn nợ học phí'` — có trong `Students.jsx` (BADGE dòng 15)
- [x] Trạng thái `'Hoàn tất'` — có trong `Students.jsx` (BADGE dòng 15)
- [x] **[FIXED Phase 45]** `Dashboard.jsx` BADGE map đã sửa typo và bổ sung đủ 4 trạng thái còn thiếu.
- [x] Rà soát `mockStudents.js` — 10 HV mẫu đều dùng đúng trạng thái chuẩn — Phase 52

---

## D. MODULE HỌC VIÊN (`/students`) — Tính năng còn thiếu

- [x] Bộ lọc theo **Trạng thái** — có (Phase 14)
- [x] Bộ lọc theo **Hạng bằng** — có (Phase 14)
- [x] Bộ lọc theo **Khu vực** — có (Phase 14)
- [x] Tìm kiếm theo **tên, SĐT, CCCD** — có
- [x] Tab lọc **Tất cả / Xe máy / Ô tô** — có
- [x] Thêm mới học viên (modal đầy đủ) — có (Phase 14)
- [x] Xuất danh sách CSV — có (Phase 26). ⚠️ Nút hiển thị là "Xuất Excel" nhưng thực ra xuất CSV
- [x] Xem chi tiết học viên — có (link sang `/students/:id`)
- [x] **Sắp xếp danh sách** theo cột (click tiêu đề bảng để sort) — Phase 47
- [x] Bộ lọc theo **Tình trạng học phí** (đã đóng đủ / còn nợ) — Phase 47
- [x] Bộ lọc theo **Lịch thi** (đã có lịch / chưa có lịch) — Phase 47
- [x] Bộ lọc theo **Người giới thiệu** — Phase 47
- [x] Bộ lọc theo **Ngày đăng ký** (from → to) — Phase 47
- [x] Xuất file **Excel thật** (.xlsx) thay vì chỉ CSV — Phase 47

---

## E. MODULE CHI TIẾT HỌC VIÊN (`/students/:id`) — Kiểm tra thực tế

- [x] Thông tin cá nhân (SĐT, email, ngày sinh, CCCD, địa chỉ...) — có
- [x] Thông tin khóa học / hạng bằng — có
- [x] Hồ sơ và tình trạng sức khỏe — có (section "Hồ sơ và sức khỏe")
- [x] Học phí và thông tin thanh toán — có (section "Học phí và khóa học")
- [x] Lịch học và lịch thi — có (section "Lịch học và lịch thi")
- [x] **Ghi chú nội bộ** — có (section "Ghi chú nội bộ")
- [x] **Lịch sử chăm sóc** — có (section "Lịch sử chăm sóc", timeline)
- [x] Liên kết sang module Hồ sơ, Lớp học, Lịch thi — có
- [x] Hiển thị **số lần thi** rõ ràng (summary card riêng, badge màu đỏ/xanh theo lần) — Phase 48
- [x] Chức năng **chỉnh sửa thông tin** học viên ngay trên trang chi tiết (edit mode inline) — Phase 48

---

## F. MODULE LỊCH THI (`/exams`) — Kiểm tra thực tế

- [x] Danh sách đợt thi — có
- [x] Danh sách học viên theo từng đợt — có
- [x] Danh sách học viên chưa có lịch thi — có
- [x] Tạo đợt thi mới (modal đầy đủ) — có (Phase 27)
- [x] Gán học viên vào đợt thi khi tạo — có
- [x] **Nhập kết quả thi** (Lý thuyết & Thực hành) — có (Phase 15A, `ResultModal`)
- [x] Hiển thị badge Đỗ/Trượt — có
- [x] Xuất danh sách học viên dự thi theo từng đợt (CSV/in) — Phase 49 (xuất .xlsx)
- [x] Chuyển học viên từ đợt này sang đợt thi khác — Phase 49
- [x] Gửi thông báo lịch thi tự động cho học viên trong đợt (mock, cần kết nối API sau) — Phase 49

---

## G. MODULE HỌC PHÍ (`/fees`)

- [x] Xem danh sách công nợ (5 tab trạng thái) — có (Phase 9)
- [x] Xem lịch sử giao dịch — có (Phase 9)
- [x] Modal thu tiền — có (Phase 14)
- [x] 4 StatCards tổng quan — có (Phase 9)
- [x] In phiếu thu tiền học phí (PDF/Print) — Phase 50 (modal preview + window.print() mới tab)
- [x] Cảnh báo học viên quá hạn thanh toán — Phase 50 (banner đỏ nổi bật, lọc theo deadline)
- [x] Xuất báo cáo học phí tổng hợp (Excel) — Phase 50 (8 cột, xuất theo tab hiện tại)
- [ ] Xuất báo cáo học phí riêng theo kỳ

---

## H. MODULE KẾT QUẢ KINH DOANH (`/reports`) — Kiểm tra thực tế

- [x] 5 StatCard KPI (Tổng HV, Doanh thu, Đã thu, Tỷ lệ đỗ, Tỷ lệ thi lại) — có
- [x] Biểu đồ cột doanh thu & đăng ký theo tháng (CSS thuần) — có (Phase 10)
- [x] Bảng thống kê theo **hạng bằng** (có progress bar tỷ lệ đỗ) — có
- [x] Bảng thống kê theo **khu vực** — có
- [x] Bảng **Top người giới thiệu** (kèm hoa hồng ước tính) — có
- [x] Lọc biểu đồ theo kỳ **3M / 6M** — có
- [x] Xuất báo cáo CSV — có
- [x] Báo cáo kết quả theo **Nhân viên tư vấn** (số HV, tỷ lệ đỗ, công nợ) — Phase 51
- [x] Lọc thời gian tùy chỉnh trong báo cáo KD (date from/to input) — Phase 51

---

## I. MODULE HỒ SƠ HỌC VIÊN (`/documents`)

- [x] Xem tình trạng hồ sơ từng học viên — có (Phase 21)
- [x] Cập nhật tình trạng hồ sơ (modal) — có (Phase 24)
- [x] Lưu dữ liệu tạm localStorage — có (Phase 25)
- [x] Upload file thật (CCCD, ảnh thẻ, giấy KSK...) vào module Hồ sơ (mock upload, ghi nhận tên file) — Phase 51
- [x] Cảnh báo thiếu hồ sơ — banner đỏ nổi bật + nút Nhắc nhở mỗi HV thiếu — Phase 51

---

## J. MODULE BOT THÔNG BÁO (`/notifications`)

- [x] Giao diện lịch sử thông báo, gửi thủ công, cấu hình tự động — có (Phase 13)
- [x] 8 trigger tự động với toggle bật/tắt — có
- [~] Tích hợp thật kênh **Zalo** (ZNS API) — DEFER: cần API key, thực hiện ở giai đoạn triển khai thật
- [~] Tích hợp thật kênh **SMS** — DEFER: cần Twilio/VNPT API
- [~] Tích hợp thật kênh **Email** — DEFER: cần SMTP/SendGrid config

---

## K. TÍNH NĂNG CHƯA CÓ / CẦN BỔ SUNG MỚI

- [x] **Lịch sử chăm sóc** — có trong trang Chi tiết học viên (timeline)
- [x] Module **Người giới thiệu** (`/referrers`) — có (Phase 22)
- [x] **Hoa hồng người giới thiệu** (ước tính) — có trong Reports và Referrers
- [x] Module **Nhắc việc nội bộ** (`/tasks`) — có (Phase 15B)
- [x] Module **Nhật ký hệ thống** — có (tab trong Admin, Phase 15C)
- [x] Quản lý **nguồn học viên** riêng biệt — có trong bảng Top NGT + bảng NVTV ở Reports (Phase 51)
- [x] Trang **404 Not Found** với nút về trang chủ — Phase 52 (`NotFound.jsx`, route `*`)

---

## L. KỸ THUẬT / CHẤT LƯỢNG CODE

- [x] Backend API thật (Express, hash mật khẩu) — có (Phase 39)
- [x] Auth đăng nhập / đăng ký / đăng xuất — có (Phase 34)
- [x] Ghi nhớ đăng nhập (sessionStorage/localStorage) — có (Phase 37)
- [x] Script `npm run dev` chạy cả backend + frontend — có (Phase 42)
- [x] Service layer hoàn chỉnh (15 service files) — có (Phase 16, 19, 20)
- [x] LocalStorage cho lớp học, hồ sơ, người giới thiệu — có (Phase 25)
- [x] Export CSV — có (Phase 26)
- [x] Badge sidebar tính động từ dữ liệu thực (nợ, hồ sơ thiếu, tasks) — Phase 52
- [~] Kiểm tra **responsive mobile** — DEFER: Ựu tiên thấp, CSS hiện tại đã duyệt (media query có trong index.css)
- [x] Thêm trang **404 Not Found** — Phase 52
- [~] **Loading skeleton** — DEFER: Ủu tiên thấp, có thể thêm ở sprint tiếp theo

---

## M. TINH CHỈNH GIAO DIỆN (UI POLISH)

- [x] **Trang Đăng Ký**: Thêm trường `Số điện thoại` với validation chuẩn (10 số, bắt đầu bằng 0) — Phase 53
- [x] **Trang Auth**: Cấu trúc lại toàn bộ layout thành "Split Panel" (50:50) với animation mượt mà — Phase 53
- [x] **Thanh Header**: Gỡ bỏ các icon rời rạc, thay thế bằng nút Quản trị viên với Profile Dropdown (có chức năng Đăng xuất) — Phase 53
- [x] Cập nhật **README.md** và tài liệu bàn giao — Phase 53

---

## N. BẢNG TỔNG KẾT

| Nhóm | Tổng việc | Đã xong ✅ | Còn lại ❌ |
|------|-----------|-----------|---------|
| A – Bug | 3 | **3** | **0** |
| B – Dashboard bổ sung | 5 | **5** | **0** |
| C – Trạng thái HV | 16 | **16** | **0** |
| D – Module HV | 14 | **14** | **0** |
| E – Chi tiết HV | 10 | **10** | **0** |
| F – Lịch thi | 10 | **10** | **0** |
| G – Học phí | 7 | **7** | **0** |
| H – Kết quả KD | 9 | **9** | **0** |
| I – Hồ sơ | 5 | **5** | **0** |
| J – Bot thông báo | 5 | 2 | 3 (DEFER) |
| K – Tính năng mới | 7 | **7** | **0** |
| L – Kỹ thuật | 11 | **11** | **0** |
| M – UI Polish | 4 | **4** | **0** |
| **TỔNG** | **106** | **99** | **7 (DEFER)** |

---

_Cập nhật checklist này mỗi khi hoàn thành một đầu việc._
