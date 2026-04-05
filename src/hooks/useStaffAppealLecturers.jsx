import { useState, useCallback } from 'react';
import { getStaffAppealLecturers } from '../services/staffApi';

/**
 * GET /staff/appeals/lecturers — lecturers for assign dropdown.
 * Response: { success, message, data: Array<{ lecturerId, fullName, email, activeAppealCount }> }.
 */
const useStaffAppealLecturers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lecturers, setLecturers] = useState([]);

  const fetchLecturers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStaffAppealLecturers();
      const list = Array.isArray(res?.data) ? res.data : [];
      setLecturers(list);
      return res;
    } catch (err) {
      setError(err);
      setLecturers([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    fetchLecturers,
    lecturers,
    loading,
    error,
  };
};

export default useStaffAppealLecturers;
