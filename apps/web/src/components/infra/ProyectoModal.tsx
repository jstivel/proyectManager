'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

interface ProyectoModalProps {
  proyecto?: any; 
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  supervisores: any[];
}

export default function ProyectoModal({ proyecto, isOpen, onClose, onSuccess, supervisores }: ProyectoModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    entidad: '',
    region: '',
    supervisor_id: '',
    estado: 'activo'
  })

  useEffect(() => {
    if (proyecto) {
      setFormData({
        nombre: proyecto.nombre || '',
        entidad: proyecto.entidad || '',
        region: proyecto.region || '',
        supervisor_id: proyecto.supervisor_id || '',
        estado: proyecto.estado || 'activo'
      })
    } else {
      setFormData({ nombre: '', entidad: '', region: '', supervisor_id: '', estado: 'activo' })
    }
  }, [proyecto, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  console.log("1. Iniciando envío..."); // Diagnóstico
  setLoading(true)

  try {
    const dataToSave = {
      nombre: formData.nombre,
      entidad: formData.entidad || null,
      region: formData.region || null,
      supervisor_id: formData.supervisor_id === "" ? null : formData.supervisor_id,
      estado: formData.estado
    }

    console.log("2. Datos a enviar:", dataToSave); // Diagnóstico

    const isEditing = !!proyecto?.id
    
    // Ejecutamos la petición
    const response = isEditing 
      ? await supabase.from('proyectos').update(dataToSave).eq('id', proyecto.id)
      : await supabase.from('proyectos').insert([dataToSave])

    console.log("3. Respuesta de Supabase:", response); // Diagnóstico

    if (response.error) {
      console.error("4. Error detectado:", response.error);
      alert("Error de Supabase: " + response.error.message)
    } else {
      console.log("4. Éxito total");
      onSuccess()
      onClose()
    }
  } catch (err) {
    console.error("Error capturado en el catch:", err);
    alert("Ocurrió un error inesperado. Revisa la consola.");
  } finally {
    console.log("5. Finalizando proceso (setLoading(false))");
    setLoading(false)
  }
}

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-6 border-b bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">
            {proyecto ? 'Editar Proyecto' : 'Nuevo Proyecto'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre del Proyecto</label>
            <input 
              required
              placeholder="Ej: Levantamiento Fibra Zona Sur"
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
              value={formData.nombre}
              onChange={e => setFormData({...formData, nombre: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Entidad</label>
              <input 
                placeholder="Cliente"
                className="w-full p-2 border border-slate-300 rounded-md outline-none text-slate-900"
                value={formData.entidad}
                onChange={e => setFormData({...formData, entidad: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Región</label>
              <input 
                placeholder="Ciudad/Zona"
                className="w-full p-2 border border-slate-300 rounded-md outline-none text-slate-900"
                value={formData.region}
                onChange={e => setFormData({...formData, region: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Asignar Supervisor</label>
            <select 
              className="w-full p-2 border border-slate-300 rounded-md outline-none bg-white text-slate-900"
              value={formData.supervisor_id}
              onChange={e => setFormData({...formData, supervisor_id: e.target.value})}
            >
              <option value="">Seleccione un supervisor...</option>
              {supervisores.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-6">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Guardando...' : proyecto ? 'Actualizar' : 'Crear Proyecto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}