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
      // Handle guest access limit error
      if (error.response?.status === 403 && error.response?.data?.access_limit_reached) {
        // Keep user data but mark access as limited
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
          storedUser.access_limit_reached = true;
          setUser(storedUser);
        }
      } else {
        logout();
      }
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
  }, [token]);

  // Check guest access limit and logout if expired
  useEffect(() => {
    if (!user || user.user_type !== 'guest') {
      return;
    }

    const hoursRemaining = getRemainingAccessHours(user);

    // If hours reached 0, logout automatically
    if (hoursRemaining <= 0) {
      logout();
      window.location.href = '/login';
      return;
    }

    // Set up interval to check every minute
    const checkInterval = setInterval(() => {
      const hoursLeft = getRemainingAccessHours(user);
      if (hoursLeft <= 0) {
        logout();
        window.location.href = '/login';
      }
    }, 60000); // Check every 60 seconds

    return () => clearInterval(checkInterval);
  }, [user, token]);

  // Refresh user data (call this after guest accesses a bill)
  const refreshUser = async () => {
    try {
      const response = await userAPI.getProfile();
      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    } catch (error) {
      console.error('Failed to refresh user:', error);
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
    const { email } = response.data;
    // Don't auto-login, just save email for resend verification
    localStorage.setItem('pending_email', email);
    return response.data;
  };

  const guestRegister = async (userData) => {
    // Use registerGuestDirect if no invitation_code, otherwise use registerGuest (with code)
    const endpoint = userData.invitation_code ? 'registerGuest' : 'registerGuestDirect';
    const response = await authAPI[endpoint](userData);
    const { user, token, bill } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    // Return the bill if it exists (for code invitation flow)
    return { user, token, bill: bill || null };
  };

  const guestLogin = async ({ email, invitation_code }) => {
    const response = await authAPI.loginGuest({ email, invitation_code });
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
    refreshUser,
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

  // No baseline set yet, allow access
  if (!accessResetAt) {
    return true;
  }

  const hoursSinceReset = (now - accessResetAt) / (1000 * 60 * 60);

  // Reset after 24 hours
  if (hoursSinceReset >= 24) {
    return true;
  }

  // Check if user has remaining hours (based on actual time elapsed)
  return hoursSinceReset < 6;
}

// Get remaining access hours for guest
function getRemainingAccessHours(user) {
  if (!user || user.user_type !== 'guest') {
    return Infinity; // Unlimited for non-guest
  }

  const now = new Date();
  const accessResetAt = user.access_reset_at ? new Date(user.access_reset_at) : null;

  // Check if we need to reset the daily counter (24 hours have passed)
  if (!accessResetAt) {
    return 6; // No baseline set yet, full 6 hours available
  }

  const hoursSinceReset = (now - accessResetAt) / (1000 * 60 * 60);

  if (hoursSinceReset >= 24) {
    return 6; // Reset after 24 hours
  }

  // Calculate remaining hours based on actual time elapsed
  return Math.max(0, 6 - hoursSinceReset);
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
