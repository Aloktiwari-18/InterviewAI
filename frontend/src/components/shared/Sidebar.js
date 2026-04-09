import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Mic, FileText, Clock, LogOut,
  Zap, Sun, Moon, ChevronRight, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/interview', icon: Mic, label: 'AI Interview' },
  { to: '/resume', icon: FileText, label: 'Resume AI' },
  { to: '/history', icon: Clock, label: 'History' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="w-64 min-h-screen flex flex-col py-6 px-4 border-r"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 px-2 mb-8">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--brand))' }}>
          <Zap size={16} color="white" fill="white" />
        </div>
        <span className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
          Interview<span className="gradient-text">AI</span>
        </span>
      </Link>

      {/* User */}
      <div className="flex items-center gap-3 px-2 py-3 rounded-xl mb-6"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--brand))' }}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
          <span className="badge badge-purple text-xs capitalize">{user?.plan || 'free'}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider px-2 mb-3"
          style={{ color: 'var(--text-secondary)' }}>Menu</p>
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
          return (
            <motion.div key={to} whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}>
              <Link to={to} className={`sidebar-link ${isActive ? 'active' : ''}`}>
                <Icon size={18} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={14} />}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Stats card */}
      {user?.stats && (
        <div className="my-4 p-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} style={{ color: 'var(--accent)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Your Progress</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center">
              <p className="text-lg font-bold gradient-text">{user.stats.totalInterviews}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Interviews</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold gradient-text">{user.stats.bestScore || 0}%</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Best Score</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom actions */}
      <div className="space-y-1 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
        <button onClick={toggleTheme}
          className="sidebar-link w-full">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button onClick={logout}
          className="sidebar-link w-full text-red-400 hover:bg-red-500/10">
          <LogOut size={18} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
