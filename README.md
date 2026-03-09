# AGSFJOPE – Frontend

## Automatic Grading System for Java OOP Practical Exams  
**Hệ thống chấm điểm tự động bài thi thực hành Lập trình Hướng đối tượng Java**

---

## 📌 Giới thiệu

AGSFJOPE là frontend của hệ thống chấm điểm tự động bài thi Java OOP, được xây dựng nhằm hỗ trợ giảng viên, trợ giảng và sinh viên trong việc:
- Nộp bài thực hành Java
- Chấm điểm tự động dựa trên test case, phân tích OOP và LLM
- Cung cấp phản hồi chi tiết, minh bạch và nhất quán

Frontend được phát triển bằng **ReactJS + Vite**, giao tiếp với backend Java thông qua REST API.

---

## 🛠 Công nghệ sử dụng

### Frontend
- Vite
- ReactJS (JavaScript)
- React Router DOM
- Axios
- Context API

### Backend (tích hợp)
- Java
- REST API
- LLM (OpenAI API – qua backend)

---

## 📂 Cấu trúc thư mục

```txt
src/
├── api/                # Gọi API backend
│   ├── axiosClient.js
│   ├── authApi.js
│   ├── submissionApi.js
│   └── gradingApi.js
│
├── components/         # Component UI dùng chung
│   ├── Button.jsx
│   ├── Sidebar.jsx
│   ├── Navbar.jsx
│   └── Modal.jsx
│
├── layouts/            # Layout theo role
│   ├── StudentLayout.jsx
│   ├── LecturerLayout.jsx
│   └── AdminLayout.jsx
│
├── pages/              # Các trang (route)
│   ├── auth/
│   │   └── Login.jsx
│   ├── student/
│   │   └── SubmitCode.jsx
│   └── lecturer/
│       └── Dashboard.jsx
│
├── routes/
│   └── AppRoutes.jsx
│
├── context/
│   └── AuthContext.jsx
│
├── constants/
│   └── roles.js
│
├── App.jsx
└── main.jsx
"# AGSFJOPE-frontend" 
