import axios from 'axios';

// Backend base URL (e.g., http://localhost:5000 or production domain)
export const BACKEND_URL = (
  import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'https://ai-victim-detction.onrender.com')
).replace(/\/+$/, '');

// Full API endpoint base (e.g., http://localhost:5000/api)
export const API_BASE_URL = (import.meta.env.VITE_API_URL || `${BACKEND_URL}/api`).replace(/\/+$/, '');

/**
 * Resolves full URL for uploaded images/media returned from backend
 */
export const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${BACKEND_URL}${cleanPath}`;
};

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Request Interceptor: Attach JWT Token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('aerosentry_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401s gracefully
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token on 401 Unauthorized
      localStorage.removeItem('aerosentry_token');
      localStorage.removeItem('aerosentry_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;
