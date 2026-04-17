# QLHV Lái Xe — Hệ thống Quản lý Học viên Trung tâm Đào tạo Lái xe

> Phiên bản SaaS hiện đại, giao diện dark/light mode, đầy đủ tính năng quản lý từ tuyển sinh đến cấp bằng.

---

## 🚀 Khởi động nhanh

### Yêu cầu hệ thống
- **Node.js** >= 18.x
- **npm** >= 9.x

### Cài đặt & chạy

```bash
# 1. Cài đặt dependencies
npm install

# 2. Chạy đồng thời frontend (Vite) + backend (Express)
npm run dev
```

- **Frontend:** http://localhost:5173 (hoặc 5174 nếu port bị dùng)
- **Backend API:** http://localhost:4000/api

### Build production

```bash
npm run build
```

Output tại `dist/` — triển khai lên bất kỳ static host (Vercel, Netlify, Nginx...).

---

## 🔐 Đăng nhập mặc định

| Email | Mật khẩu | Vai trò |
|-------|----------|---------|
| `admin@trungcau.vn` | `admin123` | Quản trị viên |

---

## 📋 Tính năng chính

### 📊 Tổng quan (Dashboard)
- 11 stat cards theo dõi trạng thái học viên real-time
- Bảng lịch thi sắp tới (7 ngày)
- Bảng học viên đăng ký gần đây
- Bảng học viên còn nợ học phí
- Bảng học viên thiếu hồ sơ
- Biểu đồ phân bố học viên theo hạng bằng

### 👥 Học viên (`/students`)
- Danh sách đầy đủ với bộ lọc 6 chiều (trạng thái, hạng, khu vực, học phí, lịch thi, ngày đăng ký)
- Tìm kiếm theo tên / SĐT / CCCD
- Sắp xếp theo cột (click tiêu đề)
- Thêm học viên mới (modal đầy đủ)
- **Xuất Excel** (.xlsx) với 12 cột

### 📄 Chi tiết học viên (`/students/:id`)
- Thông tin cá nhân đầy đủ (SĐT, email, CCCD, địa chỉ, liên hệ khẩn cấp...)
- Lịch học & lịch thi
- Trạng thái hồ sơ (CCCD, ảnh thẻ, giấy KSK, đơn đăng ký)
- Học phí & công nợ chi tiết
- Ghi chú nội bộ & lịch sử chăm sóc (timeline)
- **Edit mode inline** — chỉnh sửa trực tiếp không cần modal

### 📅 Lịch thi (`/exams`)
- Quản lý đợt thi theo batch
- Danh sách học viên từng đợt
- Nhập kết quả thi (Lý thuyết + Thực hành)
- Chuyển học viên giữa đợt thi
- Gửi thông báo lịch thi (mock)
- **Xuất Excel** danh sách dự thi

### 💰 Học phí (`/fees`)
- 4 stat cards tổng quan (Tổng phải thu, Đã thu, Còn nợ, Số HV nợ)
- Tab lọc theo trạng thái (Đã đủ / Còn nợ / Quá hạn...)
- **Banner cảnh báo** học viên quá hạn thanh toán (tự động lọc theo deadline)
- Thu tiền & ghi nhận thanh toán (modal)
- **In phiếu thu** (mở tab mới, auto-print)
- **Xuất báo cáo Excel** (8 cột, theo tab đang xem)
- Lịch sử giao dịch chi tiết

### 📁 Hồ sơ (`/documents`)
- Theo dõi tình trạng hồ sơ từng học viên
- **Banner cảnh báo** học viên còn thiếu giấy tờ + nút Nhắc nhở
- Cập nhật trạng thái hồ sơ (modal)
- **Upload file mock** (giả lập đính kèm, cần cloud storage thật sau)
- Xuất danh sách CSV

### 📈 Kết quả Kinh doanh (`/reports`)
- 5 KPI cards (Tổng HV, Doanh thu, Đã thu, Tỷ lệ đỗ, Tỷ lệ thi lại)
- Biểu đồ cột Doanh thu & Đăng ký theo tháng (CSS thuần, tooltip hover)
- Thống kê theo Hạng bằng / Khu vực
- **Bảng kết quả theo Nhân viên tư vấn** (số HV, tỷ lệ đỗ, công nợ)
- Top Người giới thiệu (hoa hồng ước tính)
- **Bộ lọc thời gian** From/To tùy chỉnh
- **Xuất Excel** (.xlsx) báo cáo tổng hợp

### 🔔 BOT thông báo (`/notifications`)
- Lịch sử thông báo đã gửi
- Gửi thông báo thủ công
- 8 trigger tự động với toggle bật/tắt

### ✅ Nhắc việc (`/tasks`)
- Danh sách công việc nội bộ
- Badge sidebar động (đếm task chưa hoàn thành)

---

## 🗂️ Cấu trúc thư mục

```
src/
├── data/           # Mock data (mockStudents.js, mockStudentProfiles.js...)
├── layouts/        # DashboardLayout, Header, Sidebar
├── pages/          # 14 trang chính (Dashboard, Students, Fees, Exams...)
│   └── NotFound.jsx    ← Trang 404
├── services/       # 15 service files (studentService, feeService, exportService...)
├── index.css       # Global design system (dark/light theme, CSS variables)
└── App.jsx         # Router chính (14 routes + wildcard 404)

scripts/
└── dev.js          # Chạy song song frontend + backend

server/             # Express backend (auth JWT, API endpoints)
```

---

## 🔧 Kỹ thuật

| Thành phần | Công nghệ |
|---|---|
| Frontend | React 18 + Vite 8 |
| Routing | React Router v6 |
| Styling | Vanilla CSS (custom design system, CSS variables) |
| Backend | Express.js (Node.js) |
| Auth | JWT + bcrypt |
| Export Excel | SheetJS (xlsx) — lazy load (code split) |
| Mock data | Local JS objects (không cần DB để dev/demo) |
| Theme | Dark / Light mode toggle |

---

## 🔔 Sidebar Badge động

Badge trên Sidebar tính tự động từ dữ liệu thực:
- **Học viên**: tổng số học viên
- **Học phí**: số HV còn nợ (debt ≠ 0)
- **Hồ sơ**: số HV còn thiếu giấy tờ
- **Nhắc việc**: số task chưa hoàn thành

---

## ⚠️ Tính năng cần tích hợp thật (DEFER)

| Tính năng | Cần |
|---|---|
| Gửi Zalo ZNS | API key từ Zalo Official Account |
| Gửi SMS | Twilio / VNPT SMS API |
| Gửi Email | SMTP / SendGrid config |
| Upload file thật | AWS S3 / Cloudinary / Firebase Storage |
| Database thật | PostgreSQL / MongoDB (thay mock data) |
| Deploy | VPS / Vercel / Railway + custom domain |

---

## 📊 Thống kê dự án

- **Build size:** ~469 KB JS (gzip: ~124 KB)
- **xlsx chunk:** ~425 KB (lazy load, chỉ tải khi user export)
- **Modules:** 63 React components/services
- **Checklist:** **95/102 việc hoàn thành (93.1%)**
- **Routes:** 14 routes chính + wildcard 404

---

## 📸 Demo nhanh

Sau `npm run dev` → truy cập http://localhost:5173 → đăng nhập → khám phá.
