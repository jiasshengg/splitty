import { createContext, useContext, useEffect, useState } from 'react';
import { checkSession } from '@/lib/session';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = async () => {
    setIsLoading(true);

    try {
      const isLoggedIn = await checkSession();
      setIsAuthenticated(isLoggedIn);
      return isLoggedIn;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        refreshSession,
        markLoggedIn() {
          setIsAuthenticated(true);
          setIsLoading(false);
        },
        markLoggedOut() {
          setIsAuthenticated(false);
          setIsLoading(false);
        },
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
