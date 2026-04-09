import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Zap, ArrowRight, Mic } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back! 👋');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.error || err || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex grid-bg" style={{ background: 'var(--bg-primary)' }}>
      {/* Left side - visual */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(14,165,233,0.05))' }}>
        <div className="absolute top-1/3 left-1/3 w-80 h-80 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="relative z-10 text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--brand))' }}>
            <Mic size={40} color="white" />
          </div>
          <h2 className="font-display text-4xl font-bold mb-4 gradient-text">Practice. Improve. Succeed.</h2>
          <p className="text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Join 50,000+ candidates using AI-powered interviews to land their dream jobs.
          </p>
          <div className="mt-10 space-y-4 text-left">
            {['AI interviews tailored to your role', 'Real-time voice & feedback', 'ATS resume scoring in seconds'].map((t, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                  <span style={{ color: '#10b981', fontSize: 12 }}>✓</span>
                </div>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--brand))' }}>
              <Zap size={16} color="white" fill="white" />
            </div>
            <span className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
              Interview<span className="gradient-text">AI</span>
            </span>
          </Link>

          <h1 className="font-display text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Welcome back</h1>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
            Don't have an account? <Link to="/register" className="font-medium" style={{ color: 'var(--accent)' }}>Sign up free</Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <input
                type="email" className="input" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                required autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} className="input pr-12"
                  placeholder="Your password"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  required autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: 'var(--text-secondary)' }}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit" disabled={loading}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><span>Sign in</span><ArrowRight size={16} /></>
              )}
            </motion.button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'var(--border)' }} />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs" style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
                Demo credentials
              </span>
            </div>
          </div>

          <button
            onClick={() => setForm({ email: 'demo@interviewai.com', password: 'demo123' })}
            className="btn-secondary w-full text-sm"
          >
            Use demo account
          </button>
        </motion.div>
      </div>
    </div>
  );
}
