import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../app/context/authContext';
import examApi from '../../services/examApi';
import blockApi from '../../services/blockApi';
import submissionApi from '../../services/submissionApi';
import gradingApi from '../../services/gradingApi';

// ─── Nav items ───────────────────────────────────────────────────────────────
const navItems = [
  { icon: 'home',          label: 'Dashboard',  to: '/student',               active: false },
  { icon: 'upload_file',   label: 'Nộp bài',    to: '/student/submit',        active: false },
  { icon: 'bar_chart',     label: 'Kết quả',    to: '/student/results',       active: true  },
  { icon: 'gavel',         label: 'Phúc khảo',  to: '/student/appeals',       active: false },
  { icon: 'notifications', label: 'Thông báo',  to: '/student/notifications', active: false },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

// ─── Score badge ─────────────────────────────────────────────────────────────
function ScoreBadge({ score, maxScore }) {
  if (score == null) {
    return <span className="text-slate-400 font-medium text-sm">—</span>;
  }
  const num = parseFloat(score);
  const max = parseFloat(maxScore) || 10;
  const pct = Math.min(100, (num / max) * 100);
  const color = num >= 8 ? '#22c55e' : num >= 5 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex flex-col gap-1.5 min-w-[80px]">
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-black" style={{ color }}>{num.toFixed(1)}</span>
        <span className="text-xs text-slate-400 font-medium">/ {max.toFixed(1)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden w-full">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─── Grading status badge ────────────────────────────────────────────────────
const gradingStatusMap = {
  PASS:      { label: 'Đạt',         cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  FAIL:      { label: 'Không đạt',   cls: 'bg-red-50 text-red-700 border-red-200',             dot: 'bg-red-500' },
  GRADING:   { label: 'Đang chấm',   cls: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-400 animate-pulse' },
  SUBMITTED: { label: 'Chờ chấm',    cls: 'bg-sky-50 text-sky-700 border-sky-200',             dot: 'bg-sky-400' },
  PENDING:   { label: 'Chờ chấm',    cls: 'bg-sky-50 text-sky-700 border-sky-200',             dot: 'bg-sky-400' },
};

function StatusBadge({ status }) {
  const info = gradingStatusMap[status] || { label: status || '—', cls: 'bg-slate-50 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${info.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${info.dot}`} />
      {info.label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StudentResultsPage() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);
  const [sidebarDropdownOpen, setSidebarDropdownOpen] = useState(false);
  const headerRef = useRef(null);
  const sidebarRef = useRef(null);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── User display ─────────────────────────────────────────────────────────────
  const displayName = user?.fullName || 'Sinh viên';
  const displayId   = user?.userId ? `ID: ${user.userId.slice(0, 8).toUpperCase()}` : '—';
  const avatarText  = displayName !== 'Sinh viên'
    ? displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'SV';

  // ── Fetch data ───────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Lấy danh sách exams
      const examRes = await examApi.getAll({ page: 0, size: 100, sort: 'startTime,desc' });
      const exams   = examRes?.data?.content ?? [];

      // 2. Lấy blocks cho mỗi exam
      const blockResults = await Promise.allSettled(
        exams.map(async (exam) => {
          const res    = await blockApi.getByExam(exam.examId);
          const blocks = Array.isArray(res) ? res : res?.data ?? [];
          return blocks.map((b) => ({
            ...b,
            examName:     exam.name,
            examSemester: exam.semester ?? '',
            examStatus:   exam.status,
          }));
        }),
      );

      const allBlocks = blockResults
        .filter((r) => r.status === 'fulfilled')
        .flatMap((r) => r.value);

      if (allBlocks.length === 0) {
        setRows([]);
        return;
      }

      // 3. Song song: lấy submission + grading result cho từng block
      const enriched = await Promise.allSettled(
        allBlocks.map(async (block, idx) => {
          // Submission
          let sub = null;
          try {
            const subRes = await submissionApi.getMySubmission(block.examId, block.blockId);
            const data   = subRes?.data ?? subRes;
            if (data?.submissionId) sub = data;
          } catch { /* block chưa nộp — bỏ qua */ }

          if (!sub) return null; // Không có bài nộp → bỏ qua block này

          // Grading result (có thể chưa có)
          let grading = null;
          try {
            const gRes = await gradingApi.getMyResult(block.examId, block.blockId);
            grading    = gRes?.data ?? gRes;
          } catch { /* chưa có kết quả — grading = null */ }

          return {
            _idx:         idx,
            examId:       block.examId,
            blockId:      block.blockId,
            submissionId: sub.submissionId,
            examName:     block.examName,
            semester:     block.examSemester,
            blockName:    block.name,
            examDate:     block.startTime,
            submittedAt:  sub.submittedAt,
            // Grading fields
            totalScore:   grading?.totalScore ?? null,
            maxScore:     grading?.maxScore   ?? null,
            gradingStatus: grading
              ? grading.status          // PASS | FAIL
              : sub.status === 'GRADING'
                ? 'GRADING'
                : 'SUBMITTED',          // chưa chấm
            gradedAt:     grading?.gradedAt ?? null,
            gradingResultId: grading?.gradingResultId ?? null,
          };
        }),
      );

      const list = enriched
        .filter((r) => r.status === 'fulfilled' && r.value)
        .map((r) => r.value)
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

      setRows(list);
    } catch (e) {
      console.error('[StudentResultsPage] loadData error:', e);
      setError('Không thể tải kết quả. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Click outside ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const fn = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target))  setHeaderDropdownOpen(false);
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) setSidebarDropdownOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const handleLogout = () => {
    logout();
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-gradient-to-br from-[#f7f7f8] via-[#f6f6f8] to-[#fffaf6] font-[Inter,sans-serif] overflow-hidden">

      {/* ══════ SIDEBAR ══════ */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-[72px]'} transition-[width] duration-300 ease-in-out flex-shrink-0 flex flex-col bg-gradient-to-b from-[#2b2b2f] to-[#232327] border-r border-slate-800 shadow-2xl z-20`}>
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-3 border-b border-slate-700/50">
          <div className="w-9 h-9 bg-[#F37021] rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
            <span className="material-symbols-outlined text-white text-[18px]">terminal</span>
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="text-white text-sm font-black leading-none truncate">Java OOP Exam</p>
              <p className="text-slate-400 text-[9px] mt-0.5 uppercase tracking-widest">FPT University</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              title={!sidebarOpen ? item.label : undefined}
              className={`flex items-center gap-3 h-11 px-3 rounded-xl transition-all duration-200 group
                ${item.active
                  ? 'bg-[#F37021]/10 text-[#F37021]'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
            >
              <span className={`material-symbols-outlined text-[20px] flex-shrink-0 ${item.active ? 'text-[#F37021]' : 'group-hover:text-slate-200'}`}>
                {item.icon}
              </span>
              {sidebarOpen && (
                <span className={`text-sm font-semibold truncate ${item.active ? 'font-bold text-[#F37021]' : ''}`}>
                  {item.label}
                </span>
              )}
              {item.active && sidebarOpen && (
                <div className="ml-auto w-1.5 h-5 rounded-full bg-[#F37021] flex-shrink-0" />
              )}
            </Link>
          ))}
        </nav>

        {/* User area */}
        <div className="px-3 py-4 border-t border-slate-700/50" ref={sidebarRef}>
          {sidebarDropdownOpen && sidebarOpen && (
            <div className="mb-2 bg-[#3a3a3a] rounded-2xl border border-slate-700 shadow-xl py-1 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700">
                <p className="text-sm font-bold text-white">{displayName}</p>
              </div>
              <Link
                to="/student/profile"
                onClick={() => setSidebarDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] text-slate-400">person</span>
                Hồ sơ cá nhân
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-slate-700 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Đăng xuất
              </button>
            </div>
          )}
          <button
            onClick={() => setSidebarDropdownOpen(!sidebarDropdownOpen)}
            className={`w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 transition-colors ${!sidebarOpen ? 'justify-center' : ''}`}
          >
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-[#F37021]/20 text-[#F37021] font-black text-sm flex items-center justify-center ring-2 ring-[#F37021]/30">
                {avatarText}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#2D2D2D]" />
            </div>
            {sidebarOpen && (
              <>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-white text-[13px] font-bold truncate">{displayName}</p>
                  <p className="text-slate-400 text-[10px] truncate">{displayId}</p>
                </div>
                <span className={`material-symbols-outlined text-slate-400 text-[18px] transition-transform duration-200 ${sidebarDropdownOpen ? 'rotate-180' : ''}`}>
                  expand_less
                </span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ══════ MAIN ══════ */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between h-16 px-8 border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-9 h-9 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-all"
            >
              <span className="material-symbols-outlined text-xl">menu</span>
            </button>
            <div>
              <h1 className="text-slate-800 font-black text-[17px] leading-none">Kết quả chấm bài</h1>
              <div className="flex items-center text-[11px] text-slate-400 gap-1 mt-0.5">
                <Link to="/student" className="hover:text-[#F37021] transition-colors">Trang chủ</Link>
                <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                <span className="text-[#F37021] font-medium">Kết quả</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              title="Làm mới"
              className="w-9 h-9 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-all"
            >
              <span className={`material-symbols-outlined text-xl ${loading ? 'animate-spin' : ''}`}>refresh</span>
            </button>
            <div className="relative" ref={headerRef}>
              <button
                onClick={() => setHeaderDropdownOpen(!headerDropdownOpen)}
                className="w-9 h-9 rounded-full bg-[#F37021]/20 text-[#F37021] font-black text-sm flex items-center justify-center ring-2 ring-[#F37021]/30 hover:ring-[#F37021]/60 transition-all cursor-pointer"
              >
                {avatarText}
              </button>
              {headerDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-slate-200 shadow-xl py-1 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-800">{displayName}</p>
                  </div>
                  <Link
                    to="/student/profile"
                    onClick={() => setHeaderDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-slate-400">person</span>
                    Hồ sơ cá nhân
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-8 py-8 max-w-7xl mx-auto space-y-6">

            {/* ── Page title section ── */}
            <section className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 shadow-sm px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Lịch sử kết quả nộp bài</h2>
                <p className="text-sm text-slate-500 mt-1">Theo dõi trạng thái chấm và điểm số của từng kỳ thi.</p>
              </div>
              <div className="hidden sm:flex w-11 h-11 rounded-xl bg-[#F37021]/10 text-[#F37021] items-center justify-center">
                <span className="material-symbols-outlined">bar_chart</span>
              </div>
            </section>

            {/* ── Loading ── */}
            {loading && (
              <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-full border-4 border-[#F37021]/30 border-t-[#F37021] animate-spin" />
                <p className="text-slate-500 font-medium">Đang tải kết quả chấm bài...</p>
              </div>
            )}

            {/* ── Error ── */}
            {!loading && error && (
              <div className="bg-white rounded-2xl border border-red-200 p-12 flex flex-col items-center text-center gap-3 shadow-sm">
                <span className="material-symbols-outlined text-red-400 text-5xl">error</span>
                <p className="font-bold text-slate-700">{error}</p>
                <button
                  onClick={loadData}
                  className="px-6 py-2.5 bg-[#F37021] text-white rounded-xl font-bold text-sm hover:bg-orange-500 transition-colors"
                >
                  Thử lại
                </button>
              </div>
            )}

            {/* ── Empty ── */}
            {!loading && !error && rows.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center text-center gap-4 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-300 text-4xl">assignment_late</span>
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">Chưa có kết quả nào</h2>
                  <p className="text-sm text-slate-500 mt-1">Bạn chưa có bài nộp nào trong các kỳ thi gần đây.</p>
                </div>
                <Link
                  to="/student/submit"
                  className="mt-1 px-6 py-2.5 bg-[#F37021] text-white rounded-xl font-bold text-sm hover:bg-orange-500 transition-colors"
                >
                  Đi đến trang nộp bài
                </Link>
              </div>
            )}

            {/* ── Table ── */}
            {!loading && !error && rows.length > 0 && (
              <div className="bg-white/95 backdrop-blur rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/5 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black text-slate-800">Lịch sử nộp bài &amp; kết quả</h2>
                    <p className="text-xs text-slate-400 mt-0.5">{rows.length} bài nộp</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] table-fixed text-sm">
                    <thead>
                      <tr className="bg-slate-50/90 border-b border-slate-100 text-center text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <th className="px-5 py-3.5 w-[56px] text-center">#</th>
                        <th className="px-5 py-3.5 w-[18%] text-center">Tên kỳ thi</th>
                        <th className="px-5 py-3.5 w-[8%] text-center">Kỳ</th>
                        <th className="px-5 py-3.5 w-[18%] text-center">Block / Ca</th>
                        <th className="px-5 py-3.5 w-[14%] text-center">Ngày thi</th>
                        <th className="px-5 py-3.5 w-[14%] text-center">Điểm số</th>
                        <th className="px-5 py-3.5 w-[13%] text-center">Trạng thái</th>
                        <th className="px-5 py-3.5 w-[12%] text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {rows.map((r, i) => (
                        <tr
                          key={r.submissionId}
                          className="odd:bg-white even:bg-slate-50/30 hover:bg-orange-50/40 transition-colors group"
                        >
                          {/* # */}
                          <td className="px-5 py-4 text-slate-400 font-bold text-xs text-center align-middle">{i + 1}</td>

                          {/* Exam name */}
                          <td className="px-5 py-4 text-center align-middle">
                            <p className="font-bold text-slate-800 leading-snug line-clamp-2 max-w-[180px] mx-auto">{r.examName}</p>
                          </td>

                          {/* Semester */}
                          <td className="px-5 py-4 text-center align-middle">
                            {r.semester ? (
                              <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">{r.semester}</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* Block */}
                          <td className="px-5 py-4 text-center align-middle">
                            <p className="text-slate-700 font-semibold">{r.blockName || '—'}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Nộp: {fmtDate(r.submittedAt)}</p>
                          </td>

                          {/* Ngày thi */}
                          <td className="px-5 py-4 text-slate-600 whitespace-nowrap text-center align-middle">
                            {fmtDate(r.examDate)}
                          </td>

                          {/* Điểm */}
                          <td className="px-5 py-4 text-center align-middle">
                            <div className="flex justify-center">
                              <ScoreBadge score={r.totalScore} maxScore={r.maxScore} />
                            </div>
                          </td>

                          {/* Trạng thái */}
                          <td className="px-5 py-4 text-center align-middle">
                            <div className="flex flex-col items-center">
                              <StatusBadge status={r.gradingStatus} />
                            {r.gradedAt && (
                              <p className="text-[10px] text-slate-400 mt-1">Chấm: {fmtDate(r.gradedAt)}</p>
                            )}
                            </div>
                          </td>

                          {/* Hành động */}
                          <td className="px-5 py-4 text-center align-middle">
                            <div className="flex items-center justify-center gap-2">
                              {/* Xem chi tiết — chỉ hiện khi đã có kết quả */}
                              {r.gradingResultId ? (
                                <Link
                                  to={`/student/results/${r.submissionId}`}
                                  state={{ examId: r.examId, blockId: r.blockId }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F37021]/10 text-[#F37021] text-xs font-bold hover:bg-[#F37021]/20 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[14px]">visibility</span>
                                  Chi tiết
                                </Link>
                              ) : (
                                <span className="inline-flex items-center whitespace-nowrap gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed select-none">
                                  <span className="material-symbols-outlined text-[14px]">hourglass_empty</span>
                                  Chờ kết quả
                                </span>
                              )}

                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    Hiển thị <span className="font-bold text-slate-600">{rows.length}</span> kết quả
                  </p>
                  <p className="text-xs text-slate-400">
                    Cập nhật lúc {new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())}
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
