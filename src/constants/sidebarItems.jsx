export const STAFF_SIDEBAR_ITEMS = [
  {
    key: '1',
    label: 'Bảng điều khiển',
    to: '/exam-staff',
  },
  {
    key: '2',
    label: 'Quản lí kỳ thi',
    to: '/exam-staff/exams',
  },
  {
    key: '3',
    label: 'Bài nộp',
    to: '/exam-staff/submissions',
  },
  {
    key: '4',
    label: 'Đơn phúc khảo',
    to: '/exam-staff/appeals',
  },
  {
    key: '5',
    label: 'Nhật ký thao tác',
    to: '/exam-staff/audits',
  },
];

export const ADMIN_ICONS = [
  'dashboard',
  'monitoring',
  'group',
  'rule',
  'memory',
  'settings',
];

export const ADMIN_SIDEBAR_ITEMS_FLAT = [
  { key: '1', label: 'Bảng điều khiển', to: '/admin' },
  { key: '2', label: 'Số liệu hệ thống' },
  { key: '3', label: 'Người dùng & Roles', to: '/admin/student-management' },
  { key: '4', label: 'Quy tắc chấm điểm' },
  { key: '5', label: 'Model AI' },
  {
    key: '6',
    label: 'Settings',
  },
];

export const ADMIN_SIDEBAR_ITEMS = [
  {
    key: 'g1',
    label: 'Giám sát',
    type: 'group',
    children: [
      { key: '1', label: 'Bảng điều khiển', to: '/admin' },
      { key: '2', label: 'Số liệu hệ thống' },
    ],
  },
  {
    key: 'g2',
    label: 'Quản lí',
    type: 'group',
    children: [
      {
        key: '3',
        label: 'Người dùng & Roles',
        to: '/admin/student-management',
      },
      { key: '4', label: 'Quy tắc chấm điểm' },
    ],
  },
  {
    key: 'g3',
    label: 'Cấu hình',
    type: 'group',
    children: [
      { key: '5', label: 'Model AI' },
      {
        key: '6',
        label: 'Settings',
      },
    ],
  },
];
