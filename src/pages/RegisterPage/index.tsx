import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormData } from '../../schemas';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';

export const RegisterPage = () => {
  const [serverError, setServerError] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  });
  const { registerUser } = useAuth();
  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      // Aquí llamarías a tu función de registro de AuthContext o API directamente
      await registerUser(data.name, data.email, data.password);
      console.log("Registrando usuario:", data);
      
      // Simulación de éxito:
      alert("¡Cuenta creada con éxito!");
      await registerUser(data.name, data.email, data.password);
      navigate('/login', { state: { message: "¡Cuenta creada! Ahora inicia sesión." } });
    } catch (err: any) {
      setServerError(err.message || "Error al crear la cuenta");
    }
  };

  return (
    <>
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">

      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">

        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Crea tu cuenta</h2>
          <p className="mt-2 text-sm text-gray-600">Es rápido y fácil</p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {/* Campo Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
            <input
              {...register("name")}
              className={`mt-1 block w-full px-3 py-3 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              placeholder="Juan Pérez"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Campo Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              {...register("email")}
              type="email"
              className={`mt-1 block w-full px-3 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              placeholder="correo@ejemplo.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* Campo Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              {...register("password")}
              type="password"
              className={`mt-1 block w-full px-3 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {/* Campo Confirmar Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirmar Contraseña</label>
            <input
              {...register("confirmPassword")}
              type="password"
              className={`mt-1 block w-full px-3 py-3 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              placeholder="••••••••"
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          {serverError && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded text-center border border-red-200">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-md disabled:opacity-50"
          >
            {isSubmitting ? "Creando cuenta..." : "Registrarse"}
          </button>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};
