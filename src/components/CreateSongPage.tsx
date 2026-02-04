import { useForm } from 'react-hook-form';
import { SongPreview } from './SongPreview'; // Importamos el nuevo componente

export const CreateSongPage = () => {
  const { register, watch, handleSubmit } = useForm<SongFormData>();
  
  // 1. "Observamos" los campos en tiempo real
  const watchedValues = watch();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
      {/* LADO IZQUIERDO: FORMULARIO */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Editor de Acordes</h2>
        <form className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
           {/* ... aquí van tus inputs de Título, Artista y el Textarea de Content ... */}
           <textarea 
             {...register("content")} 
             className="w-full font-mono p-4 bg-gray-50 rounded-lg border"
             rows={15}
           />
        </form>
      </div>

      {/* LADO DERECHO: VISTA PREVIA (Pegajosa para que no se pierda al hacer scroll) */}
      <div className="lg:sticky lg:top-6 self-start">
        <SongPreview 
          title={watchedValues.title} 
          artist={watchedValues.artist} 
          content={watchedValues.content} 
        />
      </div>
    </div>
  );
};
