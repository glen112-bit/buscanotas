import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import  type { User, AuthContextType } from './types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

const registerUser = async (name: string, email: string, pass: string) => {
  try {
    const response = await fetch('https://tu-api.com/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, pass }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error al crear la cuenta");
    }

    const data = await response.json();

    // Logueo automático tras registro
    setUser(data.user);
    localStorage.setItem('app_user', JSON.stringify(data.user));
    localStorage.setItem('auth_token', data.token);

  } catch (error) {
    if (error instanceof TypeError) throw new Error("No hay conexión a internet");
    throw error;
  }
};

  // 1. Efecto para persistencia de sesión
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedUser = localStorage.getItem('app_user');
        if (savedUser) {
          // Simulamos una pequeña espera para el spinner
          // await new Promise(resolve => setTimeout(resolve, 500));
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error("Error al cargar usuario del storage", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  // 2. Función de Login
  const login = async (email: string, pass: string) => {
    try {
      const response = await fetch('https://tu-api.com/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // ¡Importante para fetch!
        body: JSON.stringify({ email, pass }),
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error("Credenciales incorrectas");
        if (response.status === 500) throw new Error("Error en el servidor");
        throw new Error("Algo salió mal");
      }

      const data = await response.json();

      // Guardamos en estado y storage
      setUser(data.user);
      localStorage.setItem('app_user', JSON.stringify(data.user));
      localStorage.setItem('auth_token', data.token);

    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error("No hay conexión a internet");
      }
      throw error;
    }
  };

  // 3. Función de Logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem('app_user');
    localStorage.removeItem('auth_token');
  };

  return (

    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      registerUser,
      isAuthenticated: !!user, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return context;
};
