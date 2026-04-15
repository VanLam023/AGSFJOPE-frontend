import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import gradingApi from '../../services/gradingApi';
import appealApi from '../../services/appealApi';
import { getStaffAppeals } from '../../services/staffApi';
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
import {
  canRenderAppealScoreComparison,
  findAppealById,
  findAppealBySubmissionId,
  getAppealReviewerName,
  isAppealFinalStatus,
  resolveAppealScores,
  resolveSubmissionScoreComparison,
  unwrapApiData,
} from '../student/appeals/helpers/appealHelpers';

const GRADING_POLL_INTERVAL_MS = 2000;
const GRADING_POLL_MAX_ATTEMPTS = 30;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function clearScoringSnapshot(detail) {
  if (!detail || typeof detail !== 'object') return detail;

  const answers = Array.isArray(detail.answers)
    ? detail.answers.map((answer) => ({
      ...answer,
      questionScore: null,
      rawTestCaseScore: null,
      rawOopScore: null,
      guardRuleTriggered: false,
      guardRuleNote: null,
      aiReview: null,
      testCaseResults: [],
    }))
    : [];

  return {
    ...detail,
    status: 'GRADING',
    submissionStatus: 'GRADING',
    totalScore: null,
    testCaseScore: null,
    oopScore: null,
    note: null,
    gradedAt: null,
    answers,
  };
}

export default function SubmissionDetailPage({
  examId,
  blockId,
  submissionId,
  onBack,
  isStudentView = false,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const prefill = location?.state?.prefill ?? null;
  const routeAppealId = location?.state?.appealId ?? null;
  const routeAppealRecord = location?.state?.appeal ?? null;

  const [loading, setLoading] = useState(!prefill);
  const [error, setError] = useState('');
  const [detailWarning, setDetailWarning] = useState('');
  const [detail, setDetail] = useState(prefill);
  const [appealRecord, setAppealRecord] = useState(routeAppealRecord);
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

      const appealsPromise = routeAppealRecord
        ? Promise.resolve({ data: routeAppealRecord })
        : isStudentView
          ? appealApi.getMyAppeals()
          : getStaffAppeals({ page: 0, size: 200 });

      try {
        const [resultResponse, appealsResponse] = await Promise.allSettled([
          gradingApi.getSubmissionResult(submissionId),
          appealsPromise,
        ]);

        if (!mounted) return;

        if (resultResponse.status === 'fulfilled') {
          const payload = extractPayload(resultResponse.value);
          setDetail((prev) => ({ ...(prev || {}), ...(payload || {}) }));
          setOpenQuestion(-1);
          setDetailWarning('');
          setLocalSubmissionStatus('');
        } else {
          const apiMessage = extractApiErrorMessage(
            resultResponse.reason,
            'Không thể tải chi tiết bài chấm. Vui lòng thử lại.',
          );

          if (prefill) {
            setDetail((prev) => prev || prefill);
            setDetailWarning(apiMessage);
            setError('');
          } else {
            setError(apiMessage);
          }
        }

        if (appealsResponse.status === 'fulfilled') {
          const payload = routeAppealRecord
            ? routeAppealRecord
            : unwrapApiData(appealsResponse.value);
          const matchedAppeal = routeAppealId
            ? findAppealById(payload?.appeals ?? payload, routeAppealId)
            : findAppealBySubmissionId(payload?.appeals ?? payload, submissionId);
          setAppealRecord(matchedAppeal || routeAppealRecord || null);
        } else {
          setAppealRecord(routeAppealRecord || null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load().catch((errorResponse) => {
      if (!mounted) return;
      const apiMessage = extractApiErrorMessage(
        errorResponse,
        'Không thể tải chi tiết bài chấm. Vui lòng thử lại.',
      );

      if (prefill) {
        setDetail((prev) => prev || prefill);
        setDetailWarning(apiMessage);
        setError('');
      } else {
        setError(apiMessage);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [isStudentView, prefill, routeAppealId, routeAppealRecord, submissionId]);

  const handleRegrade = useCallback(async () => {
    if (!examId || !blockId || !submissionId) {
      message.error('Thiếu thông tin định danh để chấm lại.');
      return;
    }

    setIsRegrading(true);
    setLocalSubmissionStatus('GRADING');
    setDetail((prev) => clearScoringSnapshot(prev));
    setOpenQuestion(-1);
    setDetailWarning('');

    try {
      await gradingApi.triggerSingleGrading(examId, blockId, submissionId);
      message.success('Đã gửi yêu cầu chấm lại.');

      let latestPayload = null;
      let completed = false;

      for (let attempt = 0; attempt < GRADING_POLL_MAX_ATTEMPTS; attempt += 1) {
        const response = await gradingApi.getSubmissionResult(submissionId);
        const payload = extractPayload(response);
        latestPayload = payload;

        const statusText = String(
          payload?.submissionStatus || payload?.status || ''
        ).toUpperCase();
        const isStillGrading = statusText === 'GRADING';

        if (!isStillGrading) {
          completed = true;
          break;
        }

        await sleep(GRADING_POLL_INTERVAL_MS);
      }

      if (latestPayload) {
        setDetail((prev) => ({ ...(prev || {}), ...(latestPayload || {}) }));
      }

      if (!completed) {
        setDetailWarning('Đã gửi yêu cầu chấm lại. Hệ thống vẫn đang xử lý, vui lòng tải lại sau ít phút.');
      }

      setLocalSubmissionStatus('');
    } catch (errorResponse) {
      setLocalSubmissionStatus('');
      message.error(extractApiErrorMessage(errorResponse, 'Lỗi khi yêu cầu chấm lại.'));
    } finally {
      setIsRegrading(false);
    }
  }, [blockId, examId, submissionId]);

  const handleAppeal = useCallback(() => {
    if (!submissionId) {
      message.error('Thiếu submissionId để tạo yêu cầu phúc khảo.');
      return;
    }

    navigate(`/student/appeals/create/${submissionId}`, {
      state: {
        prefill: {
          submissionId,
          examId,
          blockId,
          examName: prefill?.examName || detail?.examName || detail?.blockName,
          semesterName: prefill?.semesterName || detail?.semesterName,
          blockName: prefill?.blockName || detail?.blockName,
          totalScore: detail?.totalScore,
          maxScore: detail?.maxScore,
          gradedAt: detail?.gradedAt,
          status: detail?.status,
        },
      },
    });
  }, [blockId, detail?.blockName, detail?.examName, detail?.gradedAt, detail?.maxScore, detail?.semesterName, detail?.status, detail?.totalScore, examId, navigate, prefill?.blockName, prefill?.examName, prefill?.semesterName, submissionId]);

  const toggleQuestion = useCallback((index) => {
    setOpenQuestion((prev) => (prev === index ? -1 : index));
  }, []);

  const displayResultStatus = localSubmissionStatus === 'GRADING' ? 'GRADING' : detail?.status;
  const displaySubmissionStatus =
    localSubmissionStatus || detail?.submissionStatus || detail?.status || '—';

  const status = useMemo(() => resultBadge(displayResultStatus), [displayResultStatus]);

  const answers = useMemo(
    () => (Array.isArray(detail?.answers) ? detail.answers : []),
    [detail],
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

  const shouldRenderScoreComparison = useMemo(
    () => canRenderAppealScoreComparison(appealRecord),
    [appealRecord],
  );

  const comparableAppealRecord = useMemo(
    () => (shouldRenderScoreComparison ? appealRecord : null),
    [appealRecord, shouldRenderScoreComparison],
  );

  const appealScores = useMemo(
    () => resolveAppealScores(comparableAppealRecord, detail),
    [comparableAppealRecord, detail],
  );

  const submissionScoreComparison = useMemo(
    () => resolveSubmissionScoreComparison(comparableAppealRecord, detail),
    [comparableAppealRecord, detail],
  );

  const reviewedQuestionScores = useMemo(
    () => submissionScoreComparison?.reviewedQuestionScores || {},
    [submissionScoreComparison],
  );

  const originalQuestionScores = useMemo(
    () => submissionScoreComparison?.originalQuestionScores || {},
    [submissionScoreComparison],
  );

  const reviewerName = useMemo(
    () => getAppealReviewerName(appealRecord),
    [appealRecord],
  );

  const disableRegradeByAppeal = useMemo(
    () => isAppealFinalStatus(appealRecord?.status),
    [appealRecord?.status],
  );

  const isScoreResolving = loading || localSubmissionStatus === 'GRADING';

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
          disableRegrade={disableRegradeByAppeal}
        />

        {loading && <LoadingState hasDetail={!!detail} />}
        {!loading && !!error && <AlertBox type="error" text={error} />}
        {!loading && !error && !!detailWarning && <AlertBox type="warning" text={detailWarning} />}

        {!!detail && !error && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <div className="xl:col-span-8 space-y-6">
              <OverviewHeader
                detail={detail}
                status={status}
                appealScores={appealScores}
                showScoreComparison={shouldRenderScoreComparison}
                isScoreResolving={isScoreResolving}
              />

              <QuestionsSection
                answers={answers}
                openQuestion={openQuestion}
                onToggleQuestion={toggleQuestion}
                reviewedQuestionScores={reviewedQuestionScores}
                originalQuestionScores={originalQuestionScores}
                gradingMode={detail?.gradingMode}
                reviewerName={reviewerName}
                isScoreResolving={isScoreResolving}
              />
            </div>

            <div className="xl:col-span-4">
              <SummarySidebar
                detail={detail}
                displaySubmissionStatus={displaySubmissionStatus}
                tcSummary={tcSummary}
                gradingDurationLabel={gradingDurationLabel}
                appealRecord={appealRecord}
                appealScores={appealScores}
                reviewerName={reviewerName}
                showScoreComparison={shouldRenderScoreComparison}
                isScoreResolving={isScoreResolving}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
