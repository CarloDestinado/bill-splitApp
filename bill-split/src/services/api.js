import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/register', data),
  login: (data) => api.post('/login', data),
  logout: () => api.post('/logout'),
  registerGuest: (data) => api.post('/guest/register', data),
  loginGuest: (data) => api.post('/guest/login', data),
  upgradeToRegistered: (data) => api.post('/upgrade-account', data),
  forgotPassword: (data) => api.post('/forgot-password', data),
  resetPassword: (data) => api.post('/reset-password', data),
};

// User APIs
export const userAPI = {
  getProfile: () => api.get('/user'),
  updateProfile: (data) => api.put('/user/update', data),
  upgradeToPremium: (data) => api.post('/user/upgrade-premium', data),
};

// Bill APIs
export const billAPI = {
  getAll: () => api.get('/bills'),
  create: (data) => api.post('/bills', data),
  getById: (id) => api.get(`/bills/${id}`),
  update: (id, data) => api.put(`/bills/${id}`, data),
  delete: (id) => api.delete(`/bills/${id}`),
  share: (id, data) => api.post(`/bills/${id}/share`, data),
  getUsers: (id) => api.get(`/bills/${id}/users`),
};

// Invitation APIs
export const invitationAPI = {
  verifyCode: (data) => api.post('/verify-invitation', data),
  checkEmail: (data) => api.post('/guest/check-email', data),
  create: (data) => api.post('/invitations/create', data),
  accept: (id) => api.post(`/invitations/${id}/accept`),
};

export default api;
