import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { checkSession } from '@/lib/session';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const validateSession = async () => {
      const isLoggedIn = await checkSession();

      if (!isMounted) {
        return;
      }

      setIsAuthenticated(isLoggedIn);
    };

    validateSession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isAuthenticated === null) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;