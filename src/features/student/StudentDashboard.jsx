import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../app/context/authContext';
import examApi from '../../services/examApi';
import blockApi from '../../services/blockApi';

// ─── Status badge config ──────────────────────────────────────────────────────
const statusInfo = {
  GRADED:    { label: 'Đã có kết quả', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  GRADING:   { label: 'Đang chấm',     cls: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500 animate-pulse' },
  SUBMITTED: { label: 'Đã nộp',        cls: 'bg-sky-50 text-sky-700 border-sky-200',             dot: 'bg-sky-500' },
};

const navItems = [
  { icon: 'home',           label: 'Dashboard',   to: '/student',               active: true  },
  { icon: 'upload_file',    label: 'Nộp bài',     to: '/student/submit',         active: false },
  { icon: 'bar_chart',      label: 'Kết quả',     to: '/student/results',        active: false },
  { icon: 'gavel',          label: 'Phúc khảo',   to: '/student/appeals',        active: false },
  { icon: 'notifications',  label: 'Thông báo',   to: '/student/notifications',  active: false },
];

// ─── Countdown hook ───────────────────────────────────────────────────────────
// Đếm ngược đến một mốc thời gian bất kỳ (ISO string hoặc Date object).
function useCountdown(target) {
  const compute = () => {
    const diff = new Date(target) - new Date();
    if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0, expired: true };
    return {
      days:    Math.floor(diff / 86400000),
      hours:   Math.floor((diff % 86400000) / 3600000),
      mins:    Math.floor((diff % 3600000) / 60000),
      secs:    Math.floor((diff % 60000) / 1000),
      expired: false,
    };
  };
  const [cd, setCd] = useState(compute);
  useEffect(() => {
    if (!target) return;
    setCd(compute());
    const id = setInterval(() => setCd(compute()), 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return cd;
}

// ─── Digit Flip card ─────────────────────────────────────────────────────────
function DigitBox({ value, label }) {
  const prev = useRef(value);
  const [flip, setFlip] = useState(false);

  useEffect(() => {
    if (prev.current !== value) {
      setFlip(true);
      const t = setTimeout(() => setFlip(false), 300);
      prev.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative w-16 h-[72px] rounded-2xl bg-[#1C1C1E] border border-white/10 flex items-center justify-center overflow-hidden
        shadow-lg shadow-black/30 transition-transform duration-300 ${flip ? 'scale-y-95' : 'scale-y-100'}`}>
        {/* top half gradient */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-white/[0.04]" />
        {/* center divider */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-black/40" />
        {/* glow */}
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5" />
        <span className="text-white text-3xl font-black tabular-nums tracking-tight relative z-10">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-white/40 text-[9px] uppercase tracking-[0.2em] font-bold">{label}</span>
    </div>
  );
}

// ─── Helper: tìm block gần nhất ──────────────────────────────────────────────
/**
 * Từ danh sách blocks (nhiều exam gộp lại), trả về block relevant nhất:
 * - Ưu tiên block đang ONGOING (startTime <= now <= endTime).
 * - Nếu không có ONGOING, lấy block UPCOMING có startTime gần nhất.
 * - Trả về null nếu không có block nào thỏa mãn.
 *
 * @param {Array} blocks - mảng block objects từ API, mỗi item shape: { blockId, examId, name, startTime, endTime, examName }
 * @returns {object|null}
 */
function findNearestBlock(blocks) {
  const now = new Date();

  // Lọc các block chưa kết thúc (endTime > now)
  const activeBlocks = blocks.filter((b) => b.endTime && new Date(b.endTime) > now);
  if (activeBlocks.length === 0) return null;

  // Kiểm tra xem có block nào đang ONGOING không
  const ongoingBlocks = activeBlocks.filter(
    (b) => b.startTime && new Date(b.startTime) <= now,
  );
  if (ongoingBlocks.length > 0) {
    // Lấy block ONGOING có endTime gần now nhất (sắp hết hạn)
    return ongoingBlocks.sort((a, b) => new Date(a.endTime) - new Date(b.endTime))[0];
  }

  // Không có ONGOING → lấy UPCOMING có startTime gần nhất
  return activeBlocks.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))[0];
}

// ─── Main Component ───────────────────────────────────────────────────────────
const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);
  const [sidebarDropdownOpen, setSidebarDropdownOpen] = useState(false);
  const headerDropdownRef = useRef(null);
  const sidebarDropdownRef = useRef(null);

  // ── Data states ──────────────────────────────────────────────────────────────
  const [nearestBlock, setNearestBlock] = useState(null); // block thi gần nhất
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Countdown target: nếu đang ONGOING → đếm tới endTime; nếu UPCOMING → đếm tới startTime
  const now = new Date();
  const isOngoing = nearestBlock &&
    new Date(nearestBlock.startTime) <= now &&
    new Date(nearestBlock.endTime) > now;
  const countdownTarget = nearestBlock
    ? (isOngoing ? nearestBlock.endTime : nearestBlock.startTime)
    : null;

  const countdown = useCountdown(countdownTarget);

  // Nút nộp bài: chỉ active khi đang ONGOING
  const isExpired  = nearestBlock && new Date(nearestBlock.endTime) <= now;  // đã qua endTime
  const canSubmit  = nearestBlock && isOngoing;

  // ── Fetch data ───────────────────────────────────────────────────────────────
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Bước 1: Lấy danh sách tất cả exam (lấy page đủ lớn để bao hết)
      const examRes = await examApi.getAll({ page: 0, size: 100, sort: 'startTime,asc' });
      const exams = examRes?.data?.content ?? [];

      if (exams.length === 0) {
        setNearestBlock(null);
        return;
      }

      // Bước 2: Chỉ lấy block của các exam chưa COMPLETED để giảm số request
      const relevantExams = exams.filter((e) => e.status !== 'COMPLETED');

      // Bước 3: Gọi song song getByExam cho từng exam
      const blockResults = await Promise.allSettled(
        relevantExams.map((exam) =>
          blockApi.getByExam(exam.examId).then((res) => {
            // Gắn thêm thông tin exam vào từng block để hiển thị trên UI
            const blocks = Array.isArray(res) ? res : res?.data ?? [];
            return blocks.map((b) => ({
              ...b,
              examName:     exam.name,
              examSemester: exam.semester,
              examStatus:   exam.status,
            }));
          }),
        ),
      );

      // Gom tất cả blocks thành mảng phẳng (bỏ qua request bị lỗi)
      const allBlocks = blockResults
        .filter((r) => r.status === 'fulfilled')
        .flatMap((r) => r.value);

      // Bước 4: Tìm block gần nhất
      const best = findNearestBlock(allBlocks);
      setNearestBlock(best);
    } catch (err) {
      console.error('[StudentDashboard] fetchDashboardData error:', err);
      setError('Không thể tải thông tin kỳ thi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ── Đóng dropdown khi click ra ngoài ─────────────────────────────────────────
  useEffect(() => {
    const handleClick = (e) => {
      if (headerDropdownRef.current && !headerDropdownRef.current.contains(e.target))
        setHeaderDropdownOpen(false);
      if (sidebarDropdownRef.current && !sidebarDropdownRef.current.contains(e.target))
        setSidebarDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  // Thông tin user từ AuthContext — shape: { userId, fullName, roleName }
  const displayName  = user?.fullName  || 'Sinh viên';
  const displayId    = user?.userId    ? `ID: ${user.userId.slice(0, 8).toUpperCase()}` : '—';
  const displayEmail = '';                                   // không có trong AuthContext
  const avatarText   = displayName !== 'Sinh viên'
    ? displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'SV';

  // ── Formatters ────────────────────────────────────────────────────────────────
  const fmtDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    const p = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
      timeZone: 'Asia/Ho_Chi_Minh',
    }).formatToParts(d);
    const get = (type) => p.find((x) => x.type === type)?.value ?? '00';
    return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}`;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#f7f7f8] via-[#f6f6f8] to-[#fffaf6] font-[Inter,sans-serif] overflow-hidden">

      {/* ════════════════════════════════════════════
          SIDEBAR
      ════════════════════════════════════════════ */}
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

          {/* Sidebar user area với dropdown */}
          <div className="px-3 py-4 border-t border-slate-700/50" ref={sidebarDropdownRef}>
            {sidebarDropdownOpen && sidebarOpen && (
              <div className="mb-2 bg-[#3a3a3a] rounded-2xl border border-slate-700 shadow-xl py-1 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700">
                  <p className="text-sm font-bold text-white">{displayName}</p>
                  <p className="text-xs text-slate-400">{displayEmail}</p>
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

      {/* ════════════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 bg-orange-200/20 rounded-full blur-3xl" />

        {/* ── Header ── */}
        <header className="flex-shrink-0 flex items-center justify-between h-16 px-8 border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-9 h-9 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-all"
            >
              <span className="material-symbols-outlined text-xl">menu</span>
            </button>
            <div>
              <h1 className="text-slate-800 font-black text-[17px] leading-none">Trang chủ</h1>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Xin chào trở lại, <span className="text-[#F37021]">{displayName}</span> 👋
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button className="relative w-9 h-9 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-all">
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#F37021] rounded-full" />
            </button>

            {/* Avatar + dropdown */}
            <div className="relative" ref={headerDropdownRef}>
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
                    <p className="text-xs text-slate-400">{displayEmail}</p>
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

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto bg-transparent">
          <div className="px-8 py-8 max-w-5xl mx-auto space-y-6">

            {/* ═══════════════════════════════
                SECTION 1 — Active/Upcoming Exam Banner
            ═══════════════════════════════ */}
            <section>
              {/* Loading skeleton */}
              {loading && (
                <div className="relative rounded-3xl overflow-hidden shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1C1008] via-[#1a1a1a] to-[#111]" />
                  <div className="relative p-8 flex items-center justify-center min-h-[200px]">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-full border-4 border-[#F37021]/30 border-t-[#F37021] animate-spin" />
                      <p className="text-white/40 text-sm font-medium">Đang tải thông tin kỳ thi...</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error state */}
              {!loading && error && (
                <div className="relative rounded-3xl overflow-hidden shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1C1008] via-[#1a1a1a] to-[#111]" />
                  <div className="relative p-8 flex items-center justify-center min-h-[200px]">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <span className="material-symbols-outlined text-red-400 text-4xl">error</span>
                      <p className="text-white/70 text-sm font-medium">{error}</p>
                      <button
                        onClick={fetchDashboardData}
                        className="mt-2 px-5 py-2 rounded-full bg-[#F37021]/20 text-[#F37021] text-sm font-bold border border-[#F37021]/30 hover:bg-[#F37021]/30 transition-colors"
                      >
                        Thử lại
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty state — không có kỳ thi nào */}
              {!loading && !error && !nearestBlock && (
                <div className="relative rounded-3xl overflow-hidden shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1C1008] via-[#1a1a1a] to-[#111]" />
                  <div className="relative p-8 flex items-center justify-center min-h-[200px]">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <span className="material-symbols-outlined text-white/20 text-4xl">event_busy</span>
                      <p className="text-white/60 text-base font-bold">Không có kỳ thi nào sắp diễn ra</p>
                      <p className="text-white/30 text-sm">Hãy kiểm tra lại sau khi Phòng khảo thí công bố lịch thi.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Main banner — có dữ liệu */}
              {!loading && !error && nearestBlock && (
                <div className="relative rounded-3xl overflow-hidden shadow-[0_24px_50px_rgba(249,115,22,0.18)] ring-1 ring-orange-400/20">
                  {/* Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1C1008] via-[#1a1a1a] to-[#111]" />
                  {/* Orange glow orb */}
                  <div className="absolute -top-20 -left-20 w-72 h-72 bg-[#F37021]/20 rounded-full blur-[80px]" />
                  <div className="absolute -bottom-10 right-20 w-48 h-48 bg-amber-400/10 rounded-full blur-[60px]" />
                  {/* Dot texture */}
                  <div className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                  />
                  {/* Top accent line */}
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#F37021]/60 to-transparent" />

                  <div className="relative p-8">
                    <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">

                      {/* Left — info */}
                      <div className="flex-1 space-y-5">
                        {/* Status badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F37021]/15 border border-[#F37021]/30 rounded-full backdrop-blur-sm">
                          <span className="w-2 h-2 rounded-full bg-[#F37021] animate-pulse shadow-sm shadow-[#F37021]" />
                          <span className="text-[#F37021] text-[10px] font-bold uppercase tracking-[0.2em]">
                            {isOngoing ? 'Kỳ thi đang diễn ra' : 'Kỳ thi sắp diễn ra'}
                          </span>
                        </div>

                        {/* Tên kỳ thi + block */}
                        <div>
                          <h2 className="text-white text-2xl font-black leading-tight tracking-tight">
                            {nearestBlock.examName}
                          </h2>
                          <p className="text-white/50 text-sm mt-1 font-medium">
                            {nearestBlock.name}
                            {nearestBlock.examSemester ? ` — ${nearestBlock.examSemester}` : ''}
                          </p>
                          {/* Thời gian thi */}
                          <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/40">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">schedule</span>
                              Bắt đầu: <span className="text-white/60 font-semibold ml-1">{fmtDate(nearestBlock.startTime)}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">timer_off</span>
                              Kết thúc: <span className="text-white/60 font-semibold ml-1">{fmtDate(nearestBlock.endTime)}</span>
                            </span>
                          </div>
                        </div>

                        {/* CTA — nút nộp bài */}
                        {canSubmit ? (
                          <Link
                            to={`/student/submit?examId=${nearestBlock.examId}&blockId=${nearestBlock.blockId}`}
                            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-white text-sm
                              bg-[#F37021] hover:bg-orange-500 shadow-xl shadow-[#F37021]/30 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
                          >
                            <span className="material-symbols-outlined text-[18px]">upload_file</span>
                            Nộp bài ngay
                            <span className="material-symbols-outlined text-[16px] ml-0.5">arrow_forward</span>
                          </Link>
                        ) : isExpired ? (
                          <div className="flex flex-col gap-2">
                            <button
                              disabled
                              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-red-300/60 text-sm
                                bg-red-500/10 border border-red-500/20 cursor-not-allowed select-none"
                            >
                              <span className="material-symbols-outlined text-[18px]">timer_off</span>
                              Đã hết giờ nộp bài
                            </button>
                            <p className="text-white/30 text-xs">
                              Hạn nộp đã kết thúc lúc <span className="text-red-400/70 font-semibold">{fmtDate(nearestBlock.endTime)}</span>
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <button
                              disabled
                              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-white/40 text-sm
                                bg-white/5 border border-white/10 cursor-not-allowed select-none"
                            >
                              <span className="material-symbols-outlined text-[18px]">lock_clock</span>
                              Chưa tới giờ nộp bài
                            </button>
                            <p className="text-white/30 text-xs">
                              Nút sẽ được mở khi đến <span className="text-[#F37021]/70 font-semibold">{fmtDate(nearestBlock.startTime)}</span>
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Right — Countdown */}
                      <div className="flex-shrink-0">
                        <div className="bg-white/5 border border-white/10 rounded-3xl px-7 py-6 text-center backdrop-blur-sm shadow-[0_12px_30px_rgba(0,0,0,0.25)]">
                          <p className="text-white/30 text-[9px] uppercase tracking-[0.25em] font-bold mb-5">
                            {isOngoing ? 'Thời gian còn lại' : 'Thời gian bắt đầu sau'}
                          </p>
                          {!countdown.expired ? (
                            <div className="flex items-end gap-3">
                              {countdown.days > 0 && (
                                <>
                                  <DigitBox value={countdown.days}  label="Ngày" />
                                  <span className="text-white/20 text-3xl font-black mb-5 leading-none select-none">:</span>
                                </>
                              )}
                              <DigitBox value={countdown.hours} label="Giờ"  />
                              <span className="text-white/20 text-3xl font-black mb-5 leading-none select-none">:</span>
                              <DigitBox value={countdown.mins}  label="Phút" />
                              <span className="text-white/20 text-3xl font-black mb-5 leading-none select-none">:</span>
                              <DigitBox value={countdown.secs}  label="Giây" />
                            </div>
                          ) : (
                            <p className="text-red-400 font-black text-lg">Đã hết hạn</p>
                          )}
                          <p className="text-white/20 text-[10px] mt-5">
                            {isOngoing
                              ? `Hạn nộp: ${fmtDate(nearestBlock.endTime)}`
                              : `Mở lúc: ${fmtDate(nearestBlock.startTime)}`}
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* ═══════════════════════════════
                SECTION 2 — Info cards
            ═══════════════════════════════ */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
              {[
                {
                  icon: 'folder_zip',
                  gradient: 'from-sky-500/10 to-sky-500/5',
                  border: 'border-sky-200/60',
                  iconBg: 'bg-sky-100',
                  iconColor: 'text-sky-500',
                  dot: 'bg-sky-400',
                  title: 'Cấu trúc file',
                  desc: 'File .zip phải có thư mục run/ (chứa .jar) và src/ (source code Java).',
                },
                {
                  icon: 'psychology',
                  gradient: 'from-violet-500/10 to-violet-500/5',
                  border: 'border-violet-200/60',
                  iconBg: 'bg-violet-100',
                  iconColor: 'text-violet-500',
                  dot: 'bg-violet-400',
                  title: 'AI đánh giá OOP',
                  desc: 'AI phân tích cấu trúc OOP sau khi Phòng khảo thí kích hoạt chấm.',
                },
                {
                  icon: 'gavel',
                  gradient: 'from-amber-500/10 to-amber-500/5',
                  border: 'border-amber-200/60',
                  iconBg: 'bg-amber-100',
                  iconColor: 'text-amber-600',
                  dot: 'bg-amber-400',
                  title: 'Phúc khảo',
                  desc: 'Không đồng ý với điểm? Gửi đơn phúc khảo sau khi có kết quả chính thức.',
                },
              ].map((tip) => (
                <div
                  key={tip.title}
                  className={`bg-gradient-to-br ${tip.gradient} border ${tip.border} rounded-3xl p-5 flex gap-4 items-start hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
                >
                  <div className={`w-10 h-10 rounded-2xl ${tip.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm`}>
                    <span className={`material-symbols-outlined ${tip.iconColor} text-[20px]`}>{tip.icon}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${tip.dot}`} />
                      <p className="text-slate-800 font-bold text-sm">{tip.title}</p>
                    </div>
                    <p className="text-slate-500 text-xs leading-relaxed">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </section>

          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
