import React, { createContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

//define user type
interface User {
    id: string;
    name: string;
    email: string;
    token: string;
}

//define context type
interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    register: (name: string, email: string, password: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

//create context with default values
export const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: false,
    error: null,
    register: async () => {},
    login: async () => {},
    logout: () => {}
});

//props type
interface AuthProviderProps {
    children: ReactNode;
}

//create provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children}) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    //load user from localstorage on initial render
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if(storedUser) {
            setUser(JSON.parse(storedUser));
        }
    },[]);

    //register user
    const register = async (name: string, email: string, password:string) => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/auth/register`,
                {name, email, password}
            );

            const userData = response.data.data;
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
        } catch (error: any) {
            setError(error.response?.data?.message || 'Registration Failed');
            console.error('Registration error:', error);
        } finally {
            setLoading(false);
        }
    };

    //login user
    const login = async (email: string, password: string) => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(
              `${process.env.REACT_APP_API_URL}/api/auth/login`,
              { email, password }
            );

            const userData = response.data.data;
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
        } catch (error: any) {
            setError(error.response?.data?.message || 'Login failed');
            console.error('Login error:', error);
        } finally {
            setLoading(false);
        }
    };

    //logout user
    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value = {{ user, loading, error, register, login, logout}}>
            {children}
        </AuthContext.Provider>
    );
};
//custom hook for using auth context
export const useAuth = () => React.useContext(AuthContext);