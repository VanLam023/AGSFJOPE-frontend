const testDashboardCardData = [
  {
    id: '1',
    title: 'Tổng người dùng',
    value: 1240,
    trend: '5.2%',
  },
  {
    id: '2',
    title: 'Số kì thi đang diễn ra',
    value: 48,
    trend: '0%',
  },
  {
    id: '3',
    title: 'Số bài nộp',
    value: 3,
    trend: '12.1%',
  },
  {
    id: '4',
    title: 'Bài cần phúc khảo',
    value: 18,
    trend: '!',
  },
];

const submissionsDay24H = {
  xAxis: ['07:00-08:30', '12:00-13:30', '15:00-16:30'],
  data: [60, 57, 60],
};

const submissionsBlock5 = {
  xAxis: ['09:00-10:30', '13:30-15:00', '15:30-17:00'],
  data: [50, 67, 70],
};

const submissionsBlock10 = {
  xAxis: ['09:00-10:30', '13:30-15:00', '15:30-17:00'],
  data: [53, 62, 50],
};

const userData = [
  { name: 'Sinh viên', value: 500 },
  { name: 'Giảng viên', value: 90 },
  { name: 'Cán bộ/Quản trị viên', value: 10 },
];

const auditLogs = [
  {
    id: 1,
    user: { initials: 'NV', initialsColor: 'bg-blue-100 text-blue-600', name: 'Nguyễn Văn A' },
    event: { label: 'Cập nhật prompt AI', icon: 'edit', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
    time: '2 phút trước',
    ip: '192.168.1.1',
  },
  {
    id: 2,
    user: { initials: 'LT', initialsColor: 'bg-purple-100 text-purple-600', name: 'Lê Thị B' },
    event: { label: 'Tạo kỳ thi mới', icon: 'add_circle', cls: 'bg-green-50 text-green-700 border-green-200' },
    time: '15 phút trước',
    ip: '172.16.254.1',
  },
  {
    id: 3,
    user: { initials: 'SA', initialsColor: 'bg-slate-800 text-white', name: 'Quản trị hệ thống' },
    event: { label: 'Thay đổi phân quyền', icon: 'admin_panel_settings', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
    time: '1 giờ trước',
    ip: '10.0.0.42',
  },
  {
    id: 4,
    user: { initials: 'TV', initialsColor: 'bg-blue-100 text-blue-600', name: 'Trần Văn C' },
    event: { label: 'Duyệt phúc khảo #104', icon: 'done_all', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    time: '3 giờ trước',
    ip: '192.168.1.15',
  },
  {
    id: 5,
    user: { initials: 'NT', initialsColor: 'bg-blue-100 text-blue-600', name: 'Nguyễn Thị D' },
    event: { label: 'Cập nhật cấu hình PayOS', icon: 'settings', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
    time: '5 giờ trước',
    ip: '127.0.0.1',
  },
];

const resourceMonitors = [
  {
    label: 'CPU',
    sub: 'Intel Xeon E5',
    value: 24,
    color: 'bg-[#F37021]',
    glow: 'shadow-[0_0_10px_rgba(243,112,33,0.35)]',
    textColor: 'text-[#F37021]',
  },
  {
    label: 'Bộ nhớ',
    sub: '39.6 GB / 64 GB',
    value: 62,
    color: 'bg-[#FB923C]',
    glow: 'shadow-[0_0_10px_rgba(251,146,60,0.35)]',
    textColor: 'text-[#EA580C]',
  },
  {
    label: 'Lưu trữ (NVMe)',
    sub: '900 GB / 2 TB',
    value: 45,
    color: 'bg-[#FDBA74]',
    glow: 'shadow-[0_0_10px_rgba(253,186,116,0.45)]',
    textColor: 'text-[#C2410C]',
  },
];

export {
  testDashboardCardData,
  submissionsDay24H,
  submissionsBlock5,
  submissionsBlock10,
  userData,
  auditLogs,
  resourceMonitors,
};
