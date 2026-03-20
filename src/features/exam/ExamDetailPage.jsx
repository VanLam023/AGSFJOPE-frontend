import React, { useEffect, useState } from 'react';
import examApi from '../../services/examApi';
import blockApi from '../../services/blockApi';

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
  });
}

function fmtTime(isoStr) {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleTimeString('vi-VN', {
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Sub-components ────────────────────────────────────────────────────────────

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
function BlockCard({ block, fallbackName, loadingBlocks }) {
  const displayName = block?.name || fallbackName || 'Block';
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
        <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold border ${
          hasSchedule
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-slate-50 text-slate-500 border-slate-200'
        }`}>
          {hasSchedule ? 'Đã có lịch' : 'Chưa có lịch'}
        </span>
      </div>

      {/* Body */}
      <div className="p-6 flex-1 space-y-3">
        {block?.description && (
          <p className="text-xs text-slate-500 leading-relaxed mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            {block.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <InfoItem icon="event" label="Ngày thi" value={block?.examDate ? fmtDate(block.examDate) : null} />
          <InfoItem icon="schedule" label="Bắt đầu nộp" value={block?.startTime ? fmtTime(block.startTime) : null} />
          <InfoItem icon="timer_off" label="Kết thúc nộp" value={block?.endTime ? fmtTime(block.endTime) : null} />
          <InfoItem icon="calendar_add_on" label="Tạo lúc" value={block?.createdAt ? fmtDate(block.createdAt) : null} />
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 pb-5 flex gap-3">
        <button
          className="flex-1 py-2.5 px-4 text-xs font-bold border border-slate-200 text-slate-400 bg-slate-50 rounded-xl cursor-not-allowed"
          disabled
        >
          Upload đề thi
        </button>
        <button
          className="flex-1 py-2.5 px-4 text-xs font-bold border border-slate-200 text-slate-400 bg-slate-50 rounded-xl cursor-not-allowed"
          disabled
        >
          Xem bài nộp
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

export default function ExamDetailPage({ examId, onBack, onEdit }) {
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
  useEffect(() => {
    if (!examId) return;
    setLoadingBlocks(true);
    blockApi.getByExam(examId)
      .then((res) => {
        // axiosClient interceptor trả res.data → đây là List<BlockResponse> trực tiếp từ backend
        // BlockController trả ResponseEntity<List<BlockResponse>> không wrap thêm
        const list = Array.isArray(res) ? res : [];
        // Sắp xếp: Block 10 trước, Block 3 sau (số lớn trước)
        list.sort((a, b) => {
          const numA = parseInt((a.name || '').replace(/\D/g, ''), 10) || 0;
          const numB = parseInt((b.name || '').replace(/\D/g, ''), 10) || 0;
          return numB - numA;
        });
        setBlocks(list);
      })
      .catch(() => setBlocks([]))
      .finally(() => setLoadingBlocks(false));
  }, [examId]);

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

  // Tìm đúng Block 10 (bên trái) và Block 3 (bên phải) theo tên
  const block10 = blocks.find(b => b.name === 'Block 10') ?? null;
  const block3  = blocks.find(b => b.name === 'Block 3')  ?? null;
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
            { label: 'Block 10', block: displayPairs[0] },
            { label: 'Block 3',  block: displayPairs[1] },
          ].map(({ label, block }) => (
            <BlockCard
              key={label}
              block={block}
              fallbackName={label}
              loadingBlocks={loadingBlocks}
            />
          ))}
        </div>
      </div>

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
