import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Zap, Mic, FileText, BarChart2, Shield, Star,
  CheckCircle, ArrowRight, Play, ChevronRight,
  Brain, Target, TrendingUp, Award, Users, Clock
} from 'lucide-react';
import Navbar from '../components/shared/Navbar';

const features = [
  {
    icon: <Mic size={24} />, title: 'AI Mock Interviews',
    desc: 'Practice interviews with AI powered by Llama 3.1. Get real-time feedback on your answers, tone, and technical accuracy.',
    color: '#6366f1'
  },
  {
    icon: <FileText size={24} />, title: 'ATS Resume Analysis',
    desc: 'Check your resume against job descriptions. See your ATS score and identify missing keywords that matter.',
    color: '#0ea5e9'
  },
  {
    icon: <BarChart2 size={24} />, title: 'Performance Insights',
    desc: 'Get detailed scores on communication, confidence, and technical knowledge. Track improvement over time.',
    color: '#10b981'
  },
  {
    icon: <Brain size={24} />, title: 'AI Feedback',
    desc: 'Receive specific suggestions to improve weak areas. Get sample answers and tips for better responses.',
    color: '#f59e0b'
  },
  {
    icon: <Target size={24} />, title: 'Job Matching',
    desc: 'See which skills you need to learn for your target role. Get gap analysis based on real job descriptions.',
    color: '#ec4899'
  },
  {
    icon: <Shield size={24} />, title: 'Secure & Private',
    desc: 'Your data is encrypted. We never sell your information or share it with anyone. Your privacy matters.',
    color: '#8b5cf6'
  },
];

const steps = [
  { n: '01', title: 'Upload Your Resume', desc: 'Drop in your PDF resume. Our AI parses it instantly.', icon: <FileText size={20} /> },
  { n: '02', title: 'Choose Your Role', desc: 'Select the job title and paste the job description.', icon: <Target size={20} /> },
  { n: '03', title: 'Start AI Interview', desc: 'Answer questions via voice. AI listens and evaluates.', icon: <Mic size={20} /> },
  { n: '04', title: 'Get Your Report', desc: 'Receive scores, strengths, weaknesses and sample answers.', icon: <BarChart2 size={20} /> },
];

const stats = [
  { val: '50K+', label: 'Interviews Practiced', icon: <Mic size={18} /> },
  { val: '89%', label: 'Offer Rate Improvement', icon: <TrendingUp size={18} /> },
  { val: '200+', label: 'Job Roles Covered', icon: <Award size={18} /> },
  { val: '4.9★', label: 'User Rating', icon: <Star size={18} /> },
];

function FadeIn({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}>
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const [typedText, setTypedText] = useState('');
  const phrases = ['Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer', 'DevOps Engineer'];
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    let i = 0;
    const phrase = phrases[phraseIdx];
    const interval = setInterval(() => {
      setTypedText(phrase.slice(0, i + 1));
      i++;
      if (i === phrase.length) {
        clearInterval(interval);
        setTimeout(() => {
          setPhraseIdx((p) => (p + 1) % phrases.length);
          setTypedText('');
        }, 2000);
      }
    }, 80);
    return () => clearInterval(interval);
  }, [phraseIdx]);

  return (
    <div className="min-h-screen noise" style={{ background: 'var(--bg-primary)' }}>
      <Navbar isLanding />

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 grid-bg">
        {/* Background blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse-slow"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-15 animate-pulse-slow"
          style={{ background: 'radial-gradient(circle, #0ea5e9, transparent)', animationDelay: '2s' }} />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8"
              style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', color: 'var(--accent-light)' }}>
              <Zap size={14} fill="currentColor" /> Powered by Llama 3.1 · LangChain · LangGraph
            </span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6"
            style={{ color: 'var(--text-primary)' }}>
            Ace Your Next<br />
            <span className="gradient-text">
              {typedText}
              <span className="typing-cursor" />
            </span><br />
            Interview
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}>
            AI-powered mock interviews with voice + camera, ATS resume scoring,
            and real-time feedback. Land your dream job faster.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-primary flex items-center gap-2 text-base px-8 py-4">
              Start for Free <ArrowRight size={18} />
            </Link>
            <a href="#how-it-works" className="btn-secondary flex items-center gap-2 text-base px-8 py-4">
              <Play size={16} fill="currentColor" /> See how it works
            </a>
          </motion.div>

          {/* Social proof */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-4 mt-10">
            <div className="flex -space-x-2">
              {['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899'].map((c, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: c, borderColor: 'var(--bg-primary)' }}>
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Hero visual */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4"
          style={{ bottom: '-2px' }}
        >
          <div className="glass rounded-t-2xl p-6 border-b-0"
            style={{ borderColor: 'var(--border)', background: 'rgba(26, 34, 53, 0.8)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="text-xs ml-2" style={{ color: 'var(--text-secondary)' }}>AI Interview Session — Software Engineer @ Google</span>
            </div>
            <div className="flex gap-4 items-start">
              <div className="flex-1 p-4 rounded-xl" style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--accent)' }}>AI Question</p>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>Describe a challenging system design problem you solved. How did you ensure scalability?</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                <div className="recording-dot" /> REC
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* STATS */}
      <section className="py-16 border-y" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <FadeIn key={i} delay={i * 0.1} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2" style={{ color: 'var(--accent)' }}>
                  {s.icon}
                </div>
                <p className="text-3xl font-bold font-display gradient-text">{s.val}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{s.label}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-4">
        <FadeIn className="text-center mb-16">
          <span className="badge badge-purple mb-4">Features</span>
          <h2 className="font-display text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Everything you need to land the job
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            From AI-powered practice to ATS optimization — a complete interview prep ecosystem.
          </p>
        </FadeIn>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <motion.div whileHover={{ y: -4 }} className="card p-6 h-full group cursor-default">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ background: `${f.color}18`, color: f.color }}>
                  {f.icon}
                </div>
                <h3 className="font-display font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 border-y" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
        <div className="max-w-5xl mx-auto px-4">
          <FadeIn className="text-center mb-16">
            <span className="badge badge-blue mb-4">Process</span>
            <h2 className="font-display text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              From signup to offer in 4 steps
            </h2>
          </FadeIn>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <FadeIn key={i} delay={i * 0.15}>
                <div className="relative">
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-6 left-full w-full h-px"
                      style={{ background: 'linear-gradient(90deg, var(--accent), transparent)', zIndex: 0 }} />
                  )}
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: 'linear-gradient(135deg, var(--accent), var(--brand))' }}>
                      <span className="text-white">{s.icon}</span>
                    </div>
                    <span className="text-xs font-mono font-bold" style={{ color: 'var(--accent)' }}>{s.n}</span>
                    <h3 className="font-display font-semibold mt-1 mb-2" style={{ color: 'var(--text-primary)' }}>{s.title}</h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* WHY THIS PROJECT */}
      <section id="why-this" className="py-24 max-w-6xl mx-auto px-4">
        <FadeIn className="text-center mb-16">
          <span className="badge badge-green mb-4">Why this project?</span>
          <h2 className="font-display text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Built to solve real interview problems
          </h2>
          <p className="text-lg mt-4 max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            This platform is designed based on real challenges faced during interview preparation — not assumptions.
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6">

          <FadeIn delay={0.1}>
            <motion.div whileHover={{ y: -4 }} className="card p-6">
              <div className="mb-3 text-indigo-400">
                <Mic size={20} />
              </div>
              <h3 className="font-semibold mb-2">Practice Like It's Real</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Voice + video interviews with AI asking real technical and behavioral questions.
              </p>
            </motion.div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <motion.div whileHover={{ y: -4 }} className="card p-6">
              <div className="mb-3 text-blue-400">
                <BarChart2 size={20} />
              </div>
              <h3 className="font-semibold mb-2">See Your Progress</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Track scores, watch recordings, and see exactly where you're improving.
              </p>
            </motion.div>
          </FadeIn>

          <FadeIn delay={0.3}>
            <motion.div whileHover={{ y: -4 }} className="card p-6">
              <div className="mb-3 text-green-400">
                <Brain size={20} />
              </div>
              <h3 className="font-semibold mb-2">Get Better Answers</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                AI gives you honest feedback and sample answers to help you improve.
              </p>
            </motion.div>
          </FadeIn>

        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ background: 'radial-gradient(ellipse at center, var(--accent) 0%, transparent 70%)' }} />
        <FadeIn className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            Get better at interviews
          </h2>
          <p className="text-lg mb-10" style={{ color: 'var(--text-secondary)' }}>
            Practice with AI, get real feedback, improve your skills. Start free today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary flex items-center justify-center gap-2 text-base px-10 py-4">
              Start Free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-secondary flex items-center justify-center gap-2 text-base px-10 py-4">
              Sign In
            </Link>
          </div>
          <p className="text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
            No credit card needed · Free plan available · 3 free interviews to start
          </p>
        </FadeIn>
      </section>

      {/* FOOTER */}
      <footer className="border-t py-12" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--brand))' }}>
              <Zap size={12} color="white" fill="white" />
            </div>
            <span className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>InterviewAI</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            © 2026 InterviewAI. Built with ❤️ using MERN + Llama 3.1
          </p>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Contact'].map(l => (
              <a key={l} href="#" className="text-sm transition-colors hover:text-white"
                style={{ color: 'var(--text-secondary)' }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
