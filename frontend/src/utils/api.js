import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // ❗ fallback hata diya
  timeout: 60000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(
      error.response?.data?.error || error.message || 'Something went wrong'
    );
  }
);

// Auth
export const authAPI = {
  login: (d) => api.post('/api/auth/login', d),
  register: (d) => api.post('/api/auth/register', d),
  me: () => api.get('/api/auth/me'),
};

// Interview
export const interviewAPI = {
  generateQuestions: (d) => api.post('/api/interview/generate-questions', d),
  start: (id) => api.post(`/api/interview/start/${id}`),
  submitAnswer: (id, d) => api.post(`/api/interview/submit-answer/${id}`, d),
  complete: (id) => api.post(`/api/interview/complete/${id}`),
  getHistory: () => api.get('/api/interview/history'),
  getById: (id) => api.get(`/api/interview/${id}`),
};

// Resume
export const resumeAPI = {
  upload: (formData) =>
    api.post('/api/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  analyze: (d) => api.post('/api/resume/analyze', d),
  getHistory: () => api.get('/api/resume/history'),
  getById: (id) => api.get(`/api/resume/${id}`),
};

// Feedback
export const feedbackAPI = {
  getInterview: (id) => api.get(`/api/feedback/interview/${id}`),
  getDashboard: () => api.get('/api/feedback/dashboard'),
};

export default api;