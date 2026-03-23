import React, { useContext, useEffect, useRef, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../app/context/authContext';
import SubmissionDetailPage from '../submission/SubmissionDetailPage';

const navItems = [
  { icon: 'home',          label: 'Dashboard',  to: '/student',               active: false },
  { icon: 'upload_file',   label: 'Nộp bài',    to: '/student/submit',        active: false },
  { icon: 'bar_chart',     label: 'Kết quả',    to: '/student/results',       active: true  },
  { icon: 'gavel',         label: 'Phúc khảo',  to: '/student/appeals',       active: false },
  { icon: 'notifications', label: 'Thông báo',  to: '/student/notifications', active: false },
];

export default function StudentResultDetailPage() {
  const { submissionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { examId, blockId } = location.state || {};
  
  const { user, logout } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);
  const [sidebarDropdownOpen, setSidebarDropdownOpen] = useState(false);
  const headerRef = useRef(null);
  const sidebarRef = useRef(null);

  const displayName = user?.fullName || 'Sinh viên';
  const displayId   = user?.userId ? `ID: ${user.userId.slice(0, 8).toUpperCase()}` : '—';
  const avatarText  = displayName !== 'Sinh viên'
    ? displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'SV';

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
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="flex-shrink-0 flex items-center justify-between h-16 px-8 border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-9 h-9 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-all"
            >
              <span className="material-symbols-outlined text-xl">menu</span>
            </button>
            <div>
              <h1 className="text-slate-800 font-black text-[17px] leading-none">Chi tiết bài nộp</h1>
              <div className="flex items-center text-[11px] text-slate-400 gap-1 mt-0.5">
                <Link to="/student" className="hover:text-[#F37021] transition-colors">Trang chủ</Link>
                <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                <Link to="/student/results" className="hover:text-[#F37021] transition-colors">Kết quả</Link>
                <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                <span className="text-[#F37021] font-medium">Chi tiết</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
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

        <div className="flex-1 overflow-y-auto">
          <SubmissionDetailPage 
            examId={examId}
            blockId={blockId}
            submissionId={submissionId} 
            isStudentView={true} 
            onBack={() => navigate('/student/results')} 
          />
        </div>
      </main>
    </div>
  );
}
