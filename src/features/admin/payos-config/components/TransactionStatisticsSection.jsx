const currencyFormatter = new Intl.NumberFormat('vi-VN');

function TransactionMetricCard({ label, value, meta, metaVariant, progress }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <div className="flex items-end justify-between gap-3">
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>

        {typeof progress === 'number' ? (
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-green-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : meta ? (
          <span
            className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold ${
              metaVariant === 'positive'
                ? 'bg-green-500/10 text-green-600'
                : 'text-slate-400'
            }`}
          >
            {meta}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function TransactionStatusBadge({ status }) {
  const statusClasses = {
    Success: 'bg-green-100 text-green-600',
    Pending: 'bg-amber-100 text-amber-600',
    Failed: 'bg-red-100 text-red-600',
    Refunded: 'bg-slate-100 text-slate-600',
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
        statusClasses[status] ?? 'bg-slate-100 text-slate-600'
      }`}
    >
      {status}
    </span>
  );
}

export default function TransactionStatisticsSection({
  stats,
  transactions,
  searchQuery,
  onSearchChange,
  onExport,
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#F37021]">
            monitoring
          </span>
          <h2 className="text-lg font-bold text-slate-900">
            Thống kê giao dịch
          </h2>
        </div>

        <button
          type="button"
          onClick={onExport}
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-[#F37021]"
        >
          <span>Xuất báo cáo</span>
          <span className="material-symbols-outlined text-[16px]">download</span>
        </button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {stats.map((item) => (
          <TransactionMetricCard
            key={item.key}
            label={item.label}
            value={item.value}
            meta={item.meta}
            metaVariant={item.metaVariant}
            progress={item.progress}
          />
        ))}
      </div>

      <div className="overflow-x-auto">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h3 className="text-sm font-bold text-slate-900">Giao dịch gần đây</h3>

          <div className="relative">
            <input
              className="w-full rounded-full border border-slate-200 bg-white py-1.5 pl-8 pr-4 text-xs outline-none transition focus:border-[#F37021] sm:w-48"
              type="text"
              placeholder="Tìm sinh viên..."
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
            />
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-slate-400">
              search
            </span>
          </div>
        </div>

        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-500">
              <th className="pb-3 pr-4">Sinh viên</th>
              <th className="px-4 pb-3">Mã giao dịch</th>
              <th className="px-4 pb-3 text-right">Số tiền</th>
              <th className="px-4 pb-3">Trạng thái</th>
              <th className="pb-3 pl-4 text-right">Ngày thực hiện</th>
            </tr>
          </thead>

          <tbody className="text-sm">
            {transactions.map((transaction) => (
              <tr
                key={transaction.key}
                className="border-b border-slate-50 transition hover:bg-slate-50/70 last:border-b-0"
              >
                <td className="py-4 pr-4 font-medium text-slate-900">
                  {transaction.studentName}
                </td>
                <td className="px-4 py-4 font-mono text-xs text-slate-500">
                  {transaction.paymentCode}
                </td>
                <td className="px-4 py-4 text-right font-semibold text-slate-900">
                  {currencyFormatter.format(transaction.amount)}đ
                </td>
                <td className="px-4 py-4">
                  <TransactionStatusBadge status={transaction.status} />
                </td>
                <td className="py-4 pl-4 text-right text-xs text-slate-500">
                  {transaction.executedAt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-col justify-between gap-3 text-xs font-medium text-slate-500 sm:flex-row sm:items-center">
        <p>Hiển thị {transactions.length} trên 1,284 giao dịch</p>

        <div className="flex gap-2">
          <button className="rounded border border-slate-200 px-3 py-1 transition hover:bg-slate-100">
            Trước
          </button>
          <button className="rounded border border-slate-200 px-3 py-1 transition hover:bg-slate-100">
            Sau
          </button>
        </div>
      </div>
    </section>
  );
}