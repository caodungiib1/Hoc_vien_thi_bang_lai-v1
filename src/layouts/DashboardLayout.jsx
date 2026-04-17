import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const DashboardLayout = ({ children, theme, onThemeChange, currentUser, onLogout }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className={`app-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        currentUser={currentUser}
      />
      <div className="main-wrapper">
        <Header
          theme={theme}
          onThemeChange={onThemeChange}
          isSidebarCollapsed={isSidebarCollapsed}
          onMenuToggle={() => setIsSidebarCollapsed((prev) => !prev)}
          currentUser={currentUser}
          onLogout={onLogout}
        />
        <div className="main-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
