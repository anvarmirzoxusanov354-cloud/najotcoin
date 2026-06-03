import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = React.useState(true);

  return (
    <div 
      className="flex bg-[#f1f5f9] h-screen relative overflow-hidden"
      style={{ '--sidebar-width': isDesktopSidebarOpen ? '256px' : '80px' }}
    >
      {/* Sidebar - responsive container */}
      <div className={`
        fixed inset-y-0 left-0 z-50 lg:relative transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isDesktopSidebarOpen ? 'lg:w-64' : 'lg:w-20'}
        overflow-hidden shrink-0
      `}>
        <div className={`${isDesktopSidebarOpen ? 'w-64' : 'w-20'} h-full transition-all duration-300`}>
          <Sidebar onClose={() => setIsSidebarOpen(false)} isCollapsed={!isDesktopSidebarOpen} />
        </div>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          onMenuClick={() => setIsSidebarOpen(true)} 
          isDesktopSidebarOpen={isDesktopSidebarOpen}
          toggleDesktopSidebar={() => setIsDesktopSidebarOpen(prev => !prev)}
        />
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet context={{ isDesktopSidebarOpen }} />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
