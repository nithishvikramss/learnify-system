import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentManagement from './pages/StudentManagement';
import Subjects from './pages/Subjects';
import MarksEntry from './pages/MarksEntry';
import Reports from './pages/Reports';
import StaffManagement from './pages/StaffManagement';
import { getSession, isAdmin, ROLE_LABELS } from './auth/session';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/students':  'Student Management',
  '/subjects':  'Subjects',
  '/marks':     'Marks Entry',
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
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/students"  element={<StudentManagement />} />
          <Route path="/subjects"  element={<Subjects />} />
          <Route path="/marks"     element={<MarksEntry />} />
          <Route path="/reports"   element={<Reports />} />
          <Route path="/staff"     element={isAdmin(session) ? <StaffManagement /> : <Navigate to="/dashboard" replace />} />
          <Route path="*"          element={<Navigate to="/dashboard" replace />} />
        </Routes>
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
