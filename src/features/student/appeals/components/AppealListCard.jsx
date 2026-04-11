import React from 'react';
import { Link } from 'react-router-dom';
import AppealProgressTimeline from './AppealProgressTimeline';
import AppealStatusBadge from './AppealStatusBadge';
import {
  formatDateTime,
  getAppealScoreSummary,
  isAppealFinalStatus,
} from '../helpers/appealHelpers';

function ScorePanel({ appeal }) {
  const score = getAppealScoreSummary(appeal);

  if (score.variant === 'empty') {
    return (
      <div className="text-right">
        <p className="text-2xl font-black text-slate-400">—</p>
      </div>
    );
  }

  if (score.variant === 'single') {
    return (
      <div className="text-right">
        <p className="text-3xl font-black text-slate-800">{score.originalText}</p>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Điểm hiện tại
        </p>
      </div>
    );
  }

  return (
    <div className="text-right">
      <div className="flex items-center justify-end gap-2">
        <span className={`text-sm font-bold ${score.changed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
          {score.originalText}
        </span>
        <span className={`material-symbols-outlined text-[18px] ${score.changed ? 'text-emerald-500' : 'text-slate-300'}`}>
          {score.changed ? 'arrow_upward' : 'arrow_right_alt'}
        </span>
        <span className={`text-3xl font-black ${score.changed ? 'text-emerald-600' : 'text-slate-800'}`}>
          {score.newText}
        </span>
      </div>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
        Kết quả sau phúc khảo
      </p>
    </div>
  );
}

export default function AppealListCard({ appeal }) {
  const finalStatus = isAppealFinalStatus(appeal?.status);

  return (
    <article className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm border-l-4`}>
      <div className="p-6">
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

          <ScorePanel appeal={appeal} />
        </div>

        {!finalStatus && (
          <div className="border-t border-slate-100 pt-5">
            <AppealProgressTimeline status={appeal?.status} />
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Lý do phúc khảo</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {appeal?.reason || '—'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              {appeal?.lecturerComment ? 'Phản hồi giảng viên' : 'Thông tin xử lý'}
            </p>

            {appeal?.lecturerComment ? (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {appeal.lecturerComment}
              </p>
            ) : (
              <div className="mt-2 space-y-2 text-sm text-slate-600">
                <p>
                  Giảng viên phụ trách:{' '}
                  <span className="font-semibold text-slate-800">
                    {appeal?.assignedLecturerName || 'Chưa phân công'}
                  </span>
                </p>
                <p>
                  Hạn xử lý:{' '}
                  <span className="font-semibold text-slate-800">
                    {formatDateTime(appeal?.deadlineAt)}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5 text-sm text-slate-500">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <span>
              Điểm gốc: <span className="font-bold text-slate-800">{appeal?.originalScore ?? '—'}</span>
            </span>
            <span>
              Điểm mới: <span className="font-bold text-slate-800">{appeal?.newScore ?? '—'}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            {appeal?.submissionId ? (
              <Link
                to={`/student/results/${appeal.submissionId}`}
                className="font-semibold text-[#F37021] transition-colors hover:text-orange-500"
              >
                Xem bài nộp
              </Link>
            ) : null}
            {appeal?.assignedLecturerName ? (
              <span>Giảng viên: <span className="font-semibold text-slate-700">{appeal.assignedLecturerName}</span></span>
            ) : null}
            {appeal?.completedAt ? (
              <span>Hoàn tất: <span className="font-semibold text-slate-700">{formatDateTime(appeal.completedAt)}</span></span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
