import axiosClient from './axiosClient';

const importExcel = (file) => {
  const formData = new FormData();

  formData.append('file', file);

  const res = axiosClient.post('/admin/users/import-excel', formData);
  return res;
};

const createUser = ({ roleName, email, fullName, mssv }) => {
  return axiosClient.post('/admin/users/create', {
    roleName,
    email,
    fullName,
    mssv,
  });
};

const getAllUsers = ({ page, size, sort, search, roleName }) => {
  const res = axiosClient.get('/admin/users', {
    params: {
      page,
      size,
      sort,
      search,
      roleName,
    },
  });

  return res;
};

const getUserDetail = (userId) => {
  return axiosClient.get(`/admin/users/${userId}`);
};

const editUserDetail = ({
  userId,
  fullName,
  email,
  username,
  mssv,
  phone,
  roleName,
}) => {
  return axiosClient.put(`/admin/users/${userId}`, {
    fullName,
    email,
    username,
    mssv,
    phone,
    roleName,
  });
};

const deleteUser = (userId) => {
  return axiosClient.delete(`/admin/users/${userId}`);
};

const getApiConfig = () => {
  return axiosClient.get('/admin/config/ai');
};

const updateAiConfig = ({ provider, model, apiKey, language }) => {
  return axiosClient.put('/admin/config/ai', {
    provider,
    model,
    apiKey,
    language,
  });
};

const testAIConnection = ({ provider, model, apiKey }) => {
  return axiosClient.post('/admin/config/ai/test-connection', {
    provider,
    model,
    apiKey,
  });
};

const getSystemConfig = () => {
  return axiosClient.get('/admin/config/system');
};

const getSystemGradingModes = () => {
  return axiosClient.get('/admin/config/grading-modes');
};

const getSystemGradingMode = (mode) => {
  return axiosClient.get(`/admin/config/grading-modes/${mode}`);
};

const updateSystemConfig = ({
  maxUploadSizeMb,
  maxExamPaperMb,
  defaultGradingMode,
}) => {
  return axiosClient.put('/admin/config/system', {
    maxUploadSizeMb,
    maxExamPaperMb,
    defaultGradingMode,
  });
};

const cleanParams = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null),
  );

const getAdminDashboardOverview = ({ from, to } = {}) => {
  return axiosClient.get('/admin/dashboard/overview', {
    params: cleanParams({ from, to }),
  });
};

const getAdminDashboardUserStats = ({ from, to } = {}) => {
  return axiosClient.get('/admin/dashboard/user-stats', {
    params: cleanParams({ from, to }),
  });
};

const getAdminDashboardRecentActivities = ({ limit, from, to } = {}) => {
  return axiosClient.get('/admin/dashboard/recent-activities', {
    params: cleanParams({ limit, from, to }),
  });
};

const getAdminDashboardSystemHealth = () => {
  return axiosClient.get('/admin/dashboard/system-health');
};

const getAdminDashboardSystemActivity = ({ period } = {}) => {
  return axiosClient.get('/admin/dashboard/system-activity', {
    params: cleanParams({ period }),
  });
};

export {
  importExcel,
  createUser,
  getAllUsers,
  getUserDetail,
  deleteUser,
  editUserDetail,
  getApiConfig,
  updateAiConfig,
  testAIConnection,
  getSystemConfig,
  getSystemGradingModes,
  getSystemGradingMode,
  updateSystemConfig,
  getAdminDashboardOverview,
  getAdminDashboardUserStats,
  getAdminDashboardRecentActivities,
  getAdminDashboardSystemHealth,
  getAdminDashboardSystemActivity,
};
