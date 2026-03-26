/**
 * DEV NOTE:
 * Shared navigation config for all student pages.
 * Keeping this in one place prevents layout drift between StudentDashboard,
 * StudentResultsPage, and StudentResultDetailPage.
 */
export const STUDENT_NAV_ITEMS = [
  { key: 'dashboard', icon: 'home', label: 'Dashboard', to: '/student' },
  { key: 'submit', icon: 'upload_file', label: 'Nộp bài', to: '/student/submit' },
  { key: 'results', icon: 'bar_chart', label: 'Kết quả', to: '/student/results' },
  { key: 'appeals', icon: 'gavel', label: 'Phúc khảo', to: '/student/appeals' },
  { key: 'notifications', icon: 'notifications', label: 'Thông báo', to: '/student/notifications' },
];
