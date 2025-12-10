import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);
          originalRequest.headers.Authorization = `Bearer ${access}`;

          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (data: { username: string; email: string; password: string; password2: string }) => {
    try {
      const response = await api.post('/auth/register/', data);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw error;
      } else if (error.request) {
        throw new Error('Network error: Could not reach the server. Make sure the backend is running.');
      } else {
        throw new Error('An unexpected error occurred');
      }
    }
  },
  
  login: async (credentials: { username: string; password: string }) => {
    try {
      const response = await api.post('/auth/login/', credentials);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw error;
      } else if (error.request) {
        throw new Error('Network error: Could not reach the server. Make sure the backend is running.');
      } else {
        throw new Error('An unexpected error occurred');
      }
    }
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/profile/');
    return response.data;
  },
  
  updateProfile: async (data: any) => {
    const response = await api.put('/auth/profile/', data);
    return response.data;
  },
};

// Posts API
export const postsAPI = {
  getAll: async (params?: { platform?: string; status?: string; search?: string; ordering?: string }) => {
    const response = await api.get('/posts/', { params });
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/posts/${id}/`);
    return response.data;
  },
  
  create: async (data: { platform: string; content: string; media_url?: string; scheduled_time: string }) => {
    const response = await api.post('/posts/', data);
    return response.data;
  },
  
  update: async (id: number, data: Partial<{ platform: string; content: string; media_url?: string; scheduled_time: string }>) => {
    const response = await api.put(`/posts/${id}/`, data);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/posts/${id}/`);
    return response.data;
  },
  
  cancel: async (id: number) => {
    const response = await api.post(`/posts/${id}/cancel/`);
    return response.data;
  },
  
  getStats: async () => {
    const response = await api.get('/posts/stats/');
    return response.data;
  },
};

// Social Accounts API
export const socialAccountsAPI = {
  getAll: async () => {
    const response = await api.get('/social-accounts/');
    return response.data;
  },
  
  getStatus: async () => {
    const response = await api.get('/social-accounts/status/');
    return response.data;
  },
  
  connect: async (platform: string) => {
    const response = await api.post(`/oauth/initiate/${platform}/`);
    return response.data;
  },
  
  disconnect: async (id: number) => {
    const response = await api.post(`/social-accounts/${id}/disconnect/`);
    return response.data;
  },
};

export default api;

