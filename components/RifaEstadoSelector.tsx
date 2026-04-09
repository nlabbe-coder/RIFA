'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function RifaEstadoSelector({ rifaId, estadoActual }: { rifaId: string; estadoActual: string }) {
  const [estado, setEstado] = useState(estadoActual)
  const router = useRouter()

  const cambiar = async (nuevoEstado: string) => {
    const res = await fetch(`/api/rifas/${rifaId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado }),
    })
    if (res.ok) {
      setEstado(nuevoEstado)
      toast.success('Estado actualizado')
      router.refresh()
    } else {
      toast.error('Error al actualizar')
    }
  }

  return (
    <div className="flex gap-2">
      {['activa', 'cerrada', 'sorteada'].map(e => (
        <button
          key={e}
          onClick={() => e !== estado && cambiar(e)}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
            estado === e
              ? e === 'activa' ? 'bg-verde-500 text-white'
                : e === 'cerrada' ? 'bg-gray-500 text-white'
                : 'bg-purple-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {e.charAt(0).toUpperCase() + e.slice(1)}
        </button>
      ))}
    </div>
  )
}
