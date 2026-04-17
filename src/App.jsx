import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import StudentDetail from './pages/StudentDetail';
import Classes from './pages/Classes';
import Exams from './pages/Exams';
import Fees from './pages/Fees';
import Reports from './pages/Reports';
import Documents from './pages/Documents';
import Referrers from './pages/Referrers';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import Notifications from './pages/Notifications';
import Tasks from './pages/Tasks';
import NotFound from './pages/NotFound';
import Auth from './pages/Auth';
import AccessDenied from './pages/AccessDenied';
import { getCurrentUser, logout } from './services/authService';
import { canAccessModule } from './services/permissionService';

const THEME_STORAGE_KEY = 'qlhv-theme';

const getInitialTheme = () => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === 'dark' ? 'dark' : 'light';
};

function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [currentUser, setCurrentUser] = useState(getCurrentUser);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [theme]);

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
  };

  const renderProtectedRoute = (moduleKey, element) => (
    canAccessModule(currentUser, moduleKey)
      ? element
      : <AccessDenied currentUser={currentUser} moduleKey={moduleKey} />
  );

  return (
    <div className="app-shell" data-theme={theme}>
      {currentUser ? (
        <DashboardLayout
          theme={theme}
          onThemeChange={setTheme}
          currentUser={currentUser}
          onLogout={handleLogout}
        >
          <Routes>
            <Route path="/" element={renderProtectedRoute('dashboard', <Dashboard />)} />
            <Route path="/students" element={renderProtectedRoute('students', <Students />)} />
            <Route path="/students/:id" element={renderProtectedRoute('students', <StudentDetail />)} />
            <Route path="/classes" element={renderProtectedRoute('classes', <Classes />)} />
            <Route path="/exams" element={renderProtectedRoute('exams', <Exams />)} />
            <Route path="/fees" element={renderProtectedRoute('fees', <Fees />)} />
            <Route path="/reports" element={renderProtectedRoute('reports', <Reports />)} />
            <Route path="/documents" element={renderProtectedRoute('documents', <Documents />)} />
            <Route path="/referrers" element={renderProtectedRoute('referrers', <Referrers />)} />
            <Route path="/settings" element={renderProtectedRoute('settings', <Settings />)} />
            <Route path="/admin" element={renderProtectedRoute('admin', <Admin />)} />
            <Route path="/notifications" element={renderProtectedRoute('notifications', <Notifications />)} />
            <Route path="/tasks" element={renderProtectedRoute('tasks', <Tasks />)} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DashboardLayout>
      ) : (
        <Auth onAuthenticated={setCurrentUser} />
      )}
    </div>
  );
}

export default App;
