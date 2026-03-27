import React, { useEffect, useState, useCallback } from 'react';
import { message } from 'antd';
import examApi from '../../services/examApi';
import blockApi from '../../services/blockApi';
import gradingApi from '../../services/gradingApi';
import UpdateBlockModal from './UpdateBlockModal.jsx';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
}

function fmtTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString('vi-VN', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
}

function getBlockScheduleLockMessage(block) {
  const now = Date.now();

  if (block?.endTime) {
    const end = new Date(block.endTime);
    if (!Number.isNaN(end.getTime()) && now > end.getTime()) {
      return 'Kì thi đã qua không được chỉnh sửa thời gian ca thi';
    }
  }

  if (block?.startTime) {
    const start = new Date(block.startTime);
    if (!Number.isNaN(start.getTime())) {
      const lockAt = start.getTime() - (7 * 24 * 60 * 60 * 1000);
      if (now >= lockAt) {
        return 'Không thể chỉnh sửa lịch trong vòng 7 ngày trước khi ca thi bắt đầu.';
      }
    }
  }

  return '';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BlockDetailPage({ examId, blockId, onBack, onOpenUploadPaper, onOpenSubmissions }) {
  const [exam,           setExam]           = useState(null);
  const [block,          setBlock]          = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [editingBlock,   setEditingBlock]   = useState(null);  // mở UpdateBlockModal
  const [subStats,       setSubStats]       = useState(null);  // { total, graded }

  const handleClickUpdateSchedule = () => {
    const lockMessage = getBlockScheduleLockMessage(block);
    if (lockMessage) {
      message.warning(lockMessage);
      return;
    }
    setEditingBlock(block);
  };

  const loadData = useCallback(async () => {
    if (!examId || !blockId) return;
    setLoading(true);
    setError('');
    try {
      const [examRes, blockRes] = await Promise.all([
        examApi.getById(examId),
        blockApi.getById(examId, blockId),
      ]);
      setExam(examRes?.data  ?? examRes  ?? null);
      setBlock(blockRes?.data ?? blockRes ?? null);

      // Fetch tiến độ nộp bài — dùng progress endpoint (có totalSubmissions kể cả chưa chấm)
      try {
        const pRes = await gradingApi.getProgress(examId, blockId);
        const prog = pRes?.data ?? pRes;
        setSubStats({
          total:   prog?.totalSubmissions ?? 0,
          graded:  prog?.gradedCount      ?? 0,
          grading: prog?.gradingCount     ?? 0,
          pending: prog?.pendingCount     ?? 0,
          pct:     prog?.progressPercent  ?? 0,
        });
      } catch {
        // Chưa có grading session nào → giữ null
        setSubStats(null);
      }
    } catch {
      setError('Không thể tải thông tin block. Vui lòng thử lại.');
      setExam(null);
      setBlock(null);
    } finally {
      setLoading(false);
    }
  }, [examId, blockId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Skeleton ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8 animate-pulse space-y-4">
        <div className="h-8 w-52 bg-slate-200 rounded-lg" />
        <div className="h-52 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8 space-y-4">
        <button type="button" onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-[#F37120] transition-colors group">
          <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
          <span className="text-sm font-bold">Quay lại</span>
        </button>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
          <button onClick={loadData} className="ml-auto text-sm underline hover:no-underline">Thử lại</button>
        </div>
      </div>
    );
  }

  const hasSchedule = !!block?.examDate;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Edit modal — rendered above everything */}
      {editingBlock && (
        <UpdateBlockModal
          block={editingBlock}
          onClose={() => setEditingBlock(null)}
          onSuccess={() => {
            setEditingBlock(null);
            loadData(); // reload để hiển thị schedule mới
          }}
        />
      )}

      <div className="relative max-w-6xl mx-auto px-6 sm:px-8 py-6 sm:py-8 space-y-6">
        <div className="pointer-events-none absolute -top-16 -left-16 w-72 h-72 rounded-full bg-orange-100/50 blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 -right-16 w-72 h-72 rounded-full bg-amber-100/40 blur-3xl" />

        {/* Back button */}
        <button type="button" onClick={onBack}
          className="relative z-10 flex items-center gap-2 text-slate-500 hover:text-[#F37120] transition-colors group font-semibold">
          <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
          <span className="text-sm font-bold">Quay lại chi tiết kỳ thi</span>
        </button>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ─── Left column ─── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Block info card */}
            <div className="bg-white rounded-3xl shadow-[0_18px_45px_rgba(15,23,42,0.10)] border border-orange-100/70 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-[#F37120] via-amber-400 to-[#F37120]" />
              <div className="p-6 flex flex-col md:flex-row gap-6">

                {/* Icon */}
                <div className="w-full md:w-28 h-28 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-dashed border-orange-200
                                flex flex-col items-center justify-center shrink-0 shadow-inner">
                  <span className="material-symbols-outlined text-[#F37120] text-4xl mb-1">layers</span>
                  <span className="text-[10px] font-mono text-orange-400 uppercase">Block</span>
                </div>

                {/* Info */}
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                        ${hasSchedule ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {hasSchedule ? 'Đã có lịch' : 'Chưa có lịch'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                        ${block?.hasPaper ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                        {block?.hasPaper ? 'đã Có đề thi' : 'Chưa có đề'}
                      </span>
                      <span className="text-slate-400 text-xs">• {exam?.academicYear || '—'}</span>
                    </div>
                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      {block?.name || 'Block'} — {exam?.name || 'Kỳ thi'}
                    </h3>
                    {block?.description && (
                      <p className="text-sm text-slate-500 mt-1">{block.description}</p>
                    )}
                  </div>

                  {/* Schedule info */}
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">event</span>
                      <span className="font-medium text-slate-700">{fmtDate(block?.examDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">schedule</span>
                      <span>{fmtTime(block?.startTime)} — {fmtTime(block?.endTime)}</span>
                    </div>
                   
                  </div>

                  {/* ─── Action buttons — 3 nút nằm ngang ─── */}
                  <div className="pt-2 flex items-center gap-2 flex-wrap">

                    {/* Upload đề thi */}
                    <button
                      type="button"
                      onClick={() => onOpenUploadPaper?.(blockId)}
                      className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl border border-[#F37120]
                                 text-[#F37120] text-sm font-bold hover:bg-orange-50 transition-all shadow-sm hover:shadow"
                    >
                      <span className="material-symbols-outlined text-base">upload_file</span>
                      {block?.hasPaper ? 'Upload lại đề' : 'Upload đề thi'}
                    </button>

                    {/* Chỉnh sửa lịch thi */}
                    <button
                      type="button"
                      onClick={handleClickUpdateSchedule}
                      className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl border border-slate-300
                                 text-slate-600 text-sm font-bold hover:bg-slate-50 hover:border-slate-400
                                 transition-all shadow-sm hover:shadow"
                    >
                      <span className="material-symbols-outlined text-base">edit_calendar</span>
                      Chỉnh sửa lịch
                    </button>

                    {/* Xem thống kê */}
                    <button
                      type="button"
                      className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl border border-slate-300 text-slate-600 text-sm font-bold hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm hover:shadow"
                    >
                      <span className="material-symbols-outlined text-base">bar_chart</span>
                      Thống kê
                    </button>

                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ─── Right sidebar ─── */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-[0_16px_40px_rgba(15,23,42,0.10)] border border-orange-100/60 p-6 flex flex-col gap-6 sticky top-24">

              {/* Submission stats — real data from grading/results */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Tiến độ nộp bài</h4>
                {subStats === null ? (
                  // Chưa có dữ liệu
                  <div className="flex flex-col gap-2">
                    <div className="flex items-end justify-between">
                      <div className="flex flex-col">
                        <span className="text-4xl font-black text-slate-300 leading-none">—</span>
                        <span className="text-xs text-slate-400">Chưa có dữ liệu</span>
                      </div>
                      <span className="text-2xl font-extrabold text-slate-300">—%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-200 w-0 rounded-full" />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {/* Tổng bài nộp + % đã chấm */}
                    <div className="flex items-end justify-between">
                      <div className="flex flex-col">
                        <span className="text-4xl font-black text-slate-900 leading-none">{subStats.total}</span>
                        <span className="text-xs text-slate-500 mt-0.5">Bài đã nộp</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-2xl font-extrabold ${subStats.pct === 100 ? 'text-emerald-500' : subStats.pct > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                          {subStats.pct}%
                        </span>
                        <p className="text-[10px] text-slate-400">đã chấm xong</p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${subStats.pct === 100 ? 'bg-emerald-500' : 'bg-amber-400'}`}
                        style={{ width: `${subStats.pct}%` }}
                      />
                    </div>
                    {/* Chi tiết 3 trạng thái */}
                    <div className="flex flex-col gap-1 text-xs text-slate-500">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Đã chấm xong:
                        </span>
                        <span className="font-bold text-slate-700">{subStats.graded}</span>
                      </div>
                      {subStats.grading > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            Đang chấm:
                          </span>
                          <span className="font-bold text-slate-700">{subStats.grading}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-slate-200" />
                          Chờ chấm:
                        </span>
                        <span className="font-bold text-slate-700">{subStats.pending}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => onOpenSubmissions?.(blockId)}
                  className="w-full bg-gradient-to-r from-[#F37120] to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white font-bold py-3
                                   rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/25 active:scale-95">
                  <span className="material-symbols-outlined">list_alt</span>
                  Xem danh sách bài nộp
                </button>
                <button
                  onClick={loadData}
                  className="w-full border-2 border-slate-100 hover:bg-slate-50 text-slate-600 font-bold py-3
                             rounded-xl flex items-center justify-center gap-2 transition-all">
                  <span className="material-symbols-outlined">refresh</span>
                  Làm mới dữ liệu
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
