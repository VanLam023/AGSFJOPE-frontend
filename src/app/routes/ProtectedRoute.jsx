import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext.js';

export const ROLE_HOME_MAP = Object.freeze({
  SYSTEM_ADMIN: '/admin',
  EXAM_STAFF: '/exam-staff',
  LECTURER: '/lecturer',
  STUDENT: '/student',
});

const normalizeRole = (role) =>
  typeof role === 'string' ? role.trim().toUpperCase() : '';

const sanitizeUser = (user) => {
  if (!user || typeof user !== 'object') return null;

  const roleName = normalizeRole(user.roleName);
  if (!roleName) return null;

  return {
    ...user,
    roleName,
  };
};

const getHomeRouteByRole = (roleName) =>
  ROLE_HOME_MAP[normalizeRole(roleName)] || '/login';

export default function ProtectedRoute({
  children,
  allowedRoles = [],
  redirectTo = '/login',
}) {
  const { user, loading, logout } = useAuth();
  const location = useLocation();

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const safeUser = sanitizeUser(user);
  const isAuthenticated = Boolean(token && safeUser);

  useEffect(() => {
    // Dọn session lỗi: có user nhưng mất token
    if (!loading && user && !token) {
      logout?.();
    }
  }, [loading, user, token, logout]);

  // Chờ AuthProvider restore localStorage xong rồi mới guard route
  if (loading) {
    return null;
  }

  // Chưa đăng nhập / session không hợp lệ
  if (!isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{ from: location }}
      />
    );
  }

  // Có đăng nhập nhưng sai role
  if (allowedRoles.length > 0) {
    const normalizedAllowedRoles = allowedRoles.map(normalizeRole);
    const isAllowed = normalizedAllowedRoles.includes(safeUser.roleName);

    if (!isAllowed) {
      return (
        <Navigate
          to={getHomeRouteByRole(safeUser.roleName)}
          replace
          state={{ from: location }}
        />
      );
    }
  }

  return children || <Outlet />;
}