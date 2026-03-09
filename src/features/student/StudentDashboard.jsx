import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../app/context/authContext';

// ─── Mock data ────────────────────────────────────────────────────────────────
const student = {
  name: 'Nguyễn Văn A',
  id: 'SE123456',
  avatar: 'NVA',
  email: 'se123456@fpt.edu.vn',
};

const activeExam = {
  title: 'OOP Lab Final – SP26',
  subject: 'PRO192 – Lập trình Hướng đối tượng',
  deadline: '2026-03-12T23:59:00',
};

const submissions = [
  {
    id: 1,
    attempt: 1,
    submittedAt: '2026-03-09T10:22:13',
    fileName: 'SE123456_attempt1.zip',
    status: 'GRADED',
  },
];

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

// ─── Countdown hook (không có ngày) ──────────────────────────────────────────
function useCountdown(deadline) {
  const compute = () => {
    const diff = new Date(deadline) - new Date();
    if (diff <= 0) return { hours: 0, mins: 0, secs: 0, expired: true };
    return {
      hours:   Math.floor(diff / 3600000),
      mins:    Math.floor((diff % 3600000) / 60000),
      secs:    Math.floor((diff % 60000) / 1000),
      expired: false,
    };
  };
  const [cd, setCd] = useState(compute);
  useEffect(() => {
    const id = setInterval(() => setCd(compute()), 1000);
    return () => clearInterval(id);
  }, [deadline]);
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

// ─── Main Component ───────────────────────────────────────────────────────────
const StudentDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const countdown = useCountdown(activeExam.deadline);
  const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);
  const [sidebarDropdownOpen, setSidebarDropdownOpen] = useState(false);
  const headerDropdownRef = useRef(null);
  const sidebarDropdownRef = useRef(null);

  // Đóng dropdown khi click ra ngoài
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

  return (
    <div className="flex h-screen bg-[#F5F5F5] font-[Inter,sans-serif] overflow-hidden">

      {/* ════════════════════════════════════════════
          SIDEBAR
      ════════════════════════════════════════════ */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-[72px]'} transition-[width] duration-300 ease-in-out flex-shrink-0 flex flex-col bg-[#2D2D2D] border-r border-slate-800 shadow-xl z-20`}>

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
            {/* Dropdown hiện ra phía trên */}
            {sidebarDropdownOpen && sidebarOpen && (
              <div className="mb-2 bg-[#3a3a3a] rounded-2xl border border-slate-700 shadow-xl py-1 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700">
                  <p className="text-sm font-bold text-white">{student.name}</p>
                  <p className="text-xs text-slate-400">{student.email}</p>
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
                  {student.avatar}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#2D2D2D]" />
              </div>
              {sidebarOpen && (
                <>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-white text-[13px] font-bold truncate">{student.name}</p>
                    <p className="text-slate-400 text-[10px] truncate">{student.id}</p>
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
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <header className="flex-shrink-0 flex items-center justify-between h-16 px-8 border-b border-slate-200 bg-white shadow-sm sticky top-0 z-10">
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
                Xin chào trở lại, <span className="text-[#F37021]">{student.name}</span> 👋
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
                {student.avatar}
              </button>

              {headerDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-slate-200 shadow-xl py-1 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-800">{student.name}</p>
                    <p className="text-xs text-slate-400">{student.email}</p>
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
        <div className="flex-1 overflow-y-auto bg-[#F5F5F5]">
          <div className="px-8 py-8 max-w-5xl mx-auto space-y-6">

            {/* ═══════════════════════════════
                SECTION 1 — Active Exam Banner
            ═══════════════════════════════ */}
            <section>
              <div className="relative rounded-3xl overflow-hidden shadow-xl shadow-orange-500/10">
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
                      {/* Badge */}
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F37021]/15 border border-[#F37021]/30 rounded-full backdrop-blur-sm">
                        <span className="w-2 h-2 rounded-full bg-[#F37021] animate-pulse shadow-sm shadow-[#F37021]" />
                        <span className="text-[#F37021] text-[10px] font-bold uppercase tracking-[0.2em]">Kỳ thi đang diễn ra</span>
                      </div>

                      {/* Title */}
                      <div>
                        <h2 className="text-white text-2xl font-black leading-tight tracking-tight">{activeExam.title}</h2>
                        <p className="text-white/40 text-sm mt-1.5 font-medium">{activeExam.subject}</p>
                      </div>

                      {/* CTA */}
                      <Link
                        to="/student/submit"
                        className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-white text-sm
                          bg-[#F37021] hover:bg-orange-500 shadow-xl shadow-[#F37021]/30 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <span className="material-symbols-outlined text-[18px]">upload_file</span>
                        Nộp bài ngay
                        <span className="material-symbols-outlined text-[16px] ml-0.5">arrow_forward</span>
                      </Link>
                    </div>

                    {/* Right — Countdown */}
                    <div className="flex-shrink-0">
                      <div className="bg-white/5 border border-white/10 rounded-3xl px-7 py-6 text-center backdrop-blur-sm">
                        <p className="text-white/30 text-[9px] uppercase tracking-[0.25em] font-bold mb-5">Thời gian còn lại</p>
                        {!countdown.expired ? (
                          <div className="flex items-end gap-3">
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
                          Hạn: {new Date(activeExam.deadline).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </section>

            {/* ═══════════════════════════════
                SECTION 2 — Submission History
            ═══════════════════════════════ */}
            <section>
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#F37021]/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#F37021] text-[18px]">history</span>
                    </div>
                    <div>
                      <h3 className="text-slate-800 font-black text-sm leading-none">Lịch sử nộp bài</h3>
                      <p className="text-slate-400 text-[11px] mt-1">Kết quả hiển thị sau khi Phòng khảo thí kích hoạt chấm</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                    {submissions.length} lần nộp
                  </span>
                </div>

                {/* Rows */}
                <div className="divide-y divide-slate-100">
                  {submissions.map((sub) => {
                    const s = statusInfo[sub.status] || statusInfo.SUBMITTED;
                    return (
                      <div
                        key={sub.id}
                        className="group flex items-center gap-5 px-7 py-4 hover:bg-slate-50/80 transition-colors duration-150"
                      >
                        {/* Attempt number */}
                        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#F37021]/15 to-[#F37021]/5 border border-[#F37021]/20 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <span className="text-[#F37021] font-black text-sm">{sub.attempt}</span>
                        </div>

                        {/* File icon */}
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-slate-400 text-[18px]">folder_zip</span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-800 text-sm font-bold leading-none">
                            {new Date(sub.submittedAt).toLocaleString('vi-VN')}
                          </p>
                          <p className="text-slate-400 text-xs mt-1.5 truncate font-mono">{sub.fileName}</p>
                        </div>

                        {/* Status */}
                        <div className="flex-shrink-0">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border ${s.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                        </div>

                        {/* Action */}
                        <div className="flex-shrink-0">
                          {sub.status === 'GRADED' ? (
                            <Link
                              to={`/student/results/${sub.id}`}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F37021]/10 text-[#F37021] font-bold text-xs hover:bg-[#F37021]/20 transition-colors border border-[#F37021]/20"
                            >
                              Xem kết quả
                              <span className="material-symbols-outlined text-[14px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                            </Link>
                          ) : (
                            <span className="text-slate-300 text-sm">—</span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {submissions.length === 0 && (
                    <div className="py-16 text-center">
                      <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-slate-300 text-3xl">upload_file</span>
                      </div>
                      <p className="text-slate-600 font-bold text-base">Chưa có lần nộp bài nào</p>
                      <p className="text-slate-400 text-sm mt-1 mb-6">Hãy nộp bài trước hạn để đảm bảo kết quả của bạn.</p>
                      <Link
                        to="/student/submit"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#F37021] text-white font-bold rounded-full hover:bg-orange-600 transition-all shadow-lg shadow-[#F37021]/25"
                      >
                        <span className="material-symbols-outlined text-lg">upload_file</span>
                        Nộp bài ngay
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ═══════════════════════════════
                SECTION 3 — Info cards
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
                  desc: 'File .zip phải có thư mục run/ (chứa .jar) và dist/ (source code Java).',
                },
                {
                  icon: 'psychology',
                  gradient: 'from-violet-500/10 to-violet-500/5',
                  border: 'border-violet-200/60',
                  iconBg: 'bg-violet-100',
                  iconColor: 'text-violet-500',
                  dot: 'bg-violet-400',
                  title: 'AI đánh giá OOP',
                  desc: 'Gemini AI phân tích cấu trúc OOP sau khi Phòng khảo thí kích hoạt chấm.',
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
                  className={`bg-gradient-to-br ${tip.gradient} border ${tip.border} rounded-3xl p-5 flex gap-4 items-start hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
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
