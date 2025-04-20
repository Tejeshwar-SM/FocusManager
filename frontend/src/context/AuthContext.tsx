import React, { createContext, useState, useEffect, ReactNode } from "react";
import AuthService from "../services/AuthService";
import socketService from "../services/SocketService";

// Define user type
interface User {
  id: string;
  name: string;
  email: string;
}

// Define context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  theme: "light" | "dark";
  toggleTheme: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  error: null,
  theme: "light",
  toggleTheme: () => {},
  register: async () => {},
  login: async () => {},
  logout: async () => {},
});

// Props type
interface AuthProviderProps {
  children: ReactNode;
}

// Create provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "light";
  });

  // Toggle theme function
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  // Load user from localStorage on initial render and apply theme
  useEffect(() => {
    // Apply theme when it changes
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);

    const verifyAuth = async () => {
      try {
        const storedData = localStorage.getItem("userData");
        const token = localStorage.getItem("accessToken");

        // If we have both user data and token, check if token is valid
        if (storedData && token) {
          const userData = JSON.parse(storedData);
          
          try {
            // Verify with backend if token is valid
            const isValid = await AuthService.validateToken();
            
            if (isValid) {
              // If valid, set user and connect socket
              setUser(userData);
              socketService.connect();
            } else {
              // If not valid, clear storage
              console.log("Invalid token - clearing auth state");
              localStorage.removeItem("accessToken");
              localStorage.removeItem("userData");
              setUser(null);
            }
          } catch (error) {
            console.error("Token validation error:", error);
            // If verification fails, clear storage
            localStorage.removeItem("accessToken");
            localStorage.removeItem("userData");
            setUser(null);
          }
        } else {
          // If no token or user data, set user to null
          setUser(null);
        }
      } catch (error) {
        console.error("Auth verification error:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, [theme]);

  // Register user
  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await AuthService.register(name, email, password);
      if (response.success) {
        setUser({
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
        });
      } else {
        setError(response.message || "Registration failed");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      setError(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await AuthService.login(email, password);
      if (response.success) {
        setUser({
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
        });
      } else {
        setError(response.message || "Login failed");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clear local state regardless of API success
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userData");
      socketService.disconnect();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        theme,
        toggleTheme,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => React.useContext(AuthContext);