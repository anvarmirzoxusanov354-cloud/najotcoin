import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  NotificationsNone, 
  DarkModeOutlined, 
  ChevronLeftOutlined,
  ChevronRightOutlined,
  LogoutOutlined,
  Menu
} from '@mui/icons-material';
import { Switch, Select, MenuItem, FormControl } from '@mui/material';

const Header = ({ onMenuClick, isDesktopSidebarOpen, toggleDesktopSidebar }) => {
  const [lang, setLang] = useState('uzb');
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-6 bg-[#f1f5f9]">
      <div className="flex items-center gap-2 lg:gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="lg:hidden w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-gray-500"
        >
          <Menu />
        </button>
        
        <button 
          onClick={toggleDesktopSidebar}
          className="hidden lg:flex w-8 h-8 items-center justify-center bg-white rounded-lg shadow-sm text-gray-400 shrink-0 hover:bg-gray-50 cursor-pointer transition-colors"
        >
           {isDesktopSidebarOpen ? <ChevronLeftOutlined fontSize="small" className="scale-75" /> : <ChevronRightOutlined fontSize="small" className="scale-75" />}
        </button>
        <div className="relative group max-w-xs w-full sm:w-64">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
            <Search fontSize="small" />
          </div>
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-white border-none rounded-xl py-2 pl-10 pr-4 w-full text-sm focus:ring-2 focus:ring-[#7c4dff] transition-all shadow-sm outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-4 shrink-0">
      
        <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
          <FormControl size="small" variant="standard" sx={{ minWidth: 100, px: 2 }}>
            <Select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              displayEmpty
              disableUnderline
              sx={{ fontSize: '14px', fontWeight: 500, height: '36px' }}
            >
              <MenuItem value="uzb">Uzbek</MenuItem>
              <MenuItem value="eng">English</MenuItem>
              <MenuItem value="rus">Russian</MenuItem>
            </Select>
          </FormControl>
        </div>
        
        <button className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-gray-500 hover:bg-gray-50 transition-all">
          <NotificationsNone />
        </button>

        <div className="hidden sm:flex items-center gap-1 bg-white px-2 py-1 rounded-xl shadow-sm">
          <DarkModeOutlined fontSize="small" className="text-gray-500" />
          <Switch size="small" color="default" />
        </div>

        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-white cursor-pointer">
          <img 
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        </div>

        <button
          onClick={handleLogout}
          className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-red-400 hover:bg-red-50 hover:text-red-500 transition-all"
          title="Chiqish"
        >
          <LogoutOutlined fontSize="small" />
        </button>
      </div>
    </header>
  );
};

export default Header;
