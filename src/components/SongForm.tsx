import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { songSchema, type SongFormData } from '../schemas';

export const SongForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<SongFormData>({
    resolver: zodResolver(songSchema)
  });

  const onSubmit = async (data: SongFormData) => {
    try {
      // Aquí conectarás con tu API para guardar la canción
      console.log("Guardando canción:", data);
      alert("¡Canción guardada con éxito!");
      reset(); // Limpia el formulario
    } catch (error) {
      alert("Error al guardar");
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 w-full max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <span className="mr-2">🎸</span> Nueva Canción
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">Título de la Canción</label>
            <input
              {...register("title")}
              placeholder="Ej: Imagine"
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3 px-4 border"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          {/* Artista */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">Artista / Banda</label>
            <input
              {...register("artist")}
              placeholder="Ej: John Lennon"
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3 px-4 border"
            />
            {errors.artist && <p className="text-red-500 text-xs mt-1">{errors.artist.message}</p>}
          </div>
        </div>

        {/* Tono (Key) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700">Tono Original (Key)</label>
          <input
            {...register("key")}
            placeholder="Ej: C Major o Sol Mayor"
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3 px-4 border"
          />
        </div>

        {/* Contenido: Acordes y Letra */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Letra y Acordes (Usa espacios para alinear)
          </label>
          <textarea
            {...register("content")}
            rows={12}
            placeholder={"  G           D\nImagine all the people..."}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-sm p-4 border bg-gray-50"
          />
          <p className="text-gray-400 text-[10px] mt-2 italic">
            Tip: Escribe los acordes en una línea y la letra en la siguiente.
          </p>
          {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
        >
          {isSubmitting ? "Publicando..." : "Publicar Canción"}
        </button>
      </form>
    </div>
  );
};
