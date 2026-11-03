import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, ClipboardList,
  BarChart3, GraduationCap, LogOut
} from 'lucide-react';
import { clearSession } from '../auth/session';

const navItems = [
  { path: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'         },
  { path: '/students',   icon: Users,           label: 'Students'          },
  { path: '/subjects',   icon: BookOpen,        label: 'Subjects'          },
  { path: '/marks',      icon: ClipboardList,   label: 'Marks Entry'       },
  { path: '/reports',    icon: BarChart3,       label: 'Reports & Analytics'},
];

interface SidebarProps {
  /** Whether the sidebar is shown on small screens (always shown on desktop). */
  open: boolean;
  onNavigate: () => void;
}

export default function Sidebar({ open, onNavigate }: SidebarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const go = (path: string) => {
    navigate(path);
    onNavigate();
  };

  const handleLogout = () => {
    clearSession();
    navigate('/login', { replace: true });
  };

  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <GraduationCap size={20} color="#a5b4fc" />
          <h2>LearnifyAnalytics</h2>
        </div>
        <span>Student Management System</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ path, icon: Icon, label }) => (
          <button
            key={path}
            className={`nav-item${pathname === path ? ' active' : ''}`}
            onClick={() => go(path)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item" onClick={handleLogout} style={{ color: '#fca5a5' }}>
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
