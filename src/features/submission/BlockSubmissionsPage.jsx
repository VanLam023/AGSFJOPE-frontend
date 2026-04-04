import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import examApi from '../../services/examApi';
import blockApi from '../../services/blockApi';
import submissionApi from '../../services/submissionApi';
import gradingApi from '../../services/gradingApi';

function fmtDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
}

function fmtSize(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function getSubmissionStatusBadge(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'GRADING') return { label: 'Đang chấm', cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20' };
  if (s === 'GRADED') return { label: 'Đã chấm', cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' };
  return { label: 'Chưa chấm', cls: 'bg-sky-50 text-sky-700 ring-1 ring-sky-600/20' };
}

function getResultBadge(gradingStatus) {
  const s = String(gradingStatus || '').toUpperCase();
  if (s === 'PASS') return { label: 'Đạt', cls: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-600/30 font-bold' };
  if (s === 'FAIL') return { label: 'Không đạt', cls: 'bg-red-50 text-red-700 ring-1 ring-red-600/20 font-bold' };
  return null;
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

  if (status === 400) return 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại dữ liệu gửi lên.';
  if (status === 401) return 'Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập.';
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
  if (status === 404) return 'Không tìm thấy dữ liệu tương ứng hoặc API chưa sẵn sàng.';
  if (status === 409) return 'Thao tác đang xung đột với trạng thái hiện tại của hệ thống.';
  if (status >= 500) return 'Máy chủ đang gặp lỗi. Vui lòng thử lại sau.';

  return error?.message || fallback;
}

function normalizeSubmissionsPayload(raw) {
  if (!raw) return { data: [], pagination: {}, stats: {} };
  const lv1 = raw?.data;
  const lv2 = raw?.data?.data;

  const list =
    (Array.isArray(raw?.data) && raw.data) ||
    (Array.isArray(lv1?.data) && lv1.data) ||
    (Array.isArray(lv2?.data) && lv2.data) ||
    (Array.isArray(lv1) && lv1) ||
    (Array.isArray(lv2) && lv2) ||
    [];

  return {
    data: list,
    pagination: raw?.pagination ?? lv1?.pagination ?? lv2?.pagination ?? {},
    stats: raw?.stats ?? lv1?.stats ?? lv2?.stats ?? {},
  };
}

function mapGradingResultsFallback(items = []) {
  return items.map((it) => ({
    submissionId: it?.submissionId,
    studentId: it?.studentId,
    studentName: it?.studentName,
    studentCode: it?.studentCode,
    studentEmail: it?.studentEmail ?? null,
    submittedAt: it?.submittedAt ?? null,
    fileSizeBytes: it?.fileSizeBytes ?? null,
    submissionStatus: it?.submissionStatus ?? 'GRADED',
    gradingResultId: it?.gradingResultId ?? null,
    gradingStatus: it?.status ?? it?.gradingStatus ?? null,
    totalScore: it?.totalScore ?? null,
    maxScore: it?.maxScore ?? null,
    gradedAt: it?.gradedAt ?? null,
  }));
}

function canOpenSubmissionDetail(item) {
  return Boolean(item?.gradingResultId) || String(item?.submissionStatus || '').toUpperCase() === 'GRADED';
}

function slugifyFilePart(value, fallback = 'file') {
  const base = String(value || '').trim().toLowerCase();
  const normalized = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || fallback;
}

function isBrowserFileDownloadSupported() {
  return typeof window !== 'undefined' && typeof document !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';
}

function saveBlobFile(blobLike, fileName) {
  if (!isBrowserFileDownloadSupported()) return false;
  const blob = blobLike instanceof Blob ? blobLike : new Blob([blobLike]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return true;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'SUBMITTED', label: 'Chưa chấm' },
  { value: 'GRADING', label: 'Đang chấm' },
  { value: 'GRADED', label: 'Đã chấm' },
];
const STAT_CARDS = [
  {
    key: 'total',
    label: 'Tổng số bài nộp',
    icon: 'assignment',
    bg: 'from-slate-50 via-white to-slate-50',
    iconBg: 'bg-slate-100 text-slate-600',
    blob: 'bg-slate-200/40',
  },
  {
    key: 'submitted',
    label: 'Chưa chấm',
    icon: 'schedule',
    bg: 'from-sky-50 via-white to-blue-50/70',
    iconBg: 'bg-sky-100 text-sky-600',
    blob: 'bg-sky-200/40',
  },
  {
    key: 'grading',
    label: 'Đang chấm',
    icon: 'hourglass_top',
    bg: 'from-amber-50 via-white to-orange-50/70',
    iconBg: 'bg-amber-100 text-amber-600',
    blob: 'bg-amber-200/40',
  },
  {
    key: 'graded',
    label: 'Đã chấm',
    icon: 'task_alt',
    bg: 'from-emerald-50/80 via-white to-green-50/70',
    iconBg: 'bg-emerald-100 text-emerald-600',
    blob: 'bg-emerald-200/40',
  },
];

const PageBackdrop = React.memo(function PageBackdrop() {
  return (
    <>
      <div className="pointer-events-none absolute top-10 -left-14 w-56 h-56 rounded-full bg-orange-100/70 blur-3xl" />
      <div className="pointer-events-none absolute top-1/4 -right-12 w-56 h-56 rounded-full bg-amber-100/50 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 left-1/3 w-48 h-48 rounded-full bg-sky-100/40 blur-3xl" />
    </>
  );
});

const BackSection = React.memo(function BackSection({ onBack }) {
  return (
    <div className="flex items-center gap-4 relative z-10 mb-8">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-slate-900/5 backdrop-blur-md border border-slate-900/10 text-slate-600 hover:text-slate-900 hover:bg-slate-900/10 hover:border-slate-900/20 transition-all shadow-sm hover:shadow active:scale-95 group font-medium"
      >
        <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
      </button>
      <span className="text-[13px] font-bold text-slate-500 tracking-[0.1em] uppercase">Quay lại Block Details</span>
    </div>
  );
});

const HeaderSection = React.memo(function HeaderSection({ loading, total, examName, blockName, onExportCsv, onExportGradeSheet, onRefresh, exporting }) {
  const isAnyExporting = exporting.gradeSheet;

  return (
    <div className="relative z-10 p-1 flex flex-col xl:flex-row items-center justify-between gap-6 overflow-visible mb-6">
      <div className="relative w-full xl:w-auto text-center xl:text-left">
        <div className="inline-flex items-center justify-center xl:justify-start gap-2 px-3 py-1.5 rounded-full bg-slate-100/80 backdrop-blur-sm shadow-inner text-slate-600 border border-slate-200/60 text-xs font-bold uppercase tracking-widest mb-4 mx-auto xl:mx-0">
          <span className="relative flex h-2.5 w-2.5 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500"></span>
          </span>
          <span>Management Module</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 mb-3 drop-shadow-sm flex items-center justify-center xl:justify-start gap-3">
          Quản lý bài nộp
          {!loading && (
            <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-2xl bg-slate-900 text-white text-xl font-bold shadow-lg shadow-slate-900/20 translate-y-[-2px]">
              {total}
            </span>
          )}
        </h1>

        <p className="text-sm font-semibold text-slate-500 flex items-center justify-center xl:justify-start gap-2.5">
          <span className="material-symbols-outlined text-[18px]">folder_copy</span>
          <span className="text-slate-700">{examName || '—'}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
          <span className="text-slate-700">{blockName || '—'}</span>
        </p>
      </div>

      <div className="flex sm:flex-row flex-col items-center gap-3 relative z-10 w-full xl:w-auto">
        <button
          type="button"
          onClick={onExportCsv}
          disabled={isAnyExporting}
          className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white/70 backdrop-blur-md rounded-2xl text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-900/5 hover:bg-white hover:shadow-md hover:ring-slate-900/10 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
        >
          <span className="material-symbols-outlined text-[20px] text-emerald-600">download</span>
          Xuất file CSV
        </button>

        <button
          type="button"
          onClick={onExportGradeSheet}
          disabled={isAnyExporting}
          className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white/70 backdrop-blur-md rounded-2xl text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-900/5 hover:bg-white hover:shadow-md hover:ring-slate-900/10 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
        >
          <span className="material-symbols-outlined text-[20px] text-violet-600">table_view</span>
          {exporting.gradeSheet ? 'Đang xuất bảng điểm...' : 'Xuất bảng điểm'}
        </button>


        <button
          type="button"
          onClick={onRefresh}
          className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white/70 backdrop-blur-md rounded-2xl text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-900/5 hover:bg-white hover:shadow-md hover:ring-slate-900/10 transition-all hover:-translate-y-0.5 group"
          title="Làm mới"
        >
          <span className="material-symbols-outlined text-[20px] text-blue-600 group-hover:rotate-180 transition-transform duration-700">refresh</span>
          Làm mới bộ nhớ
        </button>
      </div>
    </div>
  );
});

const StatsGrid = React.memo(function StatsGrid({ stats }) {
  return (
    <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {STAT_CARDS.map((card) => (
        <div
          key={card.key}
          className="group relative overflow-hidden bg-white/60 backdrop-blur-xl p-6 rounded-[28px] shadow-sm ring-1 ring-slate-900/5 hover:shadow-xl hover:ring-slate-900/10 transition-all duration-500 min-h-[140px] isolate flex flex-col justify-between hover:-translate-y-1"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${card.bg} opacity-40 group-hover:opacity-60 transition-opacity duration-500 mix-blend-multiply rounded-[28px]`} />
          <div className={`absolute -right-8 -bottom-8 w-40 h-40 rounded-full ${card.blob} blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-700 ease-out z-[-1]`} />

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-14 h-14 rounded-2xl ${card.iconBg} flex items-center justify-center shadow-inner border border-white/50 backdrop-blur-md`}>
                <span className="material-symbols-outlined text-[28px]">{card.icon}</span>
              </div>
              <div className="text-right">
                <h3 className="text-5xl font-black text-slate-900 tracking-tighter drop-shadow-sm">{stats?.[card.key] ?? 0}</h3>
              </div>
            </div>
            <p className="text-slate-500 text-sm font-bold tracking-wide uppercase">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
});

const FilterBar = React.memo(function FilterBar({
  searchInput,
  onSearchInput,
  statusFilter,
  onStatusChange,
  size,
  onSizeChange,
  isGradingInProgress,
  isTriggering,
  loading,
  selectedCount,
  progressDoneDisplay,
  progressTotalDisplay,
  onTriggerGrading,
  onStopGrading,
  isStopping,
}) {
  return (
    <div className="relative z-10 bg-white/80 backdrop-blur-xl p-2 rounded-2xl border border-white shadow-sm ring-1 ring-slate-900/5 flex flex-col md:flex-row gap-2">
      <div className="flex-1 flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            value={searchInput}
            onChange={(e) => onSearchInput(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-transparent rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
            placeholder="Nhập tên hoặc mã số sinh viên..."
            type="text"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="h-12 pl-4 pr-10 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-transparent rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all cursor-pointer min-w-[170px]"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select
            value={size}
            onChange={(e) => onSizeChange(e.target.value)}
            className="h-12 pl-4 pr-10 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-transparent rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all cursor-pointer min-w-[140px]"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n} dòng / trang</option>
            ))}
          </select>
        </div>
      </div>

      <div className="shrink-0">
        {!isGradingInProgress ? (
          <button
            type="button"
            onClick={onTriggerGrading}
            disabled={isTriggering || loading}
            className="w-full h-12 inline-flex items-center justify-center gap-2 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl text-sm font-extrabold shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span className="material-symbols-outlined text-[20px]">play_circle</span>
            <span>{isTriggering ? 'Đang gửi...' : (selectedCount > 0 ? `Chấm ${selectedCount} bài chọn` : 'Chấm tất cả')}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 h-12">
            <span className="flex items-center gap-2 px-4 h-full bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              {progressDoneDisplay} / {progressTotalDisplay}
            </span>
            <button
              type="button"
              onClick={onStopGrading}
              disabled={isStopping}
              className="h-12 inline-flex items-center justify-center gap-2 px-6 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl text-sm font-extrabold shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              <span className="material-symbols-outlined text-[20px]">stop_circle</span>
              <span>{isStopping ? 'Đang dừng...' : 'Dừng chấm'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

const LoadingState = React.memo(function LoadingState() {
  return (
    <div className="relative z-10 bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-sm ring-1 ring-slate-900/5 p-16 text-center text-slate-500 flex flex-col items-center justify-center min-h-[400px]">
      <div className="relative w-12 h-12 mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-slate-100 mix-blend-multiply" />
        <div className="absolute inset-0 rounded-full border-4 border-[#F37120] border-t-transparent animate-spin" />
      </div>
      <p className="font-bold text-slate-700 text-lg mb-1">Đang tải dữ liệu...</p>
      <p className="text-sm">Vui lòng chờ trong giây lát</p>
    </div>
  );
});

const ErrorState = React.memo(function ErrorState({ error }) {
  return (
    <div className="relative z-10 bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 flex items-start gap-3 shadow-sm">
      <span className="material-symbols-outlined text-red-500 mt-0.5">error</span>
      <div>
        <h4 className="font-bold">Đã xảy ra lỗi</h4>
        <p className="text-sm mt-1">{error}</p>
      </div>
    </div>
  );
});

const TableSectionHeader = React.memo(function TableSectionHeader({ pagination }) {
  return (
    <div className="px-8 py-6 border-b border-slate-200/50 flex flex-col sm:flex-row items-center justify-between bg-white/50">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center text-[#F37120] shadow-sm ring-1 ring-orange-200/50">
          <span className="material-symbols-outlined text-[24px]">view_list</span>
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Danh sách bài nộp</h3>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            {pagination.totalElements > 0
              ? `Trang ${pagination.page + 1} của ${pagination.totalPages} — Tổng ${pagination.totalElements} mục`
              : 'Không tìm thấy mục nào'}
          </p>
        </div>
      </div>
    </div>
  );
});

const SubmissionTableRow = React.memo(function SubmissionTableRow({
  item,
  rowNum,
  checked,
  selectable,
  disabled,
  onToggleSelect,
  onRegrade,
  onOpenDetail,
}) {
  const statusBadge = getSubmissionStatusBadge(item?.submissionStatus);
  const resultBadge = getResultBadge(item?.gradingStatus);
  const hasScore = item?.totalScore != null;
  const canOpen = canOpenSubmissionDetail(item);

  return (
    <tr className="group bg-white hover:bg-slate-50/70 transition-all duration-300 rounded-2xl shadow-sm ring-1 ring-slate-200/50 hover:ring-orange-200 hover:shadow-lg hover:-translate-y-[2px] cursor-default">
      <td className="px-4 py-4 text-center rounded-l-2xl transition-colors">
        <input
          type="checkbox"
          checked={checked}
          disabled={!selectable || disabled}
          onChange={(e) => onToggleSelect(item?.submissionId, e.target.checked)}
          className="w-4.5 h-4.5 rounded border-slate-300 text-[#F37120] focus:ring-[#F37120] transition-colors cursor-pointer disabled:opacity-40"
        />
      </td>

      <td className="px-3 py-4 text-center text-[13px] font-black text-slate-400 transition-colors group-hover:text-[#F37120]">{rowNum}</td>

      <td className="px-3 py-4 transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center shrink-0 border border-indigo-100 shadow-inner">
            <span className="text-sm font-black text-indigo-600">{String(item?.studentName || '—').charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[15px] font-black text-slate-800 truncate" title={item?.studentName ?? '—'}>{item?.studentName ?? '—'}</span>
            {item?.studentEmail && (
              <span className="text-xs font-semibold text-slate-500 truncate mt-0.5" title={item.studentEmail}>{item.studentEmail}</span>
            )}
          </div>
        </div>
      </td>

      <td className="px-3 py-4 transition-colors">
        <span className="inline-flex px-2.5 py-1.5 rounded-lg bg-slate-100/80 text-xs font-mono font-bold text-slate-600 shadow-sm border border-slate-200/50">
          {item?.studentCode ?? 'N/A'}
        </span>
      </td>

      <td className="px-3 py-4 transition-colors">
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 truncate bg-slate-50 px-2 py-1 rounded">
            <span className="material-symbols-outlined text-[15px] text-[#F37120] shrink-0">schedule</span>
            <span className="truncate">{fmtDateTime(item?.submittedAt)}</span>
          </span>
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 truncate bg-slate-50 px-2 py-1 rounded">
            <span className="material-symbols-outlined text-[15px] text-emerald-500 shrink-0">description</span>
            <span className="truncate">{fmtSize(item?.fileSizeBytes)}</span>
          </span>
        </div>
      </td>

      <td className="px-3 py-4 text-center transition-colors">
        <span className={`inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs font-bold ${statusBadge.cls}`}>
          {statusBadge.label}
        </span>
      </td>

      <td className="px-3 py-4 text-center transition-colors">
        {hasScore ? (
          <div className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-black text-sm">
            <span>{Number(item.totalScore).toFixed(2)}</span>
            <span className="text-slate-400 font-bold">/</span>
            <span className="text-slate-500">{Number(item.maxScore || 10).toFixed(0)}</span>
          </div>
        ) : (
          <span className="text-slate-400 font-bold">—</span>
        )}
      </td>

      <td className="px-3 py-4 text-center transition-colors">
        {resultBadge ? (
          <span className={`inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs ${resultBadge.cls}`}>
            {resultBadge.label}
          </span>
        ) : (
          <span className="text-slate-400 font-bold">—</span>
        )}
      </td>

      <td className="px-4 py-4 transition-colors rounded-r-2xl">
        <div className="flex items-center justify-center gap-2 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity duration-300">
          <button
            type="button"
            title="Chấm lại bài này"
            disabled={disabled}
            onClick={() => onRegrade(item)}
            className="flex items-center justify-center w-10 h-10 text-slate-400 hover:text-orange-600 hover:bg-orange-100 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-slate-50 shadow-sm border border-slate-200 hover:shadow-orange-200/50 hover:scale-105 active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">sync</span>
          </button>

          <button
            type="button"
            title={canOpen ? 'Xem chi tiết' : 'Bài này chưa có kết quả chấm'}
            disabled={!canOpen}
            onClick={() => onOpenDetail(item)}
            className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all bg-slate-50 shadow-sm border border-slate-200 ${canOpen ? 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 hover:shadow-indigo-200/50 hover:scale-105 active:scale-95' : 'text-slate-300 cursor-not-allowed opacity-50'}`}
          >
            <span className="material-symbols-outlined text-[20px]">visibility</span>
          </button>
        </div>
      </td>
    </tr>
  );
});

const EmptyTableState = React.memo(function EmptyTableState() {
  return (
    <tr>
      <td colSpan={9} className="px-6 py-14 text-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
            <span className="material-symbols-outlined text-[28px]">inbox</span>
          </div>
          <div>
            <p className="text-base font-bold text-slate-700">Không có bài nộp phù hợp</p>
            <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc làm mới dữ liệu.</p>
          </div>
        </div>
      </td>
    </tr>
  );
});

const PaginationBar = React.memo(function PaginationBar({ totalElements, pageNumbers, currentPage, onPageChange }) {
  if (!totalElements || pageNumbers.length === 0) return null;

  return (
    <div className="px-6 pb-6 pt-2 flex flex-wrap items-center justify-center gap-2 border-t border-slate-200/50 bg-white/40">
      {pageNumbers.map((item, idx) => (
        item === '...'
          ? <span key={`ellipsis-${idx}`} className="px-3 py-2 text-sm font-bold text-slate-400">...</span>
          : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              className={`min-w-[42px] h-[42px] px-3 rounded-xl text-sm font-bold transition-all border ${item === currentPage ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300 hover:text-orange-600 hover:-translate-y-0.5'}`}
            >
              {item + 1}
            </button>
          )
      ))}
    </div>
  );
});

export default function BlockSubmissionsPage({ examId, blockId, onBack }) {
  const navigate = useNavigate();
  const { examId: routeExamId, blockId: routeBlockId } = useParams();
  const activeExamId = examId || routeExamId;
  const activeBlockId = blockId || routeBlockId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exam, setExam] = useState(null);
  const [block, setBlock] = useState(null);
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ total: 0, submitted: 0, grading: 0, graded: 0 });
  const [pagination, setPagination] = useState({ page: 0, size: 20, totalElements: 0, totalPages: 0 });
  const [progress, setProgress] = useState(null);
  const [optimisticRun, setOptimisticRun] = useState(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [exporting, setExporting] = useState({ gradeSheet: false });
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const debounceRef = useRef(null);
  const tableSectionRef = useRef(null);
  const shouldScrollAfterLoadRef = useRef(false);
  const wasGradingRef = useRef(false);

  const handleBack = useCallback(() => {
    if (typeof onBack === 'function') {
      onBack();
      return;
    }
    navigate(-1);
  }, [navigate, onBack]);

  const scrollToTableTop = useCallback(() => {
    const node = tableSectionRef.current;
    if (!node) return;
    const top = node.getBoundingClientRect().top + window.scrollY - 110;
    window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
  }, []);

  const loadMeta = useCallback(async () => {
    if (!activeExamId || !activeBlockId) return;

    const [examMeta, blockMeta] = await Promise.allSettled([
      examApi.getById(activeExamId),
      blockApi.getById(activeExamId, activeBlockId),
    ]);

    if (examMeta.status === 'fulfilled') {
      setExam(examMeta.value?.data ?? examMeta.value ?? null);
    } else {
      console.warn('[BlockSubmissionsPage] exam metadata load failed:', examMeta.reason);
    }

    if (blockMeta.status === 'fulfilled') {
      setBlock(blockMeta.value?.data ?? blockMeta.value ?? null);
    } else {
      console.warn('[BlockSubmissionsPage] block metadata load failed:', blockMeta.reason);
    }
  }, [activeExamId, activeBlockId]);

  const loadProgress = useCallback(async () => {
    if (!activeExamId || !activeBlockId) return;
    try {
      const pRes = await gradingApi.getProgress(activeExamId, activeBlockId);
      const p = pRes?.data?.data ?? pRes?.data ?? pRes ?? null;
      setProgress(p);

      const serverInProgress = String(p?.status || '').toUpperCase() === 'IN_PROGRESS' || Number(p?.gradingCount || 0) > 0;
      if (serverInProgress) return;

      setOptimisticRun((prev) => {
        if (!prev?.active) return prev;
        const elapsed = Date.now() - Number(prev?.startedAt || 0);
        if (elapsed < 12000) return prev;
        return { ...prev, active: false };
      });
    } catch {
      setProgress(null);
    }
  }, [activeExamId, activeBlockId]);

  const loadData = useCallback(async (opts = {}) => {
    if (!activeExamId || !activeBlockId) {
      setLoading(false);
      setRows([]);
      setError('Thiếu examId hoặc blockId để tải danh sách bài nộp.');
      return;
    }

    setLoading(true);
    setError('');

    const p = opts.page ?? page;
    const s = opts.size ?? size;
    const q = opts.search ?? search;
    const st = opts.statusFilter ?? statusFilter;

    try {
      const params = { page: p, size: s };
      if (q) params.search = q;
      if (st) params.status = st;

      try {
        let subsRes;
        try {
          subsRes = await submissionApi.getBlockSubmissions(activeExamId, activeBlockId, params);
        } catch (firstErr) {
          console.warn('[BlockSubmissionsPage] getBlockSubmissions with params failed, retry without params:', firstErr);
          subsRes = await submissionApi.getBlockSubmissions(activeExamId, activeBlockId);
        }

        const { data: list, pagination: pag, stats: statData } = normalizeSubmissionsPayload(subsRes);

        if ((pag?.totalElements ?? 0) > 0 && Array.isArray(list) && list.length === 0 && p > 0 && !opts.__pageReset) {
          setPage(0);
          await loadData({ page: 0, size: s, search: q, statusFilter: st, __pageReset: true });
          return;
        }

        setRows(Array.isArray(list) ? list : []);
        setPagination({
          page: pag?.page ?? p,
          size: pag?.size ?? s,
          totalElements: pag?.totalElements ?? list.length,
          totalPages: pag?.totalPages ?? 1,
        });
        setStats({
          total: statData?.total ?? list.length,
          submitted: statData?.submitted ?? 0,
          grading: statData?.grading ?? 0,
          graded: statData?.graded ?? 0,
        });

        if (!pag || Object.keys(pag).length === 0) {
          const keyword = String(q || '').trim().toLowerCase();
          const source = Array.isArray(list) ? list : [];
          const filtered = source.filter((it) => {
            const matchesStatus = !st || String(it?.submissionStatus || '').toUpperCase() === String(st).toUpperCase();
            if (!matchesStatus) return false;
            if (!keyword) return true;
            const name = String(it?.studentName || '').toLowerCase();
            const code = String(it?.studentCode || '').toLowerCase();
            return name.includes(keyword) || code.includes(keyword);
          });

          const totalElements = filtered.length;
          const totalPages = Math.max(1, Math.ceil(totalElements / s));
          const safePage = Math.max(0, Math.min(p, totalPages - 1));
          const from = safePage * s;
          const to = Math.min(from + s, totalElements);
          const pageItems = filtered.slice(from, to);

          setRows(pageItems);
          setPagination({ page: safePage, size: s, totalElements, totalPages });
        }
      } catch (submissionErr) {
        try {
          const gradingRes = await gradingApi.getBlockResults(activeExamId, activeBlockId);
          const gradingPayload = gradingRes?.data?.data ?? gradingRes?.data ?? gradingRes;
          const gradingListRaw = Array.isArray(gradingPayload) ? gradingPayload : [];
          const normalized = mapGradingResultsFallback(gradingListRaw);

          const keyword = String(q || '').trim().toLowerCase();
          const filtered = normalized.filter((it) => {
            const matchesStatus = !st || String(it?.submissionStatus || '').toUpperCase() === String(st).toUpperCase();
            if (!matchesStatus) return false;
            if (!keyword) return true;
            const name = String(it?.studentName || '').toLowerCase();
            const code = String(it?.studentCode || '').toLowerCase();
            return name.includes(keyword) || code.includes(keyword);
          });

          const totalElements = filtered.length;
          const totalPages = Math.max(1, Math.ceil(totalElements / s));
          const safePage = Math.max(0, Math.min(p, totalPages - 1));
          const from = safePage * s;
          const to = Math.min(from + s, totalElements);
          const pageItems = filtered.slice(from, to);

          setRows(pageItems);
          setPagination({ page: safePage, size: s, totalElements, totalPages });
          setStats({
            total: normalized.length,
            submitted: normalized.filter((x) => String(x?.submissionStatus || '').toUpperCase() === 'SUBMITTED').length,
            grading: normalized.filter((x) => String(x?.submissionStatus || '').toUpperCase() === 'GRADING').length,
            graded: normalized.filter((x) => String(x?.submissionStatus || '').toUpperCase() === 'GRADED').length,
          });

          console.warn('[BlockSubmissionsPage] fallback to grading/results due to submissions endpoint error:', submissionErr);
        } catch (fallbackErr) {
          console.error('[BlockSubmissionsPage] both submissions endpoint and fallback failed:', submissionErr, fallbackErr);
          setRows([]);
          setPagination({ page: 0, size: s, totalElements: 0, totalPages: 1 });
          setStats({ total: 0, submitted: 0, grading: 0, graded: 0 });
          setError(
            extractApiErrorMessage(
              fallbackErr,
              extractApiErrorMessage(submissionErr, 'Không thể tải danh sách bài nộp. Vui lòng thử lại.')
            )
          );
        }
      }
    } catch (e) {
      console.error('[BlockSubmissionsPage] unexpected loadData error:', e);
      setRows([]);
      setPagination({ page: 0, size: s, totalElements: 0, totalPages: 1 });
      setStats({ total: 0, submitted: 0, grading: 0, graded: 0 });
      setError(extractApiErrorMessage(e, 'Không thể tải danh sách bài nộp. Vui lòng thử lại.'));
      setProgress((prev) => prev ?? null);
    } finally {
      setLoading(false);
    }
  }, [activeExamId, activeBlockId, page, size, search, statusFilter]);

  useEffect(() => { loadMeta(); }, [loadMeta]);
  useEffect(() => { loadProgress(); }, [loadProgress]);
  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const handleSearchInput = useCallback((val) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setPage(0);
    }, 400);
  }, []);

  const handleStatusChange = useCallback((val) => {
    setStatusFilter(val);
    setPage(0);
    shouldScrollAfterLoadRef.current = true;
    scrollToTableTop();
  }, [scrollToTableTop]);

  const handleSizeChange = useCallback((val) => {
    setSize(Number(val));
    setPage(0);
    shouldScrollAfterLoadRef.current = true;
    scrollToTableTop();
  }, [scrollToTableTop]);

  const handlePageChange = useCallback((nextPage) => {
    shouldScrollAfterLoadRef.current = true;
    setPage(nextPage);
    scrollToTableTop();
  }, [scrollToTableTop]);

  const handleRefresh = useCallback(async () => {
    setSelectedSubmissionIds([]);
    setPage(0);
    shouldScrollAfterLoadRef.current = true;
    await loadData({ page: 0, size, search, statusFilter });
  }, [loadData, search, size, statusFilter]);

  useEffect(() => {
    if (!loading && shouldScrollAfterLoadRef.current) {
      scrollToTableTop();
      shouldScrollAfterLoadRef.current = false;
    }
  }, [loading, rows.length, scrollToTableTop]);

  const serverGradingInProgress = String(progress?.status || '').toUpperCase() === 'IN_PROGRESS' || Number(progress?.gradingCount || 0) > 0;
  const isGradingInProgress = Boolean(optimisticRun?.active) || serverGradingInProgress;

  const progressTotalDisplay = useMemo(() => {
    if (optimisticRun?.active && optimisticRun?.scope === 'selected') {
      return Number(optimisticRun?.total || 0);
    }
    return Number(progress?.totalSubmissions ?? optimisticRun?.total ?? 0);
  }, [optimisticRun, progress?.totalSubmissions]);

  const progressDoneDisplay = useMemo(() => {
    const fromServer = Number(progress?.gradedCount ?? 0);
    if (optimisticRun?.active && optimisticRun?.scope === 'selected') {
      return Math.min(fromServer, Number(optimisticRun?.total || 0));
    }
    return fromServer;
  }, [optimisticRun, progress?.gradedCount]);

  useEffect(() => {
    if (!isGradingInProgress || !activeExamId || !activeBlockId) return undefined;
    const intervalId = setInterval(() => {
      loadProgress();
    }, 4000);
    return () => clearInterval(intervalId);
  }, [isGradingInProgress, activeExamId, activeBlockId, loadProgress]);

  useEffect(() => {
    if (isGradingInProgress) {
      wasGradingRef.current = true;
      return;
    }
    if (wasGradingRef.current) {
      wasGradingRef.current = false;
      loadData();
    }
  }, [isGradingInProgress, loadData]);

  const isRowSelectable = useCallback((item) => {
    const s = String(item?.submissionStatus || '').toUpperCase();
    return s === 'SUBMITTED' || s === 'GRADED';
  }, []);

  const visibleSelectableIds = useMemo(
    () => rows.filter(isRowSelectable).map((it) => it?.submissionId).filter(Boolean),
    [rows, isRowSelectable]
  );

  const selectedIdSet = useMemo(() => new Set(selectedSubmissionIds), [selectedSubmissionIds]);

  const visibleSelectedCount = useMemo(
    () => visibleSelectableIds.filter((id) => selectedIdSet.has(id)).length,
    [visibleSelectableIds, selectedIdSet]
  );

  const selectedCount = selectedSubmissionIds.length;
  const allVisibleSelected = visibleSelectableIds.length > 0 && visibleSelectedCount === visibleSelectableIds.length;

  const toggleSelectOne = useCallback((id, checked) => {
    if (!id) return;
    setSelectedSubmissionIds((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      }
      return prev.filter((x) => x !== id);
    });
  }, []);

  const toggleSelectAllVisible = useCallback((checked) => {
    setSelectedSubmissionIds((prev) => {
      if (checked) {
        const merged = new Set([...prev, ...visibleSelectableIds]);
        return Array.from(merged);
      }
      return prev.filter((id) => !visibleSelectableIds.includes(id));
    });
  }, [visibleSelectableIds]);

  const handleTriggerGrading = useCallback(async () => {
    if (!activeExamId || !activeBlockId || isTriggering || isGradingInProgress) return;

    try {
      setIsTriggering(true);
      const isSelectedMode = selectedCount > 0;
      const idsToGrade = selectedCount > 0
        ? selectedSubmissionIds
        : rows
            .filter((it) => {
              const s = String(it?.submissionStatus || '').toUpperCase();
              return s === 'SUBMITTED' || s === 'GRADED';
            })
            .map((it) => it?.submissionId)
            .filter(Boolean);

      const statusById = new Map(rows.map((it) => [it?.submissionId, String(it?.submissionStatus || '').toUpperCase()]));
      const selectedSubmittedCount = idsToGrade.filter((id) => statusById.get(id) === 'SUBMITTED').length;
      const selectedGradedCount = idsToGrade.filter((id) => statusById.get(id) === 'GRADED').length;
      const allSubmittedCount = Number(stats?.submitted || 0);
      const allGradedCount = Number(stats?.graded || 0);
      const submittedForUpdate = isSelectedMode ? selectedSubmittedCount : allSubmittedCount;
      const gradedForUpdate = isSelectedMode ? selectedGradedCount : allGradedCount;
      const expectedTotal = isSelectedMode ? idsToGrade.length : (allSubmittedCount + allGradedCount);

      const body = {
        blockId: activeBlockId,
        submissionIds: isSelectedMode ? selectedSubmissionIds : null,
      };

      await gradingApi.triggerGrading(activeExamId, activeBlockId, body);

      setOptimisticRun({
        active: true,
        total: expectedTotal,
        scope: isSelectedMode ? 'selected' : 'all',
        startedAt: Date.now(),
      });

      if (idsToGrade.length > 0) {
        const idSet = new Set(idsToGrade);
        setRows((prev) => prev.map((it) => {
          const s = String(it?.submissionStatus || '').toUpperCase();
          const isGradeable = s === 'SUBMITTED' || s === 'GRADED';
          const shouldMove = isSelectedMode ? (!!it?.submissionId && idSet.has(it.submissionId)) : isGradeable;
          if (!shouldMove) return it;
          return { ...it, submissionStatus: 'GRADING' };
        }));

        if (expectedTotal > 0) {
          setStats((prev) => ({
            ...prev,
            submitted: Math.max(0, Number(prev?.submitted || 0) - submittedForUpdate),
            graded: Math.max(0, Number(prev?.graded || 0) - gradedForUpdate),
            grading: Math.max(0, Number(prev?.grading || 0) + expectedTotal),
          }));
        }
      }

      message.success(selectedCount > 0 ? `Đã bắt đầu chấm ${selectedCount} bài đã chọn.` : 'Đã bắt đầu chấm tất cả bài nộp.');
      setSelectedSubmissionIds([]);
      loadProgress();
    } catch (e) {
      setOptimisticRun(null);
      message.error(extractApiErrorMessage(e, 'Không thể bắt đầu chấm bài. Vui lòng thử lại.'));
    } finally {
      setIsTriggering(false);
    }
  }, [activeBlockId, activeExamId, isGradingInProgress, isTriggering, loadProgress, rows, selectedCount, selectedSubmissionIds, stats]);

  const handleStopGrading = useCallback(async () => {
    if (!activeExamId || !activeBlockId || isStopping || !isGradingInProgress) return;
    try {
      setIsStopping(true);
      setOptimisticRun((prev) => (prev ? { ...prev, active: false } : prev));
      await gradingApi.stopGrading(activeExamId, activeBlockId);
      message.success('Đã gửi yêu cầu dừng chấm.');
      await Promise.all([loadData(), loadProgress()]);
    } catch (e) {
      message.error(extractApiErrorMessage(e, 'Không thể dừng chấm bài. Vui lòng thử lại.'));
    } finally {
      setIsStopping(false);
    }
  }, [activeBlockId, activeExamId, isGradingInProgress, isStopping, loadData, loadProgress]);

  const handleOpenSubmissionDetail = useCallback((item) => {
    const submissionId = item?.submissionId;
    if (!submissionId || !activeExamId || !activeBlockId) {
      message.warning('Không tìm thấy thông tin bài nộp để xem chi tiết.');
      return;
    }
    if (!canOpenSubmissionDetail(item)) {
      message.info('Bài này chưa có kết quả chấm để xem chi tiết.');
      return;
    }

    navigate(`/exam-staff/exams/${activeExamId}/blocks/${activeBlockId}/submissions/${submissionId}`, {
      state: {
        prefill: {
          submissionId,
          studentName: item?.studentName ?? null,
          studentCode: item?.studentCode ?? null,
          studentEmail: item?.studentEmail ?? null,
          submissionStatus: item?.submissionStatus ?? null,
          status: item?.gradingStatus ?? null,
          gradingResultId: item?.gradingResultId ?? null,
          totalScore: item?.totalScore ?? null,
          maxScore: item?.maxScore ?? null,
          gradedAt: item?.gradedAt ?? null,
        },
      },
    });
  }, [activeBlockId, activeExamId, navigate]);

  const handleRegradeOne = useCallback(async (item) => {
    if (!item?.submissionId || isGradingInProgress || isTriggering) return;

    try {
      setIsTriggering(true);
      await gradingApi.triggerSingleGrading(activeExamId, activeBlockId, item.submissionId);

      setRows((prev) => prev.map((r) => (
        r?.submissionId === item.submissionId
          ? {
              ...r,
              submissionStatus: 'GRADING',
              gradingResultId: null,
              gradingStatus: null,
              totalScore: null,
              maxScore: null,
              gradedAt: null,
            }
          : r
      )));

      setOptimisticRun({
        active: true,
        total: 1,
        scope: 'selected',
        startedAt: Date.now(),
      });

      message.success(`Đã bắt đầu chấm lại bài của ${item?.studentName ?? 'sinh viên'}.`);
      loadProgress();
    } catch (e) {
      message.error(extractApiErrorMessage(e, 'Không thể chấm lại bài này.'));
    } finally {
      setIsTriggering(false);
    }
  }, [activeBlockId, activeExamId, isGradingInProgress, isTriggering, loadProgress]);

  const downloadProtectedFile = useCallback(async (endpoint, defaultFileName, unsupportedMessage) => {
    if (!isBrowserFileDownloadSupported()) {
      message.warning(unsupportedMessage || 'Web chưa hỗ trợ tải file ở màn này.');
      return false;
    }

    try {
      const response = await axiosClient.get(endpoint, { responseType: 'blob' });
      const blob = response instanceof Blob
        ? response
        : response?.data instanceof Blob
          ? response.data
          : new Blob([response], { type: 'application/octet-stream' });

      const ok = saveBlobFile(blob, defaultFileName);
      if (!ok) {
        message.warning(unsupportedMessage || 'Web chưa hỗ trợ tải file ở màn này.');
        return false;
      }
      return true;
    } catch (error) {
      const status = Number(error?.response?.status || 0);
      if (status === 404 || status === 405 || status === 501) {
        message.warning(unsupportedMessage || 'Web chưa hỗ trợ tải file ở màn này.');
        return false;
      }
      throw error;
    }
  }, []);

  const handleExportCsv = useCallback(() => {
    if (!rows.length) {
      message.info('Hiện chưa có dữ liệu để xuất CSV.');
      return;
    }

    if (!isBrowserFileDownloadSupported()) {
      message.warning('Web chưa hỗ trợ xuất file CSV ở màn này.');
      return;
    }

    const headers = ['STT', 'Sinh viên', 'Mã SV', 'Email', 'Thời gian nộp', 'Dung lượng', 'Trạng thái', 'Điểm số', 'Kết quả'];
    const csvRows = rows.map((it, idx) => {
      const statusBadge = getSubmissionStatusBadge(it.submissionStatus);
      const resultBadge = getResultBadge(it.gradingStatus);
      const score = it.totalScore != null
        ? `${Number(it.totalScore).toFixed(2)}/${Number(it.maxScore || 10).toFixed(0)}`
        : '—';
      return [
        (pagination.page * pagination.size) + idx + 1,
        it.studentName ?? '',
        it.studentCode ?? '',
        it.studentEmail ?? '',
        fmtDateTime(it.submittedAt),
        fmtSize(it.fileSizeBytes),
        statusBadge.label,
        score,
        resultBadge ? resultBadge.label : '—',
      ];
    });

    const escapeCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [headers, ...csvRows].map((r) => r.map(escapeCell).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const fileName = `danh-sach-bai-nop-${slugifyFilePart(block?.name || activeBlockId, 'block')}.csv`;

    const ok = saveBlobFile(blob, fileName);
    if (!ok) {
      message.warning('Web chưa hỗ trợ xuất file CSV ở màn này.');
      return;
    }

    message.success('Đã bắt đầu tải file CSV.');
  }, [activeBlockId, block?.name, pagination.page, pagination.size, rows]);

  const handleExportGradeSheet = useCallback(async () => {
    if (!activeExamId || !activeBlockId) {
      message.warning('Thiếu thông tin exam hoặc block để xuất bảng điểm.');
      return;
    }

    setExporting((prev) => ({ ...prev, gradeSheet: true }));
    try {
      const fileName = `bang-diem-${slugifyFilePart(block?.name || activeBlockId, 'block')}.xlsx`;
      const ok = await downloadProtectedFile(
        `/exams/${activeExamId}/blocks/${activeBlockId}/export/grade-sheet`,
        fileName,
        'Web chưa hỗ trợ xuất bảng điểm ở màn này.'
      );
      if (ok) message.success('Đã bắt đầu tải bảng điểm.');
    } catch (error) {
      message.error(extractApiErrorMessage(error, 'Không thể xuất bảng điểm lúc này.'));
    } finally {
      setExporting((prev) => ({ ...prev, gradeSheet: false }));
    }
  }, [activeBlockId, activeExamId, block?.name, downloadProtectedFile]);


  const totalPages = pagination.totalPages;
  const currentPage = pagination.page;

  const pageNumbers = useMemo(() => {
    if (totalPages <= 1) return [];
    const delta = 2;
    const range = [];
    const start = Math.max(0, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);
    if (start > 0) range.push(0);
    if (start > 1) range.push('...');
    for (let i = start; i <= end; i += 1) range.push(i);
    if (end < totalPages - 2) range.push('...');
    if (end < totalPages - 1) range.push(totalPages - 1);
    return range;
  }, [currentPage, totalPages]);

  const renderedRows = useMemo(() => rows.map((item, idx) => ({
    item,
    rowNum: pagination.page * pagination.size + idx + 1,
    selectable: isRowSelectable(item),
    checked: !!item?.submissionId && selectedIdSet.has(item.submissionId),
  })), [isRowSelectable, pagination.page, pagination.size, rows, selectedIdSet]);

  return (
    <div className="relative max-w-7xl mx-auto w-full p-6 sm:p-8 pt-20 sm:pt-24 space-y-6">
      <PageBackdrop />
      <BackSection onBack={handleBack} />

      <HeaderSection
        loading={loading}
        total={stats.total}
        examName={exam?.name}
        blockName={block?.name}
        onExportCsv={handleExportCsv}
        onExportGradeSheet={handleExportGradeSheet}
        onRefresh={handleRefresh}
        exporting={exporting}
      />

      {!loading && !error && <StatsGrid stats={stats} />}

      <FilterBar
        searchInput={searchInput}
        onSearchInput={handleSearchInput}
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
        size={size}
        onSizeChange={handleSizeChange}
        isGradingInProgress={isGradingInProgress}
        isTriggering={isTriggering}
        loading={loading}
        selectedCount={selectedCount}
        progressDoneDisplay={progressDoneDisplay}
        progressTotalDisplay={progressTotalDisplay}
        onTriggerGrading={handleTriggerGrading}
        onStopGrading={handleStopGrading}
        isStopping={isStopping}
      />

      {loading && <LoadingState />}
      {!loading && !!error && <ErrorState error={error} />}

      {!loading && !error && (
        <div ref={tableSectionRef} className="relative z-10 bg-white/70 backdrop-blur-xl rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] ring-1 ring-slate-900/5 mt-8 overflow-hidden flex flex-col">
          <TableSectionHeader pagination={pagination} />

          <div className="overflow-x-auto p-6 pt-2">
            <table className="w-full text-left border-separate border-spacing-y-3 min-w-[1080px]">
              <thead>
                <tr>
                  <th className="sticky top-0 z-10 px-4 py-4 text-center w-[40px] sm:w-[50px] rounded-l-2xl">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      disabled={visibleSelectableIds.length === 0 || isGradingInProgress}
                      onChange={(e) => toggleSelectAllVisible(e.target.checked)}
                      className="w-4.5 h-4.5 rounded border-slate-300 text-[#F37120] focus:ring-[#F37120] cursor-pointer disabled:opacity-50"
                    />
                  </th>
                  <th className="sticky top-0 z-10 px-2 py-4 text-[11px] sm:text-[12px] font-extrabold text-slate-400 uppercase tracking-widest text-center">STT</th>
                  <th className="sticky top-0 z-10 px-2 py-4 text-[11px] sm:text-[12px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Sinh viên</th>
                  <th className="sticky top-0 z-10 px-2 py-4 text-[11px] sm:text-[12px] font-extrabold text-slate-400 uppercase tracking-widest text-center">MSSV</th>
                  <th className="sticky top-0 z-10 px-2 py-4 text-[11px] sm:text-[12px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Chi tiết file</th>
                  <th className="sticky top-0 z-10 px-2 py-4 text-[11px] sm:text-[12px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Tiến trình</th>
                  <th className="sticky top-0 z-10 px-2 py-4 text-[11px] sm:text-[12px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Chấm điểm</th>
                  <th className="sticky top-0 z-10 px-2 py-4 text-[11px] sm:text-[12px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Đánh giá</th>
                  <th className="sticky top-0 z-10 px-3 py-4 text-[11px] sm:text-[12px] font-extrabold text-slate-400 uppercase tracking-widest text-center rounded-r-2xl">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {renderedRows.length > 0 ? renderedRows.map(({ item, rowNum, selectable, checked }) => (
                  <SubmissionTableRow
                    key={item?.submissionId || rowNum}
                    item={item}
                    rowNum={rowNum}
                    checked={checked}
                    selectable={selectable}
                    disabled={isGradingInProgress || isTriggering}
                    onToggleSelect={toggleSelectOne}
                    onRegrade={handleRegradeOne}
                    onOpenDetail={handleOpenSubmissionDetail}
                  />
                )) : <EmptyTableState />}
              </tbody>
            </table>
          </div>

          <PaginationBar
            totalElements={pagination.totalElements}
            pageNumbers={pageNumbers}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
