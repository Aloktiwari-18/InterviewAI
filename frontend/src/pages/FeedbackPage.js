import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle, XCircle, TrendingUp, MessageSquare,
  ChevronDown, ChevronUp, Download, ArrowLeft, Award
} from 'lucide-react';
import DashboardLayout from '../components/shared/DashboardLayout';
import ScoreCircle from '../components/shared/ScoreCircle';
import { feedbackAPI } from '../utils/api';

function ScoreBar({ label, score, color }) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span className="text-sm font-bold" style={{ color }}>{score}%</span>
      </div>
      <div className="progress-bar">
        <motion.div className="progress-fill" initial={{ width: 0 }}
          animate={{ width: `${score}%` }} transition={{ duration: 1, delay: 0.3 }}
          style={{ background: color }} />
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedAnswer, setExpandedAnswer] = useState(null);

  useEffect(() => {
    feedbackAPI.getInterview(id)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    </DashboardLayout>
  );

  if (!data) return (
    <DashboardLayout>
      <div className="text-center py-20">
        <p style={{ color: 'var(--text-secondary)' }}>Feedback not found</p>
        <Link to="/history" className="btn-primary mt-4 inline-block">View History</Link>
      </div>
    </DashboardLayout>
  );

  const { scores, feedback, answers, jobTitle, completedAt } = data;
  const overallScore = scores?.overall || 0;
  const verdictColor = overallScore >= 75 ? '#10b981' : overallScore >= 55 ? '#f59e0b' : '#ef4444';
  const verdictLabel = overallScore >= 75 ? 'Strong Hire' : overallScore >= 55 ? 'Consider' : 'Needs Work';

  const downloadReport = () => {
    const report = `
INTERVIEW FEEDBACK REPORT
=========================
Job Title: ${jobTitle}
Date: ${new Date(completedAt).toLocaleDateString()}

SCORES
------
Overall: ${scores?.overall}%
Communication: ${scores?.communication}%
Technical: ${scores?.technical}%
Confidence: ${scores?.confidence}%
Relevance: ${scores?.relevance}%

VERDICT: ${feedback?.verdict}

SUMMARY
-------
${feedback?.summary}

STRENGTHS
---------
${(feedback?.strengths || []).map(s => '• ' + s).join('\n')}

AREAS FOR IMPROVEMENT
---------------------
${(feedback?.weaknesses || []).map(w => '• ' + w).join('\n')}

IMPROVEMENT TIPS
----------------
${(feedback?.improvements || []).map(i => '• ' + i).join('\n')}

Q&A REVIEW
----------
${(answers || []).map((a, i) => `Q${i+1}: ${a.question}\nYour Answer: ${a.answer}\nScore: ${a.score || 0}%\nSample Answer: ${a.sampleAnswer || 'N/A'}\n`).join('\n')}
    `;
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `interview-feedback-${id}.txt`; a.click();
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/history" className="flex items-center gap-2 text-sm mb-3 hover:text-white transition-colors"
              style={{ color: 'var(--text-secondary)' }}>
              <ArrowLeft size={14} /> Back to history
            </Link>
            <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Interview Feedback</h1>
            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
              {jobTitle} · {completedAt ? new Date(completedAt).toLocaleDateString() : 'Just now'}
            </p>
          </div>
          <button onClick={downloadReport} className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={14} /> Download Report
          </button>
        </div>

        {/* Verdict banner */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="card p-6 mb-6 flex items-center gap-4"
          style={{ border: `1px solid ${verdictColor}30`, background: `${verdictColor}08` }}>
          <Award size={32} style={{ color: verdictColor, flexShrink: 0 }} />
          <div className="flex-1">
            <p className="font-display font-bold text-2xl" style={{ color: verdictColor }}>
              {verdictLabel}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{feedback?.verdict}</p>
          </div>
          <div className="text-right">
            <p className="font-display font-bold text-4xl" style={{ color: verdictColor }}>{overallScore}%</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Overall Score</p>
          </div>
        </motion.div>

        {/* Score circles */}
        <div className="card p-8 mb-6">
          <h2 className="font-display font-semibold text-lg mb-8 text-center" style={{ color: 'var(--text-primary)' }}>
            Detailed Scores
          </h2>
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            {[
              { label: 'Communication', score: scores?.communication, color: '#6366f1' },
              { label: 'Technical', score: scores?.technical, color: '#0ea5e9' },
              { label: 'Confidence', score: scores?.confidence, color: '#10b981' },
              { label: 'Relevance', score: scores?.relevance, color: '#f59e0b' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}>
                <ScoreCircle score={s.score || 0} label={s.label} color={s.color} size={110} />
              </motion.div>
            ))}
          </div>
          <div className="space-y-4 max-w-lg mx-auto">
            <ScoreBar label="Communication" score={scores?.communication || 0} color="#6366f1" />
            <ScoreBar label="Technical Depth" score={scores?.technical || 0} color="#0ea5e9" />
            <ScoreBar label="Confidence" score={scores?.confidence || 0} color="#10b981" />
            <ScoreBar label="Answer Relevance" score={scores?.relevance || 0} color="#f59e0b" />
          </div>
        </div>

        {/* Feedback cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="card p-5">
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2 text-sm" style={{ color: '#10b981' }}>
              <CheckCircle size={16} /> Strengths
            </h3>
            <ul className="space-y-2">
              {(feedback?.strengths || []).map((s, i) => (
                <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <span className="text-green-400 mt-1 flex-shrink-0">•</span>{s}
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-5">
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2 text-sm" style={{ color: '#ef4444' }}>
              <XCircle size={16} /> Weaknesses
            </h3>
            <ul className="space-y-2">
              {(feedback?.weaknesses || []).map((w, i) => (
                <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <span className="text-red-400 mt-1 flex-shrink-0">•</span>{w}
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-5">
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2 text-sm" style={{ color: 'var(--accent)' }}>
              <TrendingUp size={16} /> Improvements
            </h3>
            <ul className="space-y-2">
              {(feedback?.improvements || []).map((imp, i) => (
                <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--accent)', flexShrink: 0 }} className="mt-1">→</span>{imp}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Summary */}
        {feedback?.summary && (
          <div className="card p-6 mb-6">
            <h3 className="font-display font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <MessageSquare size={16} style={{ color: 'var(--accent)' }} /> AI Summary
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{feedback.summary}</p>
          </div>
        )}

        {/* Q&A Review */}
        <div className="card p-6">
          <h3 className="font-display font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Question-by-Question Review ({answers?.length || 0} questions)
          </h3>
          <div className="space-y-3">
            {(answers || []).map((a, i) => (
              <div key={i} className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                <button onClick={() => setExpandedAnswer(expandedAnswer === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent)' }}>{i + 1}</span>
                    <span className="text-sm font-medium line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                      {a.question}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold" style={{
                      color: (a.score || 0) >= 70 ? '#10b981' : (a.score || 0) >= 50 ? '#f59e0b' : '#ef4444'
                    }}>{a.score || 0}%</span>
                    {expandedAnswer === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </button>
                {expandedAnswer === i && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }}
                    className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <div className="p-4 space-y-3">
                      <div>
                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Your Answer</p>
                        <p className="text-sm p-3 rounded-xl" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                          {a.answer || 'No answer provided'}
                        </p>
                      </div>
                      {a.sampleAnswer && (
                        <div>
                          <p className="text-xs font-semibold mb-1" style={{ color: '#10b981' }}>✨ Sample Answer</p>
                          <p className="text-sm p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--text-secondary)' }}>
                            {a.sampleAnswer}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <Link to="/interview" className="btn-primary flex items-center gap-2">Practice Again</Link>
          <Link to="/resume" className="btn-secondary flex items-center gap-2">Improve Resume</Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
