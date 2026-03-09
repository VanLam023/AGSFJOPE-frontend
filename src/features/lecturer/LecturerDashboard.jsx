import React, { useState, useContext, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../app/context/authContext";

// ─── Mock data ────────────────────────────────────────────────────────────────
const lecturer = {
  name: "TS. Trần Văn B",
  role: "Academic Premium",
  avatar: "TVB",
  email: "tvb@fpt.edu.vn",
};

const appeals = [
  {
    id: 1,
    studentName: "Nguyễn Văn A",
    mssv: "SE12345",
    examName: "OOP Final Exam",
    block: "Block 1",
    assignedDate: "01 Oct 2023",
    deadline: "05 Oct 2023",
    deadlineRaw: "2023-10-05",
    status: "ASSIGNED",
    overdue: false,
  },
  {
    id: 2,
    studentName: "Lê Thị B",
    mssv: "SE12346",
    examName: "OOP Midterm",
    block: "Block 1",
    assignedDate: "02 Oct 2023",
    deadline: "06 Oct 2023",
    deadlineRaw: "2023-10-06",
    status: "REVIEWING",
    overdue: false,
  },
  {
    id: 3,
    studentName: "Trần Văn C",
    mssv: "SE12347",
    examName: "OOP Final Exam",
    block: "Block 1",
    assignedDate: "28 Sep 2023",
    deadline: "01 Oct 2023",
    deadlineRaw: "2023-10-01",
    status: "COMPLETED",
    overdue: false,
  },
  {
    id: 4,
    studentName: "Phạm Văn D",
    mssv: "SE12348",
    examName: "OOP Quiz 2",
    block: "Block 1",
    assignedDate: "25 Sep 2023",
    deadline: "30 Sep 2023",
    deadlineRaw: "2023-09-30",
    status: "OVERDUE",
    overdue: true,
  },
];

const stats = {
  assigned: 5,
  completed: 12,
  overdue: 1,
};

// ─── Status config ─────────────────────────────────────────────────────────
const statusConfig = {
  ASSIGNED: {
    label: "ASSIGNED",
    dot: "bg-blue-600",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
  },
  REVIEWING: {
    label: "REVIEWING",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  COMPLETED: {
    label: "COMPLETED",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  OVERDUE: {
    label: "OVERDUE",
    dot: "bg-red-600",
    badge: "bg-red-50 text-red-700 border-red-200",
  },
};

// ─── Components ───────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] ?? statusConfig.ASSIGNED;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function LecturerDashboard() {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [notifCount] = useState(4);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);
  const [sidebarDropdownOpen, setSidebarDropdownOpen] = useState(false);
  const headerDropdownRef = useRef(null);
  const sidebarDropdownRef = useRef(null);

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
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-[72px]'} transition-[width] duration-300 ease-in-out flex-shrink-0 flex flex-col bg-[#2D2D2D] border-r border-slate-800 shadow-xl z-20 h-screen sticky top-0`}>

        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-3 border-b border-slate-700/50">
          <div className="size-9 bg-[#F37021] rounded-xl shadow-md flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-white text-[18px]">school</span>
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
          {[
            { icon: 'dashboard',     label: 'Dashboard',  to: '/lecturer',          active: true  },
            { icon: 'assignment',    label: 'Phúc khảo',  to: '/lecturer/appeals',  active: false },
            { icon: 'bar_chart',     label: 'Thống kê',   to: '/lecturer/stats',    active: false },
            { icon: 'notifications', label: 'Thông báo',  to: '/lecturer/alerts',   active: false, badge: notifCount },
          ].map((item) => (
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
              <div className="relative flex-shrink-0">
                <span className={`material-symbols-outlined text-[20px] ${item.active ? 'text-[#F37021]' : 'group-hover:text-slate-200'}`}>
                  {item.icon}
                </span>
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 size-4 bg-[#F37021] text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
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

        {/* Bottom: User dropdown */}
        <div className="px-3 py-4 border-t border-slate-700/50" ref={sidebarDropdownRef}>
          {sidebarDropdownOpen && sidebarOpen && (
            <div className="mb-2 bg-[#3a3a3a] rounded-2xl border border-slate-700 shadow-xl py-1 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700">
                <p className="text-sm font-bold text-white truncate">{lecturer.name}</p>
                <p className="text-xs text-slate-400 truncate">{lecturer.email}</p>
              </div>
              <Link
                to="/lecturer/profile"
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
              <div className={`size-9 rounded-full bg-[#F37021]/20 ring-2 transition-all flex items-center justify-center text-[#F37021] font-bold text-sm
                ${sidebarDropdownOpen ? 'ring-[#F37021]' : 'ring-slate-700'}`}>
                {lecturer.avatar}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 size-3 bg-emerald-400 rounded-full border-2 border-[#2D2D2D]" />
            </div>
            {sidebarOpen && (
              <>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-white text-[13px] font-bold truncate">{lecturer.name}</p>
                  <p className="text-slate-400 text-[10px] truncate">{lecturer.role}</p>
                </div>
                <span className={`material-symbols-outlined text-slate-400 text-[18px] transition-transform duration-200 ${sidebarDropdownOpen ? 'rotate-180' : ''}`}>
                  expand_less
                </span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white h-16 border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-9 h-9 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-all"
            >
              <span className="material-symbols-outlined text-xl">menu</span>
            </button>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Lecturer Dashboard</h2>
          </div>
          <div className="flex items-center gap-6">
            {/* Notification bell */}
            <button className="text-slate-500 hover:text-[#F37021] transition-colors relative">
              <span className="material-symbols-outlined text-[26px]">
                notifications
              </span>
              {notifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 size-4 bg-[#F37021] text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold">
                  {notifCount}
                </span>
              )}
            </button>

            <div className="h-6 w-px bg-slate-200" />

            {/* Avatar dropdown */}
            <div className="relative" ref={headerDropdownRef}>
              <button
                onClick={() => setHeaderDropdownOpen(!headerDropdownOpen)}
                className="flex items-center gap-3 group"
              >
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">{lecturer.name}</p>
                  <p className="text-xs text-slate-500">{lecturer.role}</p>
                </div>
                <div className={`size-10 rounded-full bg-[#F37021]/20 ring-2 transition-all flex items-center justify-center text-[#F37021] font-bold text-sm
                  ${headerDropdownOpen ? 'ring-[#F37021]' : 'ring-slate-100 group-hover:ring-[#F37021]/50'}`}>
                  {lecturer.avatar}
                </div>
              </button>

              {headerDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-slate-200 shadow-xl py-1 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-800">{lecturer.name}</p>
                    <p className="text-xs text-slate-400">{lecturer.email}</p>
                  </div>
                  <Link
                    to="/lecturer/profile"
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

        {/* Page body */}
        <div className="flex-1 overflow-y-auto bg-[#F5F5F5]">
          <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">

            {/* ── Stat cards ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Assigned */}
              <div className="relative overflow-hidden bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex items-center gap-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <span className="material-symbols-outlined absolute -right-2 -bottom-2 text-[90px] text-slate-900/[0.035] pointer-events-none select-none">task</span>
                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-slate-500 text-[22px]">task</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] mb-1.5">Assigned Appeals</p>
                  <h3 className="text-4xl font-black text-slate-800 leading-none">{stats.assigned}</h3>
                </div>
              </div>

              {/* Completed */}
              <div className="relative overflow-hidden bg-gradient-to-br from-[#FFF4EE] to-white rounded-3xl border border-[#F37021]/20 shadow-sm p-6 flex items-center gap-5 hover:shadow-md hover:shadow-orange-100 hover:-translate-y-0.5 transition-all duration-200">
                <span className="material-symbols-outlined absolute -right-2 -bottom-2 text-[90px] text-[#F37021]/[0.08] pointer-events-none select-none">check_circle</span>
                <div className="w-12 h-12 rounded-2xl bg-[#F37021]/10 border border-[#F37021]/20 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[#F37021] text-[22px]">check_circle</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#F37021]/50 uppercase tracking-[0.18em] mb-1.5">Completed Reviews</p>
                  <h3 className="text-4xl font-black text-[#F37021] leading-none">{stats.completed}</h3>
                </div>
              </div>

              {/* Overdue */}
              <div className="relative overflow-hidden bg-gradient-to-br from-red-50 to-white rounded-3xl border border-red-200/60 shadow-sm p-6 flex items-center gap-5 hover:shadow-md hover:shadow-red-100 hover:-translate-y-0.5 transition-all duration-200">
                <span className="material-symbols-outlined absolute -right-2 -bottom-2 text-[90px] text-red-500/[0.07] pointer-events-none select-none">error</span>
                <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-200/60 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-red-500 text-[22px]">error</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-[0.18em] mb-1.5">Overdue Appeals</p>
                  <h3 className="text-4xl font-black text-red-600 leading-none">{stats.overdue}</h3>
                </div>
              </div>
            </div>

            {/* ── Appeals table ─────────────────────────────────────────────── */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#F37021]/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#F37021] text-[18px]">assignment</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 leading-none">Đơn phúc khảo được phân công</h3>
                    <p className="text-[11px] text-slate-400 mt-1">Danh sách sinh viên yêu cầu chấm lại bài thi</p>
                  </div>
                </div>
                <button className="inline-flex items-center gap-1.5 text-[#F37021] text-xs font-bold bg-[#F37021]/8 hover:bg-[#F37021]/15 px-3 py-1.5 rounded-xl transition-colors border border-[#F37021]/15">
                  Xem tất cả
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] w-10 text-center">#</th>
                      <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Sinh viên</th>
                      <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Kỳ thi</th>
                      <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Block</th>
                      <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Ngày giao</th>
                      <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Deadline</th>
                      <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Trạng thái</th>
                      <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {appeals.map((appeal, idx) => (
                      <tr
                        key={appeal.id}
                        className={`group hover:bg-slate-50/80 transition-colors duration-150 ${appeal.overdue ? "bg-red-50/30" : ""}`}
                      >
                        <td className="px-6 py-4 text-slate-400 text-xs font-bold text-center">{idx + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F37021]/20 to-[#F37021]/10 border border-[#F37021]/20 flex items-center justify-center text-[#F37021] font-black text-xs flex-shrink-0">
                              {appeal.studentName.split(" ").map((w) => w[0]).slice(-2).join("")}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 leading-none">{appeal.studentName}</p>
                              <p className="text-[11px] text-slate-400 mt-1 font-mono">{appeal.mssv}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-semibold">{appeal.examName}</td>
                        <td className="px-6 py-4">
                          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-bold">{appeal.block}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs font-medium">{appeal.assignedDate}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold flex items-center gap-0.5 ${appeal.overdue ? "text-red-600" : "text-slate-600"}`}>
                            {appeal.overdue && (
                              <span className="material-symbols-outlined text-[13px]">warning</span>
                            )}
                            {appeal.deadline}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={appeal.status} />
                        </td>
                        <td className="px-6 py-4 text-center">
                          {appeal.status === "COMPLETED" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl">
                              <span className="material-symbols-outlined text-[14px]">check</span>
                              Đã chấm
                            </span>
                          ) : (
                            <button
                              className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-xl transition-all shadow-sm
                                ${appeal.overdue
                                  ? "bg-red-500 hover:bg-red-600 text-white shadow-red-200"
                                  : "bg-[#F37021] hover:bg-orange-600 text-white shadow-orange-100"
                                }`}
                            >
                              <span className="material-symbols-outlined text-[14px]">edit_note</span>
                              {appeal.overdue ? "Chấm ngay" : "Chấm lại"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Bottom: Timeline + Donut ─────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-4">

              {/* Timeline */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-7">
                <div className="flex items-center gap-3 mb-7">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-amber-600 text-[18px]">schedule</span>
                  </div>
                  <h3 className="text-sm font-black text-slate-800">Deadline sắp tới</h3>
                </div>

                <div className="space-y-4">
                  {/* Overdue */}
                  <div className="flex gap-4 items-start">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-red-100 border-2 border-red-400 flex items-center justify-center shadow-sm shadow-red-100">
                        <span className="material-symbols-outlined text-red-500 text-[15px]">warning</span>
                      </div>
                      <div className="w-px flex-1 bg-gradient-to-b from-red-200 to-transparent mt-1 min-h-[28px]" />
                    </div>
                    <div className="flex-1 pb-2">
                      <span className="text-[9px] font-black text-red-500 uppercase tracking-[0.2em]">Cần xử lý ngay</span>
                      <div className="mt-1.5 bg-red-50/60 border border-red-200/60 rounded-2xl p-4">
                        <h4 className="text-sm font-bold text-slate-800">OOP Quiz 2 — Phạm Văn D</h4>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="material-symbols-outlined text-red-400 text-[13px]">calendar_today</span>
                          <p className="text-xs text-red-500 font-semibold">Đã quá hạn 2 ngày</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 24h */}
                  <div className="flex gap-4 items-start">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-[#F37021]/10 border-2 border-[#F37021]/50 flex items-center justify-center shadow-sm shadow-orange-100">
                        <span className="material-symbols-outlined text-[#F37021] text-[15px]">schedule</span>
                      </div>
                      <div className="w-px flex-1 bg-gradient-to-b from-orange-200 to-transparent mt-1 min-h-[28px]" />
                    </div>
                    <div className="flex-1 pb-2">
                      <span className="text-[9px] font-black text-[#F37021] uppercase tracking-[0.2em]">Trong 24h tới</span>
                      <div className="mt-1.5 bg-orange-50/60 border border-[#F37021]/15 rounded-2xl p-4">
                        <h4 className="text-sm font-bold text-slate-800">OOP Final Exam — Nguyễn Văn A</h4>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="material-symbols-outlined text-slate-400 text-[13px]">calendar_today</span>
                          <p className="text-xs text-slate-500 font-medium">Hạn cuối: 05/10/2023</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Upcoming */}
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-400 text-[15px]">event</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Sắp tới</span>
                      <div className="mt-1.5 bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                        <h4 className="text-sm font-bold text-slate-800">OOP Midterm — Lê Thị B</h4>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="material-symbols-outlined text-slate-400 text-[13px]">calendar_today</span>
                          <p className="text-xs text-slate-500 font-medium">Hạn cuối: 06/10/2023</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Donut chart */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-7 flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-[#F37021]/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#F37021] text-[18px]">donut_large</span>
                  </div>
                  <h3 className="text-sm font-black text-slate-800">Thống kê kết quả</h3>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center">
                  {/* SVG donut */}
                  <div className="relative size-44">
                    {/* Glow */}
                    <div className="absolute inset-8 rounded-full bg-[#F37021]/15 blur-xl pointer-events-none" />
                    <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                      {/* Track */}
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="#f1f5f9" strokeDasharray="100,100" strokeWidth="3.5"
                      />
                      {/* Approved 70% */}
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="#F37021" strokeDasharray="70,100" strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                      {/* Denied 30% */}
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="#e2e8f0" strokeDasharray="28,100" strokeDashoffset="-71" strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-slate-800">12</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">Total</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="mt-7 w-full grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 bg-orange-50/80 border border-[#F37021]/15 rounded-2xl px-4 py-3.5">
                      <div className="w-3 h-3 rounded-full bg-[#F37021] shadow-sm flex-shrink-0" />
                      <div>
                        <p className="text-sm font-black text-slate-800 leading-none">70%</p>
                        <p className="text-[11px] text-slate-500 font-medium mt-1">8 Approved</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3.5">
                      <div className="w-3 h-3 rounded-full bg-slate-300 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-black text-slate-800 leading-none">30%</p>
                        <p className="text-[11px] text-slate-500 font-medium mt-1">4 Denied</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
