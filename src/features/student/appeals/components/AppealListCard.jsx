import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import AppealProgressTimeline from './AppealProgressTimeline';
import AppealStatusBadge from './AppealStatusBadge';
import {
  formatDateTime,
  formatScore,
  getAppealReviewerName,
  isAppealFinalStatus,
  resolveAppealScores,
} from '../helpers/appealHelpers';

function ScorePanel({ scoreInfo }) {
  const originalText = scoreInfo.originalScore != null ? formatScore(scoreInfo.originalScore) : '—';
  const newText = scoreInfo.newScore != null ? formatScore(scoreInfo.newScore) : '—';

  if (scoreInfo.originalScore == null) {
    return (
      <div className="text-right">
        <p className="text-2xl font-black text-slate-400">—</p>
      </div>
    );
  }

  if (scoreInfo.newScore == null) {
    return (
      <div className="text-right">
        <p className="text-3xl font-black text-slate-800">{originalText}</p>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Điểm hiện tại
        </p>
      </div>
    );
  }

  return (
    <div className="text-right">
      <div className="flex items-center justify-end gap-2">
        <span className="text-sm font-bold text-slate-400 line-through">{originalText}</span>
        <span className="material-symbols-outlined text-[18px] text-emerald-500">arrow_upward</span>
        <span className="text-3xl font-black text-emerald-600">{newText}</span>
      </div>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
        Kết quả sau phúc khảo
      </p>
    </div>
  );
}

export default function AppealListCard({ appeal }) {
  const finalStatus = isAppealFinalStatus(appeal?.status);
  const reviewerName = getAppealReviewerName(appeal);
  const scoreInfo = useMemo(
    () => resolveAppealScores(appeal, appeal?.gradingDetail),
    [appeal],
  );

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="p-5 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-lg font-black leading-tight text-slate-900">
                {appeal?.examName || 'Bài thi cần phúc khảo'}
              </h3>
              <AppealStatusBadge status={appeal?.status} />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <span>Mã yêu cầu: {appeal?.appealCode || '—'}</span>
              <span>Ngày gửi: {formatDateTime(appeal?.createdAt)}</span>
              {appeal?.semester ? <span>{appeal.semester}</span> : null}
            </div>
          </div>

          <ScorePanel scoreInfo={scoreInfo} />
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1 text-sm text-slate-600">
              <p>
                Điểm cũ:{' '}
                <span
                  className={scoreInfo.newScore != null ? 'font-bold text-slate-400 line-through' : 'font-bold text-slate-800'}
                >
                  {scoreInfo.originalScore != null ? formatScore(scoreInfo.originalScore) : '—'}
                </span>
              </p>
              <p>
                Điểm mới:{' '}
                <span className={`font-bold ${scoreInfo.newScore != null ? 'text-emerald-600' : 'text-slate-800'}`}>
                  {scoreInfo.newScore != null ? formatScore(scoreInfo.newScore) : '—'}
                </span>
              </p>
            </div>

            <div className="space-y-1 text-sm text-slate-600 xl:text-right">
              <p>
                Giảng viên:{' '}
                <span className="font-semibold text-slate-800">{reviewerName || 'Chưa phân công'}</span>
              </p>
              <p>
                Hoàn tất:{' '}
                <span className="font-semibold text-slate-800">{formatDateTime(appeal?.completedAt)}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-4">
          <AppealProgressTimeline status={appeal?.status} />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5 text-sm text-slate-500">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            {appeal?.submissionId ? (
              <Link
                to={`/student/results/${appeal.submissionId}`}
                state={{ appealId: appeal?.appealId, fromAppeal: true }}
                className="font-semibold text-[#F37021] transition-colors hover:text-orange-500"
              >
                Xem kết quả bài nộp
              </Link>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={`/student/appeals/${appeal?.appealId}`}
              state={{ appeal }}
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 px-4 font-bold text-slate-700 transition-colors hover:border-[#F37021] hover:text-[#F37021]"
            >
              Xem chi tiết đơn
            </Link>
            {finalStatus ? (
              <span className="inline-flex h-10 items-center rounded-2xl bg-emerald-50 px-4 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                Đơn đã xử lý xong
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
