import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));

  // ✅ FIX 1: Set axios default header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // ✅ FIX 2: Fetch current user on mount
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const { data } = await authAPI.me();
          setUser(data.user);
        } catch (err) {
          console.error('Failed to fetch user:', err);
          // Try refresh if available
          if (refreshToken) {
            try {
              const { data } = await authAPI.refreshToken(refreshToken);
              localStorage.setItem('token', data.token);
              setToken(data.token);
              setUser(data.user);
            } catch {
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              setToken(null);
              setRefreshToken(null);
            }
          } else {
            localStorage.removeItem('token');
            setToken(null);
          }
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token, refreshToken]);

  // ✅ FIX 3: Enhanced login with password validation feedback
  const login = async (email, password) => {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const { data } = await authAPI.login({ email, password });

      localStorage.setItem('token', data.token);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      setToken(data.token);
      setRefreshToken(data.refreshToken);
      setUser(data.user);

      toast.success('Login successful!');
      return data.user;
    } catch (err) {
      const message = typeof err === 'string' ? err : err?.message || 'Login failed';
      toast.error(message);
      throw err;
    }
  };

  // ✅ FIX 4: Enhanced register with validation
  const register = async (name, email, password, confirmPassword) => {
    try {
      // Client-side validation
      if (!name || !email || !password || !confirmPassword) {
        throw new Error('All fields are required');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      if (!/[A-Z]/.test(password)) {
        throw new Error('Password must contain at least one uppercase letter');
      }

      if (!/[0-9]/.test(password)) {
        throw new Error('Password must contain at least one number');
      }

      const { data } = await authAPI.register({ name, email, password });

      localStorage.setItem('token', data.token);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      setToken(data.token);
      setRefreshToken(data.refreshToken);
      setUser(data.user);

      toast.success('Registration successful!');
      return data.user;
    } catch (err) {
      const message = typeof err === 'string' ? err : err?.message || 'Registration failed';
      toast.error(message);
      throw err;
    }
  };

  // ✅ FIX 5: Enhanced logout with cleanup
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.warn('Logout API call failed:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
      toast.success('Logged out successfully');
    }
  };

  // ✅ FIX 6: Token refresh function (can be called proactively)
  const refreshAccessToken = async () => {
    try {
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const { data } = await authAPI.refreshToken(refreshToken);
      localStorage.setItem('token', data.token);
      setToken(data.token);
      return data.token;
    } catch (err) {
      console.error('Token refresh failed:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setToken(null);
      setRefreshToken(null);
      throw err;
    }
  };

  const updateUser = (updatedUser) => setUser(updatedUser);

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
    isAuthenticated: !!token && !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};