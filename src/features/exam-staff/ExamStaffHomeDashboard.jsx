import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfigProvider, Table, Spin, Empty } from 'antd';
import DashboardCard from '../../components/DashboardCard.jsx';
import { examStatusConfig, appealStatusConfig } from './config.jsx';
import { useStaffDashboard } from '../../hooks';
import ReactECharts from 'echarts-for-react';

const CARD_ICON = ['timer', 'description', 'check_circle', 'priority_high'];

const fmtCount = (n) => {
  if (n == null || n === '') return '—';
  return Number(n).toLocaleString('vi-VN');
};

const getInitials = (name) => {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const AVATAR_RING = [
  'bg-[#F37021]/10 text-[#F37021] border-[#F37021]/20',
  'bg-slate-200 text-slate-600 border-slate-300',
  'bg-emerald-100 text-emerald-800 border-emerald-200',
  'bg-violet-100 text-violet-800 border-violet-200',
];

const formatDateTime = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

export default function ExamStaffHomeDashboard() {
  const navigate = useNavigate();
  const {
    overview,
    recentExams,
    gradeDistribution,
    pendingAppeals,
    loading,
    errors,
  } = useStaffDashboard({ recentExamsLimit: 5, pendingAppealsLimit: 10 });

  const metricCards = useMemo(() => {
    const o = overview;
    return [
      {
        id: '1',
        title: 'Kỳ thi đang diễn ra',
        value: fmtCount(o?.activeExams),
        iconName: CARD_ICON[0],
      },
      {
        id: '2',
        title: 'Tổng bài nộp',
        value: fmtCount(o?.totalSubmissions),
        iconName: CARD_ICON[1],
      },
      {
        id: '3',
        title: 'Bài đã chấm',
        value: fmtCount(o?.gradedSubmissions),
        iconName: CARD_ICON[2],
      },
      {
        id: '4',
        title: 'Phúc khảo chờ xử lý',
        value: fmtCount(o?.pendingAppeals),
        iconName: CARD_ICON[3],
      },
    ];
  }, [overview]);

  const totalGraded = gradeDistribution?.totalGraded ?? 0;

  const gradeRanges = useMemo(
    () => gradeDistribution?.ranges ?? [],
    [gradeDistribution],
  );

  const activeGradeIndex = useMemo(() => {
    if (!gradeRanges.length) return -1;
    let max = -1;
    let idx = 0;
    gradeRanges.forEach((r, i) => {
      const c = Number(r.count ?? 0);
      if (c > max) {
        max = c;
        idx = i;
      }
    });
    return max > 0 ? idx : -1;
  }, [gradeRanges]);

  const gradeBarChartOption = useMemo(() => {
    const labels = gradeRanges.map((r) => r.label ?? '');
    const data = gradeRanges.map((r, i) => {
      const v = Number(r.count ?? 0);
      const active = i === activeGradeIndex;
      return {
        value: v,
        itemStyle: {
          color: active ? '#F37021' : '#e2e8f0',
          borderRadius: [6, 6, 0, 0],
          shadowBlur: active ? 6 : 0,
          shadowColor: active ? 'rgba(243, 112, 33, 0.35)' : 'transparent',
        },
      };
    });

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const p = Array.isArray(params) ? params[0] : params;
          const idx = p?.dataIndex ?? 0;
          const r = gradeRanges[idx];
          if (!r) return '';
          const cnt = fmtCount(r.count);
          return `${r.label ?? ''}<br/>Số bài: ${cnt}`;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '8%',
        containLabel: true,
      },
      xAxis: [
        {
          type: 'category',
          data: labels,
          axisTick: { alignWithLabel: true },
          axisLabel: {
            color: '#64748b',
            fontSize: 11,
            fontWeight: 600,
          },
        },
      ],
      yAxis: [
        {
          type: 'value',
          min: 0,
          minInterval: 1,
          axisLabel: {
            formatter: (val) =>
              Number(val).toLocaleString('vi-VN'),
          },
          splitLine: { lineStyle: { color: '#f1f5f9' } },
        },
      ],
      series: [
        {
          name: 'Phân bố',
          type: 'bar',
          barWidth: '60%',
          data,
        },
      ],
    };
  }, [gradeRanges, activeGradeIndex]);

  const examColumns = useMemo(
    () => [
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold">
            TÊN KỲ THI
          </p>
        ),
        dataIndex: 'name',
        key: 'name',
        ellipsis: true,
      },
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold">HỌC KỲ</p>
        ),
        dataIndex: 'semester',
        key: 'semester',
      },
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold">
            TRẠNG THÁI
          </p>
        ),
        dataIndex: 'status',
        key: 'status',
        render: (status) => {
          const cfg = examStatusConfig[status] ?? examStatusConfig.COMPLETED;
          return (
            <span
              className={`px-3 py-1 rounded-md text-xs font-bold border ${cfg.cls}`}
            >
              {cfg.label}
            </span>
          );
        },
      },
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold text-center">
            THAO TÁC
          </p>
        ),
        key: 'action',
        width: 140,
        render: (_, record) => (
          <div className="flex justify-center align-middle">
            <button
              type="button"
              className="bg-white border whitespace-nowrap border-slate-300 text-slate-700 hover:text-[#F37021] hover:border-[#F37021] px-3 py-2 rounded-md text-xs font-bold transition-all shadow-sm"
              onClick={() =>
                record.examId && navigate(`/exam-staff/exams/${record.examId}`)
              }
            >
              Xem chi tiết
            </button>
          </div>
        ),
      },
    ],
    [navigate],
  );

  const appealColumns = useMemo(
    () => [
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold">
            TÊN SINH VIÊN
          </p>
        ),
        key: 'student',
        render: (_, record, index) => (
          <div className="flex items-center gap-4">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border ${AVATAR_RING[index % AVATAR_RING.length]}`}
            >
              {getInitials(record.studentName)}
            </div>
            <div>
              <p className="font-bold text-slate-800">
                {record.studentName ?? '—'}
              </p>
              <p className="text-xs text-slate-500 uppercase tracking-wide mt-0.5 font-medium">
                {record.studentMssv ?? '—'}
              </p>
            </div>
          </div>
        ),
      },
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold">
            TÊN KỲ THI
          </p>
        ),
        dataIndex: 'examName',
        key: 'examName',
        ellipsis: true,
      },
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold">
            TRẠNG THÁI
          </p>
        ),
        dataIndex: 'status',
        key: 'status',
        render: (status) => {
          const cfg = appealStatusConfig[status] ?? appealStatusConfig.PENDING;
          return (
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold border ${cfg.cls}`}
            >
              <span className="material-symbols-outlined text-[12px]">
                {cfg.icon ?? 'help'}
              </span>
              {cfg.label}
            </span>
          );
        },
      },
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold">
            THỜI GIAN
          </p>
        ),
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 160,
        render: (t) => (
          <span className="text-xs text-slate-600 whitespace-nowrap">
            {formatDateTime(t)}
          </span>
        ),
      },
      {
        title: (
          <p className="text-xs text-center uppercase tracking-wider font-bold">
            THAO TÁC
          </p>
        ),
        key: 'action',
        width: 130,
        render: () => (
          <div className="flex justify-center align-middle">
            <button
              type="button"
              className="bg-white text-nowrap border border-slate-300 text-slate-700 hover:text-[#F37021] hover:border-[#F37021] px-3 py-2 rounded-md text-xs font-bold transition-all shadow-sm"
              onClick={() => navigate('/exam-staff/appeals')}
            >
              Xem chi tiết
            </button>
          </div>
        ),
      },
    ],
    [navigate],
  );

  const pendingCount = overview?.pendingAppeals ?? pendingAppeals.length;

  return (
    <ConfigProvider
      theme={{
        components: {
          Table: {
            cellPaddingInline: 24,
            headerBg: '#f8fafc',
            headerColor: '#45556c',
            headerSplitColor: 'transparent',
            rowHoverBg: 'rgb(243, 112, 33, 0.05)',
          },
        },
      }}
    >
      <Spin spinning={loading}>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {metricCards.map((item) => (
                <DashboardCard
                  key={item.id}
                  iconName={item.iconName}
                  title={item.title}
                  value={item.value}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#F37021]">
                      event_note
                    </span>
                    <h3 className="font-bold text-slate-800 text-lg">
                      Kỳ thi gần đây
                    </h3>
                  </div>
                  <button
                    type="button"
                    className="text-[#F37021] text-sm font-semibold hover:underline bg-[#F37021]/5 px-3 py-1.5 rounded-md transition-colors"
                    onClick={() => navigate('/exam-staff/exams')}
                  >
                    Xem tất cả
                  </button>
                </div>
                {errors.recentExams && (
                  <p className="px-6 pt-3 text-xs text-red-500">
                    {errors.recentExams}
                  </p>
                )}
                <div className="overflow-x-auto flex-1">
                  <Table
                    rowKey={(r) => r.examId ?? r.name}
                    columns={examColumns}
                    dataSource={recentExams}
                    pagination={false}
                    locale={{ emptyText: 'Chưa có kỳ thi gần đây' }}
                    className="overflow-hidden"
                  />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-[#F37021]">
                    bar_chart
                  </span>
                  <h3 className="font-bold text-slate-800 text-lg">
                    Phân bố điểm
                  </h3>
                </div>
                {errors.gradeDistribution && (
                  <p className="text-xs text-red-500 mb-2">
                    {errors.gradeDistribution}
                  </p>
                )}
                {totalGraded === 0 && !loading ? (
                  <div className="flex flex-1 items-center justify-center min-h-[192px]">
                    <Empty description="Chưa có dữ liệu chấm điểm" />
                  </div>
                ) : gradeRanges.length === 0 && !loading ? (
                  <div className="flex flex-1 items-center justify-center min-h-[192px]">
                    <Empty description="Chưa có dữ liệu phân bố" />
                  </div>
                ) : (
                  <div className="w-full min-h-[192px] flex-1">
                    <ReactECharts
                      style={{ height: '220px', width: '100%' }}
                      option={gradeBarChartOption}
                      notMerge
                    />
                  </div>
                )}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-[12px] text-slate-500 font-medium">
                    <span className="font-bold text-slate-700">
                      {fmtCount(totalGraded)}
                    </span>{' '}
                    bài đã chấm
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#F37021]">
                    report
                  </span>
                  <h3 className="font-bold text-slate-800 text-lg">
                    Đơn phúc khảo cần xử lý
                  </h3>
                </div>
                {pendingCount > 0 ? (
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border border-red-200 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">
                      warning
                    </span>
                    Gấp ({fmtCount(pendingCount)})
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">
                    Không có đơn chờ
                  </span>
                )}
              </div>
              {errors.pendingAppeals && (
                <p className="px-6 pt-3 text-xs text-red-500">
                  {errors.pendingAppeals}
                </p>
              )}
              <div className="overflow-x-auto">
                <Table
                  rowKey={(r) =>
                    r.appealId ?? `${r.studentMssv}-${r.createdAt}`
                  }
                  columns={appealColumns}
                  dataSource={pendingAppeals}
                  pagination={false}
                  locale={{ emptyText: 'Không có đơn phúc khảo chờ xử lý' }}
                  className="overflow-hidden"
                />
              </div>
            </div>
          </div>
        </div>
      </Spin>
    </ConfigProvider>
  );
}
