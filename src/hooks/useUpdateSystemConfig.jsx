import React, { useState } from 'react';
import { updateSystemConfig } from '../services/adminApi';

const useUpdateSystemConfig = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updatedConfig, setUpdatedConfig] = useState(null);

  const callUpdateSystemConfigEndpoint = async ({
    maxUploadSizeMb,
    maxExamPaperMb,
    smtpHost,
    smtpPort,
    smtpUsername,
    smtpPassword,
    smtpFromEmail,
    defaultGradingMode,
  }) => {
    setLoading(true);
    setError(null);

    try {
      const res = await updateSystemConfig({
        maxUploadSizeMb,
        maxExamPaperMb,
        smtpHost,
        smtpPort,
        smtpUsername,
        smtpPassword,
        smtpFromEmail,
        defaultGradingMode,
      });
      setUpdatedConfig(res.data);
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    callUpdateSystemConfigEndpoint,
    updatedConfig,
    loading,
    error,
  };
};

export default useUpdateSystemConfig;

