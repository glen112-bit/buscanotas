// ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Si está cargando, no redirigir todavía
  if (isLoading) return null; 

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
