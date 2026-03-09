import React, { useState, useContext, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../app/context/authContext";

// ─── Mock data ────────────────────────────────────────────────────────────────
const examStaff = {
  name: "Exam Staff",
  role: "Exam Staff",
  avatar: "ES",
  email: "staff_01@fpt.edu.vn",
};

const recentExams = [
  {
    id: 1,
    name: "OOP Final Exam 2024",
    semester: "Summer 2024",
    status: "ONGOING",
  },
  {
    id: 2,
    name: "Midterm Practical Test",
    semester: "Summer 2024",
    status: "UPCOMING",
  },
  {
    id: 3,
    name: "Retake Workshop 2",
    semester: "Spring 2024",
    status: "COMPLETED",
  },
];

const pendingAppeals = [
  {
    id: 1,
    studentName: "Nguyen Van Luan",
    mssv: "HE150123",
    initials: "NL",
    initialsColor: "bg-[#F37021]/10 text-[#F37021] border-[#F37021]/20",
    examName: "OOP Final Exam 2024",
    status: "PENDING",
  },
  {
    id: 2,
    studentName: "Tran Minh Hoang",
    mssv: "HE161244",
    initials: "TH",
    initialsColor: "bg-slate-200 text-slate-600 border-slate-300",
    examName: "OOP Final Exam 2024",
    status: "ASSIGNED",
  },
];

const gradeDistribution = [
  { range: "0-4",  height: "15%", active: false },
  { range: "4-6",  height: "35%", active: false },
  { range: "6-8",  height: "85%", active: true  },
  { range: "8-9",  height: "60%", active: false },
  { range: "9-10", height: "40%", active: false },
];

// ─── Status configs ────────────────────────────────────────────────────────────
const examStatusConfig = {
  ONGOING:   { label: "ONGOING",   cls: "bg-green-100 text-green-700 border-green-200"  },
  UPCOMING:  { label: "UPCOMING",  cls: "bg-blue-100 text-blue-700 border-blue-200"     },
  COMPLETED: { label: "COMPLETED", cls: "bg-slate-200 text-slate-700 border-slate-300"  },
};

const appealStatusConfig = {
  PENDING:  { label: "PENDING",  icon: "schedule", cls: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  ASSIGNED: { label: "ASSIGNED", icon: "person",   cls: "bg-blue-100 text-blue-800 border-blue-200"      },
};

const ExamStatusBadge = ({ status }) => {
  const cfg = examStatusConfig[status] ?? examStatusConfig.COMPLETED;
  return (
    <span className={`px-3 py-1 rounded-md text-xs font-bold border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

const AppealStatusBadge = ({ status }) => {
  const cfg = appealStatusConfig[status] ?? appealStatusConfig.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold border ${cfg.cls}`}>
      <span className="material-symbols-outlined text-[12px]">{cfg.icon}</span>
      {cfg.label}
    </span>
  );
};

// ─── Sidebar nav items ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { icon: "dashboard",    label: "Dashboard",             to: "/exam-staff",             active: true  },
  { icon: "description",  label: "Exam Management",       to: "/exam-staff/exams",       active: false },
  { icon: "send",         label: "Submission Management", to: "/exam-staff/submissions", active: false },
  { icon: "chat_bubble",  label: "Appeal Management",     to: "/exam-staff/appeals",     active: false },
  { icon: "history",      label: "Audit Logs",            to: "/exam-staff/audit",       active: false },
];

// ─── Main component ─────────────────────────────────────────────────────────────
export default function ExamStaffDashboard() {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);
  const [sidebarDropdownOpen, setSidebarDropdownOpen] = useState(false);
  const [notifCount] = useState(5);

  const headerDropdownRef = useRef(null);
  const sidebarDropdownRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (headerDropdownRef.current && !headerDropdownRef.current.contains(e.target))
        setHeaderDropdownOpen(false);
      if (sidebarDropdownRef.current && !sidebarDropdownRef.current.contains(e.target))
        setSidebarDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    localStorage.removeItem("refreshToken");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-[#F5F5F5] font-[Inter,sans-serif] text-slate-900">

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside
        className={`${
          sidebarOpen ? "w-[240px]" : "w-[72px]"
        } transition-[width] duration-300 ease-in-out flex-shrink-0 flex flex-col bg-[#2D2D2D] shadow-xl z-20 h-screen sticky top-0`}
      >
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="bg-[#F37021] p-2 rounded-lg shadow-md flex-shrink-0">
            <span className="material-symbols-outlined text-white text-[20px]">school</span>
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <h1 className="text-sm font-bold leading-tight tracking-wide text-white truncate">
                OOP Exam Grading
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">
                FPT University
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto mt-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              title={!sidebarOpen ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg font-medium border-l-4 transition-colors group
                ${
                  item.active
                    ? "bg-[#F37021]/10 text-[#F37021] border-[#F37021]"
                    : "text-slate-300 hover:bg-white/5 hover:text-white border-transparent"
                }`}
            >
              <span className="material-symbols-outlined text-[22px] flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="text-sm truncate">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Create New Exam button */}
        {sidebarOpen && (
          <div className="px-4 pb-3">
            <button className="w-full bg-[#F37021] text-white hover:bg-[#F37021]/90 py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#F37021]/20">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Create New Exam
            </button>
          </div>
        )}
        {!sidebarOpen && (
          <div className="px-3 pb-3">
            <button
              title="Create New Exam"
              className="w-full bg-[#F37021] text-white hover:bg-[#F37021]/90 py-3 rounded-lg transition-all flex items-center justify-center shadow-lg shadow-[#F37021]/20"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
            </button>
          </div>
        )}

        {/* Bottom: User dropdown */}
        <div className="px-3 py-4 border-t border-white/10" ref={sidebarDropdownRef}>
          {/* Popup dropdown above */}
          {sidebarDropdownOpen && sidebarOpen && (
            <div className="mb-2 bg-[#3a3a3a] rounded-2xl border border-slate-700 shadow-xl py-1 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700">
                <p className="text-sm font-bold text-white truncate">{examStaff.name}</p>
                <p className="text-xs text-slate-400 truncate">{examStaff.email}</p>
              </div>
              <Link
                to="/exam-staff/profile"
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

          {/* User trigger button */}
          <button
            onClick={() => setSidebarDropdownOpen(!sidebarDropdownOpen)}
            className={`w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 transition-colors ${
              !sidebarOpen ? "justify-center" : ""
            }`}
          >
            {/* Avatar image */}
            <div className="relative flex-shrink-0">
              <div
                className={`size-9 rounded-full bg-[#F37021]/20 ring-2 transition-all flex items-center justify-center text-[#F37021] font-bold text-sm overflow-hidden
                  ${sidebarDropdownOpen ? "ring-[#F37021]" : "ring-slate-700"}`}
              >
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCo9OzzsHT5Aj1roCt7Nv_ABU8KJRL7UBksbvyl8DFixLZmQ2vxz3SsOFXyWhWJCalc9K3AabCLNaCf3_kDh_9QDIhAzQ9qnUcXAFaH_lfs_mFpcJlPc1CQT9aYTuqZuXXIetZeDRKzu4GYopfz4IUuSuD26s3zs6lAxoPlSBwDwLZQucu91YX_cVtzA-0EIEaY6lqafYO2RGLh7Z6wYmcYsdUmozJEK5oFY4fPidEncDwgS9et7v3C6xbKSoT7OE1y69DF5Fm9bxNd"
                  alt="avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.parentNode.textContent = examStaff.avatar;
                  }}
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 size-3 bg-emerald-400 rounded-full border-2 border-[#2D2D2D]" />
            </div>

            {sidebarOpen && (
              <>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-white text-[13px] font-bold truncate">{examStaff.name}</p>
                  <p className="text-slate-400 text-[10px] truncate">{examStaff.role}</p>
                </div>
                <span
                  className={`material-symbols-outlined text-slate-400 text-[18px] transition-transform duration-200 ${
                    sidebarDropdownOpen ? "rotate-180" : ""
                  }`}
                >
                  expand_less
                </span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
          {/* Left: menu toggle + breadcrumb */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-9 h-9 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-all"
            >
              <span className="material-symbols-outlined text-xl">menu</span>
            </button>
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-slate-800 leading-tight">Dashboard</h2>
              <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                <a href="#" className="hover:text-[#F37021] transition-colors">
                  Home
                </a>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-slate-400">Dashboard</span>
              </div>
            </div>
          </div>

          {/* Right: notif + avatar dropdown */}
          <div className="flex items-center gap-6">
            {/* Notification bell */}
            <div className="relative">
              <button className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#F37021] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {notifCount}
                </span>
              )}
            </div>

            {/* Avatar dropdown */}
            <div
              className="flex items-center gap-3 pl-6 border-l border-slate-200 relative"
              ref={headerDropdownRef}
            >
              <button
                onClick={() => setHeaderDropdownOpen(!headerDropdownOpen)}
                className="flex items-center gap-3 group"
              >
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800 leading-none">{examStaff.name}</p>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">{examStaff.email}</p>
                </div>
                <div
                  className={`w-10 h-10 rounded-full bg-slate-200 overflow-hidden ring-2 transition-all cursor-pointer
                    ${headerDropdownOpen ? "ring-[#F37021]" : "ring-[#F37021]/20 group-hover:ring-[#F37021]/50"}`}
                >
                  <img
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCo9OzzsHT5Aj1roCt7Nv_ABU8KJRL7UBksbvyl8DFixLZmQ2vxz3SsOFXyWhWJCalc9K3AabCLNaCf3_kDh_9QDIhAzQ9qnUcXAFaH_lfs_mFpcJlPc1CQT9aYTuqZuXXIetZeDRKzu4GYopfz4IUuSuD26s3zs6lAxoPlSBwDwLZQucu91YX_cVtzA-0EIEaY6lqafYO2RGLh7Z6wYmcYsdUmozJEK5oFY4fPidEncDwgS9et7v3C6xbKSoT7OE1y69DF5Fm9bxNd"
                    alt="avatar"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.parentNode.textContent = examStaff.avatar;
                    }}
                  />
                </div>
              </button>

              {/* Dropdown menu */}
              {headerDropdownOpen && (
                <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl py-1 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-800">{examStaff.name}</p>
                    <p className="text-xs text-slate-400">{examStaff.email}</p>
                  </div>
                  <Link
                    to="/exam-staff/profile"
                    onClick={() => setHeaderDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-slate-400">person</span>
                    Hồ sơ cá nhân
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Page body ────────────────────────────────────────────────────────── */}
        <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">

          {/* ── Metric cards ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Active Exams */}
            <div className="relative overflow-hidden bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
              <span className="material-symbols-outlined absolute right-[-10px] bottom-[-20px] text-[100px] text-[#F37021] opacity-[0.05] pointer-events-none">
                timer
              </span>
              <div className="flex justify-between items-start mb-4">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                  Active Exams
                </p>
                <div className="w-8 h-8 rounded-lg bg-[#F37021]/10 text-[#F37021] flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">timer</span>
                </div>
              </div>
              <h3 className="text-4xl font-black text-[#F37021]">3</h3>
            </div>

            {/* Total Submissions */}
            <div className="relative overflow-hidden bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
              <span className="material-symbols-outlined absolute right-[-10px] bottom-[-20px] text-[100px] text-[#F37021] opacity-[0.05] pointer-events-none">
                description
              </span>
              <div className="flex justify-between items-start mb-4">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                  Total Submissions
                </p>
                <div className="w-8 h-8 rounded-lg bg-[#F37021]/10 text-[#F37021] flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">description</span>
                </div>
              </div>
              <h3 className="text-4xl font-black text-[#F37021]">856</h3>
            </div>

            {/* Graded */}
            <div className="relative overflow-hidden bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
              <span className="material-symbols-outlined absolute right-[-10px] bottom-[-20px] text-[100px] text-[#F37021] opacity-[0.05] pointer-events-none">
                check_circle
              </span>
              <div className="flex justify-between items-start mb-4">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                  Graded
                </p>
                <div className="w-8 h-8 rounded-lg bg-[#F37021]/10 text-[#F37021] flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                </div>
              </div>
              <h3 className="text-4xl font-black text-[#F37021]">730</h3>
            </div>

            {/* Pending Appeals — red accent */}
            <div className="relative overflow-hidden bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-b-4 border-b-red-500 flex flex-col justify-between">
              <span className="material-symbols-outlined absolute right-[-10px] bottom-[-20px] text-[100px] text-red-500 opacity-[0.05] pointer-events-none">
                priority_high
              </span>
              <div className="flex justify-between items-start mb-4">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                  Pending Appeals
                </p>
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">priority_high</span>
                </div>
              </div>
              <h3 className="text-4xl font-black text-red-600">8</h3>
            </div>
          </div>

          {/* ── Middle row: Recent exams + Grade distribution ─────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Recent exams table */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#F37021]">event_note</span>
                  <h3 className="font-bold text-slate-800 text-lg">Kỳ thi gần đây</h3>
                </div>
                <button className="text-[#F37021] text-sm font-semibold hover:underline bg-[#F37021]/5 px-3 py-1.5 rounded-md transition-colors">
                  Xem tất cả
                </button>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-6 py-4">Tên kỳ thi</th>
                      <th className="px-6 py-4">Học kỳ</th>
                      <th className="px-6 py-4 text-center">Trạng thái</th>
                      <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {recentExams.map((exam, idx) => (
                      <tr
                        key={exam.id}
                        className={`hover:bg-[#F37021]/5 transition-colors border-b border-slate-100 last:border-b-0 ${
                          idx % 2 !== 0 ? "bg-slate-50" : ""
                        }`}
                      >
                        <td className="px-6 py-4 font-bold text-slate-800">{exam.name}</td>
                        <td className="px-6 py-4 text-slate-500 font-medium">{exam.semester}</td>
                        <td className="px-6 py-4 text-center">
                          <ExamStatusBadge status={exam.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-slate-400 hover:text-[#F37021] hover:bg-[#F37021]/10 p-1.5 rounded-md transition-all">
                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Grade distribution bar chart */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-[#F37021]">bar_chart</span>
                <h3 className="font-bold text-slate-800 text-lg">Phân bố điểm</h3>
              </div>
              <div className="flex items-end justify-between h-48 gap-3 flex-1">
                {gradeDistribution.map((bar) => (
                  <div key={bar.range} className="flex flex-col items-center flex-1 gap-2">
                    <div
                      className={`w-full rounded-t-md transition-colors ${
                        bar.active
                          ? "bg-[#F37021] shadow-sm shadow-[#F37021]/30"
                          : "bg-slate-200 hover:bg-slate-300"
                      }`}
                      style={{ height: bar.height }}
                    />
                    <span
                      className={`text-[11px] font-bold ${
                        bar.active ? "text-[#F37021]" : "text-slate-500"
                      }`}
                    >
                      {bar.range}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <p className="text-[12px] text-slate-500 font-medium">
                  <span className="font-bold text-slate-700">730</span> bài nộp
                </p>
                <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium">
                  Summer 2024
                </span>
              </div>
            </div>
          </div>

          {/* ── Pending appeals table ─────────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#F37021]">report</span>
                <h3 className="font-bold text-slate-800 text-lg">Đơn phúc khảo cần xử lý</h3>
              </div>
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border border-red-200 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">warning</span>
                Urgent (8)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-4">Student Name</th>
                    <th className="px-6 py-4">Exam</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {pendingAppeals.map((appeal, idx) => (
                    <tr
                      key={appeal.id}
                      className={`hover:bg-[#F37021]/5 transition-colors ${
                        idx < pendingAppeals.length - 1 ? "border-b border-slate-100" : ""
                      } ${idx % 2 !== 0 ? "bg-slate-50" : ""}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border ${appeal.initialsColor}`}
                          >
                            {appeal.initials}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{appeal.studentName}</p>
                            <p className="text-xs text-slate-500 uppercase tracking-wide mt-0.5 font-medium">
                              {appeal.mssv}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{appeal.examName}</td>
                      <td className="px-6 py-4">
                        <AppealStatusBadge status={appeal.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="bg-white border border-slate-300 text-slate-700 hover:text-[#F37021] hover:border-[#F37021] px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm">
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
