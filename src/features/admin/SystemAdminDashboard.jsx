import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../../components/layouts/MainLayout';
import {
  ADMIN_SIDEBAR_ITEMS,
  ADMIN_ICONS,
  ADMIN_SIDEBAR_ITEMS_FLAT,
} from '../../constants/sidebarItems';
import { ConfigProvider, Table, Segmented, Spin, Empty } from 'antd';
import {
  renderSiderIconsMaterialSymbol,
  renderCardWithIcon,
} from '../../components/utils/Utils';
import {
  PIE_COLOR,
  ROLE_PIE_COLOR_BY_NAME,
  ROLE_DASHBOARD_LABEL_VI,
} from './config.jsx';
import DashboardCard from '../../components/DashboardCard.jsx';
import ReactECharts from 'echarts-for-react';
import { useAdminDashboard } from '../../hooks';

const fmtCount = (n) => {
  if (n == null || n === '') return '—';
  return Number(n).toLocaleString('vi-VN');
};

const getInitials = (fullName) => {
  if (!fullName?.trim()) return '?';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return fullName.slice(0, 2).toUpperCase();
};

const AVATAR_PALETTES = [
  'bg-blue-100 text-blue-600',
  'bg-purple-100 text-purple-600',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-700',
];

const formatActivityTime = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
};

export default function SystemAdminDashboard() {
  const [notifCount] = React.useState(5);
  const {
    overview,
    userStats,
    recentActivities,
    systemHealth,
    systemActivity,
    loading,
    activityLoading,
    errors,
    activityPeriod,
    setActivityPeriod,
  } = useAdminDashboard({ activitiesLimit: 10 });

  const metricCards = useMemo(() => {
    const o = overview;
    return [
      { id: '1', title: 'Tổng người dùng', value: fmtCount(o?.totalUsers) },
      {
        id: '2',
        title: 'Kỳ thi đang diễn ra',
        value: fmtCount(o?.activeExams),
      },
      { id: '3', title: 'Tổng bài nộp', value: fmtCount(o?.totalSubmissions) },
      {
        id: '4',
        title: 'Phúc khảo chờ xử lý',
        value: fmtCount(o?.pendingAppeals),
      },
    ];
  }, [overview]);

  const pieSeriesData = useMemo(() => {
    const roles = userStats?.roles ?? [];
    return roles.map((role, index) => ({
      name:
        ROLE_DASHBOARD_LABEL_VI.get(role.displayName) ??
        ROLE_DASHBOARD_LABEL_VI.get(role.roleName) ??
        '—',
      value: role.count ?? 0,
      itemStyle: {
        color:
          ROLE_PIE_COLOR_BY_NAME[role.roleName] ??
          PIE_COLOR[index % PIE_COLOR.length],
      },
    }));
  }, [userStats]);

  const activityChartOption = useMemo(() => {
    const points = systemActivity?.dataPoints ?? [];
    const labels = points.map((p) => p.label);
    const counts = points.map((p) => p.count);
    return {
      tooltip: { trigger: 'axis' },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: labels,
        boundaryGap: false,
      },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          data: counts,
          type: 'line',
          smooth: true,
          areaStyle: { opacity: 0.12, color: '#F37021' },
          lineStyle: { color: '#F37021', width: 2 },
          itemStyle: { color: '#F37021' },
        },
      ],
    };
  }, [systemActivity]);

  const resourceRows = useMemo(() => {
    const h = systemHealth;
    if (!h) return [];
    const cpu = h.cpuUsagePercent;
    const cpuOk = cpu != null && cpu >= 0;
    return [
      {
        key: 'cpu',
        label: 'CPU',
        sub: cpuOk ? 'Máy chủ' : 'Không khả dụng',
        value: cpuOk ? Math.round(Number(cpu)) : null,
        textColor: cpuOk ? 'text-amber-600' : 'text-slate-400',
        color: 'bg-amber-500',
        glow: 'shadow-amber-500/30',
        showBar: cpuOk,
      },
      {
        key: 'mem',
        label: 'Bộ nhớ (heap)',
        sub:
          h.totalMemoryMb != null
            ? `${fmtCount(h.usedMemoryMb)} / ${fmtCount(h.totalMemoryMb)} MB`
            : '—',
        value: Math.round(Number(h.memoryUsagePercent ?? 0)),
        textColor: 'text-sky-600',
        color: 'bg-sky-500',
        glow: 'shadow-sky-500/30',
        showBar: true,
      },
      {
        key: 'disk',
        label: 'Ổ đĩa (root)',
        sub:
          h.totalDiskGb != null
            ? `${fmtCount(h.usedDiskGb)} / ${fmtCount(h.totalDiskGb)} GB`
            : '—',
        value: Math.round(Number(h.diskUsagePercent ?? 0)),
        textColor: 'text-rose-600',
        color: 'bg-rose-500',
        glow: 'shadow-rose-500/30',
        showBar: true,
      },
    ];
  }, [systemHealth]);

  const auditColumns = useMemo(
    () => [
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold">
            Người dùng
          </p>
        ),
        key: 'user',
        render: (_, row, index) => (
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`size-8 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${AVATAR_PALETTES[index % AVATAR_PALETTES.length]}`}
            >
              {getInitials(row.fullName)}
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-slate-800 text-sm block truncate">
                {row.fullName || row.username || '—'}
              </span>
              {row.username && (
                <span className="text-[11px] text-slate-400 truncate block">
                  @{row.username}
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold">Sự kiện</p>
        ),
        key: 'action',
        render: (_, row) => (
          <div className="space-y-0.5 max-w-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-slate-50 text-slate-800 border-slate-200">
              <span className="material-symbols-outlined text-[13px]">
                history
              </span>
              {row.action ?? '—'}
            </span>
            {row.entityType && (
              <span className="block text-[11px] text-slate-500 truncate">
                {row.entityType}
              </span>
            )}
          </div>
        ),
      },
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold">
            Thời gian
          </p>
        ),
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 180,
        render: (t) => (
          <span className="text-slate-500 text-xs font-medium whitespace-nowrap">
            {formatActivityTime(t)}
          </span>
        ),
      },
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold">IP nguồn</p>
        ),
        dataIndex: 'ipAddress',
        key: 'ipAddress',
        render: (ip) => (
          <code className="text-[11px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg">
            {ip ?? '—'}
          </code>
        ),
      },
    ],
    [],
  );

  const hasActivityPoints = (systemActivity?.dataPoints?.length ?? 0) > 0;

  return (
    <MainLayout
      siderIcons={renderSiderIconsMaterialSymbol({ icons: ADMIN_ICONS })}
      siderItems={({ collapsed }) => {
        if (collapsed) {
          return ADMIN_SIDEBAR_ITEMS_FLAT;
        }
        return ADMIN_SIDEBAR_ITEMS;
      }}
      notifCount={notifCount}
    >
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
        <div className="flex-1 flex flex-col min-w-0">
          <Spin spinning={loading}>
            <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {renderCardWithIcon({ data: metricCards }).map((item) => (
                  <DashboardCard
                    key={item.id}
                    iconName={item.iconName}
                    title={item.title}
                    value={item.value}
                  />
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col min-h-[420px]">
                  <div className="flex flex-wrap justify-between items-start gap-3">
                    <div>
                      <p className="font-bold text-lg">Hoạt động hệ thống</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Số nhật ký audit theo khung thời gian
                      </p>
                    </div>
                    <Segmented
                      className="w-fit ml-auto"
                      value={activityPeriod}
                      onChange={setActivityPeriod}
                      options={[
                        { label: '24 giờ', value: '24h' },
                        { label: '7 ngày', value: '7d' },
                      ]}
                    />
                  </div>
                  {errors.systemActivity && (
                    <p className="text-xs text-red-500 mt-2">
                      {errors.systemActivity}
                    </p>
                  )}
                  <Spin spinning={activityLoading}>
                    {!hasActivityPoints && !activityLoading ? (
                      <div className="flex flex-1 items-center justify-center min-h-[280px]">
                        <Empty description="Chưa có dữ liệu hoạt động" />
                      </div>
                    ) : (
                      <ReactECharts
                        style={{ height: '350px' }}
                        option={activityChartOption}
                        notMerge
                      />
                    )}
                  </Spin>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-start p-6 min-h-[420px]">
                  <div className="flex justify-between items-baseline gap-2 mb-2">
                    <p className="font-bold text-lg">Phân bố người dùng</p>
                    {userStats?.totalUsers != null && (
                      <span className="text-xs text-slate-400 font-medium">
                        Tổng: {fmtCount(userStats.totalUsers)}
                      </span>
                    )}
                  </div>
                  {errors.userStats && (
                    <p className="text-xs text-red-500 mb-2">
                      {errors.userStats}
                    </p>
                  )}
                  {pieSeriesData.length === 0 && !loading ? (
                    <div className="flex flex-1 items-center justify-center min-h-[280px]">
                      <Empty description="Chưa có dữ liệu phân bố" />
                    </div>
                  ) : (
                    <ReactECharts
                      style={{ height: '340px' }}
                      option={{
                        tooltip: { trigger: 'item' },
                        legend: {
                          orient: 'horizontal',
                          left: 'center',
                          bottom: 0,
                          itemGap: 14,
                          fontFamily: 'Be Vietnam Pro',
                        },
                        series: [
                          {
                            data: pieSeriesData,
                            type: 'pie',
                            radius: ['38%', '62%'],
                            center: ['50%', '44%'],
                            avoidLabelOverlap: false,
                            itemStyle: {
                              borderRadius: 10,
                              borderColor: '#fff',
                              borderWidth: 2,
                            },
                            label: { show: false, position: 'center' },
                            labelLine: { show: false },
                          },
                        ],
                      }}
                      notMerge
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                  <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#F37021]">
                          history
                        </span>
                        <h3 className="font-bold text-slate-800 text-lg">
                          Hoạt động gần đây
                        </h3>
                      </div>
                      <Link
                        to="/exam-staff/audits"
                        className="text-[#F37021] text-sm font-semibold hover:underline bg-[#F37021]/5 px-3 py-1.5 rounded-md transition-colors"
                      >
                        Xem tất cả
                      </Link>
                    </div>
                    {errors.recentActivities && (
                      <p className="px-6 pt-3 text-xs text-red-500">
                        {errors.recentActivities}
                      </p>
                    )}
                    <div className="overflow-x-auto">
                      <Table
                        rowKey={(row, i) =>
                          `${row.username ?? ''}-${row.createdAt ?? ''}-${i}`
                        }
                        columns={auditColumns}
                        dataSource={recentActivities}
                        pagination={false}
                        locale={{
                          emptyText: 'Chưa có hoạt động',
                        }}
                        className="overflow-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="size-9 rounded-xl bg-[#F37021]/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#F37021] text-[20px]">
                        dns
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-base leading-tight">
                        Giám sát tài nguyên
                      </h4>
                      <p className="text-xs text-slate-400">
                        JVM &amp; ổ đĩa (thời gian thực)
                      </p>
                    </div>
                  </div>
                  {errors.systemHealth && (
                    <p className="text-xs text-red-500 mb-4">
                      {errors.systemHealth}
                    </p>
                  )}
                  <div className="space-y-5 flex-1">
                    {!loading && resourceRows.length === 0 ? (
                      <Empty description="Không tải được dữ liệu" />
                    ) : (
                      resourceRows.map((res) => (
                        <div
                          key={res.key}
                          className="space-y-2"
                        >
                          <div className="flex justify-between items-center gap-2">
                            <div className="min-w-0">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.12em]">
                                {res.label}
                              </p>
                              <p className="text-sm font-semibold text-slate-700 mt-0.5 truncate">
                                {res.sub}
                              </p>
                            </div>
                            {res.value == null ? (
                              <span className="text-lg font-black text-slate-400 shrink-0">
                                N/A
                              </span>
                            ) : (
                              <span
                                className={`text-2xl font-black shrink-0 ${res.textColor}`}
                              >
                                {res.value}%
                              </span>
                            )}
                          </div>
                          {res.showBar && res.value != null && (
                            <>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${res.color} rounded-full transition-all duration-700 ${res.glow}`}
                                  style={{
                                    width: `${Math.min(100, Math.max(0, res.value))}%`,
                                  }}
                                />
                              </div>
                              <p
                                className={`text-[10px] font-bold ${res.textColor}`}
                              >
                                Đã sử dụng {res.value}%
                              </p>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Spin>
        </div>
      </ConfigProvider>
    </MainLayout>
  );
}
