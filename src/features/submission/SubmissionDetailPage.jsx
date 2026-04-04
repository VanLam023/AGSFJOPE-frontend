import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import { useLocation } from 'react-router-dom';
import gradingApi from '../../services/gradingApi';

function fmtDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
}

function num(v, digits = 2) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(digits);
}

function resultBadge(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'PASS') return { label: 'PASS', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (s === 'FAIL') return { label: 'FAIL', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
  if (s === 'GRADING') return { label: 'GRADING', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse' };
  return { label: 'PENDING', cls: 'bg-slate-50 text-slate-700 border-slate-200' };
}

function tcStatusClass(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'PASS_TESTCASE') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (s === 'FAIL_TESTCASE') return 'bg-orange-100 text-orange-700 border-orange-200';
  if (s === 'TIMEOUT') return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-rose-100 text-rose-700 border-rose-200';
}

function questionTone(ans) {
  if (ans?.guardRuleTriggered) return 'border-l-rose-500 bg-rose-50/20';
  const score = Number(ans?.questionScore ?? 0);
  const max = Number(ans?.maxScore ?? 0);
  if (max > 0 && score >= max) return 'border-l-emerald-500 bg-emerald-50/10';
  if (score > 0) return 'border-l-amber-400 bg-amber-50/20';
  return 'border-l-slate-300 bg-slate-50/30';
}

function extractPayload(res) {
  return res?.data?.data ?? res?.data ?? res ?? null;
}

function getErrorStatus(error) {
  return Number(error?.response?.status || error?.status || 0);
}

function extractApiErrorMessage(error, fallback = 'Đã xảy ra lỗi. Vui lòng thử lại.') {
  const status = getErrorStatus(error);
  const serverMessage = String(error?.response?.data?.message || '').trim();
  if (serverMessage) return serverMessage;

  if (!error?.response && error?.message) {
    return 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra backend hoặc mạng.';
  }

  if (status === 400) return 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại dữ liệu.';
  if (status === 401) return 'Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập.';
  if (status === 403) return 'Bạn không có quyền xem hoặc thao tác với bài nộp này.';
  if (status === 404) return 'Không tìm thấy kết quả chấm cho bài nộp này.';
  if (status === 409) return 'Bài nộp đang ở trạng thái không cho phép thao tác này.';
  if (status >= 500) return 'Máy chủ đang gặp lỗi. Vui lòng thử lại sau.';

  return error?.message || fallback;
}

const TopActions = React.memo(function TopActions({ onBack, isStudentView, onAppeal, onRegrade, isRegrading }) {
  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-full hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-sm font-bold text-slate-700 shadow-sm"
      >
        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        Quay lại
      </button>

      {isStudentView ? (
        <button
          type="button"
          onClick={onAppeal}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#F37021] border border-[#d9621a] text-white rounded-full hover:bg-orange-600 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-sm font-bold shadow-sm group"
        >
          <span className="material-symbols-outlined text-[20px] group-hover:-translate-y-0.5 transition-transform duration-300">gavel</span>
          Gửi yêu cầu phúc khảo
        </button>
      ) : (
        <button
          type="button"
          onClick={onRegrade}
          disabled={isRegrading}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 border border-indigo-700 text-white rounded-full hover:bg-indigo-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-sm font-bold shadow-sm disabled:opacity-70 disabled:hover:-translate-y-0 disabled:cursor-not-allowed group"
        >
          {isRegrading ? (
            <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
          ) : (
            <span className="material-symbols-outlined text-[20px] group-hover:rotate-180 transition-transform duration-500">refresh</span>
          )}
          Chấm lại
        </button>
      )}
    </div>
  );
});

const LoadingState = React.memo(function LoadingState({ hasDetail }) {
  if (!hasDetail) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/60 p-16 text-center shadow-xl">
        <div className="w-12 h-12 mx-auto rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Đang nạp dữ liệu đánh giá...</p>
      </div>
    );
  }

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-3 text-sm font-semibold text-indigo-700 inline-flex items-center gap-3 shadow-sm">
      <span className="w-4 h-4 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin" />
      Đang cập nhật dữ liệu mới nhất...
    </div>
  );
});

const AlertBox = React.memo(function AlertBox({ type = 'error', text }) {
  const typeMap = {
    error: {
      box: 'bg-rose-50 border-rose-200 text-rose-700',
      icon: 'error',
      iconCls: 'text-rose-500',
    },
    warning: {
      box: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: 'warning',
      iconCls: 'text-amber-500',
    },
  };
  const current = typeMap[type] || typeMap.error;

  return (
    <div className={`rounded-2xl border px-5 py-4 shadow-sm flex items-start gap-3 ${current.box}`}>
      <span className={`material-symbols-outlined mt-0.5 ${current.iconCls}`}>{current.icon}</span>
      <div className="font-medium text-sm">{text}</div>
    </div>
  );
});

const OverviewHeader = React.memo(function OverviewHeader({ detail, status }) {
  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden">
      <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
      <div className="p-7 sm:p-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start lg:items-center justify-between">
          <div className="flex items-center gap-5 min-w-0">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-2xl font-black flex items-center justify-center shadow-xl shadow-indigo-300/40 shrink-0">
              {detail?.studentName?.charAt(0)?.toUpperCase() || 'S'}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm ${status.cls}`}>{status.label}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Detail Report</span>
              </div>

              <h2 className="text-3xl font-black text-slate-800 tracking-tight truncate">{detail?.studentName || '—'}</h2>

              <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500 mt-2.5">
                <span className="flex items-center gap-1.5 bg-slate-100/50 px-2.5 py-1 rounded-md">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">badge</span>
                  {detail?.studentCode || '—'}
                </span>
                <span className="flex items-center gap-1.5 bg-slate-100/50 px-2.5 py-1 rounded-md max-w-full">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">mail</span>
                  <span className="truncate">{detail?.studentEmail || '—'}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50/80 border border-slate-100 rounded-3xl p-6 w-full lg:w-auto text-center lg:text-right shadow-inner shrink-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Final Grade</p>
            <div className="flex items-baseline justify-center lg:justify-end gap-1.5">
              <span className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-600">{num(detail?.totalScore)}</span>
              <span className="text-xl font-bold text-slate-400">/ {num(detail?.maxScore)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const QuestionCard = React.memo(function QuestionCard({ ans, index, isOpen, onToggle }) {
  const testCases = Array.isArray(ans?.testCaseResults) ? ans.testCaseResults : [];
  const passCount = testCases.filter((x) => String(x?.status || '').toUpperCase() === 'PASS_TESTCASE').length;
  const oopScore = ans?.aiReview?.oopScore;

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/60 shadow-[0_2px_10px_rgb(0,0,0,0.02)] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] group border-l-4 ${questionTone(ans)}`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-5 flex flex-wrap md:flex-nowrap items-center justify-between transition-colors hover:bg-slate-50/50 relative gap-4"
      >
        <div className="flex items-center gap-5 text-left w-full md:w-auto">
          <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl font-bold text-sm shadow-sm border bg-white text-slate-700 border-slate-200">
            {ans?.questionNumber ?? index + 1}
          </div>

          <div>
            <p className="font-bold text-slate-800 text-[16px] group-hover:text-indigo-600 transition-colors">
              {ans?.questionTitle || `Question ${ans?.questionNumber ?? index + 1}`}
            </p>
            <div className="flex items-center flex-wrap gap-2 mt-1.5 text-[12px] font-medium text-slate-500">
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">Weight: {num(ans?.maxScore)} pts</span>
              {ans?.guardRuleTriggered && (
                <span className="text-rose-600 font-bold uppercase tracking-wider text-[10px] bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">warning</span>
                  Guard Rule
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 shrink-0 ml-auto md:ml-0">
          <div className="text-right">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Score</p>
            <p className="text-lg font-black text-slate-800">{num(ans?.questionScore)}</p>
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 ${isOpen ? 'rotate-180 bg-indigo-50 text-indigo-600' : ''}`}>
            <span className="material-symbols-outlined text-[20px]">keyboard_arrow_down</span>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="px-6 pb-6 pt-2 bg-slate-50/30 border-t border-slate-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mt-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col h-full ring-1 ring-slate-900/5 hover:shadow-lg transition-all duration-300">
              <div className="flex-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-slate-400 bg-slate-100 p-1 rounded-md">bug_report</span>
                  Unit Test Results
                </p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 gap-4">
                    <span className="text-sm font-semibold text-slate-600">Passed Tests</span>
                    <div className="flex flex-1 items-center gap-3 max-w-[200px]">
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: testCases.length ? `${(passCount / testCases.length) * 100}%` : '0%' }}></div>
                      </div>
                      <span className="font-black text-slate-800 text-sm w-10 text-right">{passCount}/{testCases.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                {ans?.guardRuleTriggered && (
                  <div className="bg-rose-50 text-rose-700 text-[12px] font-semibold p-3.5 rounded-xl border border-rose-200 shadow-sm flex items-start gap-2">
                    <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5 animate-pulse">gavel</span>
                    <span>{ans?.guardRuleNote?.split(' (')[0] || 'Phát hiện vi phạm quy tắc'}</span>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white shadow-[0_2px_8px_rgb(0,0,0,0.04)]">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Test Case Score</span>
                  <span className={`text-2xl font-black ${ans?.guardRuleTriggered ? 'text-rose-500 line-through opacity-60' : 'text-emerald-500'}`}>{num(ans?.rawTestCaseScore)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col h-full ring-1 ring-slate-900/5 hover:shadow-lg transition-all duration-300">
              <div className="flex-1">
                <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-indigo-500 bg-indigo-50 p-1 rounded-md">psychology</span>
                  AI Code Review
                </p>

                {ans?.aiReview ? (
                  <div className="space-y-4 text-sm">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-sm font-semibold text-slate-600">OOP Score</span>
                      <span className="text-2xl font-black text-indigo-600">{num(oopScore)}</span>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 whitespace-pre-wrap text-slate-700 leading-7">
                      {ans?.aiReview?.comment || 'Không có nhận xét AI.'}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 font-medium">
                    Chưa có dữ liệu AI review cho câu này.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm ring-1 ring-slate-900/5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-slate-400 bg-slate-100 p-1 rounded-md">checklist</span>
              Danh sách test case
            </p>

            <div className="space-y-3">
              {testCases.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 font-medium">
                  Không có test case nào để hiển thị.
                </div>
              )}

              {testCases.map((tc, tIdx) => {
                const isPass = String(tc?.status || '').toUpperCase() === 'PASS_TESTCASE';
                const badgeClass = tcStatusClass(tc?.status);
                return (
                  <div key={tc?.testCaseId || tIdx} className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs shadow-sm border ${isPass ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{tc?.testCaseNumber ?? tIdx + 1}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border shadow-sm ${badgeClass}`}>{isPass ? 'PASS' : tc?.status || 'FAIL'}</span>
                      </div>
                      <span className={`text-sm font-black ${isPass ? 'text-emerald-600' : 'text-rose-600'}`}>{num(tc?.scoreEarned)}</span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        <span className="material-symbols-outlined text-[12px] text-slate-400">timer</span>
                        {tc?.executionTimeMs ?? 0}ms
                      </span>
                    </div>

                    {!!tc?.errorMessage && (
                      <div className="mt-3 p-3 bg-rose-50/50 rounded-lg text-xs font-medium text-rose-800 border border-rose-100/50 font-mono overflow-auto">{tc.errorMessage}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

const SummarySidebar = React.memo(function SummarySidebar({ detail, displaySubmissionStatus, tcSummary, gradingDurationLabel }) {
  const cleanedNote = detail?.note?.replace('Chế độ: OOP chỉ nhận xét, không tính điểm.', '').trim();

  return (
    <div className="sticky top-8 space-y-6">
      <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        <div className="p-8">
          <h4 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-indigo-500 bg-indigo-50 p-1.5 rounded-lg">assessment</span>
            Tổng quan chấm bài
          </h4>

          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100/80">
              <span className="text-sm font-medium text-slate-500">Học kỳ</span>
              <span className="text-[13px] font-bold text-slate-900 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-lg">{detail?.semesterName || '—'}</span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100/80">
              <span className="text-sm font-medium text-slate-500">Block thi</span>
              <span className="text-[13px] font-bold text-slate-900 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-lg">{detail?.blockName || '—'}</span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100/80">
              <span className="text-sm font-medium text-slate-500">Tình trạng bài nộp</span>
              <span className="text-[13px] font-bold text-slate-900 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-lg">{displaySubmissionStatus}</span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100/80">
              <span className="text-sm font-medium text-slate-500">Tổng điểm TestCase</span>
              <span className="text-base font-black text-slate-800 bg-slate-50 px-2.5 py-0.5 rounded-lg border border-slate-100">{num(detail?.testCaseScore)}</span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100/80">
              <span className="text-sm font-medium text-slate-500">Tổng điểm OOP</span>
              <span className="text-base font-black text-slate-800 bg-slate-50 px-2.5 py-0.5 rounded-lg border border-slate-100">{num(detail?.oopScore)}</span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100/80">
              <span className="text-sm font-medium text-slate-500">TestCase đạt</span>
              <span className="text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg shadow-sm">{tcSummary.pass}/{tcSummary.total}</span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100/80">
              <span className="text-sm font-medium text-slate-500">Tiến trình chấm</span>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm"><span className="material-symbols-outlined text-[14px]">check_circle</span>{gradingDurationLabel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">Dấu thời gian</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded border border-slate-100">{fmtDateTime(detail?.gradedAt)}</span>
            </div>
          </div>

          {!!cleanedNote && (
            <div className="mt-8 bg-amber-50/50 rounded-2xl p-5 border border-amber-200/50 shadow-inner">
              <p className="text-[11px] font-bold text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">info</span>
                Ghi chú cấu hình
              </p>
              <p className="text-xs font-medium text-amber-900/80 leading-relaxed whitespace-pre-wrap">{cleanedNote}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default function SubmissionDetailPage({ examId, blockId, submissionId, onBack, isStudentView = false }) {
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
        const res = await gradingApi.getSubmissionResult(submissionId);
        const payload = extractPayload(res);
        if (!mounted) return;

        setDetail((prev) => ({ ...(prev || {}), ...(payload || {}) }));
        setOpenQuestion(-1);
        setDetailWarning('');
        setLocalSubmissionStatus('');
      } catch (e) {
        if (!mounted) return;
        const apiMessage = extractApiErrorMessage(e, 'Không thể tải chi tiết bài chấm. Vui lòng thử lại.');
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
          const res = await gradingApi.getSubmissionResult(submissionId);
          const payload = extractPayload(res);
          setDetail((prev) => ({ ...(prev || {}), ...(payload || {}) }));
          setDetailWarning('');
          setLocalSubmissionStatus('');
        } catch (e) {
          setDetailWarning(extractApiErrorMessage(e, 'Đã gửi yêu cầu chấm lại nhưng chưa tải lại được chi tiết mới.'));
        }
      }, 1000);
    } catch (e) {
      setLocalSubmissionStatus('');
      message.error(extractApiErrorMessage(e, 'Lỗi khi yêu cầu chấm lại.'));
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
  const displaySubmissionStatus = localSubmissionStatus || detail?.submissionStatus || detail?.status || '—';
  const status = useMemo(() => resultBadge(displayResultStatus), [displayResultStatus]);
  const answers = useMemo(() => (Array.isArray(detail?.answers) ? detail.answers : []), [detail]);

  const tcSummary = useMemo(() => {
    const all = answers.flatMap((a) => (Array.isArray(a?.testCaseResults) ? a.testCaseResults : []));
    const pass = all.filter((x) => String(x?.status || '').toUpperCase() === 'PASS_TESTCASE').length;
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

              <div className="flex items-center justify-between pt-2">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-indigo-500 text-[24px]">analytics</span>
                  Chi tiết từng câu
                </h3>
              </div>

              <div className="space-y-5">
                {answers.map((ans, idx) => (
                  <QuestionCard
                    key={ans?.answerId || idx}
                    ans={ans}
                    index={idx}
                    isOpen={openQuestion === idx}
                    onToggle={() => toggleQuestion(idx)}
                  />
                ))}
              </div>
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
