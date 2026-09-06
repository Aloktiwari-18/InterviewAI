import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [token, setToken] = useState(
    localStorage.getItem('token')
  );

  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem('refreshToken')
  );

  // =========================================================
  // SET AXIOS AUTHORIZATION HEADER
  // =========================================================

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // =========================================================
  // INITIAL AUTH CHECK
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // No token -> no user
        if (!token) {
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        // Try existing access token
        try {
          const { data } = await authAPI.me();

          if (mounted) {
            setUser(data?.user || null);
          }

          return;
        } catch (err) {
          console.warn(
            'Access token validation failed:',
            err
          );
        }

        // =====================================================
        // ACCESS TOKEN FAILED -> TRY REFRESH TOKEN
        // =====================================================

        if (refreshToken) {
          try {
            const { data } =
              await authAPI.refreshToken(refreshToken);

            if (!data?.token) {
              throw new Error(
                'Refresh response did not contain a token'
              );
            }

            localStorage.setItem(
              'token',
              data.token
            );

            if (data.refreshToken) {
              localStorage.setItem(
                'refreshToken',
                data.refreshToken
              );
            }

            if (mounted) {
              setToken(data.token);

              if (data.refreshToken) {
                setRefreshToken(
                  data.refreshToken
                );
              }

              setUser(data.user || null);
            }

            return;
          } catch (refreshErr) {
            console.error(
              'Refresh token failed:',
              refreshErr
            );
          }
        }

        // =====================================================
        // AUTH FAILED -> CLEAR EVERYTHING
        // =====================================================

        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');

        if (mounted) {
          setToken(null);
          setRefreshToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error(
          'Authentication initialization failed:',
          err
        );

        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');

        if (mounted) {
          setToken(null);
          setRefreshToken(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, [token, refreshToken]);

  // =========================================================
  // LOGIN
  // =========================================================

  const login = async (email, password) => {
    try {
      if (!email || !email.trim()) {
        throw new Error('Email is required');
      }

      if (!password) {
        throw new Error('Password is required');
      }

      console.log('LOGIN REQUEST:', {
        email: email.trim(),
      });

      const { data } = await authAPI.login({
        email: email.trim(),
        password,
      });

      console.log('LOGIN RESPONSE:', data);

      if (!data?.token) {
        throw new Error(
          'Login response did not contain a token'
        );
      }

      // Save access token
      localStorage.setItem(
        'token',
        data.token
      );

      // Save refresh token if available
      if (data.refreshToken) {
        localStorage.setItem(
          'refreshToken',
          data.refreshToken
        );
      }

      // Update state
      setToken(data.token);

      setRefreshToken(
        data.refreshToken || null
      );

      setUser(data.user || null);

      toast.success('Login successful!');

      return data.user;
    } catch (err) {
      console.error('LOGIN ERROR:', err);

      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        (typeof err === 'string'
          ? err
          : 'Login failed');

      // IMPORTANT:
      // Always pass a STRING to toast.
      toast.error(String(message));

      throw err;
    }
  };

  // =========================================================
  // REGISTER
  // =========================================================
  //
  // IMPORTANT:
  // Only 3 arguments:
  //
  // register(name, email, password)
  //
  // No confirmPassword here.
  // =========================================================

  const register = async (
    name,
    email,
    password
  ) => {
    try {
      // =====================================================
      // BASIC VALIDATION
      // =====================================================

      if (!name || !name.trim()) {
        throw new Error('Name is required');
      }

      if (!email || !email.trim()) {
        throw new Error('Email is required');
      }

      if (!password) {
        throw new Error('Password is required');
      }

      // =====================================================
      // EMAIL VALIDATION
      // =====================================================

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email.trim())) {
        throw new Error(
          'Please enter a valid email address'
        );
      }

      // =====================================================
      // PASSWORD VALIDATION
      // =====================================================

      if (password.length < 8) {
        throw new Error(
          'Password must be at least 8 characters'
        );
      }

      if (!/[A-Z]/.test(password)) {
        throw new Error(
          'Password must contain at least one uppercase letter'
        );
      }

      if (!/[0-9]/.test(password)) {
        throw new Error(
          'Password must contain at least one number'
        );
      }

      // =====================================================
      // REGISTER API CALL
      // =====================================================

      console.log('🚀 REGISTER API CALL');

      console.log('REGISTER DATA:', {
        name: name.trim(),
        email: email.trim(),
        password: '[HIDDEN]',
      });

      const { data } = await authAPI.register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      console.log(
        '✅ REGISTER API RESPONSE:',
        data
      );

      // =====================================================
      // CHECK TOKEN
      // =====================================================

      if (!data?.token) {
        throw new Error(
          'Registration response did not contain a token'
        );
      }

      // =====================================================
      // SAVE TOKENS
      // =====================================================

      localStorage.setItem(
        'token',
        data.token
      );

      if (data.refreshToken) {
        localStorage.setItem(
          'refreshToken',
          data.refreshToken
        );
      }

      // =====================================================
      // UPDATE AUTH STATE
      // =====================================================

      setToken(data.token);

      setRefreshToken(
        data.refreshToken || null
      );

      setUser(data.user || null);

      // =====================================================
      // SUCCESS
      // =====================================================

      toast.success(
        'Registration successful!'
      );

      return data.user;
    } catch (err) {
      console.error(
        '❌ REGISTER ERROR:',
        err
      );

      // Backend error
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        (typeof err === 'string'
          ? err
          : 'Registration failed');

      // IMPORTANT:
      // React error #31 can happen when an Error
      // object is passed/rendered directly.
      // Always convert to string.
      toast.error(String(message));

      throw err;
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.warn(
        'Logout API call failed:',
        err
      );
    } finally {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem(
        'refreshToken'
      );

      // Clear state
      setToken(null);
      setRefreshToken(null);
      setUser(null);

      // Clear axios header
      delete axios.defaults.headers.common[
        'Authorization'
      ];

      toast.success(
        'Logged out successfully'
      );
    }
  };

  // =========================================================
  // REFRESH ACCESS TOKEN
  // =========================================================

  const refreshAccessToken = async () => {
    try {
      if (!refreshToken) {
        throw new Error(
          'No refresh token available'
        );
      }

      const { data } =
        await authAPI.refreshToken(
          refreshToken
        );

      if (!data?.token) {
        throw new Error(
          'Refresh response did not contain a token'
        );
      }

      // Save new token
      localStorage.setItem(
        'token',
        data.token
      );

      setToken(data.token);

      // If backend sends a new refresh token,
      // update that too.
      if (data.refreshToken) {
        localStorage.setItem(
          'refreshToken',
          data.refreshToken
        );

        setRefreshToken(
          data.refreshToken
        );
      }

      if (data.user) {
        setUser(data.user);
      }

      return data.token;
    } catch (err) {
      console.error(
        'Token refresh failed:',
        err
      );

      localStorage.removeItem('token');
      localStorage.removeItem(
        'refreshToken'
      );

      setToken(null);
      setRefreshToken(null);
      setUser(null);

      throw err;
    }
  };

  // =========================================================
  // UPDATE USER
  // =========================================================

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  // =========================================================
  // CONTEXT VALUE
  // =========================================================

  const value = {
    user,
    loading,

    token,
    refreshToken,

    login,
    register,
    logout,

    refreshAccessToken,

    updateUser,

    isAuthenticated:
      !!token && !!user,
  };

  // =========================================================
  // PROVIDER
  // =========================================================

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
