import React from 'react';
import { formatDateTime } from '../../../../components/utils/Utils';

const STATUS_META = {
  PENDING: {
    label: 'Chờ phân công',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  PROCESSING: {
    label: 'Đang xử lý',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  COMPLETED: {
    label: 'Đã gửi review',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  APPROVED: {
    label: 'Đã duyệt',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  DENIED: {
    label: 'Từ chối',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
  CANCELLED: {
    label: 'Đã hủy',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  },
};

function LecturerDashboardAppealStatusBadge({ status }) {
  const meta =
    STATUS_META[String(status || '').toUpperCase()] || {
      label: status || 'Không xác định',
      className: 'bg-slate-100 text-slate-700 border-slate-200',
    };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

function TableSkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      {Array.from({ length: 6 }).map((_, index) => (
        <td key={index} className="px-4 py-4">
          <div className="h-4 rounded bg-slate-100 animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

export default function LecturerAssignedAppealsTable({
  items,
  loading,
  onOpenAppeal,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-black text-slate-900">
            Đơn phúc khảo được giao
          </h2>
          <p className="text-sm text-slate-500">
            Danh sách đơn gần đây cần giảng viên theo dõi.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Sinh viên</th>
              <th className="px-4 py-3 font-semibold">Kỳ thi</th>
              <th className="px-4 py-3 font-semibold">Ngày giao</th>
              <th className="px-4 py-3 font-semibold">Deadline</th>
              <th className="px-4 py-3 font-semibold">Trạng thái</th>
              <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <TableSkeletonRow key={index} />
              ))
            ) : items?.length ? (
              items.map((item) => (
                <tr
                  key={item.appealId}
                  className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70 transition-colors"
                >
                  <td className="px-4 py-4 align-top">
                    <p className="text-sm font-semibold text-slate-900">
                      {item.studentName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.studentMssv || '—'}
                    </p>
                  </td>

                  <td className="px-4 py-4 align-top">
                    <p className="text-sm font-medium text-slate-900">
                      {item.examName || '—'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.blockName || '—'}
                    </p>
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-600 align-top">
                    {formatDateTime(item.assignedDate)}
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-600 align-top">
                    {formatDateTime(item.deadline)}
                  </td>

                  <td className="px-4 py-4 align-top">
                    <LecturerDashboardAppealStatusBadge status={item.status} />
                  </td>

                  <td className="px-4 py-4 align-top text-right">
                    <button
                      type="button"
                      onClick={() => onOpenAppeal(item.appealId)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-[#F37021] hover:text-[#F37021] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        open_in_new
                      </span>
                      Mở đơn
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-slate-500"
                >
                  Hiện chưa có đơn nào được giao cho bạn.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}