import React, { useState, useCallback } from 'react';
import { importExcel } from '../services/adminApi';

const useImportExcel = () => {
  const [importExcelData, setImportExcelData] = useState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callImportExcelEndpoint = useCallback(async (file) => {
    setLoading(true);
    try {
      const res = await importExcel(file);
      setImportExcelData(res);
      return res;
    } catch (err) {
      setError(err);
    } finally {
      setLoading(true);
    }
  });

  return { callImportExcelEndpoint, importExcelData, loading, error };
};

export default useImportExcel;
