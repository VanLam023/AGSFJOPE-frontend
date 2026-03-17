import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../app/context/authContext.js';
import MainLayout from '../../components/layouts/MainLayout.jsx';
import { STAFF_SIDEBAR_ITEMS } from '../../constants/sidebarItems.jsx';
import { testDashboardData } from './test.jsx';
import DashboardCard from '../../components/DashboardCard.jsx';
import {
  DashboardIcon,
  ExamManagementIcon,
  SubmissionsIcon,
  AppealsIcon,
  AuditLogIcon,
} from '../../components/icons/SidebarIcons.jsx';
import { ConfigProvider, Table, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import {
  recentExams,
  examStatusConfig,
  pendingAppeals,
  appealStatusConfig,
  gradeDistribution,
} from './config.jsx';

const CARD_ICON = ['timer', 'description', 'check_circle', 'priority_high'];

// const ICON_MAP = {
//   exam: ExamManagementIcon,
//   submission: SubmissionsIcon,
//   appeal: AppealsIcon,
//   audit: AuditLogIcon,
//   dashboard: DashboardIcon,
// };

const TABLE_COLUMNS_1 = [
  {
    title: (
      <p className="text-xs uppercase tracking-wider font-bold">TÊN KỲ THI</p>
    ),
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: <p className="text-xs uppercase tracking-wider font-bold">HỌC KỲ</p>,
    dataIndex: 'semester',
    key: 'semester',
  },
  {
    title: (
      <p className="text-xs uppercase tracking-wider font-bold">TRẠNG THÁI</p>
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
    dataIndex: 'action',
    key: 'action',
    render: () => (
      <div className="flex justify-center align-middle">
        <button className="bg-white border border-slate-300 text-slate-700 hover:text-[#F37021] hover:border-[#F37021] px-3 py-2 rounded-md text-xs font-bold transition-all shadow-sm">
          Xem chi tiết
        </button>
      </div>
    ),
  },
];

const TABLE_COLUMNS_2 = [
  {
    title: (
      <p className="text-xs uppercase tracking-wider font-bold">
        TÊN SINH VIÊN
      </p>
    ),
    dataIndex: 'student',
    key: 'student',
    render: (student) => (
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border ${student.initialsColor}`}
        >
          {student.initials}
        </div>
        <div>
          <p className="font-bold text-slate-800">{student.name}</p>
          <p className="text-xs text-slate-500 uppercase tracking-wide mt-0.5 font-medium">
            {student.mssv}
          </p>
        </div>
      </div>
    ),
  },
  {
    title: (
      <p className="text-xs uppercase tracking-wider font-bold">TÊN KỲ THI</p>
    ),
    dataIndex: 'examName',
    key: 'examName',
  },
  {
    title: (
      <p className="text-xs uppercase tracking-wider font-bold">TRẠNG THÁI</p>
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
            {cfg.icon}
          </span>
          {cfg.label}
        </span>
      );
    },
  },
  {
    title: (
      <p className="text-xs text-center uppercase tracking-wider font-bold">
        THAO TÁC
      </p>
    ),
    dataIndex: 'action',
    key: 'action',
    render: () => (
      <div className="flex justify-center align-middle">
        <button className="bg-white border border-slate-300 text-slate-700 hover:text-[#F37021] hover:border-[#F37021] px-3 py-2 rounded-md text-xs font-bold transition-all shadow-sm">
          Xem chi tiết
        </button>
      </div>
    ),
  },
];

const icons = [
  DashboardIcon,
  ExamManagementIcon,
  SubmissionsIcon,
  AppealsIcon,
  AuditLogIcon,
];

export default function ExamStaffDashboard() {
  const [selectedIndex, setSelectedIndex] = useState(1);
  const [notifCount] = useState(5);

  const cardWithIcon = testDashboardData.card.map((card, index) => {
    return { ...card, iconName: CARD_ICON[index] };
  });

  const renderedSiderIcons = icons.map((item, index) => {
    const isActive = index + 1 === selectedIndex;
    const color = isActive ? '#F37021' : '#ffffff';
    return item({ fill: color });
  });

  return (
    <MainLayout
      siderIcons={renderedSiderIcons}
      siderItems={STAFF_SIDEBAR_ITEMS}
      notifCount={notifCount}
      currentSelectedItem={(item) => setSelectedIndex(Number(item.key))}
      actionBtn={({ collapsed }) => {
        return (
          <Button
            type="primary"
            size="large"
            icon={
              <PlusOutlined
                style={{
                  fontSize: '16px',
                  strokeWidth: '30',
                  stroke: 'white',
                }}
              />
            }
            className="w-full bg-[#F37021] 
            text-white hover:bg-[#F37021]/90 
            py-3 rounded-md text-sm font-bold 
            transition-all flex items-center 
            justify-center gap-2 shadow-lg 
            shadow-[#F37021]/20"
          >
            {collapsed ? '' : 'Tạo kỳ thi mới'}
          </Button>
        );
      }}
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
              {cardWithIcon?.map((item) => {
                return (
                  <DashboardCard
                    key={item.id}
                    iconName={item.iconName}
                    title={item.title}
                    value={item.value}
                  />
                );
              })}
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
                  <button className="text-[#F37021] text-sm font-semibold hover:underline bg-[#F37021]/5 px-3 py-1.5 rounded-md transition-colors">
                    Xem tất cả
                  </button>
                </div>

                <div className="overflow-x-auto flex-1">
                  <Table
                    key="id"
                    columns={TABLE_COLUMNS_1}
                    dataSource={recentExams}
                    pagination={false}
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
                <div className="flex items-end justify-between h-48 gap-3 flex-1">
                  {gradeDistribution.map((bar) => {
                    return (
                      <div
                        key={bar.range}
                        className="flex flex-col items-center flex-1 gap-2"
                      >
                        <div
                          className={`w-full rounded-t-md transition-colors ${
                            bar.active
                              ? 'bg-[#F37021] shadow-sm shadow-[#F37021]/30'
                              : 'bg-slate-200 hover:bg-slate-300'
                          }`}
                          style={{ height: bar.height }}
                        />
                        <span
                          className={`text-[11px] font-bold ${
                            bar.active ? 'text-[#F37021]' : 'text-slate-500'
                          }`}
                        >
                          {bar.range}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-[12px] text-slate-500 font-medium">
                    <span className="font-bold text-slate-700">730</span> bài
                    nộp
                  </p>
                  <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium">
                    Summer 2024
                  </span>
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
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border border-red-200 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">
                    warning
                  </span>
                  Gấp (8)
                </span>
              </div>
              <div className="overflow-x-auto">
                <div className="overflow-x-auto">
                  <Table
                    key="id"
                    columns={TABLE_COLUMNS_2}
                    dataSource={pendingAppeals}
                    pagination={false}
                    className="overflow-hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </ConfigProvider>
    </MainLayout>
  );
}
