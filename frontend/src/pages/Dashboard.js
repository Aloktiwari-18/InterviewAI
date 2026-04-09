import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, FileText, Clock, TrendingUp, ArrowRight, BarChart2, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import DashboardLayout from '../components/shared/DashboardLayout';
import ScoreCircle from '../components/shared/ScoreCircle';
import { useAuth } from '../context/AuthContext';
import { feedbackAPI } from '../utils/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    feedbackAPI.getDashboard()
      .then(r => setDashData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const quickActions = [
    { to: '/interview', icon: <Mic size={20} />, label: 'New Interview', desc: 'Start AI mock interview', color: '#6366f1' },
    { to: '/resume', icon: <FileText size={20} />, label: 'Analyze Resume', desc: 'ATS score + job match', color: '#0ea5e9' },
    { to: '/history', icon: <Clock size={20} />, label: 'View History', desc: 'Past sessions & scores', color: '#10b981' },
  ];

  const stats = dashData?.stats || {};

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </motion.h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          Ready to practice? Here's your interview prep dashboard.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Interviews Done', value: stats.totalInterviews || 0, icon: <Mic size={18} />, color: '#6366f1' },
          { label: 'Avg Score', value: `${stats.averageScore || 0}%`, icon: <BarChart2 size={18} />, color: '#0ea5e9' },
          { label: 'Resumes Analyzed', value: stats.totalAnalyses || 0, icon: <FileText size={18} />, color: '#10b981' },
          { label: 'Best Score', value: `${user?.stats?.bestScore || 0}%`, icon: <TrendingUp size={18} />, color: '#f59e0b' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${s.color}18`, color: s.color }}>
                {s.icon}
              </div>
            </div>
            <p className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="font-display font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {quickActions.map((a, i) => (
            <motion.div key={i} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}>
              <Link to={a.to} className="card p-5 flex items-center gap-4 hover:border-current group"
                style={{ '--card-color': a.color }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                  style={{ background: `${a.color}18`, color: a.color }}>
                  {a.icon}
                </div>
                <div className="flex-1">
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{a.label}</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{a.desc}</p>
                </div>
                <ArrowRight size={16} style={{ color: 'var(--text-secondary)' }} />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Interviews */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Interviews</h3>
            <Link to="/history" className="text-sm" style={{ color: 'var(--accent)' }}>View all</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
              ))}
            </div>
          ) : dashData?.recentInterviews?.length ? (
            <div className="space-y-3">
              {dashData.recentInterviews.slice(0,4).map((iv, i) => (
                <Link key={i} to={`/feedback/${iv._id}`}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)' }}>
                    <Mic size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{iv.jobTitle}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(iv.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm" style={{ color: iv.scores?.overall >= 70 ? '#10b981' : '#f59e0b' }}>
                      {iv.scores?.overall || 0}%
                    </span>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>score</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Mic size={32} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-secondary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No interviews yet</p>
              <Link to="/interview" className="btn-primary text-sm mt-3 inline-flex items-center gap-2">
                <Plus size={14} /> Start first interview
              </Link>
            </div>
          )}
        </div>

        {/* Recent Analyses */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-semibold" style={{ color: 'var(--text-primary)' }}>Resume Analyses</h3>
            <Link to="/resume" className="text-sm" style={{ color: 'var(--accent)' }}>New analysis</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
              ))}
            </div>
          ) : dashData?.recentAnalyses?.length ? (
            <div className="space-y-3">
              {dashData.recentAnalyses.slice(0,4).map((a, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' }}>
                    <FileText size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {a.fileName || 'Resume'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm" style={{ color: a.scores?.overall >= 70 ? '#10b981' : '#f59e0b' }}>
                      {a.scores?.overall || 0}%
                    </span>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>ATS</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText size={32} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-secondary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No analyses yet</p>
              <Link to="/resume" className="btn-primary text-sm mt-3 inline-flex items-center gap-2">
                <Plus size={14} /> Analyze resume
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
