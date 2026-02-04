// AppRoutes.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext'; // Asegúrate que la ruta sea correcta
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './ProtectedRoute';

const AppRoutes = () => {
  // EXTRAE TODO AQUÍ
  const { isAuthenticated, isLoading, user } = useAuth();

  // Si isLoading es true, se queda aquí. 
  // Si nunca cambia a false en el Context, verás pantalla blanca o el spinner.
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" replace />} 
        />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard /> 
            </ProtectedRoute>
          } 
        />

        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
};
