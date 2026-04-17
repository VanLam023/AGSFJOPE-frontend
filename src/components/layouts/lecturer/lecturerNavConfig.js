export const LECTURER_NAV_ITEMS = [
  { key: 'dashboard', icon: 'dashboard', label: 'Dashboard', to: '/lecturer' },
  {
    key: 'notifications',
    icon: 'notifications',
    label: 'Thông báo',
    to: '/lecturer/notifications',
    matchPrefix: '/lecturer/notifications',
  },
  {
    key: 'appeals',
    icon: 'description',
    label: 'Phúc khảo',
    to: '/lecturer/appeals',
    matchPrefix: '/lecturer/appeals',
  },
];
