import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import examApi from '../../services/examApi';
import blockApi from '../../services/blockApi';
import submissionApi from '../../services/submissionApi';
import gradingApi from '../../services/gradingApi';

/* ─── Helpers ────────────────────────────────────────────────────────────── */
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
  if (n < 1024)           return `${n} B`;
  if (n < 1024 * 1024)   return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Trạng thái bài nộp (submissionStatus): SUBMITTED | GRADING | GRADED
 */
function getSubmissionStatusBadge(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'GRADING') return { label: 'Đang chấm', cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20' };
  if (s === 'GRADED')  return { label: 'Đã chấm',   cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' };
  return                      { label: 'Chưa chấm', cls: 'bg-sky-50 text-sky-700 ring-1 ring-sky-600/20' };
}

/**
 * Kết quả chấm (gradingStatus): PASS | FAIL | null
 */
function getResultBadge(gradingStatus) {
  const s = String(gradingStatus || '').toUpperCase();
  if (s === 'PASS') return { label: 'Đạt',       cls: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-600/30 font-bold' };
  if (s === 'FAIL') return { label: 'Không đạt', cls: 'bg-red-50 text-red-700 ring-1 ring-red-600/20 font-bold' };
  return null; // not yet graded — render '—'
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function normalizeSubmissionsPayload(raw) {
  if (!raw) return { data: [], pagination: {}, stats: {} };
  // Normalize các kiểu response khác nhau:
  // 1) { data: [...], pagination, stats }
  // 2) { success, message, data: { data: [...], pagination, stats } }
  // 3) { success, message, data: [...] }
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

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function BlockSubmissionsPage({ examId, blockId, onBack }) {
  const navigate = useNavigate();
  const { examId: routeExamId, blockId: routeBlockId } = useParams();
  const activeExamId = examId || routeExamId;
  const activeBlockId = blockId || routeBlockId;

  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [exam,         setExam]         = useState(null);
  const [block,        setBlock]        = useState(null);
  const [rows,         setRows]         = useState([]);
  const [stats,        setStats]        = useState({ total: 0, submitted: 0, grading: 0, graded: 0 });
  const [pagination,   setPagination]   = useState({ page: 0, size: 20, totalElements: 0, totalPages: 0 });
  const [progress,     setProgress]     = useState(null);
  const [optimisticRun, setOptimisticRun] = useState(null); // { active, total, scope: 'selected'|'all', startedAt }
  const [isTriggering, setIsTriggering] = useState(false);
  const [isStopping,   setIsStopping]   = useState(false);
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState([]);

  // Controlled filter state (what the server sees)
  const [page,         setPage]         = useState(0);
  const [size,         setSize]         = useState(20);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');   // '' | SUBMITTED | GRADING | GRADED

  // Debounced search input
  const [searchInput,  setSearchInput]  = useState('');
  const debounceRef = useRef(null);
  const tableSectionRef = useRef(null);
  const shouldScrollAfterLoadRef = useRef(false);
  const wasGradingRef = useRef(false);

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

      const serverInProgress =
        String(p?.status || '').toUpperCase() === 'IN_PROGRESS' || Number(p?.gradingCount || 0) > 0;
      if (serverInProgress) {
        return;
      }

      // Backend có thể cần vài giây để chuyển progress sang IN_PROGRESS sau trigger (202 Accepted)
      setOptimisticRun((prev) => {
        if (!prev?.active) return prev;
        const startedAt = Number(prev?.startedAt || 0);
        const elapsed = Date.now() - startedAt;
        if (elapsed < 12000) return prev; // giữ trạng thái lạc quan trong 12s để tránh flicker/reload
        return { ...prev, active: false };
      });
    } catch {
      setProgress(null);
    }
  }, [activeExamId, activeBlockId]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);


  /* ── Data loading ─────────────────────────────────────────────────────── */
  const loadData = useCallback(async (opts = {}) => {
    if (!activeExamId || !activeBlockId) return;
    setLoading(true);
    setError('');
    const p     = opts.page         ?? page;
    const s     = opts.size         ?? size;
    const q     = opts.search       ?? search;
    const st    = opts.statusFilter ?? statusFilter;

    try {
      const params = { page: p, size: s };
      if (q)  params.search = q;
      if (st) params.status = st;

      try {
        let subsRes;
        try {
          subsRes = await submissionApi.getBlockSubmissions(activeExamId, activeBlockId, params);
        } catch (firstErr) {
          // Retry không params (một số backend không xử lý tốt query optional)
          console.warn('[BlockSubmissionsPage] getBlockSubmissions with params failed, retry without params:', firstErr);
          subsRes = await submissionApi.getBlockSubmissions(activeExamId, activeBlockId);
        }
        const { data: list, pagination: pag, stats: statData } = normalizeSubmissionsPayload(subsRes);

        // Nếu backend trả trang rỗng nhưng total vẫn còn, tự quay về trang đầu
        if ((pag?.totalElements ?? 0) > 0 && Array.isArray(list) && list.length === 0 && p > 0 && !opts.__pageReset) {
          setPage(0);
          await loadData({ page: 0, size: s, search: q, statusFilter: st, __pageReset: true });
          return;
        }

        setRows(Array.isArray(list) ? list : []);
        setPagination({
          page:          pag.page          ?? p,
          size:          pag.size          ?? s,
          totalElements: pag.totalElements ?? list.length,
          totalPages:    pag.totalPages    ?? 1,
        });
        setStats({
          total:     statData.total     ?? list.length,
          submitted: statData.submitted ?? 0,
          grading:   statData.grading   ?? 0,
          graded:    statData.graded    ?? 0,
        });

        // Nếu backend retry không params thì phân trang/filter ở client để đồng bộ UI
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
          setPagination({
            page: safePage,
            size: s,
            totalElements,
            totalPages,
          });
        }
      } catch (submissionErr) {
        try {
          // Fallback cho backend cũ chưa có endpoint /submissions hoặc response contract khác
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
          setPagination({
            page: safePage,
            size: s,
            totalElements,
            totalPages,
          });
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
          setPagination({
            page: 0,
            size: s,
            totalElements: 0,
            totalPages: 1,
          });
          setStats({ total: 0, submitted: 0, grading: 0, graded: 0 });
        }
      }

    } catch (e) {
      // Không chặn toàn trang bằng banner lỗi chung khi vẫn có thể render dữ liệu/fallback
      console.error('[BlockSubmissionsPage] unexpected loadData error:', e);
      setError('');
      setRows((prev) => (Array.isArray(prev) ? prev : []));
      setProgress((prev) => prev ?? null);
    } finally {
      setLoading(false);
    }
  }, [activeExamId, activeBlockId, page, size, search, statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Debounce search ──────────────────────────────────────────────────── */
  const handleSearchInput = (val) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setPage(0);
    }, 400);
  };

  /* ── Filter / page changes ────────────────────────────────────────────── */
  const handleStatusChange = (val) => {
    setStatusFilter(val);
    setPage(0);
    shouldScrollAfterLoadRef.current = true;
    scrollToTableTop();
  };
  const handleSizeChange   = (val) => {
    setSize(Number(val));
    setPage(0);
    shouldScrollAfterLoadRef.current = true;
    scrollToTableTop();
  };
  const handlePageChange   = (p)   => {
    shouldScrollAfterLoadRef.current = true;
    setPage(p);
    scrollToTableTop();
  };

  const handleRefresh = async () => {
    setSelectedSubmissionIds([]);
    setPage(0);
    shouldScrollAfterLoadRef.current = true;
    await loadData({ page: 0, size, search, statusFilter });
  };

  useEffect(() => {
    if (!loading && shouldScrollAfterLoadRef.current) {
      scrollToTableTop();
      shouldScrollAfterLoadRef.current = false;
    }
  }, [loading, rows.length, scrollToTableTop]);

  const serverGradingInProgress =
    String(progress?.status || '').toUpperCase() === 'IN_PROGRESS' || Number(progress?.gradingCount || 0) > 0;
  const isGradingInProgress = Boolean(optimisticRun?.active) || serverGradingInProgress;

  const progressTotalDisplay = useMemo(() => {
    if (optimisticRun?.active && optimisticRun?.scope === 'selected') {
      return Number(optimisticRun?.total || 0);
    }
    return Number(progress?.totalSubmissions ?? optimisticRun?.total ?? 0);
  }, [progress?.totalSubmissions, optimisticRun]);

  const progressDoneDisplay = useMemo(() => {
    const fromServer = Number(progress?.gradedCount ?? 0);
    if (optimisticRun?.active && optimisticRun?.scope === 'selected') {
      return Math.min(fromServer, Number(optimisticRun?.total || 0));
    }
    return fromServer;
  }, [progress?.gradedCount, optimisticRun]);

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

  const selectedCount = selectedSubmissionIds.length;
  const visibleSelectedCount = useMemo(
    () => visibleSelectableIds.filter((id) => selectedSubmissionIds.includes(id)).length,
    [visibleSelectableIds, selectedSubmissionIds]
  );
  const allVisibleSelected = visibleSelectableIds.length > 0 && visibleSelectedCount === visibleSelectableIds.length;

  const toggleSelectOne = (id, checked) => {
    if (!id) return;
    setSelectedSubmissionIds((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      }
      return prev.filter((x) => x !== id);
    });
  };

  const toggleSelectAllVisible = (checked) => {
    setSelectedSubmissionIds((prev) => {
      if (checked) {
        const merged = new Set([...prev, ...visibleSelectableIds]);
        return Array.from(merged);
      }
      return prev.filter((id) => !visibleSelectableIds.includes(id));
    });
  };

  const handleTriggerGrading = async () => {
    if (!activeExamId || !activeBlockId || isTriggering || isGradingInProgress) return;
    try {
      setIsTriggering(true);
      const isSelectedMode = selectedCount > 0;
      const idsToGrade = selectedCount > 0
        ? selectedSubmissionIds
        : rows.filter((it) => {
            const s = String(it?.submissionStatus || '').toUpperCase();
            return s === 'SUBMITTED' || s === 'GRADED';
          }).map((it) => it?.submissionId).filter(Boolean);
      const statusById = new Map(
        rows.map((it) => [it?.submissionId, String(it?.submissionStatus || '').toUpperCase()])
      );
      const selectedSubmittedCount = idsToGrade.filter((id) => statusById.get(id) === 'SUBMITTED').length;
      const selectedGradedCount = idsToGrade.filter((id) => statusById.get(id) === 'GRADED').length;

      // all-mode: dùng stats toàn block để card cập nhật đúng (kể cả đang ở trang khác)
      const allSubmittedCount = Number(stats?.submitted || 0);
      const allGradedCount = Number(stats?.graded || 0);

      const submittedForUpdate = isSelectedMode ? selectedSubmittedCount : allSubmittedCount;
      const gradedForUpdate = isSelectedMode ? selectedGradedCount : allGradedCount;
      const expectedTotal = isSelectedMode
        ? idsToGrade.length
        : (allSubmittedCount + allGradedCount);

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

      // Optimistic UI: chuyển các bài vừa trigger sang GRADING ngay lập tức
      if (idsToGrade.length > 0) {
        const idSet = new Set(idsToGrade);
        setRows((prev) => prev.map((it) => {
          const s = String(it?.submissionStatus || '').toUpperCase();
          const isGradeable = s === 'SUBMITTED' || s === 'GRADED';
          const shouldMove = isSelectedMode
            ? (!!it?.submissionId && idSet.has(it.submissionId))
            : isGradeable;
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

      message.success(selectedCount > 0
        ? `Đã bắt đầu chấm ${selectedCount} bài đã chọn.`
        : 'Đã bắt đầu chấm tất cả bài nộp.');
      setSelectedSubmissionIds([]);
      loadProgress();
    } catch (e) {
      setOptimisticRun(null);
      const apiMessage = e?.response?.data?.message;
      message.error(apiMessage || 'Không thể bắt đầu chấm bài. Vui lòng thử lại.');
    } finally {
      setIsTriggering(false);
    }
  };

  const handleStopGrading = async () => {
    if (!activeExamId || !activeBlockId || isStopping || !isGradingInProgress) return;
    try {
      setIsStopping(true);
      setOptimisticRun((prev) => (prev ? { ...prev, active: false } : prev));
      await gradingApi.stopGrading(activeExamId, activeBlockId);
      message.success('Đã gửi yêu cầu dừng chấm.');
      await Promise.all([loadData(), loadProgress()]);
    } catch (e) {
      const apiMessage = e?.response?.data?.message;
      message.error(apiMessage || 'Không thể dừng chấm bài. Vui lòng thử lại.');
    } finally {
      setIsStopping(false);
    }
  };

  const handleOpenSubmissionDetail = (item) => {
    const submissionId = item?.submissionId;
    if (!submissionId || !activeExamId || !activeBlockId) {
      message.warning('Không tìm thấy thông tin bài nộp để xem chi tiết.');
      return;
    }
    navigate(
      `/exam-staff/exams/${activeExamId}/blocks/${activeBlockId}/submissions/${submissionId}`,
      {
        state: {
          prefill: {
            submissionId,
            studentName: item?.studentName ?? null,
            studentCode: item?.studentCode ?? null,
            status: item?.gradingStatus ?? null,
            totalScore: item?.totalScore ?? null,
            maxScore: item?.maxScore ?? null,
            gradedAt: item?.gradedAt ?? null,
          },
        },
      }
    );
  };

  /* ── Stats cards ──────────────────────────────────────────────────────── */
  const STAT_CARDS = [
    {
      key: 'total',
      label: 'Tổng số bài nộp',
      value: stats.total,
      icon: 'assignment',
      bg: 'from-slate-50 via-white to-slate-50',
      border: 'border-slate-200',
      iconBg: 'bg-slate-100 text-slate-600',
      blob: 'bg-slate-200/40',
    },
    {
      key: 'submitted',
      label: 'Chưa chấm',
      value: stats.submitted,
      icon: 'schedule',
      bg: 'from-sky-50 via-white to-blue-50/70',
      border: 'border-blue-100',
      iconBg: 'bg-sky-100 text-sky-600',
      blob: 'bg-sky-200/40',
    },
    {
      key: 'grading',
      label: 'Đang chấm',
      value: stats.grading,
      icon: 'hourglass_top',
      bg: 'from-amber-50 via-white to-orange-50/70',
      border: 'border-amber-100',
      iconBg: 'bg-amber-100 text-amber-600',
      blob: 'bg-amber-200/40',
    },
    {
      key: 'graded',
      label: 'Đã chấm',
      value: stats.graded,
      icon: 'task_alt',
      bg: 'from-emerald-50/80 via-white to-green-50/70',
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-100 text-emerald-600',
      blob: 'bg-emerald-200/40',
    },
  ];

  /* ── CSV Export ───────────────────────────────────────────────────────── */
  const handleExportExcel = useCallback(() => {
    if (!rows.length) return;
    const headers = ['STT', 'Sinh viên', 'Mã SV', 'Email', 'Thời gian nộp', 'Dung lượng', 'Trạng thái', 'Điểm số', 'Kết quả'];
    const csvRows = rows.map((it, idx) => {
      const statusBadge = getSubmissionStatusBadge(it.submissionStatus);
      const resultBadge = getResultBadge(it.gradingStatus);
      const score = it.totalScore != null
        ? `${Number(it.totalScore).toFixed(2)}/${Number(it.maxScore || 10).toFixed(0)}`
        : '—';
      return [
        (pagination.page * pagination.size) + idx + 1,
        it.studentName  ?? '',
        it.studentCode  ?? '',
        it.studentEmail ?? '',
        fmtDateTime(it.submittedAt),
        fmtSize(it.fileSizeBytes),
        statusBadge.label,
        score,
        resultBadge ? resultBadge.label : '—',
      ];
    });
    const escapeCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv  = [headers, ...csvRows].map((r) => r.map(escapeCell).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `danh-sach-bai-nop-${activeBlockId || 'block'}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [rows, activeBlockId, pagination]);

  /* ── Pagination helpers ───────────────────────────────────────────────── */
  const totalPages  = pagination.totalPages;
  const currentPage = pagination.page;

  const pageNumbers = useMemo(() => {
    if (totalPages <= 1) return [];
    const delta = 2;
    const range = [];
    const start = Math.max(0, currentPage - delta);
    const end   = Math.min(totalPages - 1, currentPage + delta);
    if (start > 0) range.push(0);
    if (start > 1) range.push('...');
    for (let i = start; i <= end; i++) range.push(i);
    if (end < totalPages - 2) range.push('...');
    if (end < totalPages - 1) range.push(totalPages - 1);
    return range;
  }, [currentPage, totalPages]);

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <div className="relative max-w-7xl mx-auto w-full p-6 sm:p-8 pt-20 sm:pt-24 space-y-6">
      {/* Blobs */}
      <div className="pointer-events-none absolute top-10 -left-14 w-56 h-56 rounded-full bg-orange-100/70 blur-3xl" />
      <div className="pointer-events-none absolute top-1/4 -right-12 w-56 h-56 rounded-full bg-amber-100/50 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 left-1/3 w-48 h-48 rounded-full bg-sky-100/40 blur-3xl" />

      {/* Back */}
      <div className="flex items-center gap-4 relative z-10 mb-8">
        <button
          type="button" onClick={onBack}
          className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-slate-900/5 backdrop-blur-md border border-slate-900/10 text-slate-600 hover:text-slate-900 hover:bg-slate-900/10 hover:border-slate-900/20 transition-all shadow-sm hover:shadow active:scale-95 group font-medium"
        >
          <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
        </button>
        <span className="text-[13px] font-bold text-slate-500 tracking-[0.1em] uppercase">Quay lại Block Details</span>
      </div>

      {/* Header bar */}
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
                {stats.total}
              </span>
            )}
          </h1>
          <p className="text-sm font-semibold text-slate-500 flex items-center justify-center xl:justify-start gap-2.5">
            <span className="material-symbols-outlined text-[18px]">folder_copy</span>
            <span className="text-slate-700">{exam?.name || '—'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            <span className="text-slate-700">{block?.name || '—'}</span>
          </p>
        </div>
        
        <div className="flex sm:flex-row flex-col items-center gap-3 relative z-10 w-full xl:w-auto">
          <button
            onClick={handleExportExcel}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white/70 backdrop-blur-md rounded-2xl text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-900/5 hover:bg-white hover:shadow-md hover:ring-slate-900/10 transition-all hover:-translate-y-0.5"
          >
            <span className="material-symbols-outlined text-[20px] text-emerald-600">download</span>
            Xuất file CSV
          </button>
          <button
            onClick={handleRefresh}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white/70 backdrop-blur-md rounded-2xl text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-900/5 hover:bg-white hover:shadow-md hover:ring-slate-900/10 transition-all hover:-translate-y-0.5 group"
            title="Làm mới"
          >
            <span className="material-symbols-outlined text-[20px] text-blue-600 group-hover:rotate-180 transition-transform duration-700 ease-spring">refresh</span>
            Làm mới bộ nhớ
          </button>
        </div>
      </div>

      {/* Stats cards */}
      {!loading && !error && (
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STAT_CARDS.map((card) => (
            <div key={card.key}
              className={`group relative overflow-hidden bg-white/60 backdrop-blur-xl p-6 rounded-[28px] shadow-sm ring-1 ring-slate-900/5 hover:shadow-xl hover:ring-slate-900/10 transition-all duration-500 min-h-[140px] isolate flex flex-col justify-between hover:-translate-y-1`}
            >
              {/* Soft glow gradient background overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.bg} opacity-40 group-hover:opacity-60 transition-opacity duration-500 mix-blend-multiply rounded-[28px]`} />
              
              {/* Dynamic Blob */}
              <div className={`absolute -right-8 -bottom-8 w-40 h-40 rounded-full ${card.blob} blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-700 ease-out z-[-1]`} />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-2xl ${card.iconBg} flex items-center justify-center shadow-inner border border-white/50 backdrop-blur-md`}>
                    <span className="material-symbols-outlined text-[28px]">{card.icon}</span>
                  </div>
                  <div className="text-right">
                    <h3 className="text-5xl font-black text-slate-900 tracking-tighter drop-shadow-sm">{card.value}</h3>
                  </div>
                </div>
                <p className="text-slate-500 text-sm font-bold tracking-wide uppercase">{card.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search + Filter bar */}
      <div className="relative z-10 bg-white/80 backdrop-blur-xl p-2 rounded-2xl border border-white shadow-sm ring-1 ring-slate-900/5 flex flex-col md:flex-row gap-2">
        <div className="flex-1 flex flex-col md:flex-row gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-transparent rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
              placeholder="Nhập tên hoặc mã số sinh viên..."
              type="text"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="h-12 pl-4 pr-10 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-transparent rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all cursor-pointer min-w-[170px]"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="SUBMITTED">Chưa chấm</option>
              <option value="GRADING">Đang chấm</option>
              <option value="GRADED">Đã chấm</option>
            </select>

            <select
              value={size}
              onChange={(e) => handleSizeChange(e.target.value)}
              className="h-12 pl-4 pr-10 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-transparent rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all cursor-pointer min-w-[140px]"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n} dòng / trang</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0">
          {!isGradingInProgress ? (
            <button
              onClick={handleTriggerGrading}
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
                onClick={handleStopGrading}
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

      {/* Loading Base */}
      {loading && (
        <div className="relative z-10 bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-sm ring-1 ring-slate-900/5 p-16 text-center text-slate-500 flex flex-col items-center justify-center min-h-[400px]">
          <div className="relative w-12 h-12 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100 mix-blend-multiply" />
            <div className="absolute inset-0 rounded-full border-4 border-[#F37120] border-t-transparent animate-spin" />
          </div>
          <p className="font-bold text-slate-700 text-lg mb-1">Đang tải dữ liệu...</p>
          <p className="text-sm">Vui lòng chờ trong giây lát</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="relative z-10 bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 flex items-start gap-3 shadow-sm">
          <span className="material-symbols-outlined text-red-500 mt-0.5">error</span>
          <div>
            <h4 className="font-bold">Đã xảy ra lỗi</h4>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Table Section */}
      {!loading && !error && (
        <div ref={tableSectionRef} className="relative z-10 bg-white/70 backdrop-blur-xl rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] ring-1 ring-slate-900/5 mt-8 overflow-hidden flex flex-col">
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

          <div className="overflow-hidden p-6 pt-2">
            <table className="w-full text-left border-separate border-spacing-y-3">
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
                {rows.map((it, idx) => {
                  const statusBadge = getSubmissionStatusBadge(it.submissionStatus);
                  const resultBadge = getResultBadge(it.gradingStatus);
                  const hasScore    = it.totalScore != null;
                  const rowNum      = pagination.page * pagination.size + idx + 1;
                  const selectable  = isRowSelectable(it);
                  const checked     = !!it?.submissionId && selectedSubmissionIds.includes(it.submissionId);
                  return (
                    <tr key={it.submissionId ?? idx}
                      className="group bg-white hover:bg-slate-50/70 transition-all duration-300 rounded-2xl shadow-sm ring-1 ring-slate-200/50 hover:ring-orange-200 hover:shadow-lg hover:-translate-y-[2px] cursor-default">
                      <td className="px-4 py-4 text-center rounded-l-2xl transition-colors">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!selectable || isGradingInProgress}
                          onChange={(e) => toggleSelectOne(it?.submissionId, e.target.checked)}
                          className="w-4.5 h-4.5 rounded border-slate-300 text-[#F37120] focus:ring-[#F37120] transition-colors cursor-pointer disabled:opacity-40"
                        />
                      </td>
                      <td className="px-3 py-4 text-center text-[13px] font-black text-slate-400 transition-colors group-hover:text-[#F37120]">{rowNum}</td>
                      <td className="px-3 py-4 transition-colors">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center shrink-0 border border-indigo-100 shadow-inner">
                            <span className="text-sm font-black text-indigo-600">
                              {String(it.studentName || '—').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[15px] font-black text-slate-800 truncate" title={it.studentName ?? '—'}>
                              {it.studentName ?? '—'}
                            </span>
                            {it.studentEmail && (
                              <span className="text-xs font-semibold text-slate-500 truncate mt-0.5" title={it.studentEmail}>
                                {it.studentEmail}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 transition-colors">
                        <span className="inline-flex px-2.5 py-1.5 rounded-lg bg-slate-100/80 text-xs font-mono font-bold text-slate-600 shadow-sm border border-slate-200/50">
                          {it.studentCode ?? 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 py-4 transition-colors">
                        <div className="flex flex-col gap-1.5 min-w-0">
                          <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 truncate bg-slate-50 px-2 py-1 rounded">
                            <span className="material-symbols-outlined text-[15px] text-[#F37120] shrink-0">schedule</span>
                            <span className="truncate">{fmtDateTime(it.submittedAt)}</span>
                          </span>
                          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 truncate bg-slate-50 px-2 py-1 rounded">
                            <span className="material-symbols-outlined text-[15px] text-emerald-500 shrink-0">description</span>
                            <span className="truncate">{fmtSize(it.fileSizeBytes)}</span>
                          </span>
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-3 py-4 transition-colors">
                        <div className="flex justify-center">
                          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black shadow-sm border uppercase tracking-wider ${statusBadge.cls}`}>
                            {String(it?.submissionStatus || '').toUpperCase() === 'GRADING' && (
                              <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                              </span>
                            )}
                            {statusBadge.label}
                          </span>
                        </div>
                      </td>

                      {/* Điểm số */}
                      <td className="px-3 py-4 transition-colors text-center">
                        {hasScore ? (
                          <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200/50 shadow-sm text-orange-900">
                            <span className="text-lg font-black leading-none">{Number(it.totalScore).toFixed(1)}</span>
                            <span className="text-xs font-black opacity-40">/{Number(it.maxScore || 10).toFixed(0)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-extrabold text-lg">—</span>
                        )}
                      </td>

                      {/* Kết quả (PASS / FAIL) */}
                      <td className="px-3 py-4 transition-colors">
                        <div className="flex justify-center">
                          {resultBadge ? (
                            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black shadow-sm uppercase tracking-wider ${resultBadge.cls}`}>
                              <span className="material-symbols-outlined text-[15px]">
                                {String(it.gradingStatus || '').toUpperCase() === 'PASS' ? 'verified' : 'cancel'}
                              </span>
                              {resultBadge.label}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-sm font-bold">—</span>
                          )}
                        </div>
                      </td>

                      {/* Hành động */}
                      <td className="px-4 py-4 transition-colors rounded-r-2xl">
                        <div className="flex items-center justify-center gap-2 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity duration-300">
                          <button
                             type="button"
                             title="Chấm lại bài này"
                             disabled={isGradingInProgress || isTriggering}
                             onClick={async () => {
                               if (!it?.submissionId || isGradingInProgress || isTriggering) return;
                               try {
                                 setIsTriggering(true);
                                 await gradingApi.triggerSingleGrading(activeExamId, activeBlockId, it.submissionId);
                                 setRows((prev) => prev.map((r) =>
                                   r?.submissionId === it.submissionId ? { ...r, submissionStatus: 'GRADING' } : r
                                 ));
                                 setOptimisticRun({ active: true, total: 1, scope: 'selected', startedAt: Date.now() });
                                 message.success(`Đã bắt đầu chấm lại bài của ${it.studentName ?? 'sinh viên'}.`);
                                 loadProgress();
                               } catch (e) {
                                 message.error(e?.response?.data?.message || 'Không thể chấm lại bài này.');
                               } finally {
                                 setIsTriggering(false);
                               }
                             }}
                             className="flex items-center justify-center w-10 h-10 text-slate-400 hover:text-orange-600 hover:bg-orange-100 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-slate-50 shadow-sm border border-slate-200 hover:shadow-orange-200/50 hover:scale-105 active:scale-95"
                           >
                             <span className="material-symbols-outlined text-[20px]">sync</span>
                           </button>
                           <button
                             type="button"
                             title="Xem chi tiết"
                             onClick={() => handleOpenSubmissionDetail(it)}
                             className="flex items-center justify-center w-10 h-10 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all bg-slate-50 shadow-sm border border-slate-200 hover:shadow-indigo-200/50 hover:scale-105 active:scale-95"
                           >
                             <span className="material-symbols-outlined text-[20px]">visibility</span>
                           </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-6 py-28 text-center rounded-b-[32px]">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center shadow-inner">
                           <span className="material-symbols-outlined text-4xl text-slate-300">search_off</span>
                        </div>
                        <p className="text-base font-bold text-slate-400">Không tìm thấy bài nộp nào phù hợp trong Block này.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-8 py-5 border-t border-slate-200/50 bg-white/50 flex flex-col sm:flex-row items-center justify-between gap-6 mt-auto">
              <p className="text-sm font-semibold text-slate-500">
                Hiển thị mục <span className="font-black text-slate-900">{pagination.page * pagination.size + 1}</span> đến <span className="font-black text-slate-900">{Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)}</span> trong số <span className="font-black text-[#F37120]">{pagination.totalElements}</span>
              </p>
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl shadow-inner border border-slate-200/50">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_left</span>
                </button>

                {pageNumbers.map((p, i) =>
                  p === '...'
                    ? <span key={`ellipsis-${i}`} className="px-2 font-black text-slate-400 text-sm">...</span>
                    : (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`min-w-[36px] h-9 rounded-xl text-sm font-black transition-all
                          ${p === currentPage
                            ? 'bg-gradient-to-r from-orange-500 to-[#F37120] text-white shadow-lg shadow-orange-500/40 translate-y-[-2px]'
                            : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm'}`}
                      >
                        {p + 1}
                      </button>
                    )
                )}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

