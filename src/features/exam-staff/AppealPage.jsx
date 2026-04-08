import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DownloadOutlined } from '@ant-design/icons';
import viVN from 'antd/locale/vi_VN';
import MainLayout from '../../components/layouts/MainLayout';
import { STAFF_SIDEBAR_ITEMS } from '../../constants/sidebarItems';
import {
  DashboardIcon,
  ExamManagementIcon,
  SubmissionsIcon,
  AppealsIcon,
  AuditLogIcon,
} from '../../components/icons/SidebarIcons.jsx';
import {
  ConfigProvider,
  Table,
  Select,
  Input,
  Empty,
  message,
  Button,
} from 'antd';
import { getStaffAppeals } from '../../services/staffApi';
import CardContainer from '../../components/CardContainer';
import DashboardCard from '../../components/DashboardCard.jsx';
import { appealStatusConfig } from './config.jsx';
import { useStaffAppeals } from '../../hooks';
import useDebounce from '../../hooks/useDebounce.jsx';
import { formatDateTime, formatCount } from '../../components/utils/Utils';
import { exportToExcel } from '../../components/utils/exportExcel.js';

const OVERVIEW_CARDS = [
  { key: 'total', title: 'Tổng đơn', field: 'total', iconName: 'inbox' },
  {
    key: 'pending',
    title: 'Chờ xử lý',
    field: 'pending',
    iconName: 'schedule',
  },
  {
    key: 'processing',
    title: 'Đang xử lý',
    field: 'processing',
    iconName: 'sync',
  },
  {
    key: 'approved',
    title: 'Đã duyệt',
    field: 'approved',
    iconName: 'task_alt',
  },
  { key: 'denied', title: 'Từ chối', field: 'denied', iconName: 'cancel' },
  {
    key: 'cancelled',
    title: 'Đã hủy',
    field: 'cancelled',
    iconName: 'block',
  },
];

const STATUS_FILTER_OPTIONS = [
  { value: 'PENDING_PAYMENT', label: appealStatusConfig.PENDING_PAYMENT.label },
  { value: 'PENDING', label: appealStatusConfig.PENDING.label },
  { value: 'PROCESSING', label: appealStatusConfig.PROCESSING.label },
  { value: 'COMPLETED', label: appealStatusConfig.COMPLETED.label },
  { value: 'APPROVED', label: appealStatusConfig.APPROVED.label },
  { value: 'DENIED', label: appealStatusConfig.DENIED.label },
  { value: 'CANCELLED', label: appealStatusConfig.CANCELLED.label },
];

const icons = [
  DashboardIcon,
  ExamManagementIcon,
  // SubmissionsIcon,
  AppealsIcon,
  AuditLogIcon,
];

async function collectAllExamNames() {
  const examNames = new Set();
  for (let pageIdx = 0; pageIdx <= 100; pageIdx += 1) {
    const envelope = await getStaffAppeals({ page: pageIdx, size: 500 });
    const pageData = envelope?.data ?? null;
    const list = pageData?.appeals ?? [];
    const total = pageData?.totalElements ?? 0;
    list.forEach((r) => {
      if (r.examName?.trim()) examNames.add(r.examName.trim());
    });
    if (list.length === 0 || (pageIdx + 1) * 500 >= total) {
      break;
    }
  }
  return Array.from(examNames).sort((a, b) => a.localeCompare(b));
}

const AppealPage = () => {
  const navigate = useNavigate();
  const [notifCount] = useState(5);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [examNameFilter, setExamNameFilter] = useState(undefined);
  const [keywordInput, setKeywordInput] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const debouncedKeyword = useDebounce(keywordInput, 400);
  const [examNameOptions, setExamNameOptions] = useState([]);
  const filterKeyRef = useRef(null);

  const { fetchStaffAppeals, data, loading, error } = useStaffAppeals();

  const activeSidebarIndex =
    STAFF_SIDEBAR_ITEMS.findIndex((item) => item.to === '/exam-staff/appeals') +
    1;

  const renderedSiderIcons = icons.map((item, index) => {
    const isActive = index + 1 === activeSidebarIndex;
    const color = isActive ? '#F37021' : '#ffffff';
    return item({ fill: color });
  });

  useEffect(() => {
    collectAllExamNames()
      .then((names) => {
        setExamNameOptions(names);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const kw = debouncedKeyword || '';
    const key = `${statusFilter ?? ''}|${kw}|${examNameFilter ?? ''}`;

    if (filterKeyRef.current === null) {
      filterKeyRef.current = key;
    }

    const filtersChanged =
      filterKeyRef.current !== null && filterKeyRef.current !== key;
    const pageToUse = filtersChanged ? 0 : page;

    // if (filtersChanged) {
    //   filterKeyRef.current = key;
    //   if (page !== 0) {
    //     queueMicrotask(() => setPage(0));
    //   }
    // }

    fetchStaffAppeals({
      page: pageToUse,
      size,
      status: statusFilter,
      keyword: kw,
      examName: examNameFilter,
    }).catch(() => message.error('Không tải được danh sách phúc khảo.'));
  }, [
    page,
    size,
    statusFilter,
    examNameFilter,
    debouncedKeyword,
    fetchStaffAppeals,
  ]);

  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const kw = debouncedKeyword || '';
      const batchSize = 1000;
      const collected = [];

      const envelope = await getStaffAppeals({
        page: 0,
        size: batchSize,
        status: statusFilter,
        keyword: kw || undefined,
        examName: examNameFilter,
      });
      const pageData = envelope?.data ?? null;
      const list = pageData?.appeals ?? [];
      const total = pageData?.totalElements ?? 0;
      collected.push(...list);

      if (!collected.length) {
        message.warning('Không có dữ liệu để xuất.');
        return;
      }

      const columns = [
        { header: 'Mã đơn', key: 'appealCode', width: 18 },
        { header: 'Sinh viên', key: 'studentName', width: 28 },
        { header: 'MSSV', key: 'studentMssv', width: 18 },
        { header: 'Kỳ thi', key: 'examName', width: 30 },
        { header: 'Block', key: 'blockName', width: 16 },
        { header: 'Trạng thái', key: 'status', width: 20 },
        {
          header: 'Giảng viên phụ trách',
          key: 'assignedLecturerName',
          width: 30,
        },
        { header: 'Hạn xử lý', key: 'deadlineAt', width: 24 },
        { header: 'Ngày tạo', key: 'createdAt', width: 24 },
      ];

      const rowsForExport = collected.map((row) => {
        const cfg =
          appealStatusConfig[row.status] ?? appealStatusConfig.PENDING;
        return {
          appealCode: String(row.appealCode ?? ''),
          studentName: String(row.studentName ?? ''),
          studentMssv: String(row.studentMssv ?? ''),
          examName: String(row.examName ?? ''),
          blockName: String(row.blockName ?? ''),
          status: String(cfg.label ?? ''),
          assignedLecturerName: String(row.assignedLecturerName ?? '—'),
          deadlineAt: formatDateTime(row.deadlineAt),
          createdAt: formatDateTime(row.createdAt),
        };
      });

      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = String(now.getFullYear());
      const fileName = `appeal-report-${dd}-${mm}-${yyyy}.xlsx`;

      await exportToExcel({
        fileName,
        sheetName: 'Appeals',
        columns,
        rows: rowsForExport,
      });

      message.success('Xuất Excel thành công.');
    } catch {
      message.error('Xuất Excel thất bại.');
    } finally {
      setIsExporting(false);
    }
  };

  const rows = data?.appeals ?? [];
  const totalElements = data?.totalElements ?? 0;
  const apiPageSize = data?.pageSize ?? size;
  const currentPageApi = data?.currentPage ?? page;

  const metricCards = useMemo(() => {
    const colorsList = [
      { backgroundColor: '#F1F5F9', color: '' },
      { backgroundColor: '#FEFCE8', color: '#CA8A04' },
      { backgroundColor: '#EFF6FF', color: '#2563EB' },
      { backgroundColor: '#F0FDF4', color: '#16A34A' },
      { backgroundColor: '#FEF2F2', color: '#DC2626' },
      { backgroundColor: '#FEF2F2', color: '#DC2626' },
    ];

    const overview = data?.overview ?? {};
    return OVERVIEW_CARDS.map((card, index) => {
      const color = colorsList[index % colorsList.length];
      return {
        ...card,
        ...color,
        id: card.key,
        value: formatCount(overview[card.field]),
      };
    });
  }, [data?.overview]);

  const columns = useMemo(
    () => [
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold">Mã đơn</p>
        ),
        dataIndex: 'appealCode',
        key: 'appealCode',
        width: 50,
        ellipsis: true,
        render: (v) => {
          return (
            <span className="text-sm font-mono font-semibold text-slate-800">
              {v.replace('#PK-', '') ?? '—'}
            </span>
          );
        },
      },
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold">
            Sinh viên
          </p>
        ),
        key: 'student',
        width: 60,
        render: (_, row) => (
          <div>
            <p className="text-sm font-medium text-slate-800 m-0">
              {row.studentName ?? '—'}
            </p>
            <p className="text-xs text-slate-500 m-0">
              {row.studentMssv ?? '—'}
            </p>
          </div>
        ),
      },
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold">Kỳ thi</p>
        ),
        dataIndex: 'examName',
        width: 65,
        key: 'examName',
        ellipsis: true,
      },
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold">Block</p>
        ),
        dataIndex: 'blockName',
        key: 'blockName',
        width: 30,
        ellipsis: true,
      },
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold">
            Trạng thái
          </p>
        ),
        dataIndex: 'status',
        key: 'status',
        width: 60,
        render: (status) => {
          const cfg = appealStatusConfig[status] ?? appealStatusConfig.PENDING;
          return (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border ${cfg.cls}`}
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
            Giảng viên
          </p>
        ),
        dataIndex: 'assignedLecturerName',
        key: 'assignedLecturerName',
        width: 50,
        ellipsis: true,
        render: (v) => v ?? '—',
      },
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold">
            Hạn xử lý
          </p>
        ),
        dataIndex: 'deadlineAt',
        key: 'deadlineAt',
        width: 50,
        render: (v) => (
          <span className="text-xs text-slate-600 whitespace-nowrap">
            {formatDateTime(v)}
          </span>
        ),
      },
      {
        title: (
          <p className="text-xs text-center uppercase tracking-wider font-bold">
            Thao tác
          </p>
        ),
        key: 'action',
        width: 50, // fixed: 'right',
        render: (_, record) => (
          <div className="flex justify-center">
            <button
              type="button"
              className="bg-white border border-slate-300 text-slate-700 hover:text-[#F37021] hover:border-[#F37021] px-3 py-2 rounded-md text-xs font-bold transition-all shadow-sm whitespace-nowrap"
              onClick={() => navigate(`/exam-staff/appeals/${record.appealId}`)}
            >
              Chi tiết
            </button>
          </div>
        ),
      },
    ],
    [navigate],
  );

  return (
    <MainLayout
      siderIcons={renderedSiderIcons}
      siderItems={STAFF_SIDEBAR_ITEMS}
      notifCount={notifCount}
    >
      <ConfigProvider
        locale={viVN}
        theme={{
          components: {
            Table: {
              cellPaddingInline: 12,
              cellPaddingBlock: 8,
              headerBg: '#f8fafc',
              headerColor: '#45556c',
              headerSplitColor: 'transparent',
              rowHoverBg: 'rgb(243, 112, 33, 0.05)',
            },
            Pagination: {
              itemActiveBg: '#F37021',
              colorPrimary: '#F37021',
              itemActiveColor: '#ffffff',
              colorPrimaryHover: '#ffffff',
            },
          },
        }}
      >
        <div className="p-4 max-w-7xl mx-auto w-full space-y-3">
          <div className="flex gap-2 items-center">
            <h1 className="text-xl font-semibold m-0">Đơn phúc khảo</h1>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {metricCards.map((item) => (
              <DashboardCard
                key={item.id}
                iconName={item.iconName}
                variant="no-bg"
                iconBackground={item.backgroundColor}
                color={item.color}
                title={item.title}
                value={item.value}
              />
            ))}
          </div>
          <CardContainer className="p-0 overflow-hidden">
            <div className="px-4 py-3 space-y-6">
              <div className="flex flex-wrap items-center gap-3 pt-2 border-b border-slate-100 pb-4">
                <Input.Search
                  className="flex-[3] min-w-[200px]"
                  size="medium"
                  placeholder="Tìm theo tên hoặc MSSV"
                  allowClear
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onSearch={(v) => setKeywordInput(v)}
                />
                <Select
                  className="flex-1"
                  placeholder="Trạng thái"
                  allowClear
                  size="medium"
                  options={STATUS_FILTER_OPTIONS}
                  value={statusFilter}
                  onChange={(v) => setStatusFilter(v)}
                />

                <Select
                  className="flex-1"
                  placeholder="Kỳ thi (tên)"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  size="medium"
                  options={examNameOptions.map((n) => ({
                    value: n,
                    label: n,
                  }))}
                  value={examNameFilter}
                  onChange={(v) => setExamNameFilter(v)}
                />
                <Button
                  className="min-w-[140px]"
                  size="medium"
                  icon={<DownloadOutlined />}
                  variant="outlined"
                  loading={isExporting}
                  onClick={handleExportExcel}
                >
                  Xuất Excel
                </Button>
              </div>

              {error && (
                <p className="text-sm text-red-600">
                  Đã có lỗi khi tải dữ liệu. Thử làm mới trang.
                </p>
              )}

              <Table
                rowKey="appealId"
                columns={columns}
                dataSource={rows}
                loading={loading}
                scroll={{ x: 0 }}
                locale={{
                  emptyText: (
                    <Empty description="Không có đơn phúc khảo phù hợp" />
                  ),
                }}
                pagination={{
                  current: (currentPageApi ?? 0) + 1,
                  pageSize: apiPageSize,
                  total: totalElements,
                  showSizeChanger: false,
                  onChange: (p, ps) => {
                    setPage(p - 1);
                    setSize(ps);
                  },
                }}
              />
            </div>
          </CardContainer>
        </div>
      </ConfigProvider>
    </MainLayout>
  );
};

export default AppealPage;
