import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { Title } from './components/Title';
// 1. ¡IMPORTANTE! Asegúrate de que estas rutas sean correctas según tus carpetas
import { LoginPage } from './pages/LoginPage';
// import { SongDetailPage } from './pages/SongDetailPage';
import { RegisterPage } from './pages/RegisterPage'; 
import { SongDetailPage } from './pages/SongDetailPage'; 
import { Dashboard } from './pages/Dashboard'; // O donde lo hayas guardado

const AppRoutes = () => {
  const [chord, setChord] = useState("---")
  const { user, isLoading } = useAuth(); 
  
  const isAuthenticated = !!user;

  // Pantalla de carga animada
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="relative flex items-center justify-center mb-4">
          <div className="absolute animate-ping h-20 w-20 rounded-full bg-indigo-400 opacity-20"></div>
          <div className="relative h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-12">
            <span className="text-white text-3xl font-bold -rotate-12">M</span>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-700 animate-pulse">
          Cargando tus notas...
        </h2>
        <p className="text-gray-400 text-sm mt-2">Estamos preparando todo para ti</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={
            !isAuthenticated ? 
              <LoginPage /> 
              : 
              <Navigate replace to="/dashboard" 
              />
          } 
        />
        <Route 
          path="/register" 
          element={
            !isAuthenticated 
              ? 
                <RegisterPage /> 
                : 
                <Navigate replace to="/dashboard" 
                />
          } 
        />
        <Route path="/song/:id" 
          element={
            <ProtectedRoute>
              <SongDetailPage />
            </ProtectedRoute>} 
        />
        <Route 
          path="/dashboard" 
          element={
              <Dashboard currentChord={chord}/>
          } 
        />
        <Route 
          path="*" 
          element={
            <Navigate replace to={
            isAuthenticated 
              ? 
                "/dashboard" 
                : "/login"} 
            />
          } 
        />
      </Routes>
    </BrowserRouter>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
