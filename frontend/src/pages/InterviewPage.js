import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Video, VideoOff, ChevronRight,
  Clock, AlertCircle, CheckCircle, Loader, SkipForward, Send
} from 'lucide-react';
import DashboardLayout from '../components/shared/DashboardLayout';
import { interviewAPI } from '../utils/api';
import toast from 'react-hot-toast';

// ---- Setup Step ----
function SetupStep({ onStart }) {
  const [form, setForm] = useState({ jobTitle: '', jobDescription: '', resumeText: '' });
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!form.jobTitle.trim()) { toast.error('Please enter a job title'); return; }
    setLoading(true);
    try {
      const { data } = await interviewAPI.generateQuestions(form);
      onStart(data.interviewId, data.questions);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to generate questions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>AI Interview Setup</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Tell the AI about the role you're interviewing for.</p>
        </div>
        <div className="card p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Job Title <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input type="text" className="input" placeholder="e.g. Senior React Developer"
              value={form.jobTitle} onChange={e => setForm({ ...form, jobTitle: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Job Description <span className="text-xs font-normal">(optional — improves question quality)</span>
            </label>
            <textarea className="input min-h-[120px] resize-y" placeholder="Paste the job description here..."
              value={form.jobDescription} onChange={e => setForm({ ...form, jobDescription: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Resume Summary <span className="text-xs font-normal">(optional — for tailored questions)</span>
            </label>
            <textarea className="input min-h-[100px] resize-y" placeholder="Paste key parts of your resume..."
              value={form.resumeText} onChange={e => setForm({ ...form, resumeText: e.target.value })} />
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleStart} disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base">
            {loading ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating 15 questions...</>
            ) : (
              <><Mic size={18} /> Start AI Interview</>
            )}
          </motion.button>
          <div className="flex flex-wrap gap-2 justify-center">
            {['Voice enabled', '15 questions', 'Real-time feedback', 'AI evaluation'].map(tag => (
              <span key={tag} className="badge badge-purple">{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ---- Interview Session ----
function InterviewSession({ interviewId, questions, onComplete }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [timer, setTimer] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [sampleAnswer, setSampleAnswer] = useState('');
  const [showSample, setShowSample] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 min per question

  const recognitionRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const questionTimerRef = useRef(null);

  // Start interview session
  useEffect(() => {
    interviewAPI.start(interviewId).catch(() => {});
    speakQuestion(questions[0]);
    // Timer
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    return () => {
      clearInterval(timerRef.current);
      clearInterval(questionTimerRef.current);
      stopCamera();
      synthRef.current?.cancel();
    };
  }, []);

  // Per-question countdown
  useEffect(() => {
    setTimeLeft(120);
    clearInterval(questionTimerRef.current);
    questionTimerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(questionTimerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(questionTimerRef.current);
  }, [currentQ]);

  const speakQuestion = (text) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    utter.pitch = 1;
    const voices = synthRef.current.getVoices();
    const preferred = voices.find(v => v.name.includes('Google') || v.name.includes('Premium'));
    if (preferred) utter.voice = preferred;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    synthRef.current.speak(utter);
  };

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported. Type your answer below.');
      return;
    }
    synthRef.current?.cancel();
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (e) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join(' ');
      setTranscript(text);
    };
    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') toast.error('Mic error: ' + e.error);
    };
    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const toggleCamera = async () => {
    if (cameraOn) {
      stopCamera();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraOn(true);
      } catch {
        toast.error('Camera access denied');
      }
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraOn(false);
  };

  const submitAnswer = async () => {
    const answer = transcript || answers[currentQ] || '';
    if (!answer.trim()) { toast.error('Please provide an answer'); return; }
    setSubmitting(true);
    stopRecording();
    try {
      const { data } = await interviewAPI.submitAnswer(interviewId, {
        questionIndex: currentQ, answer, duration: 120 - timeLeft
      });
      setAnswers(prev => ({ ...prev, [currentQ]: answer }));
      setSampleAnswer(data.sampleAnswer);
      setShowSample(true);
    } catch {
      toast.error('Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const nextQuestion = () => {
    setShowSample(false);
    setSampleAnswer('');
    setTranscript('');
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1);
      setTimeout(() => speakQuestion(questions[currentQ + 1]), 500);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      await onComplete();
    } catch {
      toast.error('Failed to complete interview');
      setSubmitting(false);
    }
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
  const progress = ((currentQ) / questions.length) * 100;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-4">
          <span className="font-display font-bold gradient-text">InterviewAI</span>
          <span className="badge badge-blue">Live Session</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <Clock size={14} />
            <span className="font-mono">{formatTime(timer)}</span>
          </div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Q {currentQ + 1} / {questions.length}
          </div>
        </div>
        {/* Progress */}
        <div className="hidden sm:block w-40">
          <div className="progress-bar">
            <motion.div className="progress-fill" animate={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
        {/* LEFT - Question */}
        <div className="flex-1 p-6 lg:p-10 flex flex-col justify-between overflow-auto">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="badge badge-purple">Question {currentQ + 1}</span>
              {isSpeaking && (
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--accent)' }}>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
                  AI Speaking...
                </span>
              )}
            </div>

            <motion.h2 key={currentQ}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="font-display text-2xl lg:text-3xl font-semibold leading-relaxed mb-4"
              style={{ color: 'var(--text-primary)' }}>
              {questions[currentQ]}
            </motion.h2>

            {/* Timer */}
            <div className="flex items-center gap-3 mb-6">
              <div className="progress-bar flex-1">
                <motion.div className="progress-fill"
                  animate={{ width: `${(timeLeft / 120) * 100}%` }}
                  style={{ background: timeLeft < 30 ? '#ef4444' : undefined }} />
              </div>
              <span className={`font-mono text-sm ${timeLeft < 30 ? 'text-red-400' : ''}`}
                style={{ color: timeLeft < 30 ? '#ef4444' : 'var(--text-secondary)' }}>
                {formatTime(timeLeft)}
              </span>
            </div>

            {/* Answer area */}
            <div>
              <textarea
                className="input min-h-[140px] resize-none"
                placeholder={isRecording ? '🎙 Listening... speak your answer' : 'Type your answer or use voice recording...'}
                value={transcript || answers[currentQ] || ''}
                onChange={e => {
                  setTranscript(e.target.value);
                  setAnswers(prev => ({ ...prev, [currentQ]: e.target.value }));
                }}
              />
            </div>

            {/* Sample answer */}
            <AnimatePresence>
              {showSample && sampleAnswer && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 rounded-xl border"
                  style={{ background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#10b981' }}>💡 Sample Answer</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{sampleAnswer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all relative ${
                isRecording ? 'mic-pulse' : ''
              }`}
              style={{
                background: isRecording ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.1)',
                border: `1px solid ${isRecording ? 'rgba(239,68,68,0.4)' : 'rgba(99,102,241,0.3)'}`,
                color: isRecording ? '#ef4444' : 'var(--accent)'
              }}>
              {isRecording ? <><MicOff size={16} /> Stop Recording</> : <><Mic size={16} /> Start Recording</>}
            </motion.button>

            {!showSample ? (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={submitAnswer} disabled={submitting}
                className="btn-primary flex items-center gap-2">
                {submitting ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
                Submit Answer
              </motion.button>
            ) : (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={nextQuestion}
                className="btn-primary flex items-center gap-2">
                {currentQ < questions.length - 1 ? (
                  <><ChevronRight size={16} /> Next Question</>
                ) : (
                  <><CheckCircle size={16} /> Finish Interview</>
                )}
              </motion.button>
            )}

            <button onClick={() => { setTranscript(''); nextQuestion(); }}
              className="btn-secondary flex items-center gap-2 text-sm">
              <SkipForward size={14} /> Skip
            </button>
          </div>
        </div>

        {/* RIGHT - Camera */}
        <div className="w-full lg:w-80 xl:w-96 p-4 lg:p-6 flex flex-col gap-4 border-t lg:border-t-0 lg:border-l"
          style={{ borderColor: 'var(--border)' }}>
          <div className="rounded-2xl overflow-hidden aspect-video flex items-center justify-center relative"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            {cameraOn ? (
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <VideoOff size={32} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-secondary)' }} />
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Camera off</p>
              </div>
            )}
            {isRecording && (
              <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                style={{ background: 'rgba(239,68,68,0.9)', color: 'white' }}>
                <div className="recording-dot" style={{ width: 6, height: 6 }} /> REC
              </div>
            )}
          </div>

          <button onClick={toggleCamera}
            className="btn-secondary flex items-center justify-center gap-2 text-sm">
            {cameraOn ? <><VideoOff size={14} /> Turn Off Camera</> : <><Video size={14} /> Turn On Camera</>}
          </button>

          {/* Question overview */}
          <div className="flex-1 overflow-auto">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
              Questions
            </p>
            <div className="space-y-1">
              {questions.map((_, i) => (
                <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                  i === currentQ ? 'font-semibold' : ''
                }`}
                  style={{
                    background: i === currentQ ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                    color: i < currentQ ? '#10b981' : i === currentQ ? 'var(--accent)' : 'var(--text-secondary)'
                  }}>
                  {i < currentQ ? <CheckCircle size={12} /> :
                   i === currentQ ? <div className="w-3 h-3 rounded-full" style={{ background: 'var(--accent)' }} /> :
                   <div className="w-3 h-3 rounded-full border" style={{ borderColor: 'var(--border)' }} />}
                  Question {i + 1}
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleFinish} disabled={submitting}
            className="btn-secondary text-sm flex items-center justify-center gap-2">
            {submitting ? <Loader size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            End & Get Feedback
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InterviewPage() {
  const [phase, setPhase] = useState('setup'); // setup | session | completing
  const [interviewId, setInterviewId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const navigate = useNavigate();

  const handleStart = (id, qs) => {
    setInterviewId(id);
    setQuestions(qs);
    setPhase('session');
  };

  const handleComplete = async () => {
    setPhase('completing');
    try {
      await interviewAPI.complete(interviewId);
      toast.success('Interview complete! Generating your report...');
      navigate(`/feedback/${interviewId}`);
    } catch {
      toast.error('Error completing interview');
      setPhase('session');
    }
  };

  if (phase === 'setup') return <SetupStep onStart={handleStart} />;
  if (phase === 'completing') return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        <p className="font-display text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Generating your feedback...
        </p>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>AI is evaluating your answers</p>
      </div>
    </div>
  );
  return <InterviewSession interviewId={interviewId} questions={questions} onComplete={handleComplete} />;
}
