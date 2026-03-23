import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../../features/auth/Login.jsx';
import ForgotPassword from '../../features/auth/ForgotPassword.jsx';
import ResetPassword from '../../features/auth/ResetPassword.jsx';
import StudentDashboard from '../../features/student/StudentDashboard.jsx';
import StudentResultsPage from '../../features/student/StudentResultsPage.jsx';
import SubmitCode from '../../features/submission/SubmitCode.jsx';
import LandingPage from '../../pages/LandingPage.jsx';
import LecturerDashboard from '../../features/lecturer/LecturerDashboard.jsx';
import ExamStaffDashboard from '../../features/exam-staff/ExamStaffDashboard.jsx';
import SystemAdminDashboard from '../../features/admin/SystemAdminDashboard.jsx';
import SystemAdminDashboardOld from '../../features/admin/SystemAdminDashboardOld.jsx';
import UserManagement from '../../features/admin/UserManagement.jsx';

import ProtectedRoute, { ROLE_HOME_MAP } from './ProtectedRoute.jsx';
import { useAuth } from '../context/authContext.js';
import VerifyAccount from '../../features/auth/VerifyAccount.jsx';
import UserDetail from '../../features/admin/UserDetail.jsx';

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

      <Route
        path="/verify-account"
        element={<VerifyAccount />}
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
      <Route
        path="/student/results"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentResultsPage />
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
      <Route
        path="/exam-staff/exams"
        element={
          <ProtectedRoute allowedRoles={['EXAM_STAFF']}>
            <ExamStaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam-staff/exams/create"
        element={
          <ProtectedRoute allowedRoles={['EXAM_STAFF']}>
            <ExamStaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam-staff/exams/:examId"
        element={
          <ProtectedRoute allowedRoles={['EXAM_STAFF']}>
            <ExamStaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam-staff/exams/:examId/edit"
        element={
          <ProtectedRoute allowedRoles={['EXAM_STAFF']}>
            <ExamStaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam-staff/exams/:examId/blocks/:blockId"
        element={
          <ProtectedRoute allowedRoles={['EXAM_STAFF']}>
            <ExamStaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam-staff/exams/:examId/blocks/:blockId/upload-paper"
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
        path="/admin/student-management/:userId"
        element={
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <UserDetail />
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
