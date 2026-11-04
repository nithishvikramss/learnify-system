import { lazy, Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';

// Each page is downloaded when first opened, so the login page stays small.
const Dashboard = lazy(() => import('./pages/Dashboard'));
const StudentManagement = lazy(() => import('./pages/StudentManagement'));
const Subjects = lazy(() => import('./pages/Subjects'));
const MarksEntry = lazy(() => import('./pages/MarksEntry'));
const Reports = lazy(() => import('./pages/Reports'));
const StaffManagement = lazy(() => import('./pages/StaffManagement'));
const Attendance = lazy(() => import('./pages/Attendance'));

import { getSession, isAdmin, ROLE_LABELS } from './auth/session';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/students':  'Student Management',
  '/subjects':  'Subjects',
  '/marks':     'Marks Entry',
  '/attendance': 'Attendance',
  '/reports':   'Reports & Analytics',
  '/staff':     'Staff Accounts',
};

function AuthGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  if (!getSession()) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

function AppLayout() {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'Learnify Analytics';
  const session = getSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
      {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />}
      <div className="main-content">
        <header className="top-bar">
          <button className="menu-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <Menu size={20} />
          </button>
          <h1>{title}</h1>
          <div className="top-bar-actions">
            <span className="user-chip">
              {session ? ROLE_LABELS[session.role] : 'User'}: <strong>{session?.username}</strong>
            </span>
          </div>
        </header>
        <Suspense fallback={<div className="loading-overlay"><div className="spinner" /><span>Loading…</span></div>}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/students"  element={<StudentManagement />} />
          <Route path="/subjects"  element={<Subjects />} />
          <Route path="/marks"     element={<MarksEntry />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/reports"   element={<Reports />} />
          <Route path="/staff"     element={isAdmin(session) ? <StaffManagement /> : <Navigate to="/dashboard" replace />} />
          <Route path="*"          element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </Suspense>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <AuthGuard>
            <AppLayout />
          </AuthGuard>
        } />
      </Routes>
    </BrowserRouter>
  );
}
