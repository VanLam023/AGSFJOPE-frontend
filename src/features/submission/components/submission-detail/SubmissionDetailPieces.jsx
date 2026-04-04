import React from 'react';
import {
  fmtDateTime,
  num,
  questionTone,
  tcStatusClass,
} from './submissionDetail.helpers.js';

export const TopActions = React.memo(function TopActions({
  onBack,
  isStudentView,
  onAppeal,
  onRegrade,
  isRegrading,
}) {
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
          <span className="material-symbols-outlined text-[20px] group-hover:-translate-y-0.5 transition-transform duration-300">
            gavel
          </span>
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
            <span className="material-symbols-outlined text-[20px] group-hover:rotate-180 transition-transform duration-500">
              refresh
            </span>
          )}
          Chấm lại
        </button>
      )}
    </div>
  );
});

export const LoadingState = React.memo(function LoadingState({ hasDetail }) {
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

export const AlertBox = React.memo(function AlertBox({ type = 'error', text }) {
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

export const OverviewHeader = React.memo(function OverviewHeader({ detail, status }) {
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
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm ${status.cls}`}>
                  {status.label}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Detail Report</span>
              </div>

              <h2 className="text-3xl font-black text-slate-800 tracking-tight truncate">
                {detail?.studentName || '—'}
              </h2>

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
              <span className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-600">
                {num(detail?.totalScore)}
              </span>
              <span className="text-xl font-bold text-slate-400">/ {num(detail?.maxScore)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export const QuestionCard = React.memo(function QuestionCard({ ans, index, isOpen, onToggle }) {
  const testCases = Array.isArray(ans?.testCaseResults) ? ans.testCaseResults : [];
  const passCount = testCases.filter(
    (x) => String(x?.status || '').toUpperCase() === 'PASS_TESTCASE'
  ).length;
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
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                Weight: {num(ans?.maxScore)} pts
              </span>
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
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{
                            width: testCases.length
                              ? `${(passCount / testCases.length) * 100}%`
                              : '0%',
                          }}
                        ></div>
                      </div>
                      <span className="font-black text-slate-800 text-sm w-10 text-right">
                        {passCount}/{testCases.length}
                      </span>
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
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Test Case Score
                  </span>
                  <span className={`text-2xl font-black ${ans?.guardRuleTriggered ? 'text-rose-500 line-through opacity-60' : 'text-emerald-500'}`}>
                    {num(ans?.rawTestCaseScore)}
                  </span>
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
                  <div
                    key={tc?.testCaseId || tIdx}
                    className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-4"
                  >
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs shadow-sm border ${isPass ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                          {tc?.testCaseNumber ?? tIdx + 1}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border shadow-sm ${badgeClass}`}>
                          {isPass ? 'PASS' : tc?.status || 'FAIL'}
                        </span>
                      </div>
                      <span className={`text-sm font-black ${isPass ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {num(tc?.scoreEarned)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        <span className="material-symbols-outlined text-[12px] text-slate-400">timer</span>
                        {tc?.executionTimeMs ?? 0}ms
                      </span>
                    </div>

                    {!!tc?.errorMessage && (
                      <div className="mt-3 p-3 bg-rose-50/50 rounded-lg text-xs font-medium text-rose-800 border border-rose-100/50 font-mono overflow-auto">
                        {tc.errorMessage}
                      </div>
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

export const QuestionsSection = React.memo(function QuestionsSection({
  answers,
  openQuestion,
  onToggleQuestion,
}) {
  return (
    <>
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
            onToggle={() => onToggleQuestion(idx)}
          />
        ))}
      </div>
    </>
  );
});

export const SummarySidebar = React.memo(function SummarySidebar({
  detail,
  displaySubmissionStatus,
  tcSummary,
  gradingDurationLabel,
}) {
  const cleanedNote = detail?.note
    ?.replace('Chế độ: OOP chỉ nhận xét, không tính điểm.', '')
    .trim();

  return (
    <div className="sticky top-8 space-y-6">
      <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        <div className="p-8">
          <h4 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-indigo-500 bg-indigo-50 p-1.5 rounded-lg">
              assessment
            </span>
            Tổng quan chấm bài
          </h4>

          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100/80">
              <span className="text-sm font-medium text-slate-500">Học kỳ</span>
              <span className="text-[13px] font-bold text-slate-900 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-lg">
                {detail?.semesterName || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100/80">
              <span className="text-sm font-medium text-slate-500">Block thi</span>
              <span className="text-[13px] font-bold text-slate-900 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-lg">
                {detail?.blockName || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100/80">
              <span className="text-sm font-medium text-slate-500">Tình trạng bài nộp</span>
              <span className="text-[13px] font-bold text-slate-900 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-lg">
                {displaySubmissionStatus}
              </span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100/80">
              <span className="text-sm font-medium text-slate-500">Tổng điểm TestCase</span>
              <span className="text-base font-black text-slate-800 bg-slate-50 px-2.5 py-0.5 rounded-lg border border-slate-100">
                {num(detail?.testCaseScore)}
              </span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100/80">
              <span className="text-sm font-medium text-slate-500">Tổng điểm OOP</span>
              <span className="text-base font-black text-slate-800 bg-slate-50 px-2.5 py-0.5 rounded-lg border border-slate-100">
                {num(detail?.oopScore)}
              </span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100/80">
              <span className="text-sm font-medium text-slate-500">TestCase đạt</span>
              <span className="text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg shadow-sm">
                {tcSummary.pass}/{tcSummary.total}
              </span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100/80">
              <span className="text-sm font-medium text-slate-500">Tiến trình chấm</span>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                {gradingDurationLabel}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">Dấu thời gian</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded border border-slate-100">
                {fmtDateTime(detail?.gradedAt)}
              </span>
            </div>
          </div>

          {!!cleanedNote && (
            <div className="mt-8 bg-amber-50/50 rounded-2xl p-5 border border-amber-200/50 shadow-inner">
              <p className="text-[11px] font-bold text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">info</span>
                Ghi chú cấu hình
              </p>
              <p className="text-xs font-medium text-amber-900/80 leading-relaxed whitespace-pre-wrap">
                {cleanedNote}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
