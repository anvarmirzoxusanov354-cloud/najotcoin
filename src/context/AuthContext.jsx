import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

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
        // Clone qilamiz — body faqat bir marta o'qiladi
        const url = typeof args[0] === 'string' ? args[0] : '';
        // Login endpointida 401 bo'lsa logout qilmaymiz
        if (!url.includes('/auth/login')) {
          localStorage.removeItem('isLogged');
          localStorage.removeItem('accessToken');
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
      const res = await fetch('https://najot-edu.softwareengineer.uz/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (res.ok && data.accessToken) {
        localStorage.setItem('isLogged', 'true');
        localStorage.setItem('accessToken', data.accessToken);
        setUser('true');
        return { ok: true };
      }
      return { ok: false, message: data.message || 'Telefon yoki parol xato!' };
    } catch {
      return { ok: false, message: 'Server bilan ulanishda xatolik!' };
    }
  };

  const logout = () => {
    localStorage.removeItem('isLogged');
    localStorage.removeItem('accessToken');
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
