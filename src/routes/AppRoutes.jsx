import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Login from '../pages/auth/Login';
import StudentLayout from '../layouts/StudentLayout';
import SubmitCode from '../pages/student/SubmitCode';
import Register from '../pages/auth/Register';
import ResetPassword from '../pages/auth/ResetPassword/ResetPassword';
import StaffDashboard from '../pages/exam-staff/StaffDashboard';

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path=""
        element={<Navigate to="/login" />}
      />
      <Route
        path="login"
        element={<Login />}
      />
      <Route
        path="register"
        element={<Register />}
      />
      <Route
        path="reset-password"
        element={<ResetPassword />}
      />
      <Route
        path="staff"
        element={
          // <ProtectedRoute>
          //   <StaffDashboard />
          // </ProtectedRoute>
          <StaffDashboard />
        }
      />
      {/* Route để xem đồ của AI, sẽ bỏ lúc deployed */}
      {/* <Route path="/dev/exam-list" element={<ExamListDemo />} />
      <Route path="/dev/exam/:id" element={<ExamDetail />} /> */}
      {/* -------------------------------------------------- */}

      <Route
        path="student"
        element={<StudentLayout />}
      >
        <Route
          index
          element={<SubmitCode />}
        />
        <Route
          path="submit"
          element={<SubmitCode />}
        />
      </Route>
    </Routes>
  );
}
