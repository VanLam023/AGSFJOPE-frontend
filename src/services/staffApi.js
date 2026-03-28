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

/**
 * GET /api/admin/audit-logs/{id} — single audit log by UUID.
 */
const getAuditLogById = (auditLogId) => {
  return axiosClient.get(`/admin/audit-logs/${auditLogId}`);
};

export { getAuditLogs, getAuditLogById };
