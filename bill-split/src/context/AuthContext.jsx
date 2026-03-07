import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadUser = async () => {
    try {
      const response = await userAPI.getProfile();
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to load user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { user, token } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    return response.data;
  };

  const register = async (userData) => {
    const response = await authAPI.register(userData);
    const { user, token } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    return response.data;
  };

  const guestRegister = async (userData) => {
    const response = await authAPI.registerGuest(userData);
    const { user, token } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    return response.data;
  };

  const guestLogin = async (email) => {
    const response = await authAPI.loginGuest({ email });
    const { user, token } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    return response.data;
  };

  const upgradeToRegistered = async (passwordData) => {
    const response = await authAPI.upgradeToRegistered(passwordData);
    const updatedUser = response.data.user;
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return response.data;
  };

  const logout = () => {
    authAPI.logout().catch(() => {});
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    guestRegister,
    guestLogin,
    logout,
    upgradeToRegistered,
    updateUser,
    isGuest: user?.user_type === 'guest',
    isPremium: user?.account_type === 'premium',
    canCreateBill: user?.account_type === 'premium' || (user?.bills_created_count || 0) < 5,
    canAccessBills: checkGuestAccessLimit(user),
    remainingAccessHours: getRemainingAccessHours(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Check if guest user has remaining access hours
function checkGuestAccessLimit(user) {
  if (!user || user.user_type !== 'guest') {
    return true; // Non-guest users have unlimited access
  }

  const now = new Date();
  const lastAccess = user.last_access_time ? new Date(user.last_access_time) : null;
  const accessResetAt = user.access_reset_at ? new Date(user.access_reset_at) : null;

  // Check if we need to reset the daily counter
  if (accessResetAt) {
    const hoursSinceReset = (now - accessResetAt) / (1000 * 60 * 60);
    if (hoursSinceReset >= 24) {
      return true; // Reset after 24 hours
    }
  }

  // Check if user has remaining hours
  return (user.access_hours_used || 0) < 6;
}

// Get remaining access hours for guest
function getRemainingAccessHours(user) {
  if (!user || user.user_type !== 'guest') {
    return Infinity; // Unlimited for non-guest
  }

  const now = new Date();
  const accessResetAt = user.access_reset_at ? new Date(user.access_reset_at) : null;

  // Check if we need to reset the daily counter
  if (accessResetAt) {
    const hoursSinceReset = (now - accessResetAt) / (1000 * 60 * 60);
    if (hoursSinceReset >= 24) {
      return 6; // Reset after 24 hours
    }
  }

  return Math.max(0, 6 - (user.access_hours_used || 0));
}
