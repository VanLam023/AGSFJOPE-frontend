import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import StatisticsSectionCard from './StatisticsSectionCard.jsx';
import { formatPercent } from '../utils/statisticsHelpers';

export default function StatisticsOopViolationChart({ items }) {
  const chartOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      backgroundColor: 'rgba(15, 23, 42, 0.94)',
      borderWidth: 0,
      textStyle: {
        color: '#f8fafc',
        fontFamily: 'Inter, sans-serif',
      },
      formatter: (params) => {
        const point = params?.[0]?.data;
        if (!point) return '';
        return [
          `<div style="font-weight:700;margin-bottom:4px;">${point.label}</div>`,
          `<div>Số lượt vi phạm: <b>${point.count.toLocaleString('vi-VN')}</b></div>`,
          `<div>Tỷ lệ: <b>${formatPercent(point.rate)}</b></div>`,
        ].join('');
      },
    },
    grid: {
      left: 110,
      right: 18,
      top: 20,
      bottom: 24,
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: {
        lineStyle: {
          color: '#f1f5f9',
        },
      },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 11,
      },
    },
    yAxis: {
      type: 'category',
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: {
        color: '#475569',
        fontSize: 12,
        fontWeight: 700,
      },
      data: items.map((item) => item.label),
    },
    series: [
      {
        type: 'bar',
        barWidth: 18,
        data: items.map((item, index) => ({
          value: item.count,
          label: item.label,
          count: item.count,
          rate: item.rate,
          itemStyle: {
            color: ['#F37120', '#fb923c', '#fdba74', '#f59e0b', '#f97316'][index % 5],
            borderRadius: 0,
          },
        })),
        label: {
          show: true,
          position: 'right',
          color: '#64748b',
          fontWeight: 700,
          formatter: ({ data }) => formatPercent(data?.rate ?? 0),
        },
      },
    ],
    animationDuration: 450,
  }), [items]);

  return (
    <StatisticsSectionCard title="Thống kê sai OOP theo tiêu chí" className="h-full">
      {!items.length ? (
        <p className="text-sm text-slate-500">Chưa có dữ liệu AI OOP để phân tích.</p>
      ) : (
        <div className="space-y-4">
          <div className="h-[260px]">
            <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} notMerge />
          </div>
          <p className="text-xs text-slate-400">
            Hover vào từng thanh để xem số lượt vi phạm và tỷ lệ theo từng tiêu chí OOP.
          </p>
        </div>
      )}
    </StatisticsSectionCard>
  );
}