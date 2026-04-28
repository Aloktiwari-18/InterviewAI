import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Video, VideoOff, ChevronRight,
  Clock, AlertCircle, CheckCircle, Loader, SkipForward, Send
} from 'lucide-react';
import DashboardLayout from '../components/shared/DashboardLayout';
import { FaceDetectionMonitor } from '../components/Media/FaceDetectionMonitor';
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

  // ✅ TAB SWITCH DETECTION
  useEffect(() => {
    let tabSwitchCount = 0;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabSwitchCount++;
        console.log(`⚠️ TAB SWITCH DETECTED (${tabSwitchCount})`);
        toast.error(`⚠️ Don't switch tabs! (Violation #${tabSwitchCount})`);
        
        // Log violation to backend
        fetch(`${process.env.REACT_APP_API_URL}/api/interview/violation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            interviewId,
            type: 'TAB_SWITCH',
            severity: tabSwitchCount > 2 ? 'major' : 'warning',
            timestamp: new Date()
          })
        }).catch(err => console.error('Violation log error:', err));
      }
    };

    const handleWindowBlur = () => {
      console.log('⚠️ WINDOW BLUR DETECTED');
      toast.error('⚠️ Please return to interview window');
      
      fetch(`${process.env.REACT_APP_API_URL}/api/interview/violation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          interviewId,
          type: 'WINDOW_BLUR',
          severity: 'warning',
          timestamp: new Date()
        })
      }).catch(err => console.error('Violation log error:', err));
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [interviewId]);

  // ✅ FACE DETECTION VIOLATION HANDLER
  const handleFaceDetectionViolation = useCallback((violation) => {
    console.log(`⚠️ FACE VIOLATION: ${violation.type} - ${violation.message}`);
    
    // Determine toast type
    const toastTypes = {
      NO_FACE: '❌ Face not detected in camera',
      MULTIPLE_FACES: `⚠️ ${violation.message}`
    };

    if (toastTypes[violation.type]) {
      toast.error(toastTypes[violation.type]);
    }

    // Log to backend
    fetch(`${process.env.REACT_APP_API_URL}/api/interview/violation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        interviewId,
        type: violation.type,
        severity: violation.severity || 'warning',
        timestamp: new Date()
      })
    }).catch(err => console.error('Face violation log error:', err));
  }, [interviewId]);

  // Per-question countdown
  useEffect(() => {
    setTimeLeft(120);
    clearInterval(questionTimerRef.current);
    questionTimerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { 
          clearInterval(questionTimerRef.current); 
          return 0; 
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(questionTimerRef.current);
  }, [currentQ]);

  // ✅ AUTO-ADVANCE TO NEXT QUESTION WHEN TIME RUNS OUT
  useEffect(() => {
    if (timeLeft === 0 && !showSample) {
      console.log('⏰ Time up! Auto-advancing to next question...');
      toast('⏰ Time is up! Moving to next question...');
      
      // Auto-submit current answer if transcript exists
      if (transcript.trim()) {
        const answer = transcript || answers[currentQ] || '';
        setSubmitting(true);
        stopRecording();
        
        interviewAPI.submitAnswer(interviewId, {
          questionIndex: currentQ, 
          answer, 
          duration: 120
        })
        .then(({ data }) => {
          setAnswers(prev => ({ ...prev, [currentQ]: answer }));
          setSampleAnswer(data.sampleAnswer);
          setShowSample(true);
          setSubmitting(false);
        })
        .catch(() => {
          setShowSample(true); // Show sample anyway
          setSubmitting(false);
        });
      } else {
        // If no transcript, just move to next question after 2 seconds
        setTimeout(() => {
          nextQuestion();
        }, 2000);
      }
    }
  }, [timeLeft, showSample, transcript, currentQ]);

  // ✅ AUTO-MOVE TO NEXT QUESTION AFTER SHOWING SAMPLE ANSWER
  useEffect(() => {
    if (showSample && timeLeft === 0) {
      setTimeout(() => {
        nextQuestion();
      }, 3000); // Show sample for 3 seconds then move on
    }
  }, [showSample, timeLeft]);

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

  const startRecording = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported. Type your answer below.');
      return;
    }

    // ✅ FIX 1: Request explicit audio permission
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });
      audioStream.getTracks().forEach(track => track.stop()); // Stop immediately, just checking permission
    } catch (err) {
      toast.error('Microphone access denied. Please enable mic permissions in browser settings.');
      return;
    }

    synthRef.current?.cancel();
    
    // ✅ FIX 2: Create new recognition instance with FIXED config for accuracy
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN'; // Support Hindi/English mix
    recognition.maxAlternatives = 1;
    
    let finalTranscript = ''; // Only FINALIZED speech
    let interimText = ''; // Temporary interim display

    recognition.onstart = () => {
      finalTranscript = '';
      interimText = '';
      setTranscript('🎙 Listening...');
    };

    recognition.onresult = (event) => {
      interimText = ''; // Reset interim
      
      // ✅ ONLY process FINAL results - ignore interim
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          // ✅ ONLY add final results with proper capitalization
          finalTranscript += transcript.charAt(0).toUpperCase() + transcript.slice(1);
          if (i < event.results.length - 1) {
            finalTranscript += ' '; // Add space between final results
          }
        } else {
          // ✅ Show interim as grayed out (don't let it change the final text)
          interimText = transcript;
        }
      }
      
      // ✅ Display: FINAL TEXT (shown) + interim as hint
      const displayText = finalTranscript 
        ? finalTranscript + (interimText ? ` [${interimText}]` : '')
        : (interimText ? `[${interimText}]` : '🎙 Listening...');
      
      setTranscript(displayText);
      setAnswers(prev => ({ ...prev, [currentQ]: finalTranscript }));
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      // ✅ Better error handling
      const errorMessages = {
        'network': '🌐 Network error. Check your internet connection.',
        'no-speech': '🔇 No speech detected. Please try again.',
        'audio-capture': '🎤 No microphone found. Check permissions.',
        'not-allowed': '🔒 Microphone permission denied.',
        'permission-denied': '🔒 Microphone permission denied.'
      };
      
      if (event.error !== 'no-speech') {
        toast.error(errorMessages[event.error] || `Mic error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      // ✅ Keep final transcript visible (don't clear)
      if (finalTranscript) {
        setTranscript(finalTranscript);
        setAnswers(prev => ({ ...prev, [currentQ]: finalTranscript }));
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    } catch (err) {
      console.error('Recognition start error:', err);
      toast.error('Failed to start recording. Please try again.');
    }
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const toggleCamera = async () => {
    if (cameraOn) {
      stopCamera();
      return;
    }

    try {
      // ✅ FIX 1: Better video constraints for cross-browser compatibility
      const constraints = {
        video: {
          width: { ideal: 1280, min: 320 },
          height: { ideal: 720, min: 240 },
          facingMode: 'user'
        },
        audio: false  // Separate audio/video to avoid conflicts
      };

      let stream = null;
      
      // ✅ FIX 2: Try with ideal constraints first, fallback to minimal
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.warn('High resolution failed, trying basic video:', err);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false
        });
      }
      
      streamRef.current = stream;
      
      // ✅ FIX 3: Proper srcObject assignment with retry logic
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsinline = true;
        
        // ✅ FIX 4: Handle video element events with timeout
        const playTimeout = setTimeout(() => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            videoRef.current.play().catch(err => {
              console.error('Video play error:', err);
              toast.error('Failed to start video playback');
              stopCamera();
            });
          }
        }, 100);

        videoRef.current.onloadedmetadata = () => {
          clearTimeout(playTimeout);
          if (videoRef.current) {
            videoRef.current.play().catch(err => {
              console.error('Video play error:', err);
            });
          }
        };

        videoRef.current.onplay = () => {
          console.log('✅ Video playing');
        };

        videoRef.current.onerror = () => {
          console.error('Video element error');
          toast.error('Video stream error');
          stopCamera();
        };
      }

      setCameraOn(true);
      toast.success('📹 Camera enabled');
      
    } catch (err) {
      console.error('Camera error:', err);
      
      // ✅ FIX 5: Specific error handling
      const errorMessages = {
        'NotAllowedError': '🔒 Camera permission denied. Enable in browser settings.',
        'NotFoundError': '📷 No camera device found. Check if camera is connected.',
        'NotReadableError': '⚠️ Camera is already in use by another application.',
        'OverconstrainedError': '⚙️ Camera does not support requested quality. Using default settings.',
        'TypeError': '🌐 getUserMedia not supported. Use HTTPS or localhost.',
        'SecurityError': '🔐 Camera access requires HTTPS (except on localhost)'
      };

      const message = errorMessages[err.name] || `Camera error: ${err.message}`;
      toast.error(message);
      
      // ✅ FIX 6: Fallback - retry with relaxed constraints
      if (err.name === 'OverconstrainedError') {
        try {
          console.log('Retrying with basic video constraints...');
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: false 
          });
          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            videoRef.current.muted = true;
            videoRef.current.play().catch(() => {});
          }
          setCameraOn(true);
          toast.success('📹 Camera enabled (standard mode)');
        } catch (fallbackErr) {
          console.error('Fallback also failed:', fallbackErr);
          toast.error('Camera unavailable');
          setCameraOn(false);
        }
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
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
              <span className={`font-mono text-sm font-semibold ${timeLeft < 30 ? 'animate-pulse' : ''}`}
                style={{ color: timeLeft < 30 ? '#ef4444' : 'var(--text-secondary)' }}>
                {formatTime(timeLeft)}
              </span>
            </div>

            {/* Time warning */}
            {timeLeft < 30 && timeLeft > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="mb-4 p-3 rounded-lg flex items-center gap-2"
                style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <AlertCircle size={16} style={{ color: '#ef4444' }} />
                <span style={{ color: '#ef4444', fontSize: '0.875rem', fontWeight: 600 }}>
                  ⏰ {timeLeft} seconds remaining - Submit or Skip!
                </span>
              </motion.div>
            )}

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

        {/* RIGHT - Camera with Face Detection */}
        <div className="w-full lg:w-80 xl:w-96 p-4 lg:p-6 flex flex-col gap-4 border-t lg:border-t-0 lg:border-l"
          style={{ borderColor: 'var(--border)' }}>
          
          {/* Face Detection Monitor */}
          {cameraOn && (
            <div className="rounded-2xl overflow-hidden">
              <FaceDetectionMonitor onViolation={handleFaceDetectionViolation} />
            </div>
          )}

          {/* Basic camera fallback */}
          {!cameraOn && (
            <div className="rounded-2xl overflow-hidden aspect-video flex items-center justify-center relative"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <div className="text-center">
                <VideoOff size={32} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-secondary)' }} />
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Camera off</p>
              </div>
            </div>
          )}

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