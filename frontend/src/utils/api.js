import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // make sure .env me set ho
  timeout: 60000,
});

// 🔐 REQUEST INTERCEPTOR
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

// 🚨 RESPONSE INTERCEPTOR (FIXED)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 🔒 Unauthorized handling
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    // ✅ ALWAYS RETURN STRING MESSAGE
    const message =
      error.response?.data?.message ||   // backend standard
      error.response?.data?.error ||     // fallback
      error.message ||                   // axios error
      'Something went wrong';

    return Promise.reject(message); // 🔥 IMPORTANT
  }
);


// ================= AUTH =================
export const authAPI = {
  login: (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
  me: () => api.get('/api/auth/me'),
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