import axiosClient from './axiosClient';

/**
 * DEV NOTE:
 * Keep all notification endpoint calls in one place so validation and
 * request normalization are consistent across the app.
 */

const ALLOWED_FILTERS = ['all', 'unread', 'read'];

function normalizeFilter(filter) {
  if (typeof filter !== 'string') return 'all';

  const normalized = filter.trim().toLowerCase();
  return ALLOWED_FILTERS.includes(normalized) ? normalized : 'all';
}

function assertValidNotificationId(notificationId) {
  if (typeof notificationId !== 'string' || !notificationId.trim()) {
    throw new Error('Invalid notificationId');
  }
}

const notificationApi = {
  getAll: (params = {}) => {
    const safeFilter = normalizeFilter(params?.filter);
    return axiosClient.get('/notifications', {
      params: { filter: safeFilter },
    });
  },

  getUnreadCount: () => axiosClient.get('/notifications/unread-count'),

  markAsRead: (notificationId) => {
    assertValidNotificationId(notificationId);
    return axiosClient.put(`/notifications/${notificationId}/read`);
  },

  markAllAsRead: () => axiosClient.put('/notifications/read-all'),
};

export { ALLOWED_FILTERS, normalizeFilter };
export default notificationApi;