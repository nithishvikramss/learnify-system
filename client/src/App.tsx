import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentManagement from './pages/StudentManagement';
import Subjects from './pages/Subjects';
import MarksEntry from './pages/MarksEntry';
import Reports from './pages/Reports';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/students':  'Student Management',
  '/subjects':  'Subjects',
  '/marks':     'Marks Entry',
  '/reports':   'Reports & Analytics',
};

function AuthGuard({ children }: { children: React.ReactNode }) {
  const auth = localStorage.getItem('auth');
  const location = useLocation();
  if (!auth) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

function AppLayout() {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'Learnify Analytics';
  const auth = JSON.parse(localStorage.getItem('auth') || '{}');

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <header className="top-bar">
          <h1>{title}</h1>
          <div className="top-bar-actions">
            <span style={{
              fontSize: 12, color: 'var(--text-muted)',
              background: 'var(--surface-2)', padding: '4px 10px',
              borderRadius: 20, border: '1px solid var(--border)'
            }}>
              {auth.role || 'User'}: <strong>{auth.username}</strong>
            </span>
          </div>
        </header>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/students"  element={<StudentManagement />} />
          <Route path="/subjects"  element={<Subjects />} />
          <Route path="/marks"     element={<MarksEntry />} />
          <Route path="/reports"   element={<Reports />} />
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
