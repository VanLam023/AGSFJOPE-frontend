import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../app/context/authContext';
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
import { DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import { ConfigProvider, Table, Button, Input, Select } from 'antd';
import {
  renderSiderIconsMaterialSymbol,
  renderRolePill,
  renderStatusPill,
} from '../../components/utils/Utils';
import MainLayout from '../../components/layouts/MainLayout';
import {
  ADMIN_SIDEBAR_ITEMS,
  ADMIN_ICONS,
  ADMIN_SIDEBAR_ITEMS_FLAT,
} from '../../constants/sidebarItems';
import { allRoles, allStatus, userSeedData } from './test.jsx';

const UserManagement = () => {
  const [selectedIndex, setSelectedIndex] = useState(1);
  const [notifCount] = useState(5);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState(undefined);
  const [statusFilter, setStatusFilter] = useState(undefined);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();

    return (userSeedData ?? []).filter((row) => {
      const name = row?.user?.name?.toLowerCase?.() ?? '';
      const email = row?.id?.email?.toLowerCase?.() ?? '';
      const mssv = row?.id?.mssv?.toLowerCase?.() ?? '';
      const role = row?.role ?? '';
      const status = row?.status ?? '';

      const matchesQuery =
        q.length === 0 ||
        name.includes(q) ||
        email.includes(q) ||
        mssv.includes(q);

      const matchesRole = !roleFilter || role === roleFilter;
      const matchesStatus = !statusFilter || status === statusFilter;

      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [query, roleFilter, statusFilter]);

  const USER_COLUMNS = useMemo(
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
            <span className="font-semibold text-slate-800 text-[16px]">
              {user.name}
            </span>
          </div>
        ),
      },
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold">
            Email/MSSV
          </p>
        ),
        dataIndex: 'id',
        key: 'id',
        render: (id) => (
          <span className={`flex flex-col gap-1.5 px-2.5 py-1 `}>
            <span className="text-[16px]">{id.email}</span>
            <span className="text-[13px] text-slate-400">{id.mssv}</span>
          </span>
        ),
      },
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold">Vai trò</p>
        ),
        dataIndex: 'role',
        key: 'role',
        render: (role) => renderRolePill({ role }),
      },
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold">
            Trạng thái
          </p>
        ),
        dataIndex: 'status',
        key: 'status',
        render: (status) => renderStatusPill({ status }),
      },
      {
        title: (
          <p className="text-xs text-center uppercase tracking-wider font-bold">
            Thao tác
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
    ],
    [],
  );

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
              cellPaddingInline: 12,
              cellPaddingBlock: 6,
              headerBg: '#f8fafc',
              headerColor: '#45556c',
              headerSplitColor: 'transparent',
              rowHoverBg: 'rgb(243, 112, 33, 0.05)',
            },
            Button: { colorPrimary: '#F37021' },
            Pagination: {
              itemActiveBg: '#F37021',
              colorPrimary: '#F37021',
              itemActiveColor: '#ffffff',
              colorPrimaryHover: '#F37021E6',
            },
          },
        }}
      >
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-8  max-w-7xl mx-auto w-full flex items-center gap-2">
            <Input.Search
              size="large"
              className="flex-2 min-w-[340px]"
              enterButton={false}
              placeholder="Tìm kiếm theo tên, email, MSSV"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              allowClear
            />
            <Select
              className="flex-1 min-w-[160px]"
              options={allRoles}
              size="large"
              placeholder="Vai trò"
              allowClear
              value={roleFilter}
              onChange={(v) => setRoleFilter(v)}
            />
            <Select
              className="flex-1 min-w-[150px]"
              options={allStatus}
              size="large"
              placeholder="Trạng thái"
              allowClear
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
            />
            <Button
              className="flex-1 min-w-[150px]"
              size="large"
              icon={<DownloadOutlined />}
              variant="outlined"
            >
              Xuất Excel
            </Button>

            <Button
              className="flex-1 min-w-[170px]"
              size="large"
              icon={<PlusOutlined />}
              type="primary"
            >
              Thêm người dùng
            </Button>
          </div>
          <div className="px-8 max-w-7xl mx-auto w-full">
            <div className="bg-white rounded-md mb-8 shadow-sm border border-slate-200 overflow-hidden">
              <Table
                columns={USER_COLUMNS}
                dataSource={filteredUsers}
                size="small"
                pagination={{
                  pageSize: 8,
                  showSizeChanger: false,
                }}
              />
            </div>
          </div>
        </div>
      </ConfigProvider>
    </MainLayout>
  );
};

export default UserManagement;
