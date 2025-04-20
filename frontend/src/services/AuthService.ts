import api from './api';
import socketService from './SocketService';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

console.log("API URL:", API_URL); // Debugging

// Auth service that uses the common api instance
const AuthService = {
  // Register a new user
  register: async (name: string, email: string, password: string) => {
    try {
      console.log("Registering user:", { name, email });
      const response = await api.post("/auth/register", {
        name,
        email,
        password
      });

      if (response.data.success) {
        localStorage.setItem("accessToken", response.data.data.accessToken);
        localStorage.setItem("userData", JSON.stringify({
          id: response.data.data.id,
          name: response.data.data.name,
          email: response.data.data.email
        }));
        socketService.connect();
      }
      return response.data;
    } catch (error: any) {
      console.error("Registration error details:", error.response?.data || error.message);
      throw error;
    }
  },

  // Login user
  login: async (email: string, password: string) => {
    try {
      console.log("Attempting login for:", email);
      
      const response = await api.post('/auth/login', {
        email,
        password
      });

      console.log("Login response:", response.data);

      if (response.data.success) {
        localStorage.setItem("accessToken", response.data.data.accessToken);
        localStorage.setItem("userData", JSON.stringify({
          id: response.data.data.id,
          name: response.data.data.name,
          email: response.data.data.email
        }));
        socketService.connect();
      }
      return response.data;
    } catch (error: any) {
      console.error("Login error details:", error.response?.data || error.message);
      throw error;
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error("Error getting current user:", error);
      throw error;
    }
  },

  // Validate token (to check if user is logged in)
  validateToken: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data.success;
    } catch (error) {
      return false;
    }
  },

  // Logout user
  logout: async () => {
    try {
      const response = await api.post("/auth/logout");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userData");
      socketService.disconnect();
      return response.data;
    } catch (error) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userData");
      socketService.disconnect();
      throw error;
    }
  }
};

export default AuthService;