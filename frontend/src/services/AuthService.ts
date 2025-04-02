import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"; // Use port 5000

//create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

//request interceptor to add the auth token header to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

//response interceptor to refresh token on receiving token expired error
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      error.response?.data?.expired
    ) {
      originalRequest._retry = true;
      
      try {
        //try to refresh the token
        const { data } = await axios.post(
          `${API_URL}/auth/refreshToken`,
          {},
          { withCredentials: true }
        );
        
        //store the new token in localstorage
        localStorage.setItem("accessToken", data.data.accessToken);

        //update the original request with new token
        originalRequest.headers["Authorization"] = `Bearer ${data.data.accessToken}`;

        //retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        //redirect to login page
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

//auth service
const AuthService = {
  //register a new user
  register: async (name: string, email: string, password: string) => {
    const response = await api.post("/auth/register", {
        name,
        email,
        password
    });

    if(response.data.success) {
        localStorage.setItem("accessToken", response.data.data.accessToken);
    }
    return response.data;
  },

  //login user
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', {
        email,
        password
    });

    if(response.data.success) {
        localStorage.setItem("accessToken", response.data.data.accessToken);
    }
    return response.data;
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

  //logout user
  logout: async ()=> {
    localStorage.removeItem("accessToken");
    return await api.post("/auth/logout");
  }
};

export default AuthService;