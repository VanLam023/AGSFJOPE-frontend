import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/context/authContext';
import { loginApi } from '../../services/authApi';

const ROLE_ROUTES = {
  SYSTEM_ADMIN: '/admin',
  EXAM_STAFF:   '/exam-staff',
  LECTURER:     '/lecturer',
  STUDENT:      '/student',
};

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername]     = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    try {
      setLoading(true);
      const res = await loginApi(username.trim(), password);
      // axiosClient interceptor trả về res.data trực tiếp
      // response format: { success, message, data: { accessToken, ... } }
      const data = res.data ?? res;

      // Kiểm tra role hợp lệ trước khi lưu
      const route = ROLE_ROUTES[data.roleName];
      if (!route) {
        setError('Tài khoản không có quyền truy cập hệ thống. Vui lòng liên hệ quản trị viên.');
        return;
      }

      // Lưu token
      localStorage.setItem('token', data.accessToken);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);

      // Lưu user vào context
      login({
        userId:   data.userId,
        fullName: data.fullName,
        roleName: data.roleName,
      });

      // Điều hướng theo role
      navigate(route);
    } catch (err) {
      const raw =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0] ||
        'Đăng nhập thất bại. Vui lòng thử lại.';
      // Strip "MSG-XX: " prefix from backend messages
      const msg = typeof raw === 'string' ? raw.replace(/^MSG-\d+:\s*/i, '') : raw;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex font-display bg-[#0C0C0F]">

      {/* ═══════════════════════════════════════
          LEFT PANEL — Dark brand panel
      ═══════════════════════════════════════ */}
      <div className="hidden lg:flex w-1/2 h-full flex-col relative overflow-hidden">

        {/* Background layers */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#180800] via-[#0C0C0F] to-[#0C0C0F]" />
          {/* Orange glow top-left */}
          <div className="absolute -top-32 -left-32 w-[560px] h-[560px] bg-orange-500/[0.07] rounded-full blur-[140px]" />
          {/* Subtle blue accent bottom-right */}
          <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-sky-500/[0.04] rounded-full blur-[120px]" />
          {/* Dot texture */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
          {/* Right border */}
          <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />
        </div>

        {/* Content — spread full height */}
        <div className="relative flex flex-col h-full px-14 py-12">

          {/* ── Logo ── */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-amber-400 rounded-lg flex items-center justify-center shadow-md shadow-primary/30">
              <span className="material-symbols-outlined text-white text-lg">terminal</span>
            </div>
            <div>
              <p className="text-white text-sm font-black tracking-tight leading-none">Chấm điểm Java OOP</p>
              <p className="text-white/30 text-[10px] mt-0.5 uppercase tracking-widest">FPT University</p>
            </div>
          </div>

          {/* ── Hero headline ── */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="space-y-8">
              {/* Eyebrow */}
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="w-2 h-2 rounded-full bg-green-400/40" />
                  <span className="w-2 h-2 rounded-full bg-green-400/20" />
                </div>
                <span className="text-green-400 text-xs font-bold tracking-[0.18em] uppercase">Hệ thống đang hoạt động</span>
              </div>

              <div>
                <h1 className="text-white font-black leading-[1.06] tracking-tight" style={{ fontSize: 'clamp(2.4rem, 3.5vw, 3.5rem)' }}>
                  Chấm điểm<br />
                  OOP tự động<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-amber-300">
                    bằng AI.
                  </span>
                </h1>
                <p className="text-white/40 text-[15px] leading-relaxed mt-5 max-w-[320px]">
                  Nộp bài, kiểm tra test case, đánh giá OOP với Gemini AI — chính xác và minh bạch.
                </p>
              </div>

              {/* Feature list */}
              <div className="space-y-1">
                {[
                  { icon: 'bolt',        color: 'text-amber-400',  bg: 'bg-amber-400/10',  label: 'Auto Grading',        sub: 'Thực thi .jar & so sánh output tự động' },
                  { icon: 'psychology',  color: 'text-sky-400',    bg: 'bg-sky-400/10',    label: 'AI OOP Review',       sub: 'Gemini phân tích encapsulation, design pattern' },
                  { icon: 'gavel',       color: 'text-violet-400', bg: 'bg-violet-400/10', label: 'Phúc khảo trực tuyến', sub: 'Gửi đơn & thanh toán qua PayOS' },
                ].map(({ icon, color, bg, label, sub }) => (
                  <div key={icon} className="flex items-center gap-4 p-3.5 rounded-2xl hover:bg-white/[0.03] transition-colors group">
                    <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                      <span className={`material-symbols-outlined ${color} text-[19px]`}>{icon}</span>
                    </div>
                    <div>
                      <p className="text-white/85 text-sm font-bold leading-none mb-1">{label}</p>
                      <p className="text-white/35 text-xs">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Stats bar ── */}
          <div className="flex-shrink-0 pt-8 border-t border-white/[0.07]">
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: '100%', label: 'Tự động hoá' },
                { value: 'OOP', label: 'Java Oriented' },
                { value: 'FPT', label: 'Chính thống' },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <p className="text-white font-black text-xl tracking-tight">{value}</p>
                  <p className="text-white/30 text-[10px] mt-0.5 leading-tight">{label}</p>
                </div>
              ))}
            </div>
            <p className="text-white/20 text-[10px] mt-6 text-center tracking-wider uppercase">
              © 2026 FPT University · Hệ thống Chấm điểm Java OOP
            </p>
          </div>

        </div>
      </div>

      {/* ═══════════════════════════════════════
          RIGHT PANEL — Login form
      ═══════════════════════════════════════ */}
      <div className="flex-1 h-full bg-[#0f1014] flex flex-col relative">

        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.07] bg-[linear-gradient(rgba(243,112,33,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(243,112,33,0.4)_1px,transparent_1px)] bg-[size:40px_40px]" />

        {/* ── Top bar ── */}
        <div className="relative flex-shrink-0 flex items-center justify-between px-10 py-5 border-b border-gray-800">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-gray-500 hover:text-white text-sm font-semibold transition-colors group"
          >
            <span className="material-symbols-outlined text-base group-hover:-translate-x-0.5 transition-transform">
              arrow_back
            </span>
            Trang chủ
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Chưa có tài khoản?</span>
            <Link to="/register" className="font-bold text-primary hover:underline underline-offset-2">
              Đăng ký ngay →
            </Link>
          </div>
        </div>

        {/* ── Form area ── */}
        <div className="relative flex-1 flex items-center justify-center overflow-y-auto px-8 py-8">
          <div className="w-full max-w-[460px]">

            {/* Heading */}
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-bold px-3 py-1.5 rounded-xl mb-5 tracking-wide">
                <span className="material-symbols-outlined text-[14px]">lock_open</span>
                Đăng nhập hệ thống
              </div>
              <h2 className="text-white font-black tracking-tight leading-tight mb-2.5" style={{ fontSize: '2rem' }}>
                Chào mừng trở lại 👋
              </h2>
              <p className="text-gray-400 text-[15px] leading-relaxed">
                Nhập thông tin tài khoản để tiếp tục vào Hệ thống Chấm điểm Java OOP.
              </p>
            </div>

            {/* Form */}
            <form className="space-y-6" onSubmit={handleLogin}>

              {/* Username */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.14em]">
                  Tên đăng nhập
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-600 group-focus-within:text-primary text-[18px] transition-colors">
                      person
                    </span>
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nhập tên đăng nhập của bạn"
                    autoComplete="username"
                    disabled={loading}
                    className="w-full h-[52px] pl-11 pr-4 bg-gray-900/80 border border-gray-700 rounded-xl text-[15px] text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/70 focus:shadow-[0_0_0_3px_rgba(243,112,33,0.1)] transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.14em]">
                    Mật khẩu
                  </label>
                  <Link to="/forgot-password" className="text-xs font-bold text-primary hover:underline underline-offset-2 transition-colors">
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-600 group-focus-within:text-primary text-[18px] transition-colors">
                      lock
                    </span>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    autoComplete="current-password"
                    disabled={loading}
                    className="w-full h-[52px] pl-11 pr-12 bg-gray-900/80 border border-gray-700 rounded-xl text-[15px] text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/70 focus:shadow-[0_0_0_3px_rgba(243,112,33,0.1)] transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-4 flex items-center text-gray-600 hover:text-gray-300 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-start gap-3 px-4 py-3 bg-red-900/20 border border-red-500/30 rounded-xl">
                  <span className="material-symbols-outlined text-red-400 text-[18px] flex-shrink-0 mt-0.5">error</span>
                  <p className="text-red-400 text-sm font-medium leading-snug">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[54px] bg-primary hover:bg-[#ff8c42] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-black text-[15px] tracking-wide transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 shadow-xl shadow-primary/20"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">login</span>
                    Đăng nhập
                  </>
                )}
              </button>

            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-7">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gray-700" />
              <span className="text-gray-600 text-xs font-semibold">hoặc</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gray-700" />
            </div>

            {/* Register CTA */}
            <Link
              to="/register"
              className="w-full h-[54px] border border-gray-700 hover:border-primary/50 rounded-xl font-bold text-[15px] text-gray-400 hover:text-primary transition-all flex items-center justify-center gap-2.5 group"
            >
              <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">
                person_add
              </span>
              Tạo tài khoản mới
            </Link>

          </div>
        </div>

        {/* ── Bottom note ── */}
        <div className="relative flex-shrink-0 text-center py-4 border-t border-gray-800">
          <p className="text-gray-600 text-xs">
            Chỉ dành cho sinh viên & cán bộ{' '}
            <span className="font-bold text-gray-500">FPT University</span>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
