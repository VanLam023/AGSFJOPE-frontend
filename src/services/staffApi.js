import axiosClient from './axiosClient';

const getAuditLogs = ({
  action,
  entityType,
  userId,
  from,
  to,
  page = 0,
  size = 20,
}) => {
  return axiosClient.get('/admin/audit-logs', {
    params: {
      action,
      entityType,
      userId,
      from,
      to,
      page,
      size,
    },
  });
};

const getAuditLogById = (auditLogId) => {
  return axiosClient.get(`/admin/audit-logs/${auditLogId}`);
};

const cleanParams = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null),
  );

/** GET /staff/dashboard/overview */
const getStaffDashboardOverview = ({ semester } = {}) => {
  return axiosClient.get('/staff/dashboard/overview', {
    params: cleanParams({ semester }),
  });
};

/** GET /staff/dashboard/recent-exams */
const getStaffDashboardRecentExams = ({ limit, semester } = {}) => {
  return axiosClient.get('/staff/dashboard/recent-exams', {
    params: cleanParams({ limit, semester }),
  });
};

/** GET /staff/dashboard/grade-distribution */
const getStaffDashboardGradeDistribution = ({ semester } = {}) => {
  return axiosClient.get('/staff/dashboard/grade-distribution', {
    params: cleanParams({ semester }),
  });
};

/** GET /staff/dashboard/pending-appeals */
const getStaffDashboardPendingAppeals = ({ limit, semester } = {}) => {
  return axiosClient.get('/staff/dashboard/pending-appeals', {
    params: cleanParams({ limit, semester }),
  });
};

export {
  getAuditLogs,
  getAuditLogById,
  getStaffDashboardOverview,
  getStaffDashboardRecentExams,
  getStaffDashboardGradeDistribution,
  getStaffDashboardPendingAppeals,
};
