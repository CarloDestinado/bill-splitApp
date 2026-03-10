/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI } from '../services/api';

const AuthContext = createContext(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

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

  useEffect(() => {
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
    isStandard: user?.account_type === 'standard',
    canCreateBill: checkCanCreateBill(user),
    canAccessBills: checkGuestAccessLimit(user),
    remainingAccessHours: getRemainingAccessHours(user),
    canAddPersonToBill: (currentPersonCount) => checkCanAddPerson(user, currentPersonCount),
    remainingBillsThisMonth: getRemainingBillsThisMonth(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Check if guest user has remaining access hours
function checkGuestAccessLimit(user) {
  if (!user || user.user_type !== 'guest') {
    return true; // Non-guest users have unlimited access
  }

  const now = new Date();
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

// Check if user can create a new bill (5 bills/month for standard, unlimited for premium)
function checkCanCreateBill(user) {
  if (!user) return false;
  
  // Premium users have unlimited bills
  if (user.account_type === 'premium') {
    return true;
  }
  
  // Guest users cannot create bills
  if (user.user_type === 'guest') {
    return false;
  }
  
  // Standard users: check monthly limit
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Check if the bill counter needs to be reset (new month)
  const lastBillMonth = user.last_bill_month ?? -1;
  const lastBillYear = user.last_bill_year ?? -1;
  
  if (currentMonth !== lastBillMonth || currentYear !== lastBillYear) {
    return true; // New month, counter reset
  }
  
  // Check if under the 5 bill limit
  return (user.bills_created_count || 0) < 5;
}

// Get remaining bills user can create this month
function getRemainingBillsThisMonth(user) {
  if (!user) return 0;
  
  // Premium users have unlimited bills
  if (user.account_type === 'premium') {
    return Infinity;
  }
  
  // Guest users cannot create bills
  if (user.user_type === 'guest') {
    return 0;
  }
  
  // Standard users: check monthly limit
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Check if the bill counter needs to be reset (new month)
  const lastBillMonth = user.last_bill_month ?? -1;
  const lastBillYear = user.last_bill_year ?? -1;
  
  if (currentMonth !== lastBillMonth || currentYear !== lastBillYear) {
    return 5; // New month, full allowance
  }
  
  // Return remaining bills
  return Math.max(0, 5 - (user.bills_created_count || 0));
}

// Check if user can add more people to a bill (3 max for standard, unlimited for premium)
function checkCanAddPerson(user, currentPersonCount) {
  if (!user) return false;
  
  // Premium users can add unlimited people
  if (user.account_type === 'premium') {
    return true;
  }
  
  // Standard users: max 3 people per bill
  return currentPersonCount < 3;
}

export { useAuth, AuthProvider };
