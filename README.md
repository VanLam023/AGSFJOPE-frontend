# AGSFJOPE – Frontend Web Application

> **Interactive Client Web Application for Java OOP Practical Exam Automated Grading System**  
> *Rich, responsive Single Page Application (SPA) providing a unified portal for FPT University's automated Java OOP practical exam evaluation platform.*

[![React 18](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![JavaScript ES6+](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Feature-Based Architecture](https://img.shields.io/badge/Architecture-Feature--Based-ff69b4?style=for-the-badge)](#3-application-architecture--tech-stack)
[![PayOS Ready](https://img.shields.io/badge/PayOS-Dynamic_QR_Payment-0088CC?style=for-the-badge)](#4-key-engineering-highlights)

---

## 📌 1. Project Overview

**AGSFJOPE Frontend** is an interactive Single Page Application (SPA) engineered with **ReactJS 18 + Vite**, serving as the primary client portal for the Automated Java OOP Exam Grading System.

The application serves **4 distinct user roles** within a single unified web platform, streamlining every stage of the exam lifecycle: exam creation, project package downloads, submission uploads, real-time batch grading monitoring, digital wallet top-ups, and end-to-end grade appeal management.

---

## 💡 2. Problem Solved & Core Value

Traditional student workflows during practical programming exams suffer from friction and opacity:
- Students lack immediate, detailed visibility into specific OOP design violations (encapsulation flaws, missing interfaces, omitted `@Override` annotations).
- Registration for grade re-evaluations (appeals), fee payments, and status tracking are fragmented across disconnected channels.
- Exam staff and instructors lack real-time dashboards to track batch grading progress and analyze overall class performance.

**AGSFJOPE Frontend Value Proposition:**
- 🖥️ **Modern & Intuitive UX**: Clean modern light-mode interface enriched with subtle micro-animations, enabling students to view granular question scores alongside AI feedback & structural AST violation breakdowns.
- ⚡ **Seamless Submissions & Live Progress Tracking**: Streamlines IDE template downloads, ZIP archive submissions, and live batch grading progress indicators.
- 💳 **PayOS Dynamic QR Payment & Wallet Integration**: Instant wallet top-ups via dynamic PayOS QR codes, complete with real-time balance reconciliation and clear transaction history logs.
- 🔄 **Closed-Loop Digital Appeal Workflow**: Digitizes 100% of the appeal lifecycle—from student creation, staff assignment, instructor review, to automated refund credits.

---

## 🏗️ 3. Application Architecture & Tech Stack

### 🧱 Feature-Based Modular Architecture
The codebase follows a domain-driven Feature-Based modular structure for maximum maintainability and scalability:

```txt
src/
├── app/               # Main App Config, Router Auth Guards, Global Stores
├── assets/            # Global Icons, Images, Base Stylesheets
├── components/        # Reusable Shared UI Elements (Buttons, Modals, Tables, Input Fields)
├── layouts/           # Role-Based Layout Wrappers (Student, Lecturer, Staff, Admin)
├── features/          # Core Domain Feature Modules
│   ├── auth/          # Login, Registration, Password Reset, JWT Authentication
│   ├── exam/          # Exam & Block Management (CRUD & Scheduling)
│   ├── exam-paper/    # Exam Paper ZIP Upload, Question & Test Case Inspection
│   ├── submission/    # IDE Project Template Downloads, Submissions Management
│   ├── grading/       # Batch Grading Progress Monitor, Granular OOP Score Breakdown
│   ├── appeal/        # Appeal Submissions, Lecturer Re-assignment, Staff Approvals
│   ├── payment/       # Wallet Top-up Modal, PayOS Dynamic QR Code, Transaction History
│   ├── notification/  # In-App Real-time Notification Center (Badge, Filter, Bulk Actions)
│   └── admin/         # User Management, System Config (AI/PayOS/SMTP), Audit Logs
├── services/          # HTTP Clients (Axios Interceptors), API Ports & Endpoints
└── utils/             # Formatting Helpers (Currency, Dates), Validation Utilities
```

### 🛠️ Core Technology Stack
- **Core Library**: React 18, JavaScript (ES6+).
- **Build Tool**: Vite (Lightning-fast HMR and build performance).
- **Routing & Navigation**: React Router DOM v6, Context API, Role-Based Route Guards.
- **HTTP Client**: Axios Client (Centralized Interceptors attaching Bearer JWT tokens and handling silent Refresh Token rotation).
- **UI & Styling**: Vanilla CSS Modern Design Tokens, Glassmorphism elements, Lucide React Icons.

---

## ⭐ 4. Key Engineering Highlights

### 1️⃣ Role-Based Access Control (RBAC 4 Roles)
Strict frontend route security using **Auth Guards** enforcing precise permissions across 4 user roles:
- 👑 **System Admin**: User management, system configuration (AI API Keys, PayOS, SMTP settings), and Audit Logs inspection.
- 📋 **Exam Staff**: Exam and Block creation/scheduling, exam paper uploads, batch grading execution, and final appeal confirmations.
- 👨‍🏫 **Lecturer**: Re-grading dashboard for assigned student appeals with detailed score adjustments and feedback.
- 🎓 **Student**: Exam submissions, detailed score inspections, wallet top-ups, and appeal submissions.

### 2️⃣ Dynamic PayOS QR Payment & Wallet Top-Up Modal
- Integrated **Dynamic PayOS QR Code Modal** for instant wallet deposits.
- Handles payment verification seamlessly, automatically reconciling wallet balances post-deposit without page reloads.
- Appeal fees are debited directly from student wallets, featuring instant `REFUNDED` status indicators upon approved appeals.

### 3️⃣ Multi-Role Dashboards & Performance Analytics
- Rich visual reporting dashboards for Exam Staff and System Administrators:
  - Score distribution metrics across exam blocks.
  - Granular OOP violation statistics (Inheritance, Encapsulation, Method Signatures, `@Override` rules).
  - Financial wallet transaction metrics and appeal success rates.

### 4️⃣ Real-Time In-App Notification Center
- Real-time notification updates informing users instantly when: batch grading completes, an appeal is assigned or approved, or wallet balances change.
- Supports unread filtering, badge counters, and bulk read/delete operations.
