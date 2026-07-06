import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  Search,
  NotificationsNone,
  DarkModeOutlined,
  LightModeOutlined,
  ChevronLeftOutlined,
  ChevronRightOutlined,
  LogoutOutlined,
  Menu,
} from '@mui/icons-material';
import { Select, MenuItem, FormControl } from '@mui/material';

const LANGS = [
  { value: 'uz', label: "O'zbekcha" },
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
];

const Header = ({ onMenuClick, isDesktopSidebarOpen, toggleDesktopSidebar }) => {
  const { logout } = useAuth();
  const { darkMode, toggleDarkMode, lang, setLang, t } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className={`h-16 flex items-center justify-between px-4 lg:px-6 transition-colors ${darkMode ? 'bg-[#0f172a] border-b border-[#1e293b]' : 'bg-[#f1f5f9]'}`}>
      <div className="flex items-center gap-2 lg:gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className={`lg:hidden w-10 h-10 flex items-center justify-center rounded-xl shadow-sm ${darkMode ? 'bg-[#1e293b] text-slate-300' : 'bg-white text-gray-500'}`}
        >
          <Menu />
        </button>

        <button
          onClick={toggleDesktopSidebar}
          className={`hidden lg:flex w-8 h-8 items-center justify-center rounded-lg shadow-sm shrink-0 hover:opacity-80 cursor-pointer transition-colors ${darkMode ? 'bg-[#1e293b] text-slate-400' : 'bg-white text-gray-400'}`}
        >
          {isDesktopSidebarOpen
            ? <ChevronLeftOutlined fontSize="small" className="scale-75" />
            : <ChevronRightOutlined fontSize="small" className="scale-75" />}
        </button>

        <div className="relative max-w-xs w-full sm:w-64">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
            <Search fontSize="small" />
          </div>
          <input
            type="text"
            placeholder={t('search')}
            className={`border-none rounded-xl py-2 pl-10 pr-4 w-full text-sm focus:ring-2 focus:ring-[#7c4dff] transition-all shadow-sm outline-none ${darkMode ? 'bg-[#1e293b] text-slate-200 placeholder-slate-500' : 'bg-white text-gray-700 placeholder-gray-400'}`}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-3 shrink-0">

        {/* Til tanlash */}
        <div className={`hidden md:block rounded-xl shadow-sm overflow-hidden ${darkMode ? 'bg-[#1e293b]' : 'bg-white'}`}>
          <FormControl size="small" variant="standard" sx={{ minWidth: 110, px: 1.5 }}>
            <Select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              displayEmpty
              disableUnderline
              sx={{
                fontSize: '13px',
                fontWeight: 500,
                height: '36px',
                color: darkMode ? '#e2e8f0' : '#374151',
                '& .MuiSvgIcon-root': { color: darkMode ? '#94a3b8' : '#6b7280' },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: darkMode ? '#1e293b' : 'white',
                    color: darkMode ? '#e2e8f0' : '#374151',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    borderRadius: '10px',
                    mt: 0.5,
                  },
                },
              }}
            >
              {LANGS.map(l => (
                <MenuItem key={l.value} value={l.value}
                  sx={{
                    fontSize: '13px', fontWeight: lang === l.value ? 600 : 400,
                    color: lang === l.value ? '#7c4dff' : (darkMode ? '#e2e8f0' : '#374151'),
                    '&:hover': { bgcolor: darkMode ? '#334155' : '#f5f0ff' },
                  }}>
                  {l.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        {/* Bildirishnomalar */}
        <button className={`w-10 h-10 flex items-center justify-center rounded-xl shadow-sm transition-all ${darkMode ? 'bg-[#1e293b] text-slate-300 hover:bg-[#334155]' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
          <NotificationsNone />
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          title={darkMode ? 'Kunduzgi rejim' : 'Tungi rejim'}
          className={`w-10 h-10 flex items-center justify-center rounded-xl shadow-sm transition-all ${darkMode ? 'bg-[#7c4dff] text-white hover:bg-[#6c3fe6]' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
        >
          {darkMode ? <LightModeOutlined fontSize="small" /> : <DarkModeOutlined fontSize="small" />}
        </button>

        {/* Profil */}
        <div className={`w-10 h-10 rounded-xl overflow-hidden shadow-sm border cursor-pointer ${darkMode ? 'border-[#334155]' : 'border-white'}`}>
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Chiqish */}
        <button
          onClick={handleLogout}
          className={`w-10 h-10 flex items-center justify-center rounded-xl shadow-sm transition-all ${darkMode ? 'bg-[#1e293b] text-red-400 hover:bg-red-900/30' : 'bg-white text-red-400 hover:bg-red-50 hover:text-red-500'}`}
          title={t('logout')}
        >
          <LogoutOutlined fontSize="small" />
        </button>
      </div>
    </header>
  );
};

export default Header;
