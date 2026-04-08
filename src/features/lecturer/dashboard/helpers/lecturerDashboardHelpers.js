import { formatDateTime } from '../../../../components/utils/Utils';

export const DASHBOARD_CARD_CONFIG = [
  {
    key: 'assignedAppeals',
    title: 'Đơn đang phụ trách',
    icon: 'assignment_ind',
    tone: 'blue',
  },
  {
    key: 'completedReviews',
    title: 'Đã hoàn thành',
    icon: 'task_alt',
    tone: 'green',
  },
  {
    key: 'overdueAppeals',
    title: 'Quá hạn',
    icon: 'warning',
    tone: 'red',
  },
];

export const URGENCY_META = {
  'CẦN XỬ LÝ NGAY': 'bg-red-50 text-red-700 border-red-200',
  'TRONG 2 NGÀY TỚI': 'bg-amber-50 text-amber-700 border-amber-200',
  'SẮP TỚI': 'bg-sky-50 text-sky-700 border-sky-200',
};

export function getUrgencyClassName(label) {
  return URGENCY_META[label] ?? 'bg-slate-50 text-slate-700 border-slate-200';
}

export function formatDeadline(value) {
  return formatDateTime(value);
}
