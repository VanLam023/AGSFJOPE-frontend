import { Routes, Route } from 'react-router-dom';
import Login from '../../features/auth/Login.jsx';
import ForgotPassword from '../../features/auth/ForgotPassword.jsx';
import ResetPassword from '../../features/auth/ResetPassword.jsx';
import StudentDashboard from '../../features/student/StudentDashboard.jsx';
import SubmitCode from '../../features/submission/SubmitCode.jsx';
import LandingPage from '../../pages/LandingPage.jsx';
import LecturerDashboard from '../../features/lecturer/LecturerDashboard.jsx';
import ExamStaffDashboard from '../../features/exam-staff/ExamStaffDashboard.jsx';

import SystemAdminDashboard from '../../features/admin/SystemAdminDashboard.jsx';
import SystemAdminDashboardOld from '../../features/admin/SystemAdminDashboardOld.jsx';
import UserManagement from '../../features/admin/UserManagement.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={<LandingPage />}
      />
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />
      <Route
        path="/reset-password"
        element={<ResetPassword />}
      />

      {/* Student routes — no layout wrapper (Dashboard has its own sidebar) */}
      <Route
        path="/student"
        element={<StudentDashboard />}
      />
      <Route
        path="/student/submit"
        element={<SubmitCode />}
      />

      {/* Lecturer routes */}
      <Route
        path="/lecturer"
        element={<LecturerDashboard />}
      />

      {/* Exam Staff routes */}
      <Route
        path="/exam-staff"
        element={<ExamStaffDashboard />}
      />
      {/* Admin routes (role: SYSTEM_ADMIN) */}
      <Route
        path="/admin"
        element={<SystemAdminDashboard />}
      />
      {/* Trang quan li nguoi dung admin */}
      <Route
        path="/admin/student-management"
        element={<UserManagement />}
      />

      <Route
        path="/admin2"
        element={<SystemAdminDashboardOld />}
      />
    </Routes>
  );
}
