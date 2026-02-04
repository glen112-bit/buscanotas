import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '../../schemas';
import { useAuth } from '../../AuthContext';
import { useState } from 'react';
// 1. Importamos Link para la navegación
import { Link } from 'react-router-dom';

export const LoginPage = () => {
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      await login(data.email, data.password);
    } catch (err: any) {
      setServerError(err.message || "Credenciales incorrectas");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Bienvenido
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Ingresa tus datos para continuar
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Campo Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                {...register("email")}
                className={`appearance-none rounded-lg relative block w-full px-3 py-3 border ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm`}
                placeholder="correo@ejemplo.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email.message}</p>}
            </div>

            {/* Campo Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                {...register("password")}
                type="password"
                className={`appearance-none rounded-lg relative block w-full px-3 py-3 border ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                } placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm`}
                placeholder="••••••••"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password.message}</p>}
            </div>
          </div>

          {serverError && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200 text-center animate-shake">
              {serverError}
            </div>
          )}

          <div className="space-y-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all shadow-md active:scale-95"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                   <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   Verificando...
                </span>
              ) : "Iniciar Sesión"}
            </button>

            {/* 2. Botón/Enlace de Registro */}
            <div className="text-center pt-2">
              <p className="text-sm text-gray-600">
                ¿No tienes una cuenta?{' '}
                <Link 
                  to="/register" 
                  className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors underline-offset-4 hover:underline"
                >
                  Regístrate gratis
                </Link>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
