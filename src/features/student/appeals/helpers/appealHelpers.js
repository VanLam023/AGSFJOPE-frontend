const CURRENCY_FORMATTER = new Intl.NumberFormat('vi-VN');
const DEFAULT_MIN_REASON_LENGTH = 10;
const MAX_REASON_LENGTH = 2000;

export function unwrapApiData(response) {
  return response?.data ?? response ?? null;
}

export function formatCurrency(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '0 ₫';
  return `${CURRENCY_FORMATTER.format(number)} ₫`;
}

export function formatScore(value, digits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return number.toFixed(digits);
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh',
  });
}

export function formatShortDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
}

export function normalizeAppealReason(value) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/\r\n/g, '\n')
    .slice(0, MAX_REASON_LENGTH);
}

export function validateAppealReason(value) {
  const reason = normalizeAppealReason(value).trim();

  if (!reason) {
    return 'Vui lòng nhập lý do phúc khảo.';
  }

  if (reason.length < DEFAULT_MIN_REASON_LENGTH) {
    return 'Lý do phúc khảo cần cụ thể hơn, tối thiểu 10 ký tự.';
  }

  return '';
}

export function extractAppealErrorMessage(error, fallback = 'Đã xảy ra lỗi. Vui lòng thử lại.') {
  const status = Number(error?.response?.status || error?.status || 0);
  const serverMessage = String(error?.response?.data?.message || '').trim();

  if (serverMessage) return serverMessage;

  if (!error?.response) {
    return 'Không thể kết nối lúc này. Vui lòng kiểm tra mạng và thử lại.';
  }

  if (status === 400) return 'Dữ liệu phúc khảo chưa hợp lệ. Vui lòng kiểm tra lại.';
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác phúc khảo này.';
  if (status === 404) return 'Không tìm thấy bài nộp hoặc thông tin phúc khảo tương ứng.';
  if (status === 409) return 'Bài nộp này đã có đơn phúc khảo hoặc đang ở trạng thái không cho phép.';
  if (status >= 500) return 'Hệ thống đang bận. Vui lòng thử lại sau ít phút.';

  return fallback;
}

export function getAppealStatusMeta(status) {
  const normalized = String(status || '').toUpperCase();

  const map = {
    PENDING_PAYMENT: {
      label: 'Chờ thanh toán',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
      dotClassName: 'bg-amber-500',
      accentClassName: 'border-l-amber-400',
    },
    PENDING: {
      label: 'Đã tiếp nhận',
      className: 'border-sky-200 bg-sky-50 text-sky-700',
      dotClassName: 'bg-sky-500',
      accentClassName: 'border-l-sky-400',
    },
    PROCESSING: {
      label: 'Đang chấm',
      className: 'border-indigo-200 bg-indigo-50 text-indigo-700',
      dotClassName: 'bg-indigo-500',
      accentClassName: 'border-l-indigo-400',
    },
    COMPLETED: {
      label: 'Đang duyệt',
      className: 'border-violet-200 bg-violet-50 text-violet-700',
      dotClassName: 'bg-violet-500',
      accentClassName: 'border-l-violet-400',
    },
    APPROVED: {
      label: 'Đã chấp nhận',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      dotClassName: 'bg-emerald-500',
      accentClassName: 'border-l-emerald-500',
    },
    DENIED: {
      label: 'Đã từ chối',
      className: 'border-rose-200 bg-rose-50 text-rose-700',
      dotClassName: 'bg-rose-500',
      accentClassName: 'border-l-rose-500',
    },
    CANCELLED: {
      label: 'Đã hủy',
      className: 'border-slate-200 bg-slate-50 text-slate-700',
      dotClassName: 'bg-slate-400',
      accentClassName: 'border-l-slate-300',
    },
  };

  return map[normalized] || {
    label: normalized || '—',
    className: 'border-slate-200 bg-slate-50 text-slate-700',
    dotClassName: 'bg-slate-400',
    accentClassName: 'border-l-slate-300',
  };
}

export function isAppealFinalStatus(status) {
  const normalized = String(status || '').toUpperCase();
  return ['APPROVED', 'DENIED', 'CANCELLED'].includes(normalized);
}

export function getAppealProgressSteps(status) {
  const normalized = String(status || '').toUpperCase();

  const stepIndexMap = {
    PENDING_PAYMENT: 0,
    PENDING: 1,
    PROCESSING: 2,
    COMPLETED: 3,
    APPROVED: 4,
    DENIED: 4,
    CANCELLED: 4,
  };

  const currentStep = stepIndexMap[normalized] ?? 0;

  const labels = [
    'Tạo đơn',
    'Đã tiếp nhận',
    'Đang chấm',
    'Duyệt kết quả',
    'Hoàn tất',
  ];

  return labels.map((label, index) => {
    const isDone = currentStep > index;
    const isCurrent = currentStep === index;
    return {
      label,
      isDone,
      isCurrent,
    };
  });
}

export function getAppealScoreSummary(item) {
  const originalScore = Number(item?.originalScore);
  const newScore = Number(item?.newScore);
  const hasOriginal = Number.isFinite(originalScore);
  const hasNew = Number.isFinite(newScore);

  if (!hasOriginal) {
    return {
      variant: 'empty',
      originalText: '—',
      newText: '—',
      changed: false,
    };
  }

  if (!hasNew) {
    return {
      variant: 'single',
      originalText: formatScore(originalScore),
      newText: '',
      changed: false,
    };
  }

  return {
    variant: 'delta',
    originalText: formatScore(originalScore),
    newText: formatScore(newScore),
    changed: Math.abs(newScore - originalScore) > 0.00001,
  };
}

export function buildAppealSearchIndex(item) {
  return [
    item?.appealCode,
    item?.examName,
    item?.semester,
    item?.assignedLecturerName,
    item?.reason,
    item?.lecturerComment,
    item?.status,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function resolveAppealOverview(data) {
  const appeals = Array.isArray(data?.appeals) ? data.appeals : [];
  return {
    totalAppeals: Number(data?.totalAppeals ?? appeals.length ?? 0),
    processingCount: Number(data?.processingCount ?? 0),
    approvedCount: Number(data?.approvedCount ?? 0),
    deniedCount: Number(data?.deniedCount ?? 0),
    appeals,
  };
}

export function resolveAppealCreatePrefill(prefill, submissionId) {
  return {
    submissionId: prefill?.submissionId || submissionId,
    examName: prefill?.examName || prefill?.blockName || 'Bài nộp cần phúc khảo',
    semesterName: prefill?.semesterName || prefill?.semester || '—',
    blockName: prefill?.blockName || '—',
    totalScore: prefill?.totalScore,
    maxScore: prefill?.maxScore,
    gradedAt: prefill?.gradedAt,
  };
}
