import React, { createContext, useContext, useState, useEffect } from 'react';
import { getToken, clearToken as clearAuthToken } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [masterKey, setMasterKey] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from sessionStorage on mount
  useEffect(() => {
    const storedUsername = sessionStorage.getItem('username');
    const storedMasterKey = sessionStorage.getItem('masterKey');
    const storedToken = getToken();

    if (storedUsername && storedMasterKey && storedToken) {
      setUser(storedUsername);
      setMasterKey(storedMasterKey);
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  // Login function - store user data in sessionStorage
  const login = (username, masterKeyValue, tokenValue) => {
    setUser(username);
    setMasterKey(masterKeyValue);
    setToken(tokenValue);
    
    // Store in sessionStorage (cleared when browser closes)
    sessionStorage.setItem('username', username);
    sessionStorage.setItem('masterKey', masterKeyValue);
    // Token is stored in localStorage by authService
  };

  // Logout function - clear all stored data
  const logout = () => {
    setUser(null);
    setMasterKey(null);
    setToken(null);
    
    // Clear sessionStorage
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('masterKey');
    
    // Clear token from localStorage
    clearAuthToken();
  };

  const value = {
    user,
    masterKey,
    token,
    loading,
    isAuthenticated: !!user && !!masterKey && !!token,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
