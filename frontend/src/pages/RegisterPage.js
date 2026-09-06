import React, { createContext, useContext, useState, useEffect } from 'react';
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

  // =====================================================
  // SET AXIOS DEFAULT AUTHORIZATION HEADER
  // =====================================================
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // =====================================================
  // INITIALIZE AUTH
  // =====================================================
  useEffect(() => {
    const initAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await authAPI.me();

        setUser(data.user);
      } catch (err) {
        console.error('Failed to fetch user:', err);

        // Try refresh token
        if (refreshToken) {
          try {
            const { data } = await authAPI.refreshToken(refreshToken);

            localStorage.setItem('token', data.token);

            setToken(data.token);

            if (data.refreshToken) {
              localStorage.setItem(
                'refreshToken',
                data.refreshToken
              );

              setRefreshToken(data.refreshToken);
            }

            setUser(data.user);
          } catch (refreshError) {
            console.error(
              'Initial token refresh failed:',
              refreshError
            );

            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');

            setToken(null);
            setRefreshToken(null);
            setUser(null);
          }
        } else {
          localStorage.removeItem('token');

          setToken(null);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =====================================================
  // LOGIN
  // =====================================================
  const login = async (email, password) => {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const { data } = await authAPI.login({
        email,
        password,
      });

      // Save access token
      localStorage.setItem('token', data.token);

      // Save refresh token if provided
      if (data.refreshToken) {
        localStorage.setItem(
          'refreshToken',
          data.refreshToken
        );

        setRefreshToken(data.refreshToken);
      }

      setToken(data.token);
      setUser(data.user);

      toast.success('Login successful!');

      return data.user;
    } catch (err) {
      console.error('Login error:', err);

      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Login failed';

      toast.error(message);

      throw err;
    }
  };

  // =====================================================
  // REGISTER
  // =====================================================
  // IMPORTANT:
  // RegisterPage currently sends only:
  // name, email, password
  //
  // Therefore confirmPassword has been removed.
  // =====================================================
  const register = async (name, email, password) => {
    try {
      // Basic validation
      if (!name || !email || !password) {
        throw new Error('All fields are required');
      }

      // Password validation
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

      // Call backend register API
      const { data } = await authAPI.register({
        name,
        email,
        password,
      });

      console.log('Registration response:', data);

      // Save access token
      if (data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
      }

      // Save refresh token
      if (data.refreshToken) {
        localStorage.setItem(
          'refreshToken',
          data.refreshToken
        );

        setRefreshToken(data.refreshToken);
      }

      // Save user
      if (data.user) {
        setUser(data.user);
      }

      toast.success('Registration successful!');

      return data.user;
    } catch (err) {
      console.error('Registration error:', err);

      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Registration failed';

      toast.error(message);

      throw err;
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.warn(
        'Logout API call failed:',
        err
      );
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

  // =====================================================
  // REFRESH ACCESS TOKEN
  // =====================================================
  const refreshAccessToken = async () => {
    try {
      if (!refreshToken) {
        throw new Error(
          'No refresh token available'
        );
      }

      const { data } =
        await authAPI.refreshToken(refreshToken);

      localStorage.setItem(
        'token',
        data.token
      );

      setToken(data.token);

      if (data.refreshToken) {
        localStorage.setItem(
          'refreshToken',
          data.refreshToken
        );

        setRefreshToken(data.refreshToken);
      }

      return data.token;
    } catch (err) {
      console.error(
        'Token refresh failed:',
        err
      );

      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');

      setToken(null);
      setRefreshToken(null);
      setUser(null);

      throw err;
    }
  };

  // =====================================================
  // UPDATE USER
  // =====================================================
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  // =====================================================
  // CONTEXT VALUE
  // =====================================================
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

    isAuthenticated: !!token && !!user,
  };

  // =====================================================
  // PROVIDER
  // =====================================================
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
