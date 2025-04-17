
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

type ProtectedRouteProps = {
  children: React.ReactNode;
  requiredRole: 'student' | 'admin' | 'company';
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // If trying to access company routes, redirect to company login
    if (requiredRole === 'company') {
      return <Navigate to="/company-login" />;
    }
    // For admin or student, redirect to the main login
    return <Navigate to="/login" />;
  }

  if (user?.role !== requiredRole) {
    // If student tries to access admin routes
    if (user?.role === 'student' && requiredRole === 'admin') {
      return <Navigate to="/student/dashboard" />;
    }
    
    // If admin tries to access student routes
    if (user?.role === 'admin' && requiredRole === 'student') {
      return <Navigate to="/admin/dashboard" />;
    }
    
    // If company tries to access student or admin routes
    if (user?.role === 'company' && (requiredRole === 'student' || requiredRole === 'admin')) {
      return <Navigate to="/company/dashboard" />;
    }
    
    // If student or admin tries to access company routes
    if ((user?.role === 'student' || user?.role === 'admin') && requiredRole === 'company') {
      return <Navigate to="/company-login" />;
    }

    // Default fallback redirect to login
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
