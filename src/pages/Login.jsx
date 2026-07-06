import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Alert } from '@mui/material';
import loginpage_img from '../assets/study.svg';
import logo from '../assets/logo-md.png';

const BASE = 'https://najot-edu.softwareengineer.uz/api/v1';

// ── Parolni tiklash modali ─────────────────────────────────────────────────
const ForgotPasswordModal = ({ onClose }) => {
  const [step, setStep] = useState(1); // 1: telefon, 2: OTP, 3: yangi parol
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPass, setNewPass] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [role, setRole] = useState('');

  const formatPhone = (val) => {
    // Faqat raqamlar qolsin
    const digits = val.replace(/\D/g, '');
    return digits;
  };

  // Qadam 1: telefon raqamini yuborish → OTP SMS
  const handleSendOtp = async () => {
    setError('');
    if (!phone.trim()) { setError("Telefon raqamini kiriting!"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setRole(data.role || '');
        setStep(2);
      } else {
        setError(data.message || 'Telefon raqam topilmadi!');
      }
    } catch {
      setError('Server bilan ulanishda xatolik!');
    } finally {
      setLoading(false);
    }
  };

  // Qadam 2: OTP kodni tasdiqlash
  const handleVerifyOtp = async () => {
    setError('');
    if (!otp.trim()) { setError("Kodni kiriting!"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), otp: Number(otp.trim()) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setStep(3);
      } else {
        setError(data.message || 'Kod noto\'g\'ri!');
      }
    } catch {
      setError('Server bilan ulanishda xatolik!');
    } finally {
      setLoading(false);
    }
  };

  // Qadam 3: Yangi parol saqlash
  const handleChangePassword = async () => {
    setError('');
    if (!newPass.trim() || newPass.length < 4) { setError("Kamida 4 ta belgidan iborat parol kiriting!"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/auth/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), password: newPass.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSuccess('Parol muvaffaqiyatli yangilandi!');
        setTimeout(() => onClose(), 1500);
      } else {
        setError(data.message || 'Xatolik yuz berdi!');
      }
    } catch {
      setError('Server bilan ulanishda xatolik!');
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = role === 'STUDENT' ? 'O\'quvchi' : role === 'TEACHER' ? 'O\'qituvchi' : role === 'ADMIN' || role === 'SUPERADMIN' ? 'Admin' : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[400px] p-8 relative">
        {/* Yopish tugmasi */}
        <button onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          ✕
        </button>

        {/* Sarlavha */}
        <h2 className="text-[18px] font-bold text-[#1e2a4a] text-center mb-1">Parolni tiklash</h2>
        <p className="text-[13px] text-gray-500 text-center mb-6">
          {step === 1 && 'Telefon raqamingizni kiriting — tasdiqlash kodi yuboriladi.'}
          {step === 2 && `SMS orqali yuborilgan kodni kiriting.${roleLabel ? ` (${roleLabel})` : ''}`}
          {step === 3 && 'Yangi parolni kiriting.'}
        </p>

        {/* Qadam ko'rsatkichi */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-2 rounded-full transition-all duration-300 ${s === step ? 'w-8 bg-[#7c4dff]' : s < step ? 'w-4 bg-[#7c4dff] opacity-40' : 'w-4 bg-gray-200'}`} />
          ))}
        </div>

        {/* Xato / Muvaffaqiyat */}
        {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-[13px] font-medium">{error}</div>}
        {success && <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-[13px] font-bold text-center">{success}</div>}

        {/* Qadam 1: Telefon */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7c4dff]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .82h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
              </span>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(formatPhone(e.target.value))}
                onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                placeholder="+998901234567"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-[14px] outline-none focus:border-[#7c4dff] transition-colors bg-gray-50"
              />
            </div>
            <button onClick={handleSendOtp} disabled={loading}
              className="w-full bg-[#7c4dff] text-white py-3 rounded-xl font-bold text-[14px] hover:bg-[#6c3fff] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
              {loading ? 'Yuborilmoqda...' : 'Kodni yuborish'}
            </button>
          </div>
        )}

        {/* Qadam 2: OTP */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7c4dff] font-bold text-[16px]">#</span>
              <input
                type="number"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                placeholder="123456"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-[14px] outline-none focus:border-[#7c4dff] transition-colors bg-gray-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <button onClick={handleVerifyOtp} disabled={loading}
              className="w-full bg-[#7c4dff] text-white py-3 rounded-xl font-bold text-[14px] hover:bg-[#6c3fff] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
              {loading ? 'Tekshirilmoqda...' : 'Tasdiqlash'}
            </button>
            <button onClick={() => { setStep(1); setOtp(''); setError(''); }}
              className="w-full text-gray-500 text-[13px] hover:text-[#7c4dff] transition-colors">
              ← Orqaga
            </button>
          </div>
        )}

        {/* Qadam 3: Yangi parol */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7c4dff]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              </span>
              <input
                type={showNewPass ? 'text' : 'password'}
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
                placeholder="Yangi parolni kiriting"
                className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-[14px] outline-none focus:border-[#7c4dff] transition-colors bg-gray-50"
              />
              <button type="button" onClick={() => setShowNewPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#7c4dff]">
                {showNewPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </button>
            </div>
            <button onClick={handleChangePassword} disabled={loading}
              className="w-full bg-[#7c4dff] text-white py-3 rounded-xl font-bold text-[14px] hover:bg-[#6c3fff] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
              {loading ? 'Saqlanmoqda...' : 'Parolni saqlash'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (result.ok) {
      if (result.role === 'STUDENT') {
        window.location.href = '/student';
      } else if (result.role === 'TEACHER') {
        window.location.href = '/teacher';
      } else {
        window.location.href = '/';
      }
    } else {
      setError(result.message || 'Telefon yoki parol xato!');
    }
  };

  let inputType = "password";
  if (showPass) {
    inputType = "text";
  }

  let passIcon = <Visibility fontSize="small" />;
  if (showPass) {
    passIcon = <VisibilityOff fontSize="small" />;
  }

  return (
    <div className="flex h-screen w-full font-sans">
      {/* Parolni tiklash modali */}
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      <div className="hidden lg:flex w-1/2 bg-[#1e2a4a] items-center justify-center">
        <img src={loginpage_img} alt="Student Illustration" className="max-w-[80%]" />
      </div>

      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 bg-white">
        <div className="w-full max-w-[400px]">
          <div className="text-center mb-10">
            <h2 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4">
              MUHAMMAD AL-XORAZMIY NOMIDAGI <br /> TOSHKENT AXBOROT TEXNOLOGIYALARI <br /> UNIVERSITETI
            </h2>
            <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 overflow-hidden">
              <img src={logo} className="w-full h-full object-contain" alt="TATU" />
            </div>
            <h1 className="text-xl font-bold text-[#1e2a4a]">LEARNING MANAGEMENT SYSTEM</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <Alert variant="filled" severity="error" sx={{ borderRadius: '8px' }}>
                {error}
              </Alert>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="+998906942321" 
                className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input 
                  type={inputType} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Parolni kiriting" 
                  className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500 transition-colors"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {passIcon}
                </button>
              </div>
              <div className="flex justify-end mt-1">
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-[13px] text-[#7c4dff] hover:underline font-medium"
                >
                  Parolni unutdingizmi?
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-[#1e2a4a] text-white py-3 rounded font-bold hover:bg-[#2a3a5e] transition-colors shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              )}
              {loading ? 'Yuklanmoqda...' : 'Kirish'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
