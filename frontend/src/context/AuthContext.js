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

  // 🔐 Set axios default header (optional but fine)
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // 🔄 Fetch current user
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const { data } = await authAPI.me(); // ✅ FIXED
          setUser(data.user);
        } catch {
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  // 🔑 LOGIN (FIXED)
  const login = async (email, password) => {
    try {
      const { data } = await authAPI.login({ email, password }); // ✅ FIXED

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);

      return data.user;
    } catch (err) {
      const message =
        typeof err === "string"
          ? err
          : err?.message || "Login failed";

      toast.error(message);
      throw err;
    }
  };

  // 📝 REGISTER (FIXED)
  const register = async (name, email, password) => {
    try {
      const { data } = await authAPI.register({ name, email, password }); // ✅ FIXED

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);

      return data.user;
    } catch (err) {
      const message =
        typeof err === "string"
          ? err
          : err?.message || "Register failed";

      toast.error(message);
      throw err;
    }
  };

  // 🚪 LOGOUT
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
  };

  const updateUser = (updatedUser) => setUser(updatedUser);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        login,
        register,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};