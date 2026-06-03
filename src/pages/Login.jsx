import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Alert } from '@mui/material';
import loginpage_img from '../assets/study.svg';
import logo from '../assets/logo-md.png';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (result.ok) {
      navigate('/');
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
