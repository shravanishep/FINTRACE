import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

interface AuthContextType {
  token: string | null;
  username: string | null;
  isAuthenticated: boolean;
  login: (username: string, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('fintrace_token'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('fintrace_user'));

  useEffect(() => {
    if (token) {
      authApi.getMe().catch(() => {
        logout();
      });
    }
  }, []);

  const login = (newUsername: string, newToken: string) => {
    localStorage.setItem('fintrace_token', newToken);
    localStorage.setItem('fintrace_user', newUsername);
    setToken(newToken);
    setUsername(newUsername);
  };

  const logout = () => {
    localStorage.removeItem('fintrace_token');
    localStorage.removeItem('fintrace_user');
    setToken(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        username,
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
