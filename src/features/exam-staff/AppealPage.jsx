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
  SubmissionsIcon,
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
  const debouncedKeyword = useDebounce(keywordInput, 400);
  const [examNameOptions, setExamNameOptions] = useState([]);
  const filterKeyRef = useRef(null);

  const { fetchStaffAppeals, data, loading, error } = useStaffAppeals();

  const renderedSiderIcons = icons.map((item, index) => {
    const isActive = index + 1 === 4;
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

  //   const handleExportExcel = useCallback(async () => {
  //     setExporting(true);
  //     try {
  //       const kw = debouncedKeyword || '';
  //       const batchSize = 500;
  //       const collected = [];
  //       let total = Infinity;
  //       for (let pageIdx = 0; pageIdx <= 200; pageIdx += 1) {
  //         const envelope = await getStaffAppeals({
  //           page: pageIdx,
  //           size: batchSize,
  //           status: statusFilter,
  //           keyword: kw || undefined,
  //           semester: semesterFilter,
  //           examName: examNameFilter,
  //         });
  //         const pageData = envelope?.data ?? null;
  //         const list = pageData?.appeals ?? [];
  //         total = pageData?.totalElements ?? collected.length + list.length;
  //         collected.push(...list);
  //         if (list.length === 0 || collected.length >= total) {
  //           break;
  //         }
  //         if (list.length < batchSize) {
  //           break;
  //         }
  //       }

  //       if (!collected.length) {
  //         message.warning('Không có dữ liệu để xuất.');
  //         return;
  //       }

  //       const headers = [
  //         'STT',
  //         'Mã đơn',
  //         'Sinh viên',
  //         'MSSV',
  //         'Kỳ học',
  //         'Kỳ thi',
  //         'Block',
  //         'Trạng thái',
  //         'Giảng viên',
  //         'Hạn xử lý',
  //       ];
  //       const csvRows = collected.map((row, idx) => {
  //         const cfg =
  //           appealStatusConfig[row.status] ?? appealStatusConfig.PENDING;
  //         return [
  //           idx + 1,
  //           row.appealCode ?? '',
  //           row.studentName ?? '',
  //           row.studentMssv ?? '',
  //           row.semester ?? '',
  //           row.examName ?? '',
  //           row.blockName ?? '',
  //           cfg.label,
  //           row.assignedLecturerName ?? '',
  //           formatDateTime(row.deadlineAt),
  //         ];
  //       });
  //       const csv = [headers, ...csvRows]
  //         .map((r) => r.map(escapeCsvCell).join(','))
  //         .join('\n');
  //       const blob = new Blob([`\uFEFF${csv}`], {
  //         type: 'text/csv;charset=utf-8;',
  //       });
  //       const url = URL.createObjectURL(blob);
  //       const a = document.createElement('a');
  //       a.href = url;
  //       a.download = `don-phuc-khao-${new Date().toISOString().slice(0, 10)}.csv`;
  //       document.body.appendChild(a);
  //       a.click();
  //       a.remove();
  //       URL.revokeObjectURL(url);
  //       message.success('Đã xuất file.');
  //     } catch {
  //       message.error('Xuất file thất bại.');
  //     } finally {
  //       setExporting(false);
  //     }
  //   }, [
  //     debouncedKeyword,
  //     statusFilter,
  //     semesterFilter,
  //     examNameFilter,
  //   ]);

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
        width: 40,
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
        width: 50,
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
