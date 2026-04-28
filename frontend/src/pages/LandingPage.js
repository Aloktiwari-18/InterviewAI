import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Zap, Mic, FileText, BarChart2, Shield, Star,
  CheckCircle, ArrowRight, Play, ChevronRight,
  Brain, Target, TrendingUp, Award, Users, Clock,
  Github, Twitter, Linkedin, Mail, ExternalLink, Lock, Zap as ZapIcon
} from 'lucide-react';
import Navbar from '../components/shared/Navbar';

const features = [
  {
    icon: <Mic size={24} />, title: 'AI Mock Interviews',
    desc: 'Practice with our Llama 3.1 powered AI that asks real questions, listens to your answers, and gives instant feedback.',
    color: '#6366f1'
  },
  {
    icon: <FileText size={24} />, title: 'ATS Resume Scanner',
    desc: 'Instantly analyze your resume against any job description. Get your ATS score and missing keywords.',
    color: '#0ea5e9'
  },
  {
    icon: <BarChart2 size={24} />, title: 'Detailed Analytics',
    desc: 'Track communication, technical depth, confidence, and relevance across every interview session.',
    color: '#10b981'
  },
  {
    icon: <Brain size={24} />, title: 'Smart Feedback',
    desc: 'Receive actionable improvement suggestions with sample answers tailored to your specific responses.',
    color: '#f59e0b'
  },
  {
    icon: <Target size={24} />, title: 'Job Matching',
    desc: 'Match your resume to job descriptions with AI-powered gap analysis and skill recommendations.',
    color: '#ec4899'
  },
  {
    icon: <Shield size={24} />, title: 'Private & Secure',
    desc: 'Your data is encrypted and never shared. Practice freely with complete peace of mind.',
    color: '#8b5cf6'
  },
];

const steps = [
  { n: '01', title: 'Upload Your Resume', desc: 'Drop in your PDF resume. Our AI parses it instantly.', icon: <FileText size={20} /> },
  { n: '02', title: 'Choose Your Role', desc: 'Select the job title and paste the job description.', icon: <Target size={20} /> },
  { n: '03', title: 'Start AI Interview', desc: 'Answer questions via voice. AI listens and evaluates.', icon: <Mic size={20} /> },
  { n: '04', title: 'Get Your Report', desc: 'Receive scores, strengths, weaknesses and sample answers.', icon: <BarChart2 size={20} /> },
];

const testimonials = [
  {
    name: 'Priya Sharma', role: 'Software Engineer @ Google',
    avatar: 'PS', rating: 5,
    text: 'InterviewAI helped me crack my Google interview on the first attempt. The AI feedback was spot-on and better than my human mock interviews.',
    color: '#6366f1'
  },
  {
    name: 'Marcus Johnson', role: 'Product Manager @ Meta',
    avatar: 'MJ', rating: 5,
    text: 'The resume analyzer flagged keywords I was completely missing. After fixing it, I started getting 3x more callbacks.',
    color: '#0ea5e9'
  },
  {
    name: 'Aisha Patel', role: 'Data Scientist @ Amazon',
    avatar: 'AP', rating: 5,
    text: 'Practiced 30+ mock interviews in two weeks. The confidence boost was real. My communication score went from 62 to 89.',
    color: '#10b981'
  },
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
        <h3 className="font-semibold mb-2">Real Interview Simulation</h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Simulates actual interview scenarios with role-based questions and AI evaluation.
        </p>
      </motion.div>
    </FadeIn>

    <FadeIn delay={0.2}>
      <motion.div whileHover={{ y: -4 }} className="card p-6">
        <div className="mb-3 text-blue-400">
          <BarChart2 size={20} />
        </div>
        <h3 className="font-semibold mb-2">Performance Tracking</h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Tracks communication, confidence, and technical understanding across sessions.
        </p>
      </motion.div>
    </FadeIn>

    <FadeIn delay={0.3}>
      <motion.div whileHover={{ y: -4 }} className="card p-6">
        <div className="mb-3 text-green-400">
          <Brain size={20} />
        </div>
        <h3 className="font-semibold mb-2">Focused Improvement</h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Provides actionable feedback to improve weak areas step by step.
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
            Ready to ace your next interview?
          </h2>
          <p className="text-lg mb-10" style={{ color: 'var(--text-secondary)' }}>
            Join thousands of candidates who landed their dream jobs using InterviewAI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary flex items-center justify-center gap-2 text-base px-10 py-4">
              Start Free Today <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-secondary flex items-center justify-center gap-2 text-base px-10 py-4">
              Sign In
            </Link>
          </div>
          <p className="text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
            No credit card required · Free forever plan · Cancel anytime
          </p>
        </FadeIn>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="py-24 bg-gradient-to-b" style={{ background: 'linear-gradient(to bottom, var(--bg-primary), var(--bg-secondary))' }}>
        <div className="max-w-6xl mx-auto px-4">
          <FadeIn className="text-center mb-16">
            <span className="badge badge-indigo mb-4">Success Stories</span>
            <h2 className="font-display text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Join thousands who landed their dream jobs
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Real feedback from real candidates who used InterviewAI to secure offers from top companies.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <FadeIn key={i} delay={i * 0.15}>
                <motion.div whileHover={{ y: -4 }} className="card p-6 h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star key={j} size={14} fill={t.color} color={t.color} />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed flex-1 mb-4" style={{ color: 'var(--text-secondary)' }}>
                    "{t.text}"
                  </p>
                  <div className="flex items-center gap-3 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{ background: t.color }}>
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{t.name}</p>
                      <p className="text-xs" style={{ color: 'var(--accent)' }}>{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section className="py-24 border-y" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <FadeIn className="text-center mb-16">
            <span className="badge badge-purple mb-4">Pricing</span>
            <h2 className="font-display text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Simple, transparent pricing
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Start free. Upgrade anytime. No hidden fees.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: 'Free', price: '0', interviews: '3', desc: 'Perfect to get started', features: ['3 mock interviews/month', 'Resume analysis', 'Basic feedback', 'Community support'] },
              { name: 'Pro', price: '9', interviews: 'Unlimited', desc: 'Best for serious candidates', features: ['Unlimited interviews', 'Advanced analytics', 'Priority AI feedback', 'Email support', 'Interview history'], badge: 'Popular' },
              { name: 'Elite', price: '29', interviews: '∞', desc: 'For career changers', features: ['Everything in Pro', '1-on-1 mentor sessions', 'Mock interviews with experts', 'Guaranteed response <2h', 'LinkedIn optimization'] },
            ].map((plan, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <motion.div whileHover={{ y: -4 }} className="card p-8 h-full flex flex-col relative"
                  style={{ border: plan.name === 'Pro' ? '2px solid var(--accent)' : '1px solid var(--border)' }}>
                  {plan.badge && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ background: 'var(--accent)', color: 'white' }}>
                      {plan.badge}
                    </div>
                  )}
                  <h3 className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{plan.name}</h3>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{plan.desc}</p>
                  <div className="mb-6">
                    <span className="font-display text-4xl font-bold" style={{ color: 'var(--accent)' }}>${plan.price}</span>
                    <span className="text-sm ml-1" style={{ color: 'var(--text-secondary)' }}>/{plan.price === '0' ? 'forever' : 'month'}</span>
                  </div>
                  <button className={`w-full py-3 rounded-lg font-semibold mb-6 transition-all ${
                    plan.name === 'Pro' ? 'btn-primary' : 'btn-secondary'
                  }`}>
                    Get Started
                  </button>
                  <div className="space-y-3">
                    {plan.features.map((f, j) => (
                      <div key={j} className="flex items-center gap-2 text-sm">
                        <CheckCircle size={16} style={{ color: 'var(--accent)' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-24 max-w-4xl mx-auto px-4">
        <FadeIn className="text-center mb-16">
          <span className="badge badge-green mb-4">FAQ</span>
          <h2 className="font-display text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Common questions answered
          </h2>
        </FadeIn>

        <div className="space-y-4">
          {[
            { q: 'How accurate is the AI feedback?', a: 'Our AI uses Llama 3.1 and evaluates based on real interview standards. Users report 89% improvement in offer rates.' },
            { q: 'Can I use the video during interviews?', a: 'Yes! All interviews are recorded and saved. You can review your performance anytime and compare progress over time.' },
            { q: 'Do you store my data securely?', a: 'Absolutely. We use military-grade encryption (AES-256) and never share your data with third parties.' },
            { q: 'Which job roles do you cover?', a: 'Over 200+ roles including Software Engineering, Product Management, Data Science, Design, and more.' },
            { q: 'Can I cancel anytime?', a: 'Yes, cancel your subscription anytime with no questions asked. Your data remains accessible for 30 days.' },
          ].map((item, i) => (
            <FadeIn key={i} delay={i * 0.05}>
              <details className="card p-4 cursor-pointer group">
                <summary className="flex items-center justify-between font-semibold" style={{ color: 'var(--text-primary)' }}>
                  <span>{item.q}</span>
                  <ChevronRight size={18} className="group-open:rotate-90 transition-transform" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {item.a}
                </p>
              </details>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* NEWSLETTER CTA */}
      <section className="py-16 my-8 rounded-2xl overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(14,165,233,0.2))' }}>
        <div className="absolute inset-0 opacity-5"
          style={{ background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%236366f1" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}
        />
        <FadeIn className="relative z-10 max-w-2xl mx-auto px-4 text-center">
          <h3 className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            💡 Get interview tips & tricks delivered weekly
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Join 10K+ candidates receiving exclusive tips, techniques, and success stories.
          </p>
          <div className="flex gap-2">
            <input type="email" placeholder="your@email.com" className="flex-1 px-4 py-2 rounded-lg text-sm"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }} />
            <button className="btn-primary px-6 py-2 text-sm whitespace-nowrap">Subscribe</button>
          </div>
        </FadeIn>
      </section>

      {/* FOOTER */}
      <footer className="border-t pt-16 pb-8" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto px-4">
          {/* Footer Main */}
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            {/* Brand */}
            <FadeIn className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-md flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, var(--accent), var(--brand))' }}>
                  <Zap size={16} color="white" fill="white" />
                </div>
                <span className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>InterviewAI</span>
              </div>
              <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
                AI-powered interview prep for ambitious professionals.
              </p>
              <div className="flex gap-3">
                {[
                  { icon: <Github size={16} />, href: '#' },
                  { icon: <Twitter size={16} />, href: '#' },
                  { icon: <Linkedin size={16} />, href: '#' },
                ].map((social, i) => (
                  <a key={i} href={social.href} className="w-8 h-8 rounded-md flex items-center justify-center transition-colors"
                    style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent)' }}>
                    {social.icon}
                  </a>
                ))}
              </div>
            </FadeIn>

            {/* Product */}
            <FadeIn delay={0.1} className="md:col-span-1">
              <h4 className="font-semibold mb-4 text-sm" style={{ color: 'var(--text-primary)' }}>Product</h4>
              <div className="space-y-2">
                {['Features', 'Pricing', 'FAQ', 'Blog'].map(l => (
                  <a key={l} href="#" className="text-xs block transition-colors"
                    style={{ color: 'var(--text-secondary)' }}>
                    {l}
                  </a>
                ))}
              </div>
            </FadeIn>

            {/* Company */}
            <FadeIn delay={0.15} className="md:col-span-1">
              <h4 className="font-semibold mb-4 text-sm" style={{ color: 'var(--text-primary)' }}>Company</h4>
              <div className="space-y-2">
                {['About', 'Careers', 'Press', 'Contact'].map(l => (
                  <a key={l} href="#" className="text-xs block transition-colors"
                    style={{ color: 'var(--text-secondary)' }}>
                    {l}
                  </a>
                ))}
              </div>
            </FadeIn>

            {/* Resources */}
            <FadeIn delay={0.2} className="md:col-span-1">
              <h4 className="font-semibold mb-4 text-sm" style={{ color: 'var(--text-primary)' }}>Resources</h4>
              <div className="space-y-2">
                {['Docs', 'API Reference', 'Community', 'Status'].map(l => (
                  <a key={l} href="#" className="text-xs block transition-colors"
                    style={{ color: 'var(--text-secondary)' }}>
                    {l}
                  </a>
                ))}
              </div>
            </FadeIn>

            {/* Legal */}
            <FadeIn delay={0.25} className="md:col-span-1">
              <h4 className="font-semibold mb-4 text-sm" style={{ color: 'var(--text-primary)' }}>Legal</h4>
              <div className="space-y-2">
                {['Privacy', 'Terms', 'Security', 'Cookie Policy'].map(l => (
                  <a key={l} href="#" className="text-xs block transition-colors"
                    style={{ color: 'var(--text-secondary)' }}>
                    {l}
                  </a>
                ))}
              </div>
            </FadeIn>
          </div>

          {/* Trust Badges */}
          <div className="border-t py-8" style={{ borderColor: 'var(--border)' }}>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <FadeIn>
                <div className="flex items-center justify-center gap-2 mb-2" style={{ color: 'var(--accent)' }}>
                  <Lock size={16} />
                  <span className="text-xs font-semibold">Enterprise Security</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>AES-256 Encryption & SOC 2 Compliant</p>
              </FadeIn>
              <FadeIn delay={0.1}>
                <div className="flex items-center justify-center gap-2 mb-2" style={{ color: 'var(--accent)' }}>
                  <Users size={16} />
                  <span className="text-xs font-semibold">Trusted by 50K+</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Candidates from 150+ countries</p>
              </FadeIn>
              <FadeIn delay={0.2}>
                <div className="flex items-center justify-center gap-2 mb-2" style={{ color: 'var(--accent)' }}>
                  <TrendingUp size={16} />
                  <span className="text-xs font-semibold">89% Success Rate</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Offer rate improvement in 2 weeks</p>
              </FadeIn>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
            style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              © 2025 InterviewAI. All rights reserved. Designed & built with ❤️ using MERN Stack + Llama 3.1.
            </p>
            <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span>Made with ⚡ by </span>
              <a href="#" className="font-semibold transition-colors hover:text-white">AI Developers</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
