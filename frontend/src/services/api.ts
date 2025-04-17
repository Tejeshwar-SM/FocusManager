import axios from 'axios';
import socketService from './SocketService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true // Important for cookies
});

// Add request interceptor for tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry && error.response?.data?.expired) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const { data } = await axios.post(
          `${API_URL}/auth/refresh`, 
          {}, 
          { withCredentials: true }
        );
        
        // Store the new token
        localStorage.setItem('accessToken', data.data.accessToken);
        
        // Update the original request with new token
        originalRequest.headers['Authorization'] = `Bearer ${data.data.accessToken}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login and disconnect socket
        localStorage.removeItem('accessToken');
        socketService.disconnect();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;