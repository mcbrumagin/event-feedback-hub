import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { loginAdmin as apiLoginAdmin } from '@/lib/graphql';
import { log } from '@/lib/logger';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'event-feedback-hub-admin-token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    // Initialize from localStorage
    return localStorage.getItem(TOKEN_KEY);
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persist token to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  const login = useCallback(async (password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      log.info('Attempting login');
      const result = await apiLoginAdmin(password);
      setToken(result.token);
      log.info('Login successful');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      log.error('Login failed', { error: message });
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    log.info('Logging out');
    setToken(null);
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        token,
        login,
        logout,
        isLoading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
