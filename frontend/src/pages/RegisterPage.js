import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Zap,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const perks = [
  '15 free AI interviews per month',
  'Full ATS resume analysis',
  'Detailed feedback reports',
  'Interview history & tracking',
];

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // =====================================================
  // HANDLE REGISTER
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('🔥 SIGNUP BUTTON CLICKED');

    console.log('🔥 FORM DATA:', {
      name: form.name,
      email: form.email,
      password: '[HIDDEN]',
    });

    // ===================================================
    // BASIC VALIDATION
    // ===================================================

    if (!form.name.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    if (!form.email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    // ===================================================
    // EMAIL VALIDATION
    // ===================================================

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(form.email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    // ===================================================
    // PASSWORD VALIDATION
    // ===================================================

    if (!form.password) {
      toast.error('Please enter a password');
      return;
    }

    if (form.password.length < 8) {
      toast.error(
        'Password must be at least 8 characters'
      );
      return;
    }

    if (!/[A-Z]/.test(form.password)) {
      toast.error(
        'Password must contain at least one uppercase letter'
      );
      return;
    }

    if (!/[0-9]/.test(form.password)) {
      toast.error(
        'Password must contain at least one number'
      );
      return;
    }

    // ===================================================
    // CALL REGISTER
    // ===================================================

    try {
      setLoading(true);

      console.log('🔥 CALLING REGISTER');

      const result = await register(
        form.name.trim(),
        form.email.trim(),
        form.password
      );

      console.log('🔥 REGISTER SUCCESS:', result);

      toast.success(
        'Account created! Welcome to InterviewAI 🎉'
      );

      navigate('/dashboard');
    } catch (err) {
      console.error('🔥 REGISTER ERROR:', err);

      // Always convert the error to a string.
      // This prevents React error #31 when an Error
      // object is accidentally passed to the UI/toast.

      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        (typeof err === 'string'
          ? err
          : 'Registration failed');

      toast.error(String(message));
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // PASSWORD STRENGTH
  // =====================================================

  const strength =
    form.password.length >= 8
      ? 'strong'
      : form.password.length >= 6
      ? 'medium'
      : 'weak';

  const strengthColor = {
    strong: '#10b981',
    medium: '#f59e0b',
    weak: '#ef4444',
  };

  const strengthWidth = {
    strong: '100%',
    medium: '60%',
    weak: '30%',
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      className="min-h-screen flex grid-bg"
      style={{
        background: 'var(--bg-primary)',
      }}
    >
      {/* =================================================
          LEFT SIDE
      ================================================= */}

      <div
        className="hidden lg:flex flex-1 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(14,165,233,0.05))',
        }}
      >
        <div
          className="absolute bottom-1/3 right-1/3 w-80 h-80 rounded-full blur-3xl opacity-20"
          style={{
            background:
              'radial-gradient(circle, #0ea5e9, transparent)',
          }}
        />

        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-4xl font-bold mb-4 gradient-text">
            Start free. Grow fast.
          </h2>

          <p
            className="text-lg mb-10 leading-relaxed"
            style={{
              color: 'var(--text-secondary)',
            }}
          >
            Get instant access to all interview prep tools.
            No credit card required.
          </p>

          <div className="space-y-4">
            {perks.map((perk, index) => (
              <motion.div
                key={index}
                initial={{
                  opacity: 0,
                  x: -10,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  delay: index * 0.1 + 0.3,
                }}
                className="flex items-center gap-3"
              >
                <CheckCircle
                  size={20}
                  style={{
                    color: '#10b981',
                    flexShrink: 0,
                  }}
                />

                <span
                  style={{
                    color: 'var(--text-secondary)',
                  }}
                >
                  {perk}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* =================================================
          RIGHT SIDE
      ================================================= */}

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="w-full max-w-md"
        >
          {/* =================================================
              LOGO
          ================================================= */}

          <Link
            to="/"
            className="flex items-center gap-2 mb-8"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background:
                  'linear-gradient(135deg, var(--accent), var(--brand))',
              }}
            >
              <Zap
                size={16}
                color="white"
                fill="white"
              />
            </div>

            <span
              className="font-display font-bold text-xl"
              style={{
                color: 'var(--text-primary)',
              }}
            >
              Interview
              <span className="gradient-text">
                AI
              </span>
            </span>
          </Link>

          {/* =================================================
              HEADING
          ================================================= */}

          <h1
            className="font-display text-3xl font-bold mb-2"
            style={{
              color: 'var(--text-primary)',
            }}
          >
            Create your account
          </h1>

          <p
            className="mb-8"
            style={{
              color: 'var(--text-secondary)',
            }}
          >
            Already have one?{' '}
            <Link
              to="/login"
              style={{
                color: 'var(--accent)',
              }}
              className="font-medium"
            >
              Sign in
            </Link>
          </p>

          {/* =================================================
              REGISTER FORM
          ================================================= */}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* NAME */}

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{
                  color: 'var(--text-secondary)',
                }}
              >
                Full name
              </label>

              <input
                type="text"
                className="input"
                placeholder="John Doe"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                required
                autoComplete="name"
                disabled={loading}
              />
            </div>

            {/* EMAIL */}

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{
                  color: 'var(--text-secondary)',
                }}
              >
                Email
              </label>

              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>

            {/* PASSWORD */}

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{
                  color: 'var(--text-secondary)',
                }}
              >
                Password
              </label>

              <div className="relative">
                <input
                  type={
                    showPass
                      ? 'text'
                      : 'password'
                  }
                  className="input pr-12"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      password: e.target.value,
                    })
                  }
                  required
                  autoComplete="new-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPass(!showPass)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{
                    color:
                      'var(--text-secondary)',
                  }}
                  disabled={loading}
                  aria-label={
                    showPass
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPass ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              {/* PASSWORD STRENGTH */}

              {form.password && (
                <div className="mt-2">
                  <div className="progress-bar mt-1">
                    <div
                      className="progress-fill"
                      style={{
                        width:
                          strengthWidth[
                            strength
                          ],
                        background:
                          strengthColor[
                            strength
                          ],
                      }}
                    />
                  </div>

                  <p
                    className="text-xs mt-1 capitalize"
                    style={{
                      color:
                        strengthColor[
                          strength
                        ],
                    }}
                  >
                    {strength} password
                  </p>
                </div>
              )}
            </div>

            {/* SUBMIT */}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{
                scale: loading ? 1 : 1.01,
              }}
              whileTap={{
                scale: loading ? 1 : 0.99,
              }}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    Create account
                  </span>

                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </form>

          {/* =================================================
              TERMS
          ================================================= */}

          <p
            className="text-xs text-center mt-6"
            style={{
              color: 'var(--text-secondary)',
            }}
          >
            By creating an account, you agree to our{' '}
            <a
              href="#"
              style={{
                color: 'var(--accent)',
              }}
              onClick={(e) => e.preventDefault()}
            >
              Terms
            </a>{' '}
            and{' '}
            <a
              href="#"
              style={{
                color: 'var(--accent)',
              }}
              onClick={(e) => e.preventDefault()}
            >
              Privacy Policy
            </a>
            .
          </p>
        </motion.div>
      </div>
    </div>
  );
}
