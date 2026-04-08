import React, { Suspense, lazy, useCallback, useMemo, useState } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import statisticsApi from '../../../services/statisticsApi';
import StatisticsBlocksComparisonTable from './components/StatisticsBlocksComparisonTable.jsx';
import StatisticsHeader from './components/StatisticsHeader.jsx';
import StatisticsMetricCards from './components/StatisticsMetricCards.jsx';
import useBlockStatisticsData from './hooks/useBlockStatisticsData.js';
import {
  buildAiOverviewSummary,
  buildAppealFinanceCards,
  buildAppealStatusItems,
  buildComparisonRows,
  buildMetricCards,
  buildPassFailSummary,
  buildOopViolationItems,
  formatScore,
  getBlockDisplayName,
  normalizeDistribution,
} from './utils/statisticsHelpers.js';

const StatisticsScoreDistribution = lazy(() => import('./components/StatisticsScoreDistribution.jsx'));
const StatisticsPassFailCard = lazy(() => import('./components/StatisticsPassFailCard.jsx'));
const StatisticsAiOverviewCard = lazy(() => import('./components/StatisticsAiOverviewCard.jsx'));
const StatisticsOopViolationChart = lazy(() => import('./components/StatisticsOopViolationChart.jsx'));
const StatisticsAppealStatusChart = lazy(() => import('./components/StatisticsAppealStatusChart.jsx'));
const StatisticsAppealFinanceChart = lazy(() => import('./components/StatisticsAppealFinanceChart.jsx'));

function resolveBlobPayload(payload) {
  if (payload instanceof Blob) return payload;
  if (payload?.data instanceof Blob) return payload.data;
  return null;
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function ChartSkeleton({ className = 'h-[320px]' }) {
  return <div className={`rounded-3xl bg-slate-100 animate-pulse ${className}`.trim()} />;
}

export default function BlockStatisticsPage({ examId, blockId, onBack }) {
  const navigate = useNavigate();
  const [exportingExcel, setExportingExcel] = useState(false);
  const {
    exam,
    currentBlock,
    examBlocks,
    statistics,
    comparisonMap,
    loading,
    error,
    comparisonLoading,
    reload,
  } = useBlockStatisticsData({ examId, blockId });

  const metricCards = useMemo(() => buildMetricCards(statistics), [statistics]);
  const scoreDistribution = useMemo(
    () => normalizeDistribution(statistics?.scoreAnalysis?.distribution),
    [statistics?.scoreAnalysis?.distribution],
  );
  const passFailSummary = useMemo(() => buildPassFailSummary(statistics), [statistics]);
  const aiOverview = useMemo(() => buildAiOverviewSummary(statistics), [statistics]);
  const oopViolationItems = useMemo(() => buildOopViolationItems(statistics), [statistics]);
  const appealStatusItems = useMemo(() => buildAppealStatusItems(statistics), [statistics]);
  const appealFinanceCards = useMemo(() => buildAppealFinanceCards(statistics), [statistics]);
  const comparisonRows = useMemo(
    () => buildComparisonRows(examBlocks, comparisonMap),
    [examBlocks, comparisonMap],
  );

  const handleExportExcel = useCallback(async () => {
    if (!examId || !blockId) return;

    setExportingExcel(true);
    try {
      const result = await statisticsApi.exportStatisticsReport(examId, blockId);
      const blob = resolveBlobPayload(result);
      if (!blob) {
        throw new Error('Không nhận được file export hợp lệ.');
      }
      const safeBlockName = (currentBlock?.name || 'block').replace(/\s+/g, '-').toLowerCase();
      downloadBlob(blob, `statistics-report-${safeBlockName}.xlsx`);
      message.success('Xuất báo cáo Excel thành công.');
    } catch (err) {
      message.error(err?.response?.data?.message || 'Xuất báo cáo Excel thất bại.');
    } finally {
      setExportingExcel(false);
    }
  }, [blockId, currentBlock?.name, examId]);

  const handleOpenBlock = useCallback((targetBlockId) => {
    if (!examId || !targetBlockId) return;
    navigate(`/exam-staff/exams/${examId}/blocks/${targetBlockId}/statistics`);
  }, [examId, navigate]);

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 py-8 space-y-6 animate-pulse">
        <div className="h-8 w-40 bg-slate-200 rounded-lg" />
        <div className="h-24 bg-slate-100 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-28 bg-slate-100 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 h-96 bg-slate-100 rounded-3xl" />
          <div className="h-96 bg-slate-100 rounded-3xl" />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="h-96 bg-slate-100 rounded-3xl" />
          <div className="h-96 bg-slate-100 rounded-3xl" />
          <div className="h-96 bg-slate-100 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-8 space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-[#F37120] transition-colors text-sm font-semibold"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Quay lại block
        </button>

        <div className="bg-rose-50 border border-rose-200 rounded-3xl px-6 py-5 text-rose-700 space-y-3">
          <p className="font-bold">Không thể tải trang thống kê.</p>
          <p>{error}</p>
          <button
            type="button"
            onClick={reload}
            className="text-sm font-bold underline hover:no-underline"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8F7F5] min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 py-8 space-y-6">
        <StatisticsHeader
          title={getBlockDisplayName(currentBlock, exam)}
          subtitle={`Điểm trung bình hiện tại: ${formatScore(statistics?.scoreAnalysis?.avgScore)}`}
          onBack={onBack}
          onExportExcel={handleExportExcel}
          exportingExcel={exportingExcel}
        />

        <StatisticsMetricCards cards={metricCards} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <Suspense fallback={<ChartSkeleton className="h-[420px]" />}>
              <StatisticsScoreDistribution distribution={scoreDistribution} />
            </Suspense>
          </div>
          <div>
            <Suspense fallback={<ChartSkeleton className="h-[420px]" />}>
              <StatisticsPassFailCard summary={passFailSummary} />
            </Suspense>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div>
            <Suspense fallback={<ChartSkeleton className="h-[340px]" />}>
              <StatisticsAiOverviewCard summary={aiOverview} />
            </Suspense>
          </div>
          <div className="xl:col-span-2">
            <Suspense fallback={<ChartSkeleton className="h-[340px]" />}>
              <StatisticsOopViolationChart items={oopViolationItems} />
            </Suspense>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Suspense fallback={<ChartSkeleton className="h-[380px]" />}>
            <StatisticsAppealStatusChart items={appealStatusItems} />
          </Suspense>
          <Suspense fallback={<ChartSkeleton className="h-[380px]" />}>
            <StatisticsAppealFinanceChart cards={appealFinanceCards} />
          </Suspense>
        </div>

        <StatisticsBlocksComparisonTable
          rows={comparisonRows}
          loading={comparisonLoading}
          onOpenBlock={handleOpenBlock}
        />
      </div>
    </div>
  );
}