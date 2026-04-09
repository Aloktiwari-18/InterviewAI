import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Menu, X, Zap, LogOut, User, LayoutDashboard, Mic, FileText, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function Navbar({ isLanding = false }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = user ? [
    { to: '/dashboard', icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
    { to: '/interview', icon: <Mic size={16} />, label: 'Interview' },
    { to: '/resume', icon: <FileText size={16} />, label: 'Resume' },
    { to: '/history', icon: <Clock size={16} />, label: 'History' },
  ] : [
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How it Works' },
    { href: '#testimonials', label: 'Testimonials' },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || !isLanding ? 'glass shadow-lg shadow-black/20' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--brand))' }}>
            <Zap size={16} color="white" fill="white" />
          </div>
          <span className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
            Interview<span className="gradient-text">AI</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) =>
            link.to ? (
              <Link key={link.to} to={link.to}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === link.to
                    ? 'text-accent-DEFAULT bg-indigo-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                style={{ color: location.pathname === link.to ? 'var(--accent)' : undefined }}
              >
                {link.icon}{link.label}
              </Link>
            ) : (
              <a key={link.href} href={link.href}
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white transition-all hover:bg-white/5">
                {link.label}
              </a>
            )
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
            style={{ color: 'var(--text-secondary)' }}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:bg-white/10"
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg, var(--accent), var(--brand))' }}>
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-medium hidden sm:block" style={{ color: 'var(--text-primary)' }}>
                  {user.name?.split(' ')[0]}
                </span>
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    className="absolute right-0 mt-2 w-48 card p-2 shadow-xl"
                    onBlur={() => setProfileOpen(false)}
                  >
                    <div className="px-3 py-2 border-b mb-1" style={{ borderColor: 'var(--border)' }}>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
                    </div>
                    <button onClick={() => { logout(); setProfileOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all">
                      <LogOut size={14} /> Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/login" className="btn-secondary text-sm py-2 px-4">Log in</Link>
              <Link to="/register" className="btn-primary text-sm py-2 px-4">Get started</Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ color: 'var(--text-primary)' }}
            onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) =>
                link.to ? (
                  <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm">
                    {link.icon}{link.label}
                  </Link>
                ) : (
                  <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {link.label}
                  </a>
                )
              )}
              {!user && (
                <div className="flex flex-col gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                  <Link to="/login" className="btn-secondary text-center text-sm" onClick={() => setMenuOpen(false)}>Log in</Link>
                  <Link to="/register" className="btn-primary text-center text-sm" onClick={() => setMenuOpen(false)}>Get started</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
