import React, { useState } from 'react';
import { getAllUsers } from '../services/adminApi';
import { mapUsersFromApi } from '../components/utils/Utils';

const useGetUsers = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState();
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLast, setIsLast] = useState(false);
  const [pageSize, setPageSize] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchUsers = async ({
    page = 0,
    size = 8,
    sort = null,
    search = null,
    roleName = null,
  }) => {
    setLoading(true);
    try {
      const res = await getAllUsers({ page, size, sort, search, roleName });
      const { content, currentPage, isLast, pageSize, totalItems, totalPages } =
        res.data;

      setUsers(mapUsersFromApi(content));
      setCurrentPage(currentPage + 1);
      setIsLast(isLast);
      setPageSize(pageSize);
      setTotalItems(totalItems);
      setTotalPages(totalPages);
      return res;
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchUsers,
    loading,
    error,
    users,
    currentPage,
    isLast,
    pageSize,
    totalItems,
    totalPages,
  };
};

export default useGetUsers;
