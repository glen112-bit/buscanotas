import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Requerido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

// Asegúrate de que esta línea tenga el "export"
export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"], // El error se marcará en este campo
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export const songSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  artist: z.string().min(1, "El artista es obligatorio"),
  key: z.string().min(1, "Especifica el tono (ej: Sol Mayor o G)"),
  content: z.string().min(10, "El contenido de la canción es demasiado corto"),
});

export type SongFormData = z.infer<typeof songSchema>;
