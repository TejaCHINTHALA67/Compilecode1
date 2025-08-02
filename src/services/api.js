import axios from 'axios';

// Base URL configuration
const BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' 
  : 'https://your-production-api.com/api';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.log('Unauthorized access - redirecting to login');
    }
    return Promise.reject(error);
  }
);

// Helper function to add auth header
const withAuth = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: (token) => api.post('/auth/logout', {}, withAuth(token)),
  getProfile: (token) => api.get('/auth/me', withAuth(token)),
  updateProfile: (data, token) => api.put('/auth/profile', data, withAuth(token)),
  changePassword: (currentPassword, newPassword, token) => 
    api.put('/auth/change-password', { currentPassword, newPassword }, withAuth(token)),
  verifyEmail: (code, token) => api.post('/auth/verify-email', { verificationCode: code }, withAuth(token)),
};

// Startups API
export const startupsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/startups?${query}`);
  },
  getFeatured: (limit = 10) => api.get(`/startups/featured?limit=${limit}`),
  getTrending: (limit = 20) => api.get(`/startups/trending?limit=${limit}`),
  getById: (id, token) => api.get(`/startups/${id}`, token ? withAuth(token) : {}),
  create: (data, token) => api.post('/startups', data, withAuth(token)),
  update: (id, data, token) => api.put(`/startups/${id}`, data, withAuth(token)),
  delete: (id, token) => api.delete(`/startups/${id}`, withAuth(token)),
  like: (id, token) => api.post(`/startups/${id}/like`, {}, withAuth(token)),
  bookmark: (id, token) => api.post(`/startups/${id}/bookmark`, {}, withAuth(token)),
  addUpdate: (id, updateData, token) => api.post(`/startups/${id}/updates`, updateData, withAuth(token)),
  getMyStartups: (params, token) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/startups/user/my-startups?${query}`, withAuth(token));
  },
  uploadFiles: (id, formData, token) => {
    return api.post(`/startups/${id}/upload`, formData, {
      ...withAuth(token),
      headers: {
        ...withAuth(token).headers,
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Investments API
export const investmentsAPI = {
  create: (data, token) => api.post('/investments', data, withAuth(token)),
  getPortfolio: (token) => api.get('/investments/portfolio', withAuth(token)),
};

// Payments API
export const paymentsAPI = {
  createRazorpayOrder: (amount, currency, token) => 
    api.post('/payments/razorpay/create-order', { amount, currency }, withAuth(token)),
  createStripeIntent: (amount, currency, token) => 
    api.post('/payments/stripe/create-intent', { amount, currency }, withAuth(token)),
  verifyPayment: (paymentData, token) => 
    api.post('/payments/verify', paymentData, withAuth(token)),
};

// Users API
export const usersAPI = {
  getById: (id) => api.get(`/users/${id}`),
  getTopInvestors: (limit = 10) => api.get(`/users/leaderboard/investors?limit=${limit}`),
};

// Community API
export const communityAPI = {
  getSectorDiscussions: (sector, token) => api.get(`/community/sectors/${sector}`, withAuth(token)),
};

// Analytics API
export const analyticsAPI = {
  getInvestmentsBySector: (token) => api.get('/analytics/investments/by-sector', withAuth(token)),
  getPortfolioPerformance: (token) => api.get('/analytics/portfolio/performance', withAuth(token)),
};

// Recommendations API
export const recommendationsAPI = {
  getStartupRecommendations: (params, token) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/recommendations/startups?${query}`, withAuth(token));
  },
  getInvestorRecommendations: (startupId, params, token) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/recommendations/investors/${startupId}?${query}`, withAuth(token));
  },
  getTrendingSectors: (token) => api.get('/recommendations/trending-sectors', withAuth(token)),
  updatePreferences: (preferences, token) => api.put('/recommendations/preferences', preferences, withAuth(token)),
  getStartupInsights: (startupId, token) => api.get(`/recommendations/insights/startup/${startupId}`, withAuth(token)),
  suggestInvestment: (data, token) => api.post('/recommendations/suggest-investment', data, withAuth(token)),
  updateAIScores: (token) => api.post('/recommendations/update-scores', {}, withAuth(token)),
};

// File upload helper
export const uploadHelper = {
  createFormData: (files) => {
    const formData = new FormData();
    
    Object.keys(files).forEach(key => {
      if (Array.isArray(files[key])) {
        files[key].forEach((file, index) => {
          formData.append(key, file);
        });
      } else if (files[key]) {
        formData.append(key, files[key]);
      }
    });
    
    return formData;
  },
};

// Export the main api instance as well
export default api;