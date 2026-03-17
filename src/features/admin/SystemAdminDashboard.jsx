import React, { useEffect, useState, useMemo } from 'react';
import { data, Link } from 'react-router-dom';
import { AuthContext } from '../../app/context/authContext';
import MainLayout from '../../components/layouts/MainLayout';
import {
  ADMIN_SIDEBAR_ITEMS,
  ADMIN_ICONS,
  ADMIN_SIDEBAR_ITEMS_FLAT,
} from '../../constants/sidebarItems';
import { ConfigProvider, Table, Button, Segmented, Dropdown } from 'antd';
import {
  renderSiderIconsMaterialSymbol,
  renderCardWithIcon,
} from '../../components/utils/Utils';
import {
  DashboardIcon,
  AIConfigurationIcon,
  AdvanceSettingsIcon,
  ExamManagementIcon,
  GradingSettingIcon,
  PayOSConfigIcon,
  RoleManagementIcon,
  UserManagementIcon,
} from '../../components/icons/SidebarIcons.jsx';
import {
  testDashboardCardData,
  submissionsDay24H,
  submissionsBlock5,
  submissionsBlock10,
  userData,
  auditLogs,
  resourceMonitors,
} from './test.jsx';
import { PIE_COLOR } from './config.jsx';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  TooltipComponent,
  TitleComponent,
  DatasetComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import DashboardCard from '../../components/DashboardCard.jsx';
import ReactECharts from 'echarts-for-react';

export default function SystemAdminDashboard() {
  const [selectedIndex, setSelectedIndex] = useState(1);
  const [notifCount] = useState(5);
  const [chartOp, setChartOp] = useState('Hôm nay');

  const AUDIT_LOG_COLUMNS = useMemo(
    () => [
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold">
            Người dùng
          </p>
        ),
        dataIndex: 'user',
        key: 'user',
        render: (user) => (
          <div className="flex items-center gap-3">
            <div
              className={`size-8 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${user.initialsColor}`}
            >
              {user.initials}
            </div>
            <span className="font-semibold text-slate-800 text-sm">
              {user.name}
            </span>
          </div>
        ),
      },
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold">Sự kiện</p>
        ),
        dataIndex: 'event',
        key: 'event',
        render: (event) => (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${event.cls}`}
          >
            <span className="material-symbols-outlined text-[13px]">
              {event.icon}
            </span>
            {event.label}
          </span>
        ),
      },
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold">
            Thời gian
          </p>
        ),
        dataIndex: 'time',
        key: 'time',
        render: (t) => (
          <span className="text-slate-400 text-xs font-medium whitespace-nowrap">
            {t}
          </span>
        ),
      },
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold">IP nguồn</p>
        ),
        dataIndex: 'ip',
        key: 'ip',
        render: (ip) => (
          <code className="text-[11px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg">
            {ip}
          </code>
        ),
      },
    ],
    [],
  );

  const currentChartData = useMemo(() => {
    switch (chartOp) {
      case 'Block 5':
        return submissionsBlock5;
      case 'Block 10':
        return submissionsBlock10;
      case 'Hôm nay':
      default:
        return submissionsDay24H;
    }
  }, [chartOp]);

  return (
    <MainLayout
      siderIcons={renderSiderIconsMaterialSymbol({ icons: ADMIN_ICONS })}
      siderItems={({ collapsed }) => {
        if (collapsed) {
          return ADMIN_SIDEBAR_ITEMS_FLAT;
        } else {
          return ADMIN_SIDEBAR_ITEMS;
        }
      }}
      notifCount={notifCount}
      currentSelectedItem={(item) => setSelectedIndex(Number(item.key))}
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
          <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {renderCardWithIcon({ data: testDashboardCardData }).map(
                (item) => {
                  return (
                    <DashboardCard
                      key={item.id}
                      iconName={item.iconName}
                      title={item.title}
                      value={item.value}
                      trend={item.trend}
                    />
                  );
                },
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-lg">Số lượng bài nộp</p>
                  <Segmented
                    className="w-fit ml-auto"
                    value={chartOp}
                    onChange={setChartOp}
                    options={['Hôm nay', 'Block 5', 'Block 10']}
                  />
                </div>

                <ReactECharts
                  style={{ height: '350px' }}
                  option={{
                    tooltip: {
                      trigger: 'axis',
                      axisPointer: {
                        type: 'shadow',
                      },
                    },
                    grid: {
                      left: '3%',
                      right: '4%',
                      bottom: '3%',
                      containLabel: true,
                    },
                    xAxis: {
                      data: currentChartData.xAxis,
                    },
                    yAxis: {},
                    series: [
                      {
                        data: currentChartData.data,
                        type: 'bar',
                        smooth: true,
                        barWidth: '50%',
                        itemStyle: {
                          barBorderRadius: 5,
                          borderWidth: 1,
                          borderType: 'solid',
                          borderColor: '#FDBA74',
                          shadowColor: 'rgba(243,112,33,0.35)',
                          color: '#F37021',
                          shadowBlur: 3,
                        },
                      },
                    ],
                  }}
                />
              </div>
              <div
                className="bg-white rounded-3xl 
              shadow-sm border border-slate-200 
              flex flex-col justify-start p-6"
              >
                <p className="font-bold text-lg">Phân bố người dùng</p>

                <ReactECharts
                  style={{
                    height: '100%',
                  }}
                  option={{
                    tooltip: {
                      trigger: 'item',
                    },
                    legend: {
                      bottom: '0%',
                      fontFamily: 'Inter',
                      orient: 'vertical',
                    },
                    series: [
                      {
                        data: userData.map((item, index) => ({
                          ...item,
                          itemStyle: { color: PIE_COLOR[index] },
                        })),
                        type: 'pie',
                        radius: ['40%', '70%'],
                        center: ['50%', '40%'],
                        avoidLabelOverlap: false,
                        itemStyle: {
                          borderRadius: 10,
                          borderColor: '#fff',
                          borderWidth: 2,
                        },
                        label: {
                          show: false,
                          position: 'center',
                        },
                        emphasis: {},
                        labelLine: {
                          show: false,
                        },
                        // Half pie
                        //------------------------
                        // radius: ['40%', '70%'],
                        // center: ['50%', '70%'],
                        // startAngle: 180,
                        // endAngle: 360,
                        //-----------------------
                      },
                    ],
                  }}
                />
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
                        Nhật ký thao tác
                      </h3>
                    </div>
                    <button className="text-[#F37021] text-sm font-semibold hover:underline bg-[#F37021]/5 px-3 py-1.5 rounded-md transition-colors">
                      Xem tất cả
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <Table
                      rowKey="id"
                      columns={AUDIT_LOG_COLUMNS}
                      dataSource={auditLogs}
                      pagination={false}
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
                      Tình trạng sử dụng máy chủ (thời gian thực)
                    </p>
                  </div>
                </div>

                <div className="space-y-5 flex-1">
                  {resourceMonitors.map((res) => (
                    <div
                      key={res.label}
                      className="space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.12em]">
                            {res.label}
                          </p>
                          <p className="text-sm font-semibold text-slate-700 mt-0.5">
                            {res.sub}
                          </p>
                        </div>
                        <span
                          className={`text-2xl font-black ${res.textColor}`}
                        >
                          {res.value}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${res.color} rounded-full transition-all duration-700 ${res.glow}`}
                          style={{ width: `${res.value}%` }}
                        />
                      </div>
                      <p className={`text-[10px] font-bold ${res.textColor}`}>
                        Đã sử dụng {res.value}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ConfigProvider>
    </MainLayout>
  );
}
