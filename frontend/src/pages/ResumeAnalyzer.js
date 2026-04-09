import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, CheckCircle, XCircle, AlertCircle,
  TrendingUp, Target, Zap, Download, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import DashboardLayout from '../components/shared/DashboardLayout';
import ScoreCircle from '../components/shared/ScoreCircle';
import { resumeAPI } from '../utils/api';
import toast from 'react-hot-toast';

function SectionCheck({ label, present }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${present ? 'badge-green' : 'badge-red'}`}>
      {present ? <CheckCircle size={14} /> : <XCircle size={14} />}
      {label}
    </div>
  );
}

function KeywordTag({ word, type }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
      type === 'match' ? 'badge-green' : 'badge-red'
    }`}>
      {type === 'match' ? <CheckCircle size={10} /> : <XCircle size={10} />}
      {word}
    </span>
  );
}

export default function ResumeAnalyzer() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [fileName, setFileName] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showRewrite, setShowRewrite] = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setUploading(true);
    setFileName(file.name);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const { data } = await resumeAPI.upload(formData);
      setResumeText(data.resumeText || '');
      toast.success(`Uploaded: ${file.name}`);
    } catch (err) {
      toast.error('Upload failed. Try pasting resume text.');
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    maxSize: 5 * 1024 * 1024,
    multiple: false
  });

  const handleAnalyze = async () => {
    if (!resumeText.trim()) { toast.error('Please upload a resume or paste resume text'); return; }
    setLoading(true);
    try {
      const { data } = await resumeAPI.analyze({ resumeText, jobDescription, fileName });
      setAnalysis(data);
      toast.success('Analysis complete!');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => { setAnalysis(null); setResumeText(''); setJobDescription(''); setFileName(''); };

  const sectionLabels = {
    hasContact: 'Contact Info', hasSummary: 'Summary/Objective',
    hasExperience: 'Work Experience', hasEducation: 'Education',
    hasSkills: 'Skills Section', hasProjects: 'Projects'
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Resume Analyzer</h1>
            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>ATS scoring + job description matching powered by AI</p>
          </div>
          {analysis && (
            <button onClick={handleReset} className="btn-secondary flex items-center gap-2 text-sm">
              <RefreshCw size={14} /> New Analysis
            </button>
          )}
        </div>

        {!analysis ? (
          <div className="space-y-6">
            {/* Upload zone */}
            <div {...getRootProps()} className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
              isDragActive ? 'border-accent-DEFAULT bg-indigo-500/5' : ''
            }`} style={{ borderColor: isDragActive ? 'var(--accent)' : 'var(--border)' }}>
              <input {...getInputProps()} />
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)' }}>
                {uploading ? <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)' }} /> : <Upload size={28} />}
              </div>
              <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                {uploading ? 'Uploading...' : isDragActive ? 'Drop it here!' : 'Drop your resume here'}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>PDF or TXT · Max 5MB</p>
              {fileName && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm badge-blue">
                  <FileText size={14} /> {fileName}
                </div>
              )}
            </div>

            {/* Paste text */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                Or paste resume text
              </label>
              <textarea className="input min-h-[140px] resize-y" placeholder="Paste your resume content here..."
                value={resumeText} onChange={e => setResumeText(e.target.value)} />
            </div>

            {/* Job description */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                Job Description <span className="text-xs font-normal">(optional but recommended)</span>
              </label>
              <textarea className="input min-h-[120px] resize-y" placeholder="Paste the job description for matching analysis..."
                value={jobDescription} onChange={e => setJobDescription(e.target.value)} />
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleAnalyze} disabled={loading || !resumeText}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base">
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing Resume...</>
              ) : (
                <><Zap size={18} /> Analyze with AI</>
              )}
            </motion.button>
          </div>
        ) : (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Score cards */}
              <div className="card p-8">
                <h2 className="font-display font-semibold text-xl mb-8 text-center" style={{ color: 'var(--text-primary)' }}>
                  Analysis Results
                </h2>
                <div className="flex flex-wrap justify-center gap-10">
                  {[
                    { label: 'ATS Score', score: analysis.scores?.ats, color: '#6366f1' },
                    { label: 'Job Match', score: analysis.scores?.jobMatch, color: '#0ea5e9' },
                    { label: 'Keywords', score: analysis.scores?.keywords, color: '#10b981' },
                    { label: 'Format', score: analysis.scores?.formatting, color: '#f59e0b' },
                    { label: 'Overall', score: analysis.scores?.overall, color: '#ec4899' },
                  ].map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}>
                      <ScoreCircle score={s.score || 0} label={s.label} color={s.color} />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Section checker */}
              <div className="card p-6">
                <h3 className="font-display font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Resume Sections</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(analysis.sections || {}).map(([key, val]) => (
                    <SectionCheck key={key} label={sectionLabels[key] || key} present={val} />
                  ))}
                </div>
              </div>

              {/* Keywords */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="card p-6">
                  <h3 className="font-display font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <CheckCircle size={16} style={{ color: '#10b981' }} /> Matched Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(analysis.analysis?.matchedKeywords || []).map((k, i) => (
                      <KeywordTag key={i} word={k} type="match" />
                    ))}
                    {!analysis.analysis?.matchedKeywords?.length && (
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No matches found</p>
                    )}
                  </div>
                </div>
                <div className="card p-6">
                  <h3 className="font-display font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <XCircle size={16} style={{ color: '#ef4444' }} /> Missing Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(analysis.analysis?.missingKeywords || []).map((k, i) => (
                      <KeywordTag key={i} word={k} type="missing" />
                    ))}
                    {!analysis.analysis?.missingKeywords?.length && (
                      <p className="text-sm" style={{ color: '#10b981' }}>No missing keywords! Great job.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              {analysis.analysis?.suggestions?.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-display font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Target size={16} style={{ color: 'var(--accent)' }} /> Improvement Suggestions
                  </h3>
                  <div className="space-y-3">
                    {analysis.analysis.suggestions.map((s, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3 p-3 rounded-xl"
                        style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99,102,241,0.1)' }}>
                        <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                          style={{ background: 'var(--accent)', color: 'white' }}>{i + 1}</span>
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Rewrite */}
              {analysis.analysis?.rewrittenSummary && (
                <div className="card p-6">
                  <button onClick={() => setShowRewrite(!showRewrite)}
                    className="w-full flex items-center justify-between">
                    <h3 className="font-display font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <Zap size={16} style={{ color: '#f59e0b' }} /> AI-Rewritten Summary
                    </h3>
                    {showRewrite ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <AnimatePresence>
                    {showRewrite && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} className="mt-4 overflow-hidden">
                        <div className="p-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
                          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            {analysis.analysis.rewrittenSummary}
                          </p>
                        </div>
                        <button className="btn-secondary mt-3 text-sm flex items-center gap-2"
                          onClick={() => navigator.clipboard.writeText(analysis.analysis.rewrittenSummary)}>
                          Copy to clipboard
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </DashboardLayout>
  );
}
