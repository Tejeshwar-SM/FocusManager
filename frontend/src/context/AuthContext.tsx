import React, { createContext, useState, useEffect, ReactNode } from "react";
import AuthService from "../services/AuthService"; // Import AuthService instead of axios

//define user type
interface User {
  id: string;
  name: string;
  email: string;
}

//define context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

//create context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  error: null,
  register: async () => {},
  login: async () => {},
  logout: async () => {},
});

//props type
interface AuthProviderProps {
  children: ReactNode;
}

//create provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  //load user from localstorage on initial render
  // Check auth status on initial load
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const storedUserData = localStorage.getItem("userData");

        if (!token || !storedUserData) {
          // No token or user data found
          setLoading(false);
          return;
        }

        // Try to verify token by making a request to get current user
        const response = await AuthService.getCurrentUser();

        if (response.success) {
          // Token is valid, update user data
          const userData = {
            id: response.data.id,
            name: response.data.name,
            email: response.data.email,
          };
          setUser(userData);
          localStorage.setItem("userData", JSON.stringify(userData));
        } else {
          // Token might be invalid, clear storage
          localStorage.removeItem("accessToken");
          localStorage.removeItem("userData");
        }
      } catch (error) {
        console.error("Auth verification error:", error);
        // Clear potentially invalid data
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userData");
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  //register user
  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      // Use AuthService
      const response = await AuthService.register(name, email, password);

      // Store user data separately from token
      const userData = {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
      };

      setUser(userData);
      localStorage.setItem("userData", JSON.stringify(userData));
    } catch (error: any) {
      setError(error.response?.data?.message || "Registration Failed");
      console.error("Registration error:", error);
      throw error; // Rethrow to allow component to handle it
    } finally {
      setLoading(false);
    }
  };

  //login user
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      // Use AuthService
      const response = await AuthService.login(email, password);

      // Store user data separately from token
      const userData = {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
      };

      setUser(userData);
      localStorage.setItem("userData", JSON.stringify(userData));
    } catch (error: any) {
      setError(error.response?.data?.message || "Login failed");
      console.error("Login error:", error);
      throw error; // Rethrow to allow component to handle it
    } finally {
      setLoading(false);
    }
  };

  //logout user
  const logout = async () => {
    try {
      await AuthService.logout(); // Use AuthService
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clean up local storage and state
      localStorage.removeItem("userData");
      localStorage.removeItem("accessToken");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, error, register, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

//custom hook for using auth context
export const useAuth = () => React.useContext(AuthContext);
