import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerApi } from '../../services/authApi';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

const Register = () => {
  const navigate = useNavigate();

  // Form fields
  const [fullName, setFullName]           = useState('');
  const [mssv, setMssv]                   = useState('');
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms]       = useState(false);

  // UI state
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState(false);

  // Derive username from email (part before @)
  const deriveUsername = (emailStr) => {
    const idx = emailStr.indexOf('@');
    return idx > 0 ? emailStr.substring(0, idx).toLowerCase() : '';
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!agreeTerms) {
      setError('Bạn phải đồng ý với Điều khoản sử dụng.');
      return;
    }
    if (!PASSWORD_REGEX.test(password)) {
      setError('Mật khẩu phải có ít nhất 8 ký tự, gồm chữ in hoa, số và ký tự đặc biệt.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    const username = deriveUsername(email);

    try {
      setLoading(true);
      await registerApi({ fullName, email, username, mssv, password });
      setSuccess(true);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0] ||
        'Đăng ký thất bại. Vui lòng thử lại.';
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
          <div className="absolute -top-32 -left-32 w-[560px] h-[560px] bg-orange-500/[0.07] rounded-full blur-[140px]" />
          <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-sky-500/[0.04] rounded-full blur-[120px]" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
          <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />
        </div>

        {/* Content */}
        <div className="relative flex flex-col h-full px-14 py-12">

          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-amber-400 rounded-lg flex items-center justify-center shadow-md shadow-primary/30">
              <span className="material-symbols-outlined text-white text-lg">terminal</span>
            </div>
            <div>
              <p className="text-white text-sm font-black tracking-tight leading-none">Chấm điểm Java OOP</p>
              <p className="text-white/30 text-[10px] mt-0.5 uppercase tracking-widest">FPT University</p>
            </div>
          </div>

          {/* Hero */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="space-y-8">

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
                  Tạo tài khoản<br />
                  để bắt đầu<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-amber-300">
                    hành trình.
                  </span>
                </h1>
                <p className="text-white/40 text-[15px] leading-relaxed mt-5 max-w-[320px]">
                  Đăng ký một lần, truy cập toàn bộ tính năng thi, nộp bài và phúc khảo trực tuyến.
                </p>
              </div>

              {/* Feature list */}
              <div className="space-y-1">
                {[
                  { icon: 'bolt',        color: 'text-amber-400',  bg: 'bg-amber-400/10',  label: 'Auto Grading',         sub: 'Thực thi .jar & so sánh output tự động' },
                  { icon: 'psychology',  color: 'text-sky-400',    bg: 'bg-sky-400/10',    label: 'AI OOP Review',        sub: 'Gemini phân tích encapsulation, design pattern' },
                  { icon: 'gavel',       color: 'text-violet-400', bg: 'bg-violet-400/10', label: 'Phúc khảo trực tuyến', sub: 'Gửi đơn & thanh toán qua PayOS' },
                ].map(({ icon, color, bg, label, sub }) => (
                  <div key={icon} className="flex items-center gap-4 p-3.5 rounded-2xl hover:bg-white/[0.03] transition-colors">
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

          {/* Stats bar */}
          <div className="flex-shrink-0 pt-8 border-t border-white/[0.07]">
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: '100%', label: 'Tự động hoá' },
                { value: 'OOP',  label: 'Java Oriented' },
                { value: 'FPT',  label: 'Chính thống' },
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
          RIGHT PANEL — Register form
      ═══════════════════════════════════════ */}
      <div className="flex-1 h-full bg-[#0f1014] flex flex-col overflow-y-auto relative">

        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.07] bg-[linear-gradient(rgba(243,112,33,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(243,112,33,0.4)_1px,transparent_1px)] bg-[size:40px_40px]" />

        {/* Top bar */}
        <div className="relative flex-shrink-0 flex items-center justify-between px-10 py-5 border-b border-gray-800">
          <Link to="/login" className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm font-medium group">
            <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
            Quay lại đăng nhập
          </Link>
          <span className="text-[11px] font-black tracking-widest text-gray-700 uppercase">FPT University</span>
        </div>

        {/* Form area */}
        <div className="relative flex-1 flex flex-col justify-center px-10 py-8 max-w-md mx-auto w-full">

          {/* ── Success state ── */}
          {success ? (
            <div className="text-center">
              <div className="w-20 h-20 rounded-xl bg-green-900/20 border border-green-500/30 flex items-center justify-center mx-auto mb-7 shadow-[0_0_30px_rgba(34,197,94,0.08)]">
                <span className="material-symbols-outlined text-green-400 text-4xl">mark_email_read</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-green-900/20 border border-green-500/30 text-green-400 text-xs font-bold px-3 py-1.5 rounded-xl mb-5 tracking-wide">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                Đăng ký thành công!
              </div>
              <h2 className="text-white font-black text-2xl tracking-tight mb-3">Kiểm tra hộp thư!</h2>
              <p className="text-gray-400 text-[15px] leading-relaxed mb-2">
                Đã gửi email kích hoạt đến <span className="font-bold text-gray-200">{email}</span>.
              </p>
              <p className="text-gray-500 text-sm mb-10">
                Click vào link trong email để kích hoạt tài khoản. Kiểm tra cả mục{' '}
                <span className="font-semibold text-gray-400">Spam / Junk</span>.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full h-[54px] bg-primary hover:bg-[#ff8c42] text-white rounded-xl font-black text-[15px] transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2.5 shadow-xl shadow-primary/20"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                Đi đến trang đăng nhập
              </button>
            </div>
          ) : (
          <>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-black text-white tracking-tight mb-1.5">Đăng ký tài khoản</h2>
            <p className="text-gray-500 text-sm">Điền thông tin để bắt đầu sử dụng hệ thống</p>
          </div>

          <form className="space-y-4" onSubmit={handleRegister}>

            {/* Họ và tên */}
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.14em] mb-1.5">
                Họ và tên
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-gray-600 group-focus-within:text-primary text-[18px] transition-colors">person</span>
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  required
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-900/80 border border-gray-700 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/70 focus:shadow-[0_0_0_3px_rgba(243,112,33,0.1)] transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.14em] mb-1.5">
                Email FPT
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-gray-600 group-focus-within:text-primary text-[18px] transition-colors">mail</span>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="anv@fpt.edu.vn"
                  required
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-900/80 border border-gray-700 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/70 focus:shadow-[0_0_0_3px_rgba(243,112,33,0.1)] transition-all disabled:opacity-50"
                />
              </div>
              {email && email.includes('@') && (
                <p className="text-xs text-gray-600 mt-1.5 pl-1">
                  Tên đăng nhập: <span className="font-bold text-gray-500">{deriveUsername(email)}</span>
                </p>
              )}
            </div>

            {/* Mã SV/GV */}
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.14em] mb-1.5">
                Mã sinh viên / giảng viên
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-gray-600 group-focus-within:text-primary text-[18px] transition-colors">badge</span>
                </span>
                <input
                  type="text"
                  value={mssv}
                  onChange={(e) => setMssv(e.target.value)}
                  placeholder="Ví dụ: SE123456 (8 ký tự cuối email)"
                  required
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-900/80 border border-gray-700 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/70 focus:shadow-[0_0_0_3px_rgba(243,112,33,0.1)] transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Mật khẩu + Xác nhận */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.14em] mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-600 group-focus-within:text-primary text-[18px] transition-colors">lock</span>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    className="w-full pl-11 pr-10 py-3.5 bg-gray-900/80 border border-gray-700 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/70 focus:shadow-[0_0_0_3px_rgba(243,112,33,0.1)] transition-all disabled:opacity-50"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-gray-300 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.14em] mb-1.5">
                  Xác nhận
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-600 group-focus-within:text-primary text-[18px] transition-colors">lock_reset</span>
                  </span>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    className="w-full pl-11 pr-10 py-3.5 bg-gray-900/80 border border-gray-700 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/70 focus:shadow-[0_0_0_3px_rgba(243,112,33,0.1)] transition-all disabled:opacity-50"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-gray-300 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">{showConfirm ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 py-1">
              <input
                id="terms"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-600 bg-gray-900 text-primary focus:ring-primary/30 cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-gray-500 leading-relaxed cursor-pointer">
                Tôi đồng ý với{' '}
                <span className="text-primary font-bold hover:underline cursor-pointer">Điều khoản sử dụng</span>
                {' '}và{' '}
                <span className="text-primary font-bold hover:underline cursor-pointer">Chính sách bảo mật</span>
              </label>
            </div>

            {/* Error */}
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
              className="w-full py-4 bg-primary hover:bg-[#ff8c42] disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-sm rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all tracking-wide flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang tạo tài khoản...
                </>
              ) : (
                'Tạo tài khoản'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-7">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gray-700" />
            <span className="text-gray-600 text-xs font-semibold">Đã có tài khoản?</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gray-700" />
          </div>

          {/* Login CTA */}
          <Link
            to="/login"
            className="w-full py-3.5 border border-gray-700 rounded-xl flex items-center justify-center gap-2 text-gray-400 text-sm font-bold hover:border-primary/50 hover:text-primary transition-all"
          >
            <span className="material-symbols-outlined text-[17px]">login</span>
            Đăng nhập ngay
          </Link>

          </>
          )}

        </div>
      </div>
    </div>
  );
};

export default Register;
