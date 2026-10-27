import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('aerosentry_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize and verify authentication state
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('aerosentry_token');
      const savedUser = localStorage.getItem('aerosentry_user');

      if (savedToken && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
          // Verify with backend
          const res = await client.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('aerosentry_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Session verification failed, resetting token.');
          localStorage.removeItem('aerosentry_token');
          localStorage.removeItem('aerosentry_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await client.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token: receivedToken, user: receivedUser } = res.data;
      setToken(receivedToken);
      setUser(receivedUser);
      localStorage.setItem('aerosentry_token', receivedToken);
      localStorage.setItem('aerosentry_user', JSON.stringify(receivedUser));
      return receivedUser;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const register = async (name, email, password, role) => {
    const res = await client.post('/auth/register', { name, email, password, role });
    if (res.data.success) {
      const { token: receivedToken, user: receivedUser } = res.data;
      setToken(receivedToken);
      setUser(receivedUser);
      localStorage.setItem('aerosentry_token', receivedToken);
      localStorage.setItem('aerosentry_user', JSON.stringify(receivedUser));
      return receivedUser;
    }
    throw new Error(res.data.message || 'Registration failed');
  };

  const quickLogin = async (role) => {
    const credentials = {
      admin: { email: 'admin@aerosentry.io', pass: 'Admin@123' },
      operator: { email: 'operator@aerosentry.io', pass: 'Operator@123' },
      rescuer: { email: 'rescuer@aerosentry.io', pass: 'Rescuer@123' },
    };

    const target = credentials[role];
    if (target) {
      return await login(target.email, target.pass);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('aerosentry_token');
    localStorage.removeItem('aerosentry_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        quickLogin,
        logout,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'admin',
        isOperator: user?.role === 'operator' || user?.role === 'admin',
        isRescuer: user?.role === 'rescuer',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
