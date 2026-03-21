import React, { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import examApi from '../../services/examApi';
import blockApi from '../../services/blockApi';
import submissionApi from '../../services/submissionApi';

const navItems = [
  { icon: 'home',          label: 'Dashboard',  to: '/student',              active: false },
  { icon: 'upload_file',   label: 'Nộp bài',    to: '/student/submit',       active: false },
  { icon: 'bar_chart',     label: 'Kết quả',    to: '/student/results',      active: true },
  { icon: 'gavel',         label: 'Phúc khảo',  to: '/student/appeals',      active: false },
  { icon: 'notifications', label: 'Thông báo',  to: '/student/notifications',active: false },
];

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const p = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh',
  }).formatToParts(d);
  const get = (type) => p.find((x) => x.type === type)?.value ?? '00';
  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}`;
}

function fmtSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const examStatusLabel = {
  COMPLETED: 'Đã kết thúc',
  ONGOING: 'Đang diễn ra',
  UPCOMING: 'Sắp diễn ra',
  DRAFT: 'Nháp',
};

const examStatusClass = {
  COMPLETED: 'bg-slate-100 text-slate-700 border-slate-200',
  ONGOING: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  UPCOMING: 'bg-amber-50 text-amber-700 border-amber-200',
  DRAFT: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

export default function StudentResultsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const examRes = await examApi.getAll({ page: 0, size: 100, sort: 'startTime,desc' });
      const exams = examRes?.data?.content ?? [];
      const recentExams = exams.slice(0, 20);

      const blocksPerExam = await Promise.allSettled(
        recentExams.map(async (exam) => {
          const blockRes = await blockApi.getByExam(exam.examId);
          const blocks = Array.isArray(blockRes) ? blockRes : blockRes?.data ?? [];
          return blocks.map((b) => ({ ...b, examName: exam.name, examStatus: exam.status }));
        }),
      );

      const allBlocks = blocksPerExam
        .filter((x) => x.status === 'fulfilled')
        .flatMap((x) => x.value);

      const submissions = await Promise.allSettled(
        allBlocks.map(async (block) => {
          const res = await submissionApi.getMySubmission(block.examId, block.blockId);
          const sub = res?.data ?? res;
          if (!sub?.submissionId) return null;
          return {
            submissionId: sub.submissionId,
            examId: block.examId,
            blockId: block.blockId,
            examName: block.examName,
            blockName: block.name,
            examStatus: block.examStatus,
            fileName: sub.fileName,
            fileSizeBytes: sub.fileSizeBytes,
            submittedAt: sub.submittedAt,
            resubmit: Boolean(sub.resubmit),
          };
        }),
      );

      const list = submissions
        .filter((x) => x.status === 'fulfilled' && x.value)
        .map((x) => x.value)
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

      setRows(list);
    } catch (e) {
      console.error('[StudentResultsPage] loadData error:', e);
      setError('Không thể tải kết quả nộp bài. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => ({
    total: rows.length,
    resubmit: rows.filter((r) => r.resubmit).length,
    latest: rows[0]?.submittedAt ?? null,
  }), [rows]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#fffdf8] via-[#f7f8fc] to-[#f3f7ff] font-[Inter] overflow-hidden">
      <aside className="w-64 flex-shrink-0 flex flex-col bg-gradient-to-b from-[#2b2b2f] to-[#232327] border-r border-slate-800 shadow-2xl z-20">
        <div className="px-5 py-5 flex items-center gap-3 border-b border-slate-700/50">
          <div className="w-9 h-9 bg-[#F37021] rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
            <span className="material-symbols-outlined text-white text-[18px]">terminal</span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-black leading-none truncate">Java OOP Exam</p>
            <p className="text-slate-400 text-[9px] mt-0.5 uppercase tracking-widest">FPT University</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={`flex items-center gap-3 h-11 px-3 rounded-xl transition-all duration-200 group ${
                item.active
                  ? 'bg-[#F37021] text-white shadow-md shadow-[#F37021]/30'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[19px]">{item.icon}</span>
              <span className="text-sm font-semibold">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="relative flex-1 overflow-y-auto">
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#f27121]/10 blur-3xl" />
        <div className="pointer-events-none absolute top-40 -right-20 h-72 w-72 rounded-full bg-[#4f46e5]/10 blur-3xl" />

        <div className="relative max-w-6xl mx-auto w-full p-6 sm:p-8 space-y-6">
        <div className="bg-white/90 backdrop-blur rounded-2xl border border-white shadow-xl shadow-slate-900/5 px-6 py-5">
          <h1 className="text-2xl font-black tracking-tight">Kết quả nộp bài</h1>
          <div className="flex items-center text-xs text-slate-500 gap-2 mt-1">
            <Link to="/student" className="hover:text-[#f27121] transition-colors">Trang chủ</Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#f27121] font-medium">Kết quả</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tổng bài đã nộp</p>
            <p className="text-2xl font-black mt-1">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Số lần nộp lại</p>
            <p className="text-2xl font-black mt-1">{stats.resubmit}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Lần nộp gần nhất</p>
            <p className="text-sm font-bold mt-2">{stats.latest ? fmtDate(stats.latest) : '—'}</p>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-full border-4 border-[#f27121]/30 border-t-[#f27121] animate-spin" />
            <p className="text-slate-500 font-medium">Đang tải kết quả nộp bài...</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-2xl border border-red-200 p-10 flex flex-col items-center text-center gap-3 shadow-sm">
            <span className="material-symbols-outlined text-red-400 text-5xl">error</span>
            <p className="font-bold text-slate-700">{error}</p>
            <button
              onClick={loadData}
              className="px-6 py-2.5 bg-[#f27121] text-white rounded-lg font-bold text-sm hover:bg-[#f27121]/90 transition-colors"
            >
              Thử lại
            </button>
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center text-center gap-3 shadow-sm">
            <span className="material-symbols-outlined text-slate-300 text-6xl">assignment_late</span>
            <h2 className="text-xl font-black">Chưa có bài nộp</h2>
            <p className="text-sm text-slate-500 max-w-md">Bạn chưa có dữ liệu nộp bài trong các kỳ thi gần đây.</p>
            <Link to="/student/submit" className="mt-2 px-6 py-2.5 bg-[#f27121] text-white rounded-lg font-bold text-sm hover:bg-[#f27121]/90 transition-colors">
              Đi đến trang nộp bài
            </Link>
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <div className="bg-white/95 backdrop-blur rounded-2xl border border-white shadow-xl shadow-slate-900/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/90 border-b border-slate-200">
                  <tr className="text-left text-slate-500">
                    <th className="px-5 py-3.5 font-bold">Kỳ thi</th>
                    <th className="px-5 py-3.5 font-bold">Ca thi</th>
                    <th className="px-5 py-3.5 font-bold">Tệp nộp</th>
                    <th className="px-5 py-3.5 font-bold">Thời gian nộp</th>
                    <th className="px-5 py-3.5 font-bold">Trạng thái kỳ thi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.submissionId} className="border-b border-slate-100 hover:bg-orange-50/30 transition-colors">
                      <td className="px-5 py-4 font-semibold text-slate-800">{r.examName}</td>
                      <td className="px-5 py-4 text-slate-700">{r.blockName}</td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">{r.fileName || '—'}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{fmtSize(r.fileSizeBytes)}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-700">{fmtDate(r.submittedAt)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${examStatusClass[r.examStatus] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {examStatusLabel[r.examStatus] || r.examStatus || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>
      </main>
      </div>
  );
}
