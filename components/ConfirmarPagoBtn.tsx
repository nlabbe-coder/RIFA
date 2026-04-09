'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function ConfirmarPagoBtn({ ordenId, accion }: { ordenId: string; accion: 'confirmado' | 'rechazado' }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleClick = async () => {
    const msg = accion === 'confirmado' ? '¿Confirmar este pago?' : '¿Rechazar y liberar los números?'
    if (!confirm(msg)) return

    setLoading(true)
    try {
      const res = await fetch(`/api/ordenes/${ordenId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estadoPago: accion }),
      })
      if (!res.ok) throw new Error('Error al actualizar')
      toast.success(accion === 'confirmado' ? '✅ Pago confirmado' : '❌ Pago rechazado')
      router.refresh()
    } catch {
      toast.error('Error al procesar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`text-sm font-semibold px-4 py-2 rounded-xl transition-all disabled:opacity-50 ${
        accion === 'confirmado'
          ? 'bg-verde-500 hover:bg-verde-600 text-white'
          : 'bg-red-100 hover:bg-red-200 text-red-700'
      }`}
    >
      {loading ? '...' : accion === 'confirmado' ? '✓ Confirmar' : '✕ Rechazar'}
    </button>
  )
}
