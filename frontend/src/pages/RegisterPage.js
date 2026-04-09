import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const perks = [
  '15 free AI interviews per month',
  'Full ATS resume analysis',
  'Detailed feedback reports',
  'Interview history & tracking',
];

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! Welcome to InterviewAI 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.error || err || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const strength = form.password.length >= 8 ? 'strong' : form.password.length >= 6 ? 'medium' : 'weak';
  const strengthColor = { strong: '#10b981', medium: '#f59e0b', weak: '#ef4444' };
  const strengthWidth = { strong: '100%', medium: '60%', weak: '30%' };

  return (
    <div className="min-h-screen flex grid-bg" style={{ background: 'var(--bg-primary)' }}>
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(14,165,233,0.05))' }}>
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #0ea5e9, transparent)' }} />
        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-4xl font-bold mb-4 gradient-text">Start free. Grow fast.</h2>
          <p className="text-lg mb-10 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Get instant access to all interview prep tools. No credit card required.
          </p>
          <div className="space-y-4">
            {perks.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 + 0.3 }}
                className="flex items-center gap-3">
                <CheckCircle size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                <span style={{ color: 'var(--text-secondary)' }}>{p}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--brand))' }}>
              <Zap size={16} color="white" fill="white" />
            </div>
            <span className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
              Interview<span className="gradient-text">AI</span>
            </span>
          </Link>

          <h1 className="font-display text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Create your account</h1>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
            Already have one? <Link to="/login" style={{ color: 'var(--accent)' }} className="font-medium">Sign in</Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Full name</label>
              <input type="text" className="input" placeholder="John Doe"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <input type="email" className="input" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input pr-12"
                  placeholder="At least 6 characters"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2">
                  <div className="progress-bar mt-1">
                    <div className="progress-fill" style={{ width: strengthWidth[strength], background: strengthColor[strength] }} />
                  </div>
                  <p className="text-xs mt-1 capitalize" style={{ color: strengthColor[strength] }}>
                    {strength} password
                  </p>
                </div>
              )}
            </div>

            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><span>Create account</span><ArrowRight size={16} /></>
              )}
            </motion.button>
          </form>

          <p className="text-xs text-center mt-6" style={{ color: 'var(--text-secondary)' }}>
            By creating an account, you agree to our{' '}
            <a href="#" style={{ color: 'var(--accent)' }}>Terms</a> and{' '}
            <a href="#" style={{ color: 'var(--accent)' }}>Privacy Policy</a>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
