import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getTimeDifference } from '../utils/timeUtils';

// Set Axios base URL to Flask backend - use environment variable if available
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
axios.defaults.baseURL = API_BASE_URL;

interface User {
  id: number;
  username: string;
  email: string;
  // Add more fields as needed
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  timeDifference: number; // Time difference between server and client
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }: { children: React.ReactNode }) => {
  // Initialize state from localStorage if available
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const storedAuth = localStorage.getItem('isAuthenticated');
    return storedAuth === 'true';
  });

  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error('Failed to parse stored user data:', e);
      return null;
    }
  });

  // Track time difference between server and client
  const [timeDifference, setTimeDifference] = useState<number>(0);

  // Expose checkAuth so it can be called on-demand, wrapped in useCallback to prevent recreation on every render
  const checkAuth = useCallback(async () => {
    // Get adjusted time (accounting for server-client time difference)
    const now = Date.now() + timeDifference;

    // Check if we've recently verified auth status (within last 2 minutes)
    const lastAuthCheck = localStorage.getItem('lastAuthCheck');

    if (lastAuthCheck && (now - parseInt(lastAuthCheck)) < 2 * 60 * 1000) {
      // Use cached auth status if it's recent
      const storedAuth = localStorage.getItem('isAuthenticated');
      const storedUser = localStorage.getItem('user');

      if (storedAuth === 'true' && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setIsAuthenticated(true);
          setUser(parsedUser);
          console.log('Using cached auth status (checked within last 2 minutes)');
          return;
        } catch (e) {
          console.error('Failed to parse stored user data:', e);
        }
      }
    }

    try {
      const response = await axios.get('/api/auth/check', { withCredentials: true });
      const data = response.data as { authenticated: boolean; user: User };

      // Update the last check timestamp with adjusted time
      localStorage.setItem('lastAuthCheck', now.toString());

      if (data.authenticated) {
        setIsAuthenticated(true);
        setUser(data.user);
        // Store authentication state in localStorage for persistence
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        setIsAuthenticated(false);
        setUser(null);
        // Clear authentication state from localStorage
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
      }
    } catch (error) {
      // Try to recover from localStorage if server check fails
      const storedAuth = localStorage.getItem('isAuthenticated');
      const storedUser = localStorage.getItem('user');

      if (storedAuth === 'true' && storedUser) {
        try {
          setIsAuthenticated(true);
          setUser(JSON.parse(storedUser));
          console.warn('Using cached authentication due to server error');
          return;
        } catch (e) {
          console.error('Failed to parse stored user data:', e);
        }
      }

      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      console.error('Auth check failed:', error);
    }
  }, [timeDifference, setIsAuthenticated, setUser]);

  // Synchronize time with server
  useEffect(() => {
    const syncTime = async () => {
      try {
        const diff = await getTimeDifference();
        setTimeDifference(diff);
        console.log(`Time difference between server and client: ${diff}ms`);
      } catch (error) {
        console.error('Failed to synchronize time with server:', error);
      }
    };

    // Sync time on mount
    syncTime();

    // Set up periodic time sync (every hour)
    const timeInterval = setInterval(syncTime, 60 * 60 * 1000);

    return () => {
      clearInterval(timeInterval);
    };
  }, []);

  // Check authentication on mount and periodically to handle session timeouts
  useEffect(() => {
    // Initial auth check
    checkAuth();

    // Set up periodic check (every 30 minutes)
    const interval = setInterval(checkAuth, 30 * 60 * 1000);

    // Set up event listeners for user activity, but with throttling
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    let activityTimeout: NodeJS.Timeout | null = null;
    let lastAuthCheck = Date.now() + timeDifference;
    const MIN_AUTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes minimum between checks

    const handleUserActivity = () => {
      // Clear existing timeout
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }

      // Only set a new timeout if we haven't checked auth recently
      activityTimeout = setTimeout(() => {
        // Use adjusted time
        const now = Date.now() + timeDifference;
        if (isAuthenticated && (now - lastAuthCheck > MIN_AUTH_CHECK_INTERVAL)) {
          checkAuth();
          lastAuthCheck = now;
        }
      }, 5 * 60 * 1000); // 5 minutes of inactivity before checking
    };

    // Add event listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });

    // Set up axios interceptor to handle 401 responses
    const interceptorId = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && error.response.status === 401 && isAuthenticated) {
          // Session expired, update auth state
          setIsAuthenticated(false);
          setUser(null);
          // You could also redirect to login or show a notification here
        }
        return Promise.reject(error);
      }
    );

    // Cleanup function
    return () => {
      clearInterval(interval);
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      axios.interceptors.response.eject(interceptorId);
    };
  }, [isAuthenticated, checkAuth, timeDifference]); // Re-run if authentication state changes

  const login = async (username: string, password: string) => {
    try {
      // Clear any existing user data from localStorage before login
      localStorage.removeItem('parsed-profile');
      localStorage.removeItem('cv-analysis');
      localStorage.removeItem('chatSessions');
      localStorage.removeItem('interview-sessions');

      // Clear sessionStorage data
      sessionStorage.clear();

      // Clear any other user-specific data
      const keysToKeep = ['theme', 'isAuthenticated', 'user', 'lastAuthCheck'];
      Object.keys(localStorage).forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });

      const response = await axios.post('/api/auth/login', {
        username,
        password
      }, { withCredentials: true });

      const data = response.data as { user: User };
      setIsAuthenticated(true);
      setUser(data.user);

      // Store authentication state in localStorage
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (error: any) {
      console.error('Login failed:', error);
      throw new Error(
        error.response?.data?.error || error.message || 'An unexpected error occurred'
      );
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      // Clear any existing user data from localStorage before registration
      localStorage.removeItem('parsed-profile');
      localStorage.removeItem('cv-analysis');
      localStorage.removeItem('chatSessions');
      localStorage.removeItem('interview-sessions');

      // Clear sessionStorage data
      sessionStorage.clear();

      // Clear any other user-specific data
      const keysToKeep = ['theme', 'isAuthenticated', 'user', 'lastAuthCheck'];
      Object.keys(localStorage).forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });

      await axios.post('/api/auth/register', {
        username,
        email,
        password
      });

      // Automatically log in after successful registration
      await login(username, password);
    } catch (error: any) {
      console.error('Registration failed:', error);
      throw new Error(
        error.response?.data?.error || error.message || 'An unexpected error occurred'
      );
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout', {}, { withCredentials: true });
      setIsAuthenticated(false);
      setUser(null);

      // Clear authentication state from localStorage
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');

      // Clear sessionStorage data
      sessionStorage.clear();
    } catch (error: any) {
      // Even if server logout fails, clear local state
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');

      // Clear sessionStorage data
      sessionStorage.clear();

      console.error('Logout failed:', error);
      throw new Error(
        error.response?.data?.error || error.message || 'An unexpected error occurred'
      );
    }
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      login,
      register,
      logout,
      checkAuth,
      setUser,
      setIsAuthenticated,
      timeDifference
    }}>
      {children}
    </AuthContext.Provider>
  );
};
