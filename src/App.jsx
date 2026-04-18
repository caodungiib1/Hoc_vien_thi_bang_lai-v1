import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
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
import BusinessesPortal from './pages/BusinessesPortal';
import Notifications from './pages/Notifications';
import Tasks from './pages/Tasks';
import NotFound from './pages/NotFound';
import Auth from './pages/Auth';
import AccessDenied from './pages/AccessDenied';
import { getCurrentUser, logout, syncCurrentUser } from './services/authService';
import {
  buildOrganizationPath,
  extractOrganizationCode,
  getOrganizationCode,
  stripOrganizationPrefix,
} from './services/orgRouteService';
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
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(getInitialTheme);
  const isSystemBusinessesRoute = location.pathname === '/businesses' || location.pathname === '/businesses/';
  // Không load user của tool chính khi đang ở cổng /businesses
  const [currentUser, setCurrentUser] = useState(() => (isSystemBusinessesRoute ? null : getCurrentUser()));


  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [theme]);

  useEffect(() => {
    // Không sync user của tool chính khi đang ở cổng /businesses
    if (isSystemBusinessesRoute) return;

    let mounted = true;

    syncCurrentUser()
      .then((user) => {
        if (!mounted || !user) return;
        setCurrentUser(user);
      })
      .catch(() => {
        if (!mounted) return;
        setCurrentUser(null);
      });

    return () => {
      mounted = false;
    };
  }, [isSystemBusinessesRoute]);

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
  };

  const renderProtectedRoute = (moduleKey, element) => (
    canAccessModule(currentUser, moduleKey)
      ? element
      : <AccessDenied currentUser={currentUser} moduleKey={moduleKey} />
  );

  const currentOrganizationCode = getOrganizationCode(currentUser);
  const pathnameOrganizationCode = extractOrganizationCode(location.pathname);
  const innerPathname = stripOrganizationPrefix(location.pathname);
  const normalizedInnerPath = innerPathname === '/auth' ? '/' : innerPathname;
  const expectedScopedPath = currentUser
    ? buildOrganizationPath(currentUser, `${normalizedInnerPath}${location.search}${location.hash}`)
    : '';
  const needsOrganizationRedirect = Boolean(
    !isSystemBusinessesRoute
    && currentUser
    && currentOrganizationCode
    && pathnameOrganizationCode !== currentOrganizationCode,
  );

  useEffect(() => {
    if (!needsOrganizationRedirect || !expectedScopedPath) return;
    navigate(expectedScopedPath, { replace: true });
  }, [expectedScopedPath, navigate, needsOrganizationRedirect]);

  const orgRoute = (path = '/') => (
    path === '/'
      ? '/:organizationCode'
      : `/:organizationCode${path}`
  );

  return (
    <div className="app-shell" data-theme={theme}>
      {isSystemBusinessesRoute ? (
        <BusinessesPortal />
      ) : currentUser ? (
        needsOrganizationRedirect ? null : (
          <DashboardLayout
            theme={theme}
            onThemeChange={setTheme}
            currentUser={currentUser}
            onLogout={handleLogout}
          >
            <Routes>
              <Route path={orgRoute('/')} element={renderProtectedRoute('dashboard', <Dashboard />)} />
              <Route path={orgRoute('/students')} element={renderProtectedRoute('students', <Students />)} />
              <Route path={orgRoute('/students/:id')} element={renderProtectedRoute('students', <StudentDetail />)} />
              <Route path={orgRoute('/classes')} element={renderProtectedRoute('classes', <Classes />)} />
              <Route path={orgRoute('/exams')} element={renderProtectedRoute('exams', <Exams />)} />
              <Route path={orgRoute('/fees')} element={renderProtectedRoute('fees', <Fees />)} />
              <Route path={orgRoute('/reports')} element={renderProtectedRoute('reports', <Reports />)} />
              <Route path={orgRoute('/documents')} element={renderProtectedRoute('documents', <Documents />)} />
              <Route path={orgRoute('/referrers')} element={renderProtectedRoute('referrers', <Referrers />)} />
              <Route path={orgRoute('/settings')} element={renderProtectedRoute('settings', <Settings />)} />
              <Route path={orgRoute('/admin')} element={renderProtectedRoute('admin', <Admin />)} />
              <Route path={orgRoute('/notifications')} element={renderProtectedRoute('notifications', <Notifications />)} />
              <Route path={orgRoute('/tasks')} element={renderProtectedRoute('tasks', <Tasks />)} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </DashboardLayout>
        )
      ) : (
        <Auth onAuthenticated={setCurrentUser} />
      )}
    </div>
  );
}

export default App;
