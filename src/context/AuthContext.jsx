import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

const BASE_URL = 'https://najot-edu.softwareengineer.uz/api/v1';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    return localStorage.getItem('isLogged');
  });

  // 401 kelganda avtomatik logout
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const response = await originalFetch(...args);
      if (response.status === 401) {
        const url = typeof args[0] === 'string' ? args[0] : '';
        if (!url.includes('/auth/login') && !url.includes('/auth/send-otp')) {
          localStorage.removeItem('isLogged');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('role');
          localStorage.removeItem('phone');
          setUser(null);
          window.location.href = '/login';
        }
      }
      return response;
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const login = async (phone, password) => {
    try {
      // 1) send-otp → telefon mavjudligini tekshiramiz
      const otpRes  = await fetch(`${BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const otpData = await otpRes.json();

      if (!otpRes.ok || !otpData.success) {
        return { ok: false, message: otpData.message || 'Telefon raqam topilmadi!' };
      }

      // 2) login → accessToken va role olamiz
      const res  = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();

      if (res.ok && data.accessToken) {
        // API response da "role": "STUDENT" yoki "ADMIN" to'g'ridan-to'g'ri keladi
        const role = String(data.role || otpData.role || 'ADMIN').toUpperCase();

        localStorage.setItem('isLogged',    'true');
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('role',        role);
        localStorage.setItem('phone',       phone);
        setUser('true');
        return { ok: true, role };
      }
      return { ok: false, message: data.message || 'Telefon yoki parol xato!' };
    } catch {
      return { ok: false, message: 'Server bilan ulanishda xatolik!' };
    }
  };

  const logout = () => {
    localStorage.removeItem('isLogged');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('role');
    localStorage.removeItem('phone');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
