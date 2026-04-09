'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function VerificarUsdtBtn() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const verificar = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cron/verificar-usdt')
      const data = await res.json()
      if (data.confirmadas > 0) {
        toast.success(`✅ ${data.confirmadas} pago(s) USDT confirmado(s) automáticamente`)
      } else if (data.pendientesRevisadas === 0) {
        toast('Sin pagos USDT pendientes', { icon: '₮' })
      } else {
        toast('Sin nuevas confirmaciones. Los pagos aún no tienen suficientes confirmaciones en la blockchain.', { icon: '⏳', duration: 5000 })
      }
      router.refresh()
    } catch {
      toast.error('Error al verificar blockchain')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={verificar}
      disabled={loading}
      className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all disabled:opacity-60"
    >
      {loading
        ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Verificando blockchain...</>
        : <><span className="text-base">₮</span> Verificar USDT</>
      }
    </button>
  )
}
