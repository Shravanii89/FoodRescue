import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('foodrescue_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('foodrescue_token') || null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch current user details & notifications
  const refreshUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get('/auth/me');
      if (res.data?.success && res.data.user) {
        setUser(res.data.user);
        localStorage.setItem('foodrescue_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.warn('Failed to refresh user profile:', err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const refreshNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiClient.get('/notifications');
      if (res.data?.success) {
        setNotifications(res.data.data || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Could not fetch notifications:', err.message);
    }
  }, [token]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (token && user) {
      refreshNotifications();
      const interval = setInterval(refreshNotifications, 20000); // Poll every 20s
      return () => clearInterval(interval);
    }
  }, [token, user, refreshNotifications]);

  const login = async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password });
    if (res.data?.success) {
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('foodrescue_token', newToken);
      localStorage.setItem('foodrescue_user', JSON.stringify(newUser));
      refreshNotifications();
      return newUser;
    }
    throw new Error(res.data?.message || 'Login failed.');
  };

  const register = async (userData) => {
    const res = await apiClient.post('/auth/register', userData);
    if (res.data?.success) {
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('foodrescue_token', newToken);
      localStorage.setItem('foodrescue_user', JSON.stringify(newUser));
      refreshNotifications();
      return newUser;
    }
    throw new Error(res.data?.message || 'Registration failed.');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('foodrescue_token');
    localStorage.removeItem('foodrescue_user');
  };

  const updateUser = (updatedData) => {
    const updated = { ...user, ...updatedData };
    setUser(updated);
    localStorage.setItem('foodrescue_user', JSON.stringify(updated));
  };

  const markNotificationRead = async (id) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await apiClient.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  // Quick Demo Login helper for 1-click login during viva / presentations
  const quickDemoLogin = async (role) => {
    const credentialsMap = {
      admin: { email: 'admin@foodrescue.org', password: 'AdminPassword123!' },
      donor: { email: 'donor@foodrescue.org', password: 'DonorPassword123!' },
      recipient: { email: 'ngo@foodrescue.org', password: 'NgoPassword123!' },
      pending_ngo: { email: 'newngo@shelter.org', password: 'NgoPassword123!' }
    };
    const creds = credentialsMap[role];
    if (creds) {
      return await login(creds.email, creds.password);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    notifications,
    unreadCount,
    refreshNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    quickDemoLogin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
