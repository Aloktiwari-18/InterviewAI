import axios from 'axios';

// ✅ Normalize baseURL - remove trailing slash to prevent double slashes
const normalizeURL = (url) => {
  if (!url) return 'http://localhost:5000';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const api = axios.create({
  baseURL: normalizeURL(process.env.REACT_APP_API_URL),
  timeout: 60000,
});

// ✅ FIX 1: REQUEST INTERCEPTOR - Add token & handle errors
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ FIX 2: RESPONSE INTERCEPTOR - Handle token refresh & errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ✅ Don't retry logout on 401 - just let it succeed silently
    if (originalRequest?.url?.includes('/auth/logout')) {
      return Promise.resolve({ data: { success: true } });
    }

    // ✅ Handle 401 Unauthorized (token expired or invalid)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          // Try to refresh the token
          const { data } = await axios.post(
            `${normalizeURL(process.env.REACT_APP_API_URL)}/api/auth/refresh`,
            { refreshToken },
            { timeout: 60000 }
          );

          // Store new tokens
          localStorage.setItem('token', data.token);
          if (data.refreshToken) {
            localStorage.setItem('refreshToken', data.refreshToken);
          }

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${data.token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - clear auth and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }

      // No refresh token - redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }

    // ✅ Better error message extraction
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Something went wrong';

    return Promise.reject(message);
  }
);

// ================= AUTH =================
export const authAPI = {
  login: (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
  me: () => api.get('/api/auth/me'),
  logout: () => api.post('/api/auth/logout'),
  refreshToken: (refreshToken) => 
    api.post('/api/auth/refresh', { refreshToken }),
};


// ================= INTERVIEW =================
export const interviewAPI = {
  generateQuestions: (data) =>
    api.post('/api/interview/generate-questions', data),

  start: (id) =>
    api.post(`/api/interview/start/${id}`),

  submitAnswer: (id, data) =>
    api.post(`/api/interview/submit-answer/${id}`, data),

  complete: (id) =>
    api.post(`/api/interview/complete/${id}`),

  logViolation: (data) =>
    api.post('/api/interview/violation', data),

  getHistory: () =>
    api.get('/api/interview/history'),

  getById: (id) =>
    api.get(`/api/interview/${id}`),
};


// ================= RESUME =================
export const resumeAPI = {
  upload: (formData) =>
    api.post('/api/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  analyze: (data) =>
    api.post('/api/resume/analyze', data),

  getHistory: () =>
    api.get('/api/resume/history'),

  getById: (id) =>
    api.get(`/api/resume/${id}`),
};


// ================= FEEDBACK =================
export const feedbackAPI = {
  getInterview: (id) =>
    api.get(`/api/feedback/interview/${id}`),

  getDashboard: () =>
    api.get('/api/feedback/dashboard'),
};

export default api;