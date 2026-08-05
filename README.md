# AGSFJOPE – Frontend Web Application

> **Interactive Client Web App for Java OOP Practical Exam Automated Grading System**  
> *Giao diện người dùng Web tương tác cho Hệ thống Chấm điểm Tự động Bài thi Java OOP (FPT University)*

[![React 18](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![JavaScript ES6+](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Feature-Based Architecture](https://img.shields.io/badge/Architecture-Feature--Based-ff69b4?style=for-the-badge)](#-kiến-trúc-ứng-dụng)
[![PayOS Ready](https://img.shields.io/badge/PayOS-Dynamic_QR_Payment-0088CC?style=for-the-badge)](#-điểm-nhấn-kĩ-thuật-nổi-bật)

---

## 📌 1. Dự án này là gì? (Project Overview)

**AGSFJOPE Frontend** là ứng dụng Web Single Page Application (SPA) xây dựng bằng **ReactJS 18 + Vite**, đóng vai trò giao diện tương tác chính cho toàn bộ hệ thống chấm bài thi thực hành Java OOP.

Ứng dụng phục vụ **4 đối tượng người dùng (Roles)** trong cùng một nền tảng unified portal, tối ưu hóa trải nghiệm từ khâu tạo đề thi, nộp bài, theo dõi tiến độ chấm real-time, thanh toán ví điện tử đến xử lý đơn phúc khảo bài thi.

---

## 💡 2. Dùng để làm gì? (Problem Solved & Value)

Trước đây, trải nghiệm nộp bài và xem kết quả thi thực hành lập trình còn nhiều hạn chế:
- Sinh viên không biết bài nộp của mình gặp lỗi gì ở cấp độ OOP (encapsulation, interface, override annotation...).
- Quy trình đăng ký phúc khảo, đóng lệ phí thi và nhận thông báo diễn ra qua nhiều kênh rời rạc.
- Giảng viên & Cán bộ coi thi thiếu công cụ trực quan để theo dõi tiến độ chấm batch và xem báo cáo thống kê vi phạm OOP.

**Giá trị AGSFJOPE Frontend mang lại:**
- 🖥️ **Giao diện hiện đại & Đơn giản (Clean Modern UI)**: Trải nghiệm mượt mà, trực quan với hiệu ứng vi mô (micro-animations), hỗ trợ xem kết quả điểm thi từng câu kèm nhận xét từ AI & Engine kiểm tra cấu trúc.
- ⚡ **Nộp bài & Theo dõi Real-time**: Cho phép sinh viên tải mẫu dự án IDE, nộp bài zip và theo dõi trạng thái bài chấm trực tiếp.
- 💳 **Tích hợp Ví & Thanh toán PayOS QR**: Nạp tiền vào ví điện tử tức thì qua mã QR động PayOS, tự động cập nhật số dư và lịch sử giao dịch rõ ràng.
- 🔄 **Quy trình Phúc khảo Khép kín**: Xử lý 100% trên UI từ gửi đơn, phân công chấm lại, nhập điểm phúc khảo đến tự động hoàn tiền vào ví.

---

## 🏗️ 3. Kiến trúc Ứng dụng (Architecture & Tech Stack)

### 🧱 Feature-Based Modular Architecture
Source code được cấu trúc chuẩn hóa theo tính năng (Feature-based structure), giúp dễ bảo trì, mở rộng và phát triển độc lập:

```txt
src/
├── app/               # Cấu hình App chính, Router Auth Guard, Global Store
├── assets/            # Biểu tượng, hình ảnh, stylesheet dùng chung
├── components/        # UI components dùng chung (Buttons, Modals, Tables, Forms)
├── layouts/           # Layouts riêng biệt theo từng Role (Student, Lecturer, Staff, Admin)
├── features/          # Các module tính năng cốt lõi của hệ thống
│   ├── auth/          # Đăng nhập, Đăng ký, Quên mật khẩu, Xác thực JWT
│   ├── exam/          # Quản lý kỳ thi, Đợt thi (Block CRUD)
│   ├── exam-paper/    # Upload đề thi ZIP, Preview chi tiết câu hỏi & Test Cases
│   ├── submission/    # Tải IDE template, Nộp bài thi ZIP/RAR, Danh sách bài nộp Block
│   ├── grading/       # Bảng tiến độ chấm bài, Xem kết quả điểm thi & vi phạm OOP
│   ├── appeal/        # Tạo đơn phúc khảo, Phân công giảng viên, Duyệt điểm phúc khảo
│   ├── payment/       # Màn hình nạp tiền ví, Mã QR PayOS, Lịch sử giao dịch & Rút tiền
│   ├── notification/  # Trung tâm thông báo in-app (Badge, Filter, Mark as read)
│   └── admin/         # Quản lý người dùng, Cấu hình hệ thống (AI/PayOS), Audit Logs
├── services/          # HTTP Client (Axios Interceptors), Websocket/API Ports
└── utils/             # Helper format tiền tệ, ngày tháng, validation rules
```

### 🛠️ Tech Stack Chính
- **Core Library**: React 18, JavaScript (ES6+).
- **Build Tool**: Vite (tốc độ Fast Refresh siêu nhanh).
- **Routing & State**: React Router DOM v6, Context API, State Management tối ưu.
- **HTTP Client**: Axios Client (bắt lỗi tập trung qua Interceptors, tự động đính kèm Bearer JWT & xử lý Refresh Token).
- **UI & Styling**: Vanilla CSS Modern Tokens, Glassmorphism design, Lucide React Icons.

---

## ⭐ 4. Điểm nhấn Kĩ thuật Nổi bật (Engineering Highlights)

### 1️⃣ Phân quyền Đa tầng RBAC (Role-Based Access Control)
- Bảo mật hệ thống với **Route Authorization Guards** phân quyền nghiêm ngặt cho 4 nhóm người dùng:
  - 👑 **System Admin**: Quản lý tài khoản, xem Audit Logs, cấu hình AI API Keys, PayOS & SMTP.
  - 📋 **Exam Staff**: Tạo kỳ thi/đợt thi (Block), upload đề thi, kích hoạt chấm bài batch, duyệt đơn phúc khảo.
  - 👨‍🏫 **Lecturer**: Dashboard bài thi phân công, thẩm định lại điểm bài nộp phúc khảo.
  - 🎓 **Student**: Nộp bài thi, xem bảng điểm chi tiết, nạp ví PayOS & gửi đơn phúc khảo.

### 2️⃣ Tích hợp Cổng thanh toán QR PayOS & Ví điện tử (Dynamic Payment Modal)
- Giao diện nạp tiền tích hợp **Mã QR PayOS sinh động (Dynamic QR Code)**.
- Xử lý mượt mà trạng thái nạp tiền, tự động Reconcile số dư ví sau khi nạp mà không cần reload trang.
- Đơn phúc khảo được trừ trực tiếp từ ví sinh viên, hiển thị trạng thái hoàn tiền (`REFUNDED`) minh bạch khi được chấp thuận.

### 3️⃣ Báo cáo Thống kê trực quan (Multi-role Dashboard & Analytics)
- Xây dựng các biểu đồ thống kê cho Exam Staff và Admin:
  - Phổ điểm bài thi thực hành theo đợt thi (Block).
  - Tỷ lệ sinh viên vi phạm từng quy tắc OOP (Kế thừa, Đóng gói, Chữ ký phương thức, `@Override`...).
  - Thống kê tài chính doanh thu nạp ví và tỷ lệ phúc khảo thành công/thất bại.

### 4️⃣ Real-time In-App Notification Center
- Trung tâm thông báo thời gian thực giúp người dùng nhận tin tức tức thì khi: bài nộp được chấm xong, đơn phúc khảo được phân công/duyệt, hoặc ví điện tử được biến động số dư.
- Hỗ trợ đánh dấu đã đọc, lọc thông báo chưa đọc và xóa hàng loạt.

---

## 🚀 5. Hướng dẫn Cài đặt & Chạy ứng dụng

### Yêu cầu hệ thống
- Node.js 18.x trở lên
- npm 9.x+ hoặc yarn / pnpm

### Các bước khởi chạy

1. **Clone Repository**
   ```bash
   git clone https://github.com/VanLam023/AGSFJOPE-frontend.git
   cd AGSFJOPE-frontend
   ```

2. **Cài đặt Dependencies**
   ```bash
   npm install
   ```

3. **Cấu hình Môi trường**
   Tạo file `.env` tại thư mục gốc của frontend:
   ```env
   VITE_API_BASE_URL=http://localhost:8080/api
   ```

4. **Khởi chạy Development Server**
   ```bash
   npm run dev
   ```
   Ứng dụng sẽ chạy tại địa chỉ: `http://localhost:5173`

5. **Build cho Production**
   ```bash
   npm run build
   ```

---

## 📝 License & Contact
- **Project**: FPT University Capstone Project
- **Authors**: AGSFJOPE Development Team
- **Contact**: `lamtvse173173@fpt.edu.vn`
