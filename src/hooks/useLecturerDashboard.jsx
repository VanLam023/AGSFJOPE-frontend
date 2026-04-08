import { useCallback, useEffect, useState } from 'react';
import {
  getLecturerDashboardAssignedAppeals,
  getLecturerDashboardOverview,
  getLecturerDashboardReviewStats,
  getLecturerDashboardUpcomingDeadlines,
} from '../services/lecturerApi';

export default function useLecturerDashboard() {
  const [data, setData] = useState({
    overview: null,
    assignedAppeals: [],
    upcomingDeadlines: [],
    reviewStats: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [overviewRes, assignedRes, upcomingRes, reviewStatsRes] = await Promise.all([
        getLecturerDashboardOverview(),
        getLecturerDashboardAssignedAppeals({ limit: 8 }),
        getLecturerDashboardUpcomingDeadlines({ limit: 5 }),
        getLecturerDashboardReviewStats(),
      ]);

      setData({
        overview: overviewRes?.data ?? null,
        assignedAppeals: assignedRes?.data ?? [],
        upcomingDeadlines: upcomingRes?.data ?? [],
        reviewStats: reviewStatsRes?.data ?? null,
      });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    ...data,
    loading,
    error,
    refresh: fetchDashboard,
  };
}
