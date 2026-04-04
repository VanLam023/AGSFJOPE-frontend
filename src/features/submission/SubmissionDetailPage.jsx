import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import { useLocation } from 'react-router-dom';
import gradingApi from '../../services/gradingApi';
import {
  AlertBox,
  LoadingState,
  OverviewHeader,
  QuestionsSection,
  SummarySidebar,
  TopActions,
} from './components/submission-detail/SubmissionDetailPieces.jsx';
import {
  extractApiErrorMessage,
  extractPayload,
  resultBadge,
} from './components/submission-detail/submissionDetail.helpers.js';

export default function SubmissionDetailPage({
  examId,
  blockId,
  submissionId,
  onBack,
  isStudentView = false,
}) {
  const location = useLocation();
  const prefill = location?.state?.prefill ?? null;

  const [loading, setLoading] = useState(!prefill);
  const [error, setError] = useState('');
  const [detailWarning, setDetailWarning] = useState('');
  const [detail, setDetail] = useState(prefill);
  const [openQuestion, setOpenQuestion] = useState(-1);
  const [isRegrading, setIsRegrading] = useState(false);
  const [localSubmissionStatus, setLocalSubmissionStatus] = useState('');

  const handleBack = useCallback(() => {
    if (typeof onBack === 'function') {
      onBack();
      return;
    }
    window.history.back();
  }, [onBack]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!submissionId) {
        setLoading(false);
        setError('Thiếu submissionId để tải chi tiết bài chấm.');
        return;
      }

      setLoading(true);
      setError('');
      setDetailWarning('');

      try {
        const response = await gradingApi.getSubmissionResult(submissionId);
        const payload = extractPayload(response);
        if (!mounted) return;

        setDetail((prev) => ({ ...(prev || {}), ...(payload || {}) }));
        setOpenQuestion(-1);
        setDetailWarning('');
        setLocalSubmissionStatus('');
      } catch (errorResponse) {
        if (!mounted) return;
        const apiMessage = extractApiErrorMessage(
          errorResponse,
          'Không thể tải chi tiết bài chấm. Vui lòng thử lại.'
        );

        if (prefill) {
          setDetail((prev) => prev || prefill);
          setDetailWarning(apiMessage);
          setError('');
        } else {
          setError(apiMessage);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [prefill, submissionId]);

  const handleRegrade = useCallback(async () => {
    if (!examId || !blockId || !submissionId) {
      message.error('Thiếu thông tin định danh để chấm lại.');
      return;
    }

    setIsRegrading(true);
    setLocalSubmissionStatus('GRADING');

    try {
      await gradingApi.triggerSingleGrading(examId, blockId, submissionId);
      message.success('Đã gửi yêu cầu chấm lại.');

      setTimeout(async () => {
        try {
          const response = await gradingApi.getSubmissionResult(submissionId);
          const payload = extractPayload(response);
          setDetail((prev) => ({ ...(prev || {}), ...(payload || {}) }));
          setDetailWarning('');
          setLocalSubmissionStatus('');
        } catch (errorResponse) {
          setDetailWarning(
            extractApiErrorMessage(
              errorResponse,
              'Đã gửi yêu cầu chấm lại nhưng chưa tải lại được chi tiết mới.'
            )
          );
        }
      }, 1000);
    } catch (errorResponse) {
      setLocalSubmissionStatus('');
      message.error(extractApiErrorMessage(errorResponse, 'Lỗi khi yêu cầu chấm lại.'));
    } finally {
      setIsRegrading(false);
    }
  }, [blockId, examId, submissionId]);

  const handleAppeal = useCallback(() => {
    message.info('Tính năng nộp đơn phúc khảo đang được hệ thống phát triển, vui lòng quay lại sau.');
  }, []);

  const toggleQuestion = useCallback((index) => {
    setOpenQuestion((prev) => (prev === index ? -1 : index));
  }, []);

  const displayResultStatus = localSubmissionStatus === 'GRADING' ? 'GRADING' : detail?.status;
  const displaySubmissionStatus =
    localSubmissionStatus || detail?.submissionStatus || detail?.status || '—';

  const status = useMemo(() => resultBadge(displayResultStatus), [displayResultStatus]);

  const answers = useMemo(
    () => (Array.isArray(detail?.answers) ? detail.answers : []),
    [detail]
  );

  const tcSummary = useMemo(() => {
    const all = answers.flatMap((answer) =>
      Array.isArray(answer?.testCaseResults) ? answer.testCaseResults : []
    );
    const pass = all.filter(
      (item) => String(item?.status || '').toUpperCase() === 'PASS_TESTCASE'
    ).length;
    return { total: all.length, pass };
  }, [answers]);

  const gradingDurationLabel = useMemo(() => {
    if (localSubmissionStatus === 'GRADING') return 'Đang chấm...';
    if (!detail?.gradedAt) return '—';
    return 'Đã chấm xong';
  }, [detail?.gradedAt, localSubmissionStatus]);

  return (
    <div className="relative min-h-screen bg-[#F8FAFC]">
      <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#a78bfa] to-[#60a5fa] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8 space-y-6">
        <TopActions
          onBack={handleBack}
          isStudentView={isStudentView}
          onAppeal={handleAppeal}
          onRegrade={handleRegrade}
          isRegrading={isRegrading}
        />

        {loading && <LoadingState hasDetail={!!detail} />}
        {!loading && !!error && <AlertBox type="error" text={error} />}
        {!loading && !error && !!detailWarning && <AlertBox type="warning" text={detailWarning} />}

        {!!detail && !error && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <div className="xl:col-span-8 space-y-6">
              <OverviewHeader detail={detail} status={status} />

              <QuestionsSection
                answers={answers}
                openQuestion={openQuestion}
                onToggleQuestion={toggleQuestion}
              />
            </div>

            <div className="xl:col-span-4">
              <SummarySidebar
                detail={detail}
                displaySubmissionStatus={displaySubmissionStatus}
                tcSummary={tcSummary}
                gradingDurationLabel={gradingDurationLabel}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
