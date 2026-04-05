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

const getStaffDashboardOverview = ({ semester } = {}) => {
  return axiosClient.get('/staff/dashboard/overview', {
    params: cleanParams({ semester }),
  });
};

const getStaffDashboardRecentExams = ({ limit, semester } = {}) => {
  return axiosClient.get('/staff/dashboard/recent-exams', {
    params: cleanParams({ limit, semester }),
  });
};

const getStaffDashboardGradeDistribution = ({ semester } = {}) => {
  return axiosClient.get('/staff/dashboard/grade-distribution', {
    params: cleanParams({ semester }),
  });
};

const getStaffDashboardPendingAppeals = ({ limit, semester } = {}) => {
  return axiosClient.get('/staff/dashboard/pending-appeals', {
    params: cleanParams({ limit, semester }),
  });
};

const cleanAppealListParams = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== undefined && v !== null && v !== '',
    ),
  );

/** GET /staff/appeals/{appealId} — appeal detail (StaffAppealDetailResponse) */
const getStaffAppealById = (appealId) =>
  axiosClient.get(`/staff/appeals/${appealId}`);

/** GET /staff/appeals — list + overview + pagination */
const getStaffAppeals = ({
  status,
  keyword,
  semester,
  examName,
  page = 0,
  size = 10,
} = {}) => {
  return axiosClient.get('/staff/appeals', {
    params: cleanAppealListParams({
      status,
      keyword,
      semester,
      examName,
      page,
      size,
    }),
  });
};

/** GET /staff/appeals/lecturers — dropdown for assign (lecturer workload list) */
const getStaffAppealLecturers = () =>
  axiosClient.get('/staff/appeals/lecturers');

/** PUT /staff/appeals/{appealId}/assign — PENDING only */
const assignStaffAppeal = (appealId, { lecturerId, deadlineAt }) =>
  axiosClient.put(`/staff/appeals/${appealId}/assign`, {
    lecturerId,
    deadlineAt,
  });

/** PUT /staff/appeals/{appealId}/confirm — COMPLETED only */
const confirmStaffAppeal = (appealId, { isApprove }) =>
  axiosClient.put(`/staff/appeals/${appealId}/confirm`, { isApprove });

export {
  getAuditLogs,
  getAuditLogById,
  getStaffDashboardOverview,
  getStaffDashboardRecentExams,
  getStaffDashboardGradeDistribution,
  getStaffDashboardPendingAppeals,
  getStaffAppealById,
  getStaffAppeals,
  getStaffAppealLecturers,
  assignStaffAppeal,
  confirmStaffAppeal,
};
