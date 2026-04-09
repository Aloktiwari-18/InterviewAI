import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
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
    return Promise.reject(error.response?.data?.error || error.message || 'Something went wrong');
  }
);

// Auth
export const authAPI = {
  login: (d) => api.post('/auth/login', d),
  register: (d) => api.post('/auth/register', d),
  me: () => api.get('/auth/me'),
};

// Interview
export const interviewAPI = {
  generateQuestions: (d) => api.post('/interview/generate-questions', d),
  start: (id) => api.post(`/interview/start/${id}`),
  submitAnswer: (id, d) => api.post(`/interview/submit-answer/${id}`, d),
  complete: (id) => api.post(`/interview/complete/${id}`),
  getHistory: () => api.get('/interview/history'),
  getById: (id) => api.get(`/interview/${id}`),
};

// Resume
export const resumeAPI = {
  upload: (formData) => api.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  analyze: (d) => api.post('/resume/analyze', d),
  getHistory: () => api.get('/resume/history'),
  getById: (id) => api.get(`/resume/${id}`),
};

// Feedback
export const feedbackAPI = {
  getInterview: (id) => api.get(`/feedback/interview/${id}`),
  getDashboard: () => api.get('/feedback/dashboard'),
};

export default api;
