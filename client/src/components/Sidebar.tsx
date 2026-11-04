import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, ClipboardList,
  BarChart3, GraduationCap, LogOut, UserCog, KeyRound, CalendarCheck
} from 'lucide-react';
import { useState } from 'react';
import ChangePasswordModal from './ChangePasswordModal';
import { clearSession, getSession, isAdmin } from '../auth/session';

const navItems = [
  { path: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'         },
  { path: '/students',   icon: Users,           label: 'Students'          },
  { path: '/subjects',   icon: BookOpen,        label: 'Subjects'          },
  { path: '/marks',      icon: ClipboardList,   label: 'Marks Entry'       },
  { path: '/attendance', icon: CalendarCheck,   label: 'Attendance'        },
  { path: '/reports',    icon: BarChart3,       label: 'Reports & Analytics'},
  { path: '/staff',      icon: UserCog,         label: 'Staff', adminOnly: true },
];

interface SidebarProps {
  /** Whether the sidebar is shown on small screens (always shown on desktop). */
  open: boolean;
  onNavigate: () => void;
}

export default function Sidebar({ open, onNavigate }: SidebarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [changingPassword, setChangingPassword] = useState(false);
  const admin = isAdmin(getSession());

  const go = (path: string) => {
    navigate(path);
    onNavigate();
  };

  const handleLogout = () => {
    clearSession();
    navigate('/login', { replace: true });
  };

  return (
    <>
    <aside className={`sidebar${open ? ' open' : ''}`}>
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <GraduationCap size={20} color="#a5b4fc" />
          <h2>LearnifyAnalytics</h2>
        </div>
        <span>Student Management System</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.filter(item => admin || !item.adminOnly).map(({ path, icon: Icon, label }) => (
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
        <button className="nav-item" onClick={() => setChangingPassword(true)}>
          <KeyRound size={16} />
          Change Password
        </button>
        <button className="nav-item" onClick={handleLogout} style={{ color: '#fca5a5' }}>
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
    {changingPassword && <ChangePasswordModal onClose={() => setChangingPassword(false)} />}
    </>
  );
}
