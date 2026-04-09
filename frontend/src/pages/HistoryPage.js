import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, FileText, Clock, BarChart2, ChevronRight, Calendar } from 'lucide-react';
import DashboardLayout from '../components/shared/DashboardLayout';
import { interviewAPI, resumeAPI } from '../utils/api';

function ScorePill({ score }) {
  const color = score >= 75 ? '#10b981' : score >= 55 ? '#f59e0b' : '#ef4444';
  return (
    <span className="font-bold text-sm px-3 py-1 rounded-full"
      style={{ background: `${color}18`, color }}>
      {score}%
    </span>
  );
}

export default function HistoryPage() {
  const [interviews, setInterviews] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [tab, setTab] = useState('interviews');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      interviewAPI.getHistory(),
      resumeAPI.getHistory()
    ]).then(([iv, rv]) => {
      setInterviews(iv.data.interviews || []);
      setAnalyses(rv.data.analyses || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>History</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>All your past sessions and analyses</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-secondary)' }}>
          {[
            { key: 'interviews', label: 'Interviews', icon: <Mic size={14} />, count: interviews.length },
            { key: 'analyses', label: 'Resume Analyses', icon: <FileText size={14} />, count: analyses.length },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: tab === t.key ? 'var(--bg-card)' : 'transparent',
                color: tab === t.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: tab === t.key ? '1px solid var(--border)' : '1px solid transparent'
              }}>
              {t.icon} {t.label}
              <span className="px-1.5 py-0.5 rounded-full text-xs" style={{ background: 'var(--bg-secondary)' }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
            ))}
          </div>
        ) : tab === 'interviews' ? (
          interviews.length ? (
            <div className="space-y-3">
              {interviews.map((iv, i) => (
                <motion.div key={iv._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}>
                  <Link to={`/feedback/${iv._id}`}
                    className="card p-5 flex items-center gap-4 hover:border-indigo-500/40 group">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)' }}>
                      <Mic size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{iv.jobTitle}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <Calendar size={11} /> {new Date(iv.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <Clock size={11} /> {iv.duration ? `${Math.floor(iv.duration / 60)}m` : 'N/A'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                          iv.status === 'completed' ? 'badge-green' : 'badge-blue'
                        }`}>{iv.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {iv.scores?.overall !== undefined && <ScorePill score={iv.scores.overall} />}
                      <ChevronRight size={16} style={{ color: 'var(--text-secondary)' }}
                        className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Mic size={40} className="mx-auto mb-4 opacity-20" style={{ color: 'var(--text-secondary)' }} />
              <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No interviews yet</p>
              <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Start your first AI mock interview</p>
              <Link to="/interview" className="btn-primary inline-flex items-center gap-2">
                <Mic size={16} /> Start Interview
              </Link>
            </div>
          )
        ) : (
          analyses.length ? (
            <div className="space-y-3">
              {analyses.map((a, i) => (
                <motion.div key={a._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}>
                  <div className="card p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' }}>
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {a.fileName || 'Resume'}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <Calendar size={11} /> {new Date(a.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          Job Match: {a.scores?.jobMatch || 0}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {a.scores?.overall !== undefined && <ScorePill score={a.scores.overall} />}
                      <BarChart2 size={16} style={{ color: 'var(--text-secondary)' }} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <FileText size={40} className="mx-auto mb-4 opacity-20" style={{ color: 'var(--text-secondary)' }} />
              <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No analyses yet</p>
              <Link to="/resume" className="btn-primary inline-flex items-center gap-2">
                <FileText size={16} /> Analyze Resume
              </Link>
            </div>
          )
        )}
      </div>
    </DashboardLayout>
  );
}
