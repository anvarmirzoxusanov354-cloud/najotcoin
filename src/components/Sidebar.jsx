
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  HomeOutlined,
  PeopleAltOutlined,
  SchoolOutlined,
  GroupOutlined,
  CardGiftcardOutlined,
  SettingsOutlined,
  DescriptionOutlined,
  CloseOutlined
} from '@mui/icons-material';

const NAV_ITEMS = [
  { path: '/',           icon: HomeOutlined,        key: 'home',         exact: true  },
  { path: '/teachers',   icon: PeopleAltOutlined,   key: 'teachers',     exact: false },
  { path: '/classes',    icon: SchoolOutlined,       key: 'classes',      exact: false },
  { path: '/students',   icon: GroupOutlined,        key: 'students',     exact: false },
  { path: '/gifts',      icon: CardGiftcardOutlined, key: 'gifts',        exact: false },
  { path: '/management', icon: SettingsOutlined,     key: 'management',   exact: false },
];

const Sidebar = ({ onClose, isCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, darkMode } = useApp();

  const isActive = (path, exact) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div className={`${isCollapsed ? 'w-20 p-2' : 'w-72 lg:w-64 p-4'} bg-white flex flex-col h-screen sticky top-0 rounded-r-3xl transition-all duration-300`}>
      
      {/* Logo */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-10 px-2`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center text-white font-bold shrink-0">E</div>
          {!isCollapsed && <span className="text-xl font-bold text-gray-900">Najotedu</span>}
        </div>
        {!isCollapsed && (
          <button onClick={onClose} className="lg:hidden p-2 text-gray-400 hover:text-gray-600">
            <CloseOutlined />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="space-y-1 flex-1">
        {NAV_ITEMS.map(({ path, icon: Icon, key, exact }) => {
          const active = isActive(path, exact);
          const label  = t(key);
          return (
            <Link
              key={path}
              to={path}
              title={label}
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl transition-all no-underline
                ${active
                  ? 'bg-[#7c4dff] text-white shadow-[0_2px_8px_rgba(124,77,255,0.3)]'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
            >
              <Icon fontSize="small" className={active ? 'text-white' : 'text-gray-400'} />
              {!isCollapsed && (
                <span className={`text-sm font-semibold ${active ? 'text-white' : 'text-gray-600'}`}>
                  {label}
                </span>
              )}
              {/* Active indicator dot (collapsed holatda) */}
              {isCollapsed && active && (
                <span className="absolute right-1 w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Obuna widget */}
      {!isCollapsed && (
        <div className="mt-auto">
          <div className="bg-gray-50 p-4 rounded-2xl">
            <div className="flex gap-3 mb-4">
              <div className="p-2 bg-white rounded shadow-sm">
                <DescriptionOutlined className="text-orange-400" fontSize="small" />
              </div>
              <div>
                <p className="text-xs font-bold">{t('subscription')}</p>
                <p className="text-[10px] text-red-500">{t('subscriptionExpired')}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/subscription')}
              className="w-full bg-[#ff3d00] text-white py-2 rounded-xl text-xs font-bold hover:bg-opacity-90 cursor-pointer"
            >
              ⚡ {t('renewSubscription')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
