import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../../features/auth/Login.jsx';
import ForgotPassword from '../../features/auth/ForgotPassword.jsx';
import ResetPassword from '../../features/auth/ResetPassword.jsx';
import StudentDashboard from '../../features/student/StudentDashboard.jsx';
import StudentResultsPage from '../../features/student/StudentResultsPage.jsx';
import StudentResultDetailPage from '../../features/student/StudentResultDetailPage.jsx';
import SubmitCode from '../../features/submission/SubmitCode.jsx';
import LandingPage from '../../pages/LandingPage.jsx';
import LecturerDashboard from '../../features/lecturer/LecturerDashboard.jsx';
import ExamStaffDashboard from '../../features/exam-staff/ExamStaffDashboard.jsx';
import SystemAdminDashboard from '../../features/admin/SystemAdminDashboard.jsx';
import SystemAdminDashboardOld from '../../features/admin/SystemAdminDashboardOld.jsx';
import UserManagement from '../../features/admin/UserManagement.jsx';
import PayOSConfigurationPage from '../../features/admin/PayOSConfigurationPage.jsx';

import ProtectedRoute from './ProtectedRoute.jsx';
import { ROLE_HOME_MAP } from '../../constants/routes.js';
import { useAuth } from '../context/authContext.js';
import VerifyAccount from '../../features/auth/VerifyAccount.jsx';
import UserDetail from '../../features/admin/UserDetail.jsx';
import SystemConfig from '../../features/admin/SystemConfig.jsx';
import AIConfig from '../../features/admin/AIConfig.jsx';
import AuditLogsPage from '../../features/exam-staff/AuditLogsPage.jsx';
import AuditLogDetailPage from '../../features/exam-staff/AuditLogDetailPage.jsx';
import AppealPage from '../../features/exam-staff/AppealPage.jsx';
import AppealDetailPage from '../../features/exam-staff/AppealDetailPage.jsx';

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
      <Route
        path="/student/results/:submissionId"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentResultDetailPage />
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
      <Route
        path="/exam-staff/exams/:examId/blocks/:blockId/submissions"
        element={
          <ProtectedRoute allowedRoles={['EXAM_STAFF']}>
            <ExamStaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam-staff/exams/:examId/blocks/:blockId/submissions/:submissionId"
        element={
          <ProtectedRoute allowedRoles={['EXAM_STAFF']}>
            <ExamStaffDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/exam-staff/appeals"
        element={
          <ProtectedRoute allowedRoles={['EXAM_STAFF']}>
            <AppealPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam-staff/appeals/:appealId"
        element={
          <ProtectedRoute allowedRoles={['EXAM_STAFF']}>
            <AppealDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam-staff/audits/:auditLogId"
        element={
          <ProtectedRoute allowedRoles={['EXAM_STAFF', 'SYSTEM_ADMIN']}>
            <AuditLogDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam-staff/audits"
        element={
          <ProtectedRoute allowedRoles={['EXAM_STAFF', 'SYSTEM_ADMIN']}>
            <AuditLogsPage />
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

      <Route
        path="/admin/payos-configuration"
        element={
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <PayOSConfigurationPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/ai-config"
        element={
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <AIConfig />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/system-config"
        element={
          <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
            <SystemConfig />
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
