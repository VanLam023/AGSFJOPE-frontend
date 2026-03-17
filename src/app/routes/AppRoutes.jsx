import { Routes, Route, Navigate } from 'react-router-dom';
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

import ProtectedRoute, { ROLE_HOME_MAP } from './ProtectedRoute.jsx';
import { useAuth } from '../context/authContext.js';

const normalizeRole = (role) =>
  typeof role === 'string' ? role.trim().toUpperCase() : '';

const getDefaultRoute = (user, token) => {
  const roleName = normalizeRole(user?.roleName);

  if (token && roleName && ROLE_HOME_MAP[roleName]) {
    return ROLE_HOME_MAP[roleName];
  }

  return '/';
};

export default function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  const token = localStorage.getItem('token');
  const defaultRoute = getDefaultRoute(user, token);
  const isLoggedIn = Boolean(token && user);

  return (
    <Routes>
      <Route
        path="/"
        element={<LandingPage />}
      />

      <Route
        path="/login"
        element={
          isLoggedIn ? (
            <Navigate
              to={defaultRoute}
              replace
            />
          ) : (
            <Login />
          )
        }
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
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/submit"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <SubmitCode />
          </ProtectedRoute>
        }
      />

      {/* Lecturer routes */}
      <Route
        path="/lecturer"
        element={
          <ProtectedRoute allowedRoles={['LECTURER']}>
            <LecturerDashboard />
          </ProtectedRoute>
        }
      />

      {/* Exam Staff routes */}
      <Route
        path="/exam-staff"
        element={
          <ProtectedRoute allowedRoles={['EXAM_STAFF']}>
            <ExamStaffDashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <SystemAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/student-management"
        element={
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin2"
        element={
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <SystemAdminDashboardOld />
          </ProtectedRoute>
        }
      />

      {/* Route lạ */}
      <Route
        path="*"
        element={
          <Navigate
            to={defaultRoute}
            replace
          />
        }
      />
    </Routes>
  );
}