import StatisticsSectionCard from './StatisticsSectionCard.jsx';
import { formatPercent, formatScore } from '../utils/statisticsHelpers';

export default function StatisticsAiOverviewCard({ summary }) {
  const items = [
    {
      key: 'avgOopScore',
      title: 'Điểm OOP trung bình',
      value: formatScore(summary?.avgOopScore),
      helper: 'Điểm do AI review tổng hợp',
      accent: 'text-violet-600',
      bg: 'bg-violet-50 border-violet-200',
      icon: 'account_tree',
    },
    {
      key: 'oopViolatedRate',
      title: 'Tỷ lệ vi phạm OOP',
      value: formatPercent(summary?.oopViolatedRate),
      helper: `${summary?.oopViolatedCount ?? 0} lượt bị flag`,
      accent: 'text-rose-600',
      bg: 'bg-rose-50 border-rose-200',
      icon: 'warning',
    },
    {
      key: 'hardCodeRate',
      title: 'Tỷ lệ hard-code',
      value: formatPercent(summary?.hardCodeRate),
      helper: `${summary?.hardCodeCount ?? 0} lượt phát hiện`,
      accent: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-200',
      icon: 'code',
    },
  ];

  return (
    <StatisticsSectionCard title="Tổng quan AI / OOP" className="h-full">
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.key}
            className={`rounded-2xl border px-4 py-4 ${item.bg}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{item.title}</p>
                <p className="text-2xl font-black text-slate-900 mt-2">{item.value}</p>
                <p className="text-xs text-slate-500 mt-2">{item.helper}</p>
              </div>
              <span className={`material-symbols-outlined text-[24px] ${item.accent}`}>
                {item.icon}
              </span>
            </div>
          </div>
        ))}
      </div>
    </StatisticsSectionCard>
  );
}