import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { message } from 'antd';
import examApi from '../../services/examApi';
import blockApi from '../../services/blockApi';
import examPaperApi from '../../services/examPaperApi';
import gradingApi from '../../services/gradingApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_META = {
  ONGOING:   { label: 'Đang diễn ra', cls: 'bg-green-100 text-green-700' },
  UPCOMING:  { label: 'Sắp diễn ra',  cls: 'bg-blue-100 text-blue-700'  },
  COMPLETED: { label: 'Đã kết thúc',  cls: 'bg-slate-100 text-slate-600' },
};

function fmtDate(isoStr) {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
}

function fmtTime(isoStr) {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleTimeString('vi-VN', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
}

function sanitizeUiErrorMessage(message) {
  if (!message || typeof message !== 'string') return 'Có lỗi xảy ra. Vui lòng thử lại.';
  return message.replace(/\s*\([^)]*\)\.?\s*$/, '').trim();
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

// ─── Sub-components ────────────────────────────────────────────────────────────

function UpdateBlockModal({ block, onClose, onSuccess }) {
  const [examDate, setExamDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Điền dữ liệu block vào form
  useEffect(() => {
    if (!block) return;
    if (block.examDate) {
      setExamDate(block.examDate); // 'YYYY-MM-DD'
    }
    if (block.startTime) {
      const st = new Date(block.startTime);
      setStartTime(st.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    }
    if (block.endTime) {
      const et = new Date(block.endTime);
      setEndTime(et.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    }
  }, [block]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!examDate || !startTime || !endTime) {
      setError('Vui lòng nhập đầy đủ Ngày thi, Giờ bắt đầu và Giờ kết thúc');
      return;
    }
    // Ngày thi phải lớn hơn ngày hiện tại
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(examDate);
    if (selected <= today) {
      setError('Ngày thi phải lớn hơn ngày hiện tại');
      return;
    }
    // Giờ kết thúc phải lớn hơn giờ bắt đầu (so sánh chuỗi HH:mm, cùng ngày)
    if (endTime <= startTime) {
      setError('Giờ kết thúc phải lớn hơn giờ bắt đầu');
      return;
    }
    if (!block?.blockId || !block?.examId) {
      setError('Không xác định được block này. Vui lòng tải lại trang và thử lại.');
      return;
    }

    try {
      // Gửi đúng offset +07:00 (múi giờ Việt Nam) thay vì với toISOString() có thể trừ 7 tiếng và lưu sai
      const startIso = `${examDate}T${startTime}:00+07:00`;
      const endIso   = `${examDate}T${endTime}:00+07:00`;

      setSaving(true);
      setError('');
      await blockApi.update(block.examId, block.blockId, {
        examDate,
        startTime: startIso,
        endTime: endIso
      });
      onSuccess();
    } catch (err) {
      const rawMessage = err?.response?.data?.message || 'Cập nhật thất bại. Vui lòng kiểm tra lại thời gian.';
      setError(sanitizeUiErrorMessage(rawMessage));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-[0_20px_50px_rgba(15,23,42,0.25)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-orange-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#F37120]">edit_calendar</span>
            <h3 className="font-bold text-slate-800">Cập nhật {block?.name}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2 text-amber-800 text-sm">
            <span className="material-symbols-outlined text-[18px]">warning</span>
            <p>Lưu ý: Bạn không thể cập nhật giờ khi còn dưới 1 tuần trước ngày thi diễn ra. Vui lòng cân nhắc trước khi cập nhật.</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2 text-red-700 text-sm">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <p>{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-slate-400">event</span>
              Ngày thi
            </label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm font-medium text-slate-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-slate-400">schedule</span>
                Giờ bắt đầu
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm font-medium text-slate-700"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-slate-400">timer_off</span>
                Giờ kết thúc
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm font-medium text-slate-700"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 flex items-center justify-center min-w-[120px] text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-[#F37120] rounded-xl shadow-md hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SemesterBadge({ semester }) {
  if (!semester) return <span className="text-slate-500">—</span>;
  const prefix = semester.substring(0, 2).toUpperCase();

  let config = {
    color: 'bg-slate-100 text-slate-700 border-slate-200 shadow-slate-500/10',
    icon: 'calendar_month',
  };

  if (prefix === 'SP') {
    config = { color: 'bg-emerald-100 text-emerald-800 border-emerald-200 shadow-emerald-500/20', icon: 'local_florist' };
  } else if (prefix === 'SU') {
    config = { color: 'bg-amber-100 text-amber-800 border-amber-200 shadow-amber-500/20', icon: 'light_mode' };
  } else if (prefix === 'FA') {
    config = { color: 'bg-indigo-100 text-indigo-800 border-indigo-200 shadow-indigo-500/20', icon: 'eco' };
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border shadow-sm ${config.color}`}>
      <span className="material-symbols-outlined text-[14px]">{config.icon}</span>
      {semester}
    </div>
  );
}

function InfoItem({ label, value, accent, icon }) {
  return (
    <div className="flex flex-col justify-center p-3 rounded-xl bg-slate-50/50 border border-slate-100/50 hover:bg-slate-50 transition-colors">
      <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1">
        {icon && <span className="material-symbols-outlined text-[14px]">{icon}</span>}
        {label}
      </p>
      <p className={`text-[15px] font-bold ${accent ? 'text-[#F37120]' : 'text-slate-800'}`}>
        {value || '—'}
      </p>
    </div>
  );
}

/** Card thông tin một Block */
// blockSource = object thực từ API (luôn có blockId, name),
// block = cùng object (có thể null nếu không tìm được theo tên)
function BlockCard({ block, blockSource, fallbackName, loadingBlocks, onEdit, onOpenBlockDetail }) {
  // Dùng blockSource để get blockId khi cần mở modal (block có thể null nếu chưa có lịch)
  const editTarget = blockSource ?? block;
  const displayName = editTarget?.name || fallbackName || 'Block';
  // skeleton
  if (loadingBlocks) {
    return (
      <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-[0_10px_28px_rgba(15,23,42,0.06)] flex flex-col animate-pulse">
        <div className="h-5 w-24 bg-slate-200 rounded mb-6" />
        <div className="space-y-3 flex-1">
          <div className="h-4 bg-slate-100 rounded w-3/4" />
          <div className="h-4 bg-slate-100 rounded w-1/2" />
          <div className="h-4 bg-slate-100 rounded w-2/3" />
        </div>
      </div>
    );
  }

  // Chưa có lịch thi (examDate null)
  const hasSchedule = !!block?.examDate;

  return (
    <div className="bg-white border border-orange-100 rounded-2xl shadow-[0_10px_28px_rgba(15,23,42,0.06)] hover:shadow-[0_14px_34px_rgba(249,115,22,0.14)] transition-all duration-300 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#F37120] text-[18px]">layers</span>
          </div>
          <h4 className="text-base font-extrabold text-slate-800">{displayName}</h4>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold border ${hasSchedule ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
            {hasSchedule ? 'Đã có lịch' : 'Chưa có lịch'}
          </span>
          <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold border ${block?.hasPaper ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
            {block?.hasPaper ? 'Đã có đề thi' : 'Chưa có đề'}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 flex-1 space-y-4">
        {block?.description && (
          <p className="text-xs text-slate-500 leading-relaxed mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            {block.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <InfoItem icon="event" label="Ngày thi" value={block?.examDate ? fmtDate(block.examDate) : null} />
          <InfoItem icon="description" label="Đề thi" value={block?.hasPaper ? (block?.paperFileName || 'Đã tải lên') : 'Chưa tải lên'} />
          <InfoItem icon="schedule" label="Giờ bắt đầu" value={block?.startTime ? fmtTime(block.startTime) : null} />
          <InfoItem icon="timer_off" label="Giờ kết thúc" value={block?.endTime ? fmtTime(block.endTime) : null} />
          <InfoItem icon="upload_file" label="Số bài nộp" value={String(block?.submissionCount ?? 0)} />
          <InfoItem icon="fact_check" label="Số bài đã chấm" value={`${block?.gradedCount ?? 0}/${block?.submissionCount ?? 0}`} />
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 pb-5 flex gap-3">
        <button
          onClick={() => {
            const target = editTarget ?? { name: fallbackName };
            const lockMessage = getBlockScheduleLockMessage(target);
            if (lockMessage) {
              message.warning(lockMessage);
              return;
            }
            onEdit?.(target);
          }}
          className="flex-1 py-2.5 px-4 text-xs font-bold border border-orange-200 text-orange-600 bg-orange-50 rounded-xl hover:bg-orange-100 hover:border-orange-300 hover:-translate-y-0.5 transition-all flex justify-center items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">edit</span>
          Cập nhật
        </button>
        <button
          type="button"
          onClick={() => {
            const targetBlockId = editTarget?.blockId;
            if (targetBlockId) onOpenBlockDetail?.(targetBlockId);
          }}
          className="flex-1 py-2.5 px-4 text-xs font-bold border border-slate-200 text-slate-600 bg-white rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5 transition-all shadow-sm flex justify-center items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">visibility</span>
          Chi tiết
        </button>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="max-w-6xl mx-auto px-8 py-6 space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-slate-200 rounded-xl" />
      <div className="h-56 bg-slate-100 rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-slate-100 rounded-2xl" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function ExamDetailPage({ examId, onBack, onEdit, onOpenBlockDetail }) {
  const [exam, setExam]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  // Block state
  const [blocks, setBlocks]           = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);

  // Fetch exam detail
  useEffect(() => {
    if (!examId) return;
    setLoading(true);
    setError('');
    examApi.getById(examId)
      .then((res) => {
        const payload = res?.data ?? res;
        setExam(payload);
      })
      .catch((err) => {
        setError(
          err?.response?.data?.message ||
          'Không thể tải thông tin kỳ thi. Vui lòng thử lại.'
        );
      })
      .finally(() => setLoading(false));
  }, [examId]);

  // Fetch blocks after exam loaded
  const loadBlocks = async () => {
    if (!examId) { console.warn('[Block] examId is empty, skip'); return; }
    console.log('[Block] GET blocks for examId:', examId);
    setLoadingBlocks(true);
    try {
      const res = await blockApi.getByExam(examId);
      console.log('[Block] raw res:', res, '| isArray:', Array.isArray(res));
      const list = Array.isArray(res) ? res
                 : Array.isArray(res?.data) ? res.data
                 : [];
      console.log('[Block] parsed list length:', list.length, list);

      const listWithPaperNameAndStats = await Promise.all(
        list.map(async (b) => {
          if (!b?.blockId) return b;

          let paperFileName = b?.paperFileName ?? null;
          if (b?.hasPaper) {
            try {
              const paperRes = await examPaperApi.getByBlock(examId, b.blockId);
              const paper = paperRes?.data ?? paperRes;
              paperFileName = paper?.fileName || null;
            } catch {
              // keep null, do not fail whole list
            }
          }

          let submissionCount = 0;
          let gradedCount = 0;
          try {
            const progressRes = await gradingApi.getProgress(examId, b.blockId);
            const progress = progressRes?.data ?? progressRes;
            submissionCount = Number(progress?.totalSubmissions ?? 0);
            gradedCount = Number(progress?.gradedCount ?? 0);
          } catch {
            // keep default 0/0 when no grading progress yet
          }

          return {
            ...b,
            paperFileName,
            submissionCount,
            gradedCount,
          };
        })
      );

      listWithPaperNameAndStats.sort((a, b) => {
        const numA = parseInt((a.name || '').replace(/\D/g, ''), 10) || 0;
        const numB = parseInt((b.name || '').replace(/\D/g, ''), 10) || 0;
        return numB - numA;
      });
      setBlocks(listWithPaperNameAndStats);
    } catch (err) {
      console.error('[Block] error:', err?.response?.status, err?.response?.data, err?.message);
      setBlocks([]);
    } finally {
      setLoadingBlocks(false);
    }
  };

  useEffect(() => {
    loadBlocks();
  }, [examId]);

  // Handle Update Block modal
  const [editingBlock, setEditingBlock] = useState(null);

  function openDeleteConfirm() {
    setDeleteError('');
    setConfirmOpen(true);
  }

  function closeDeleteConfirm() {
    if (deleting) return;
    setConfirmOpen(false);
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError('');
    try {
      await examApi.delete(examId);
      setConfirmOpen(false);
      onBack?.();
    } catch (err) {
      setDeleteError(err?.response?.data?.message || 'Xóa thất bại. Vui lòng thử lại.');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-8 py-16 flex flex-col items-center gap-4 text-center">
        <span className="material-symbols-outlined text-5xl text-red-400">error</span>
        <p className="text-slate-700 font-semibold">{error}</p>
        <button
          onClick={onBack}
          className="mt-2 px-6 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium"
        >
          Quay lại
        </button>
      </div>
    );
  }

  if (!exam) return null;

  const statusMeta = STATUS_META[exam.status] ?? STATUS_META.UPCOMING;

  // Tìm Block 10 (bên trái) và Block 3 (bên phải)
  // Ưu tiên match theo tên có chứa số, fallback: blocks[0]/blocks[1]
  const block10 = blocks.find(b => /\b10\b/.test(b.name || ''))
               ?? blocks.find(b => !/\b3\b/.test(b.name || ''))
               ?? blocks[0]
               ?? null;
  const block3  = blocks.find(b => /\b3\b/.test(b.name || '') && !/10/.test(b.name || ''))
               ?? blocks.find(b => b !== block10)
               ?? blocks[1]
               ?? null;
  const displayPairs = loadingBlocks ? [null, null] : [block10, block3];

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-8 py-6 sm:py-8 space-y-6 sm:space-y-7">

      {/* ── Header actions ── */}
      <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-gradient-to-r from-white to-orange-50/40 shadow-[0_8px_24px_rgba(249,115,22,0.08)] px-4 sm:px-5 py-3.5">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-[#F37120] transition-colors font-semibold"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Quay lại
        </button>
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={onEdit}
            className="px-4 py-2.5 border border-[#F37120] bg-white text-[#F37120] rounded-xl text-sm font-bold hover:bg-orange-50 transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            Chỉnh sửa
          </button>
          <button
            onClick={openDeleteConfirm}
            disabled={deleting}
            className="px-4 py-2.5 border border-red-300 bg-white text-red-500 rounded-xl text-sm font-bold hover:bg-red-50 transition-all flex items-center gap-2 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            {deleting ? 'Đang xóa...' : 'Xóa'}
          </button>
        </div>
      </div>

      {/* ── Exam overview card ── */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-[0_14px_40px_rgba(15,23,42,0.08)] border border-orange-100/70 relative">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F37120] via-amber-400 to-[#F37120]" />
        
        <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-start">
          {/* Icon Box */}
          <div className="w-full md:w-32 h-32 rounded-2xl bg-gradient-to-br from-[#F37120]/10 to-orange-50 border border-orange-100/50 flex flex-col items-center justify-center shrink-0 shadow-inner group transition-all hover:bg-orange-50/80">
            <span className="material-symbols-outlined text-[#F37120] text-5xl group-hover:scale-110 transition-transform duration-300 ease-out drop-shadow-sm">inventory_2</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider border flex items-center gap-1.5 shadow-sm uppercase ${statusMeta.cls} ${statusMeta.cls.includes('bg-green') ? 'border-green-200' : statusMeta.cls.includes('bg-blue') ? 'border-blue-200' : 'border-slate-200'}`}>
                {exam.status === 'ONGOING' && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                {statusMeta.label}
              </span>
              
              <SemesterBadge semester={exam.semester} />
            </div>

            <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-3 truncate">{exam.name}</h3>

            {exam.description && (
              <p className="text-[13px] text-slate-500 mb-6 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100/60 shadow-sm">{exam.description}</p>
            )}

            <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 ${!exam.description && 'mt-6'}`}>
              <InfoItem icon="school" label="Năm học" value={exam.academicYear} />
              <InfoItem icon="calendar_today" label="Ngày bắt đầu" value={fmtDate(exam.startTime)} />
              <InfoItem icon="event" label="Ngày kết thúc" value={fmtDate(exam.endTime)} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Block section ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[#F37120]">layers</span>
          <h3 className="text-lg font-extrabold text-slate-800">Danh sách Block</h3>
          {!loadingBlocks && blocks.length > 0 && (
            <span className="text-xs bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full font-bold">
              {blocks.length} block
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[
            { label: 'Block 10', block: displayPairs[0], src: block10 },
            { label: 'Block 3',  block: displayPairs[1], src: block3  },
          ].map(({ label, block, src }) => (
            <BlockCard
              key={label}
              block={block}
              blockSource={src}
              fallbackName={label}
              loadingBlocks={loadingBlocks}
              onEdit={setEditingBlock}
              onOpenBlockDetail={onOpenBlockDetail}
            />
          ))}
        </div>
      </div>

      {/* ── Update Block modal ── (dùng Portal để tránh bị clip bởi overflow) */}
      {editingBlock && createPortal(
        <UpdateBlockModal
          block={editingBlock}
          onClose={() => setEditingBlock(null)}
          onSuccess={() => {
            setEditingBlock(null);
            loadBlocks();
          }}
        />,
        document.body
      )}

      {/* ── Delete confirm modal ── */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close confirm modal"
            onClick={closeDeleteConfirm}
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
          />
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-[0_20px_50px_rgba(15,23,42,0.25)] p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">warning</span>
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Xác nhận xóa kỳ thi</h4>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Bạn có chắc muốn xóa kỳ thi <span className="font-semibold">"{exam?.name}"</span>?<br />
                  Hành động này không thể hoàn tác.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-semibold disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors text-sm font-semibold disabled:opacity-70 min-w-[120px] shadow-sm"
              >
                {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
