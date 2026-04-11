import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, ClipboardList,
  BarChart3, GraduationCap, LogOut
} from 'lucide-react';

const navItems = [
  { path: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'         },
  { path: '/students',   icon: Users,           label: 'Students'          },
  { path: '/subjects',   icon: BookOpen,        label: 'Subjects'          },
  { path: '/marks',      icon: ClipboardList,   label: 'Marks Entry'       },
  { path: '/reports',    icon: BarChart3,       label: 'Reports & Analytics'},
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('auth');
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <GraduationCap size={20} color="#a5b4fc" />
          <h2>LearnifyAnalytics</h2>
        </div>
        <span>Student Performance System</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ path, icon: Icon, label }) => (
          <button
            key={path}
            className={`nav-item${pathname === path ? ' active' : ''}`}
            onClick={() => navigate(path)}
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
