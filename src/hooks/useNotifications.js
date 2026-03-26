import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import notificationApi, { normalizeFilter } from '../services/notificationApi';
import {
  normalizeNotificationList,
  normalizeUnreadCount,
} from '../components/notifications/notificationHelpers';

const DEFAULT_FILTER = 'all';
const POLL_INTERVAL_MS = 30000;

/**
 * Shared notification hook for header bell dropdowns.
 *
 * VALIDATION / DEFENSIVE GOALS:
 * - sanitize API payload before rendering
 * - prevent invalid filter values
 * - avoid state updates after unmount
 * - handle malformed backend data without crashing UI
 * - keep optimistic update but rollback safely when request fails
 */
export default function useNotifications({ enabled = true, isOpen = false } = {}) {
  const [activeFilter, setActiveFilterState] = useState(DEFAULT_FILTER);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingCount, setLoadingCount] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const mountedRef = useRef(false);
  const initializedRef = useRef(false);
  const listRequestIdRef = useRef(0);
  const countRequestIdRef = useRef(0);

  const setActiveFilter = useCallback((nextFilter) => {
    setActiveFilterState(normalizeFilter(nextFilter));
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!enabled) return 0;

    const requestId = ++countRequestIdRef.current;

    try {
      setLoadingCount(true);

      const res = await notificationApi.getUnreadCount();
      const nextCount = normalizeUnreadCount(res?.data);

      if (!mountedRef.current || requestId !== countRequestIdRef.current) {
        return nextCount;
      }

      setUnreadCount(nextCount);
      return nextCount;
    } catch (err) {
      console.error('Failed to load unread notification count:', err);
      return 0;
    } finally {
      if (mountedRef.current && requestId === countRequestIdRef.current) {
        setLoadingCount(false);
      }
    }
  }, [enabled]);

  const fetchNotifications = useCallback(
    async (filter = activeFilter) => {
      if (!enabled) return [];

      const safeFilter = normalizeFilter(filter);
      const requestId = ++listRequestIdRef.current;

      try {
        setLoadingList(true);
        setError('');

        const res = await notificationApi.getAll({ filter: safeFilter });
        const list = normalizeNotificationList(res?.data);

        if (!mountedRef.current || requestId !== listRequestIdRef.current) {
          return list;
        }

        setNotifications(list);
        return list;
      } catch (err) {
        console.error('Failed to load notifications:', err);

        if (mountedRef.current && requestId === listRequestIdRef.current) {
          setError('Không thể tải thông báo. Vui lòng thử lại.');
          setNotifications([]);
        }

        return [];
      } finally {
        if (mountedRef.current && requestId === listRequestIdRef.current) {
          setLoadingList(false);
        }
      }
    },
    [activeFilter, enabled],
  );

  const refresh = useCallback(
    async (filter = activeFilter) => {
      const safeFilter = normalizeFilter(filter);
      await Promise.all([
        fetchUnreadCount(),
        fetchNotifications(safeFilter),
      ]);
    },
    [activeFilter, fetchNotifications, fetchUnreadCount],
  );

  const markAsRead = useCallback(
    async (notificationId) => {
      if (typeof notificationId !== 'string' || !notificationId.trim()) {
        return;
      }

      const current = notifications.find((item) => item.notificationId === notificationId);
      if (!current) return;

      const wasUnread = current.isRead === false;

      setNotifications((prev) =>
        prev.map((item) =>
          item.notificationId === notificationId
            ? { ...item, isRead: true, readAt: item.readAt ?? new Date().toISOString() }
            : item,
        ),
      );

      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      try {
        await notificationApi.markAsRead(notificationId);
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
        await refresh();
      }
    },
    [notifications, refresh],
  );

  const markAllAsRead = useCallback(async () => {
    const hasUnread = notifications.some((item) => item.isRead === false);
    if (!hasUnread) return;

    const previous = notifications;

    setActionLoading(true);
    setNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        isRead: true,
        readAt: item.readAt ?? new Date().toISOString(),
      })),
    );
    setUnreadCount(0);

    try {
      await notificationApi.markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);

      if (mountedRef.current) {
        setNotifications(previous);
      }

      await refresh();
    } finally {
      if (mountedRef.current) {
        setActionLoading(false);
      }
    }
  }, [notifications, refresh]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    fetchUnreadCount();

    const intervalId = window.setInterval(() => {
      fetchUnreadCount();

      if (isOpen) {
        fetchNotifications(activeFilter);
      }
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [activeFilter, enabled, fetchNotifications, fetchUnreadCount, isOpen]);

  useEffect(() => {
    if (!enabled || !isOpen) return;

    if (!initializedRef.current) {
      initializedRef.current = true;
    }

    fetchNotifications(activeFilter);
  }, [activeFilter, enabled, fetchNotifications, isOpen]);

  const unreadItemsInView = useMemo(
    () => notifications.filter((item) => item.isRead === false).length,
    [notifications],
  );

  return {
    activeFilter,
    setActiveFilter,
    notifications,
    unreadCount,
    unreadItemsInView,
    loadingList,
    loadingCount,
    actionLoading,
    error,
    refresh,
    fetchUnreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}