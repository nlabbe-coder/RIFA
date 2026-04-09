'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { formatBs, formatDateTime, metodoPagoLabel } from '@/lib/utils'
import Link from 'next/link'

interface Orden {
  id: string
  numeros: string
  total: number
  metodoPago: string
  estadoPago: string
  creadoEn: string
  rifa: { titulo: string; totalNumeros: number }
  comprador: { nombre: string; telefono: string; email: string }
}

export default function ConfirmacionPage() {
  const router = useRouter()
  const [orden, setOrden] = useState<Orden | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = sessionStorage.getItem('orden_id')
    if (!id) { router.push('/'); return }

    fetch(`/api/ordenes/${id}`)
      .then(r => r.json())
      .then(data => { setOrden(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full"/>
      </div>
    </>
  )

  if (!orden) return null

  const numeros: number[] = JSON.parse(orden.numeros)
  const digits = orden.rifa.totalNumeros.toString().length

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-verde-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">¡Pedido registrado!</h1>
          <p className="text-gray-500">
            Tu participación está guardada. En cuanto confirmemos tu pago, recibirás un mensaje.
          </p>
        </div>

        {/* Orden detalle */}
        <div className="card p-6 mb-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900">Detalle del pedido</h2>
            <span className="badge bg-yellow-100 text-yellow-800">⏳ Pago pendiente</span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">N° de orden</span>
              <span className="font-mono font-bold text-gray-800 text-xs">{orden.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Rifa</span>
              <span className="font-medium text-gray-800">{orden.rifa.titulo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Fecha</span>
              <span className="text-gray-800">{formatDateTime(orden.creadoEn)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Método de pago</span>
              <span className="font-medium text-gray-800">{metodoPagoLabel(orden.metodoPago)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Comprador</span>
              <span className="text-gray-800">{orden.comprador.nombre}</span>
            </div>
          </div>

          <div className="border-t border-gray-100 mt-4 pt-4">
            <p className="text-sm text-gray-500 mb-2">Tus números:</p>
            <div className="flex flex-wrap gap-1.5">
              {numeros.sort((a,b) => a-b).map(n => (
                <span key={n} className="bg-primary-100 text-primary-700 text-xs font-bold px-2.5 py-1 rounded-lg">
                  {n.toString().padStart(digits, '0')}
                </span>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between items-center">
            <span className="font-bold text-gray-900">Total a pagar</span>
            <span className="text-2xl font-black text-primary-600">{formatBs(orden.total)}</span>
          </div>
        </div>

        {/* Instrucciones pago */}
        <div className="card p-6 mb-5 bg-amber-50 border border-amber-200">
          <h3 className="font-bold text-amber-800 mb-3">📋 ¿Qué sigue?</h3>
          <ol className="text-sm text-amber-700 space-y-2 list-decimal list-inside">
            <li>Realiza el pago por <strong>{metodoPagoLabel(orden.metodoPago)}</strong> por el monto de <strong>{formatBs(orden.total)}</strong></li>
            <li>Guarda tu comprobante de pago</li>
            <li>Envíanos el comprobante por WhatsApp al <strong>+591 7X XXX XXX</strong></li>
            <li>Confirmaremos tu participación en menos de 24 horas</li>
          </ol>
        </div>

        {/* WhatsApp CTA */}
        <a
          href={`https://wa.me/59170000000?text=${encodeURIComponent(`Hola, acabo de hacer un pedido en RifaBolivia. Mi N° de orden es: ${orden.id}. Nombre: ${orden.comprador.nombre}. Total: ${formatBs(orden.total)}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-4 rounded-xl transition-all mb-4 shadow-md"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Enviar comprobante por WhatsApp
        </a>

        <div className="text-center">
          <Link href="/" className="text-primary-600 hover:underline text-sm font-medium">
            ← Volver a las rifas
          </Link>
        </div>
      </div>
    </>
  )
}
