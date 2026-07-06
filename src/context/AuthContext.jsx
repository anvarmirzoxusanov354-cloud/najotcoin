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
      // 1) Login → accessToken va role olamiz
      const res  = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.accessToken) {
        return { ok: false, message: data.message || 'Telefon yoki parol xato!' };
      }

      const role = String(data.role || 'ADMIN').toUpperCase();

      // 2) Faqat STUDENT uchun OTP SMS yuboriladi
      if (role === 'STUDENT') {
        await fetch(`${BASE_URL}/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone }),
        }).catch(() => {}); // SMS xatolik bo'lsa ham loginga ta'sir qilmasin
      }

      localStorage.setItem('isLogged',    'true');
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('role',        role);
      localStorage.setItem('phone',       phone);
      setUser('true');
      return { ok: true, role };
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
