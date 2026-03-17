import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/authContext.js';

import Login from '../../features/auth/Login.jsx';
import ForgotPassword from '../../features/auth/ForgotPassword.jsx';
import ResetPassword from '../../features/auth/ResetPassword.jsx';

import StudentDashboard from '../../features/student/StudentDashboard.jsx';
import SubmitCode from '../../features/submission/SubmitCode.jsx';
import LecturerDashboard from '../../features/lecturer/LecturerDashboard.jsx';
import ExamStaffDashboard from '../../features/exam-staff/ExamStaffDashboard.jsx';

import SystemAdminDashboard from '../../features/admin/SystemAdminDashboard.jsx';
import SystemAdminDashboardOld from '../../features/admin/SystemAdminDashboardOld.jsx';
import UserManagement from '../../features/admin/UserManagement.jsx';

import LandingPage from '../../pages/LandingPage.jsx';
import ProtectedRoute, { ROLE_HOME_MAP } from './ProtectedRoute.jsx';

const normalizeRole = (role) =>
  typeof role === 'string' ? role.trim().toUpperCase() : '';

const getFallbackRoute = (user, token) => {
  const normalizedRole = normalizeRole(user?.roleName);

  if (token && normalizedRole && ROLE_HOME_MAP[normalizedRole]) {
    return ROLE_HOME_MAP[normalizedRole];
  }

  return '/';
};

export default function AppRoutes() {
  const { user } = useAuth();

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fallbackRoute = getFallbackRoute(user, token);

  return (
    <Routes>
      {/* Public routes */}
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

      {/* Student routes */}
      <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
        <Route
          path="/student"
          element={<StudentDashboard />}
        />
        <Route
          path="/student/submit"
          element={<SubmitCode />}
        />
      </Route>

      {/* Lecturer routes */}
      <Route element={<ProtectedRoute allowedRoles={['LECTURER']} />}>
        <Route
          path="/lecturer"
          element={<LecturerDashboard />}
        />
      </Route>

      {/* Exam Staff routes */}
      <Route element={<ProtectedRoute allowedRoles={['EXAM_STAFF']} />}>
        <Route
          path="/exam-staff"
          element={<ExamStaffDashboard />}
        />
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute allowedRoles={['SYSTEM_ADMIN']} />}>
        <Route
          path="/admin"
          element={<SystemAdminDashboard />}
        />
        <Route
          path="/admin/student-management"
          element={<UserManagement />}
        />
        <Route
          path="/admin2"
          element={<SystemAdminDashboardOld />}
        />
      </Route>

      {/* Fallback */}
      <Route
        path="*"
        element={
          <Navigate
            to={fallbackRoute}
            replace
          />
        }
      />
    </Routes>
  );
}