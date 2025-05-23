import axios from 'axios';
import socketService from './SocketService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true // Important for cookies
});

// Add request interceptor for tokens and debugging
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Add request debugging
    if (config.method === 'post' || config.method === 'put') {
      console.log(`${config.method.toUpperCase()} request to ${config.url}:`, config.data);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for token refresh and error debugging
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Enhanced error logging
    if (error.response) {
      console.error(`${error.response.status} Error:`, {
        url: originalRequest.url,
        method: originalRequest.method,
        data: originalRequest.data,
        response: error.response.data
      });
    }
    
    // Don't retry if it's already a retry or refresh endpoint
    if (originalRequest._retry || originalRequest.url === '/auth/refresh') {
      return Promise.reject(error);
    }
    
    // If error is 401 and not already retrying
    if (error.response?.status === 401) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const { data } = await axios.post(
          `${API_URL}/auth/refresh`, 
          {}, 
          { withCredentials: true }
        );
        
        if (data.success && data.data.accessToken) {
          // Store the new token
          localStorage.setItem('accessToken', data.data.accessToken);
          
          // Update the original request with new token
          originalRequest.headers['Authorization'] = `Bearer ${data.data.accessToken}`;
          
          // Retry the original request
          return api(originalRequest);
        } else {
          throw new Error('Failed to refresh token');
        }
      } catch (refreshError) {
        // If refresh fails, redirect to login and disconnect socket
        console.error('Failed to refresh token:', refreshError);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userData');
        socketService.disconnect();
        
        // Only redirect if we're in a browser context
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;