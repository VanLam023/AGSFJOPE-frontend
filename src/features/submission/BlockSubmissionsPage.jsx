import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import examApi from '../../services/examApi';
import blockApi from '../../services/blockApi';
import submissionApi from '../../services/submissionApi';
import gradingApi from '../../services/gradingApi';
import {
  BackSection,
  ErrorState,
  FilterBar,
  HeaderSection,
  LoadingState,
  PageBackdrop,
  StatsGrid,
  SubmissionsTableCard,
} from './components/block-submissions/BlockSubmissionsPieces.jsx';
import {
  extractApiErrorMessage,
  fmtDateTime,
  fmtSize,
  getResultBadge,
  getSubmissionStatusBadge,
  isBrowserFileDownloadSupported,
  mapGradingResultsFallback,
  normalizeSubmissionsPayload,
  saveBlobFile,
  slugifyFilePart,
} from './components/block-submissions/blockSubmissions.helpers.js';

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
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  });
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
  }, [activeBlockId, activeExamId]);

  const loadProgress = useCallback(async () => {
    if (!activeExamId || !activeBlockId) return;
    try {
      const pRes = await gradingApi.getProgress(activeExamId, activeBlockId);
      const p = pRes?.data?.data ?? pRes?.data ?? pRes ?? null;
      setProgress(p);

      const serverInProgress =
        String(p?.status || '').toUpperCase() === 'IN_PROGRESS' ||
        Number(p?.gradingCount || 0) > 0;
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
  }, [activeBlockId, activeExamId]);

  const loadData = useCallback(
    async (opts = {}) => {
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
            console.warn(
              '[BlockSubmissionsPage] getBlockSubmissions with params failed, retry without params:',
              firstErr
            );
            subsRes = await submissionApi.getBlockSubmissions(activeExamId, activeBlockId);
          }

          const { data: list, pagination: pag, stats: statData } = normalizeSubmissionsPayload(subsRes);

          if (
            (pag?.totalElements ?? 0) > 0 &&
            Array.isArray(list) &&
            list.length === 0 &&
            p > 0 &&
            !opts.__pageReset
          ) {
            setPage(0);
            await loadData({
              page: 0,
              size: s,
              search: q,
              statusFilter: st,
              __pageReset: true,
            });
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
              const matchesStatus =
                !st ||
                String(it?.submissionStatus || '').toUpperCase() === String(st).toUpperCase();
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
              const matchesStatus =
                !st ||
                String(it?.submissionStatus || '').toUpperCase() === String(st).toUpperCase();
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
              submitted: normalized.filter(
                (x) => String(x?.submissionStatus || '').toUpperCase() === 'SUBMITTED'
              ).length,
              grading: normalized.filter(
                (x) => String(x?.submissionStatus || '').toUpperCase() === 'GRADING'
              ).length,
              graded: normalized.filter(
                (x) => String(x?.submissionStatus || '').toUpperCase() === 'GRADED'
              ).length,
            });

            console.warn(
              '[BlockSubmissionsPage] fallback to grading/results due to submissions endpoint error:',
              submissionErr
            );
          } catch (fallbackErr) {
            console.error(
              '[BlockSubmissionsPage] both submissions endpoint and fallback failed:',
              submissionErr,
              fallbackErr
            );
            setRows([]);
            setPagination({ page: 0, size: s, totalElements: 0, totalPages: 1 });
            setStats({ total: 0, submitted: 0, grading: 0, graded: 0 });
            setError(
              extractApiErrorMessage(
                fallbackErr,
                extractApiErrorMessage(
                  submissionErr,
                  'Không thể tải danh sách bài nộp. Vui lòng thử lại.'
                )
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
    },
    [activeBlockId, activeExamId, page, search, size, statusFilter]
  );

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  const handleSearchInput = useCallback((value) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
      setPage(0);
    }, 400);
  }, []);

  const handleStatusChange = useCallback(
    (value) => {
      setStatusFilter(value);
      setPage(0);
      shouldScrollAfterLoadRef.current = true;
      scrollToTableTop();
    },
    [scrollToTableTop]
  );

  const handleSizeChange = useCallback(
    (value) => {
      setSize(Number(value));
      setPage(0);
      shouldScrollAfterLoadRef.current = true;
      scrollToTableTop();
    },
    [scrollToTableTop]
  );

  const handlePageChange = useCallback(
    (nextPage) => {
      shouldScrollAfterLoadRef.current = true;
      setPage(nextPage);
      scrollToTableTop();
    },
    [scrollToTableTop]
  );

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

  const serverGradingInProgress =
    String(progress?.status || '').toUpperCase() === 'IN_PROGRESS' ||
    Number(progress?.gradingCount || 0) > 0;
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
  }, [activeBlockId, activeExamId, isGradingInProgress, loadProgress]);

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
    const status = String(item?.submissionStatus || '').toUpperCase();
    return status === 'SUBMITTED' || status === 'GRADED';
  }, []);

  const visibleSelectableIds = useMemo(
    () => rows.filter(isRowSelectable).map((item) => item?.submissionId).filter(Boolean),
    [isRowSelectable, rows]
  );

  const selectedIdSet = useMemo(() => new Set(selectedSubmissionIds), [selectedSubmissionIds]);

  const visibleSelectedCount = useMemo(
    () => visibleSelectableIds.filter((id) => selectedIdSet.has(id)).length,
    [selectedIdSet, visibleSelectableIds]
  );

  const selectedCount = selectedSubmissionIds.length;
  const allVisibleSelected =
    visibleSelectableIds.length > 0 && visibleSelectedCount === visibleSelectableIds.length;

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

  const toggleSelectAllVisible = useCallback(
    (checked) => {
      setSelectedSubmissionIds((prev) => {
        if (checked) {
          const merged = new Set([...prev, ...visibleSelectableIds]);
          return Array.from(merged);
        }
        return prev.filter((id) => !visibleSelectableIds.includes(id));
      });
    },
    [visibleSelectableIds]
  );

  const handleTriggerGrading = useCallback(async () => {
    if (!activeExamId || !activeBlockId || isTriggering || isGradingInProgress) return;

    try {
      setIsTriggering(true);
      const isSelectedMode = selectedCount > 0;
      const idsToGrade =
        selectedCount > 0
          ? selectedSubmissionIds
          : rows
              .filter((item) => {
                const status = String(item?.submissionStatus || '').toUpperCase();
                return status === 'SUBMITTED' || status === 'GRADED';
              })
              .map((item) => item?.submissionId)
              .filter(Boolean);

      const statusById = new Map(
        rows.map((item) => [item?.submissionId, String(item?.submissionStatus || '').toUpperCase()])
      );
      const selectedSubmittedCount = idsToGrade.filter(
        (id) => statusById.get(id) === 'SUBMITTED'
      ).length;
      const selectedGradedCount = idsToGrade.filter((id) => statusById.get(id) === 'GRADED').length;
      const allSubmittedCount = Number(stats?.submitted || 0);
      const allGradedCount = Number(stats?.graded || 0);
      const submittedForUpdate = isSelectedMode ? selectedSubmittedCount : allSubmittedCount;
      const gradedForUpdate = isSelectedMode ? selectedGradedCount : allGradedCount;
      const expectedTotal = isSelectedMode
        ? idsToGrade.length
        : allSubmittedCount + allGradedCount;

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
        setRows((prev) =>
          prev.map((item) => {
            const status = String(item?.submissionStatus || '').toUpperCase();
            const isGradeable = status === 'SUBMITTED' || status === 'GRADED';
            const shouldMove = isSelectedMode
              ? !!item?.submissionId && idSet.has(item.submissionId)
              : isGradeable;
            if (!shouldMove) return item;
            return { ...item, submissionStatus: 'GRADING' };
          })
        );

        if (expectedTotal > 0) {
          setStats((prev) => ({
            ...prev,
            submitted: Math.max(0, Number(prev?.submitted || 0) - submittedForUpdate),
            graded: Math.max(0, Number(prev?.graded || 0) - gradedForUpdate),
            grading: Math.max(0, Number(prev?.grading || 0) + expectedTotal),
          }));
        }
      }

      message.success(
        selectedCount > 0
          ? `Đã bắt đầu chấm ${selectedCount} bài đã chọn.`
          : 'Đã bắt đầu chấm tất cả bài nộp.'
      );
      setSelectedSubmissionIds([]);
      loadProgress();
    } catch (error) {
      setOptimisticRun(null);
      message.error(
        extractApiErrorMessage(error, 'Không thể bắt đầu chấm bài. Vui lòng thử lại.')
      );
    } finally {
      setIsTriggering(false);
    }
  }, [
    activeBlockId,
    activeExamId,
    isGradingInProgress,
    isTriggering,
    loadProgress,
    rows,
    selectedCount,
    selectedSubmissionIds,
    stats,
  ]);

  const handleStopGrading = useCallback(async () => {
    if (!activeExamId || !activeBlockId || isStopping || !isGradingInProgress) return;
    try {
      setIsStopping(true);
      setOptimisticRun((prev) => (prev ? { ...prev, active: false } : prev));
      await gradingApi.stopGrading(activeExamId, activeBlockId);
      message.success('Đã gửi yêu cầu dừng chấm.');
      await Promise.all([loadData(), loadProgress()]);
    } catch (error) {
      message.error(
        extractApiErrorMessage(error, 'Không thể dừng chấm bài. Vui lòng thử lại.')
      );
    } finally {
      setIsStopping(false);
    }
  }, [activeBlockId, activeExamId, isGradingInProgress, isStopping, loadData, loadProgress]);

  const handleOpenSubmissionDetail = useCallback(
    (item) => {
      const submissionId = item?.submissionId;
      if (!submissionId || !activeExamId || !activeBlockId) {
        message.warning('Không tìm thấy thông tin bài nộp để xem chi tiết.');
        return;
      }

      const canOpen =
        Boolean(item?.gradingResultId) ||
        String(item?.submissionStatus || '').toUpperCase() === 'GRADED';
      if (!canOpen) {
        message.info('Bài này chưa có kết quả chấm để xem chi tiết.');
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
              studentEmail: item?.studentEmail ?? null,
              submissionStatus: item?.submissionStatus ?? null,
              status: item?.gradingStatus ?? null,
              gradingResultId: item?.gradingResultId ?? null,
              totalScore: item?.totalScore ?? null,
              maxScore: item?.maxScore ?? null,
              gradedAt: item?.gradedAt ?? null,
            },
          },
        }
      );
    },
    [activeBlockId, activeExamId, navigate]
  );

  const handleRegradeOne = useCallback(
    async (item) => {
      if (!item?.submissionId || isGradingInProgress || isTriggering) return;

      try {
        setIsTriggering(true);
        await gradingApi.triggerSingleGrading(activeExamId, activeBlockId, item.submissionId);

        setRows((prev) =>
          prev.map((row) =>
            row?.submissionId === item.submissionId
              ? {
                  ...row,
                  submissionStatus: 'GRADING',
                  gradingResultId: null,
                  gradingStatus: null,
                  totalScore: null,
                  maxScore: null,
                  gradedAt: null,
                }
              : row
          )
        );

        setOptimisticRun({
          active: true,
          total: 1,
          scope: 'selected',
          startedAt: Date.now(),
        });

        message.success(`Đã bắt đầu chấm lại bài của ${item?.studentName ?? 'sinh viên'}.`);
        loadProgress();
      } catch (error) {
        message.error(extractApiErrorMessage(error, 'Không thể chấm lại bài này.'));
      } finally {
        setIsTriggering(false);
      }
    },
    [activeBlockId, activeExamId, isGradingInProgress, isTriggering, loadProgress]
  );

  const downloadProtectedFile = useCallback(async (endpoint, defaultFileName, unsupportedMessage) => {
    if (!isBrowserFileDownloadSupported()) {
      message.warning(unsupportedMessage || 'Web chưa hỗ trợ tải file ở màn này.');
      return false;
    }

    try {
      const response = await axiosClient.get(endpoint, { responseType: 'blob' });
      const blob =
        response instanceof Blob
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

    const headers = [
      'STT',
      'Sinh viên',
      'Mã SV',
      'Email',
      'Thời gian nộp',
      'Dung lượng',
      'Trạng thái',
      'Điểm số',
      'Kết quả',
    ];

    const csvRows = rows.map((item, idx) => {
      const statusBadge = getSubmissionStatusBadge(item.submissionStatus);
      const resultBadge = getResultBadge(item.gradingStatus);
      const score =
        item.totalScore != null
          ? `${Number(item.totalScore).toFixed(2)}/${Number(item.maxScore || 10).toFixed(0)}`
          : '—';
      return [
        pagination.page * pagination.size + idx + 1,
        item.studentName ?? '',
        item.studentCode ?? '',
        item.studentEmail ?? '',
        fmtDateTime(item.submittedAt),
        fmtSize(item.fileSizeBytes),
        statusBadge.label,
        score,
        resultBadge ? resultBadge.label : '—',
      ];
    });

    const escapeCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [headers, ...csvRows].map((row) => row.map(escapeCell).join(',')).join('\n');
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

  const renderedRows = useMemo(
    () =>
      rows.map((item, idx) => ({
        item,
        rowNum: pagination.page * pagination.size + idx + 1,
        selectable: isRowSelectable(item),
        checked: !!item?.submissionId && selectedIdSet.has(item.submissionId),
      })),
    [isRowSelectable, pagination.page, pagination.size, rows, selectedIdSet]
  );

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
        <SubmissionsTableCard
          tableSectionRef={tableSectionRef}
          pagination={pagination}
          allVisibleSelected={allVisibleSelected}
          visibleSelectableIds={visibleSelectableIds}
          isGradingInProgress={isGradingInProgress}
          toggleSelectAllVisible={toggleSelectAllVisible}
          renderedRows={renderedRows}
          disabled={isGradingInProgress || isTriggering}
          onToggleSelect={toggleSelectOne}
          onRegrade={handleRegradeOne}
          onOpenDetail={handleOpenSubmissionDetail}
          pageNumbers={pageNumbers}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
