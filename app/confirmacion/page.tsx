'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { formatBs, formatDateTime, metodoPagoLabel } from '@/lib/utils'
import Link from 'next/link'
import ComprobantePDF from '@/components/ComprobantePDF'

interface Orden {
  id: string
  numeros: string
  total: number
  metodoPago: string
  estadoPago: string
  comprobante?: string
  notas?: string
  creadoEn: string
  rifa: { titulo: string; totalNumeros: number }
  comprador: { nombre: string; telefono: string; email: string }
}

const INTERVALO_USDT = 8000  // revisar cada 8 segundos para USDT
const INTERVALO_OTROS = 30000 // cada 30s para otros métodos

export default function ConfirmacionPage() {
  const router = useRouter()
  const [orden, setOrden] = useState<Orden | null>(null)
  const [loading, setLoading] = useState(true)
  const [ultimaVerif, setUltimaVerif] = useState<Date | null>(null)
  const [verificando, setVerificando] = useState(false)
  const [recienConfirmado, setRecienConfirmado] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const ordenIdRef = useRef<string | null>(null)

  const fetchOrden = async (id: string, silencioso = false) => {
    if (!silencioso) setVerificando(true)
    try {
      const res = await fetch(`/api/ordenes/${id}`)
      const data: Orden = await res.json()

      setOrden(prev => {
        // Detectar si acaba de ser confirmado
        if (prev?.estadoPago === 'pendiente' && data.estadoPago === 'confirmado') {
          setRecienConfirmado(true)
          if (intervalRef.current) clearInterval(intervalRef.current)
        }
        return data
      })
      setUltimaVerif(new Date())
    } finally {
      if (!silencioso) setVerificando(false)
      setLoading(false)
    }
  }

  // Disparar verificación blockchain para USDT
  const verificarBlockchain = async () => {
    try {
      await fetch('/api/cron/verificar-usdt')
    } catch {}
  }

  useEffect(() => {
    const id = sessionStorage.getItem('orden_id')
    if (!id) { router.push('/'); return }
    ordenIdRef.current = id
    fetchOrden(id)
  }, [])

  useEffect(() => {
    if (!orden) return
    if (orden.estadoPago === 'confirmado') return // ya confirmado, no polling

    const esUsdt = orden.metodoPago === 'usdt'
    const intervalo = esUsdt ? INTERVALO_USDT : INTERVALO_OTROS

    intervalRef.current = setInterval(async () => {
      if (esUsdt) await verificarBlockchain()
      await fetchOrden(ordenIdRef.current!, true)
    }, intervalo)

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [orden?.metodoPago, orden?.estadoPago])

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
  const esUsdt = orden.metodoPago === 'usdt'
  const redUsdt = orden.notas?.match(/USDT_RED:(\w+)/)?.[1]?.toUpperCase() ?? ''

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* Estado del pago */}
        {orden.estadoPago === 'confirmado' ? (
          // ── CONFIRMADO ──────────────────────────────────────────────
          <div className="text-center mb-8">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5 shadow-xl ${recienConfirmado ? 'animate-bounce' : ''} bg-verde-500`}>
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            {recienConfirmado ? (
              <>
                <h1 className="text-3xl font-black text-gray-900 mb-2">🎉 ¡Pago recibido!</h1>
                <p className="text-verde-600 font-semibold text-lg">Tu pago fue confirmado ahora mismo</p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-black text-gray-900 mb-2">✅ Pago confirmado</h1>
                <p className="text-verde-600 font-semibold">Tu participación está asegurada</p>
              </>
            )}
            <p className="text-gray-500 text-sm mt-2">Revisa tu correo — te enviamos la confirmación a <strong>{orden.comprador.email}</strong></p>
          </div>

        ) : orden.estadoPago === 'rechazado' ? (
          // ── RECHAZADO ────────────────────────────────────────────────
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-xl">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">Pago rechazado</h1>
            <p className="text-gray-500">Contacta con nosotros por WhatsApp para resolver el problema.</p>
          </div>

        ) : (
          // ── PENDIENTE ────────────────────────────────────────────────
          <div className="text-center mb-8">
            {esUsdt ? (
              <>
                <div className="relative w-24 h-24 mx-auto mb-5">
                  <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center shadow-xl">
                    <span className="text-4xl text-white font-black">₮</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 border-3 border-white border-t-transparent rounded-full animate-spin border-2"/>
                  </div>
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-2">Verificando en blockchain</h1>
                <p className="text-gray-500 text-sm">Estamos monitoreando la red <strong>{redUsdt}</strong> en tiempo real</p>
              </>
            ) : (
              <>
                <div className="w-24 h-24 bg-amber-400 rounded-full flex items-center justify-center mx-auto mb-5 shadow-xl">
                  <span className="text-4xl">⏳</span>
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-2">Pedido registrado</h1>
                <p className="text-gray-500 text-sm">Confirmaremos tu pago en menos de 24 horas</p>
              </>
            )}
          </div>
        )}

        {/* Card estado en tiempo real */}
        {orden.estadoPago === 'pendiente' && (
          <div className={`card p-5 mb-5 ${esUsdt ? 'border-2 border-amber-300 bg-amber-50' : 'border border-gray-100'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {esUsdt ? (
                  <>
                    <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"/>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">Verificación automática activa</p>
                      <p className="text-xs text-gray-500">Revisando la blockchain cada {INTERVALO_USDT/1000}s</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"/>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">En revisión por el equipo</p>
                      <p className="text-xs text-gray-500">Esta página se actualiza automáticamente</p>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={async () => {
                  if (esUsdt) await verificarBlockchain()
                  await fetchOrden(ordenIdRef.current!)
                }}
                disabled={verificando}
                className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-600 font-medium disabled:opacity-50 flex items-center gap-1.5"
              >
                {verificando
                  ? <><div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"/>Verificando...</>
                  : '↻ Verificar ahora'
                }
              </button>
            </div>
            {ultimaVerif && (
              <p className="text-xs text-gray-400 mt-3">
                Última verificación: {ultimaVerif.toLocaleTimeString('es-BO')}
              </p>
            )}
          </div>
        )}

        {/* Detalle orden */}
        <div className="card p-6 mb-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900">Detalle del pedido</h2>
            <span className={`badge ${
              orden.estadoPago === 'confirmado' ? 'bg-green-100 text-green-700'
              : orden.estadoPago === 'rechazado' ? 'bg-red-100 text-red-700'
              : 'bg-yellow-100 text-yellow-800'
            }`}>
              {orden.estadoPago === 'confirmado' ? '✅ Confirmado'
               : orden.estadoPago === 'rechazado' ? '❌ Rechazado'
               : '⏳ Pendiente'}
            </span>
          </div>

          <div className="space-y-2.5 text-sm mb-5">
            <div className="flex justify-between">
              <span className="text-gray-500">N° de orden</span>
              <span className="font-mono font-bold text-gray-700 text-xs">{orden.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Rifa</span>
              <span className="font-medium text-gray-800 text-right max-w-[200px]">{orden.rifa.titulo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Comprador</span>
              <span className="text-gray-800">{orden.comprador.nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Método</span>
              <span className="font-medium text-gray-800">
                {metodoPagoLabel(orden.metodoPago)}
                {redUsdt && <span className="text-xs text-gray-400 ml-1">({redUsdt})</span>}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Fecha</span>
              <span className="text-gray-800 text-xs">{formatDateTime(orden.creadoEn)}</span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 mb-4">
            <p className="text-sm text-gray-500 mb-2 font-medium">Tus números:</p>
            <div className="flex flex-wrap gap-1.5">
              {numeros.sort((a, b) => a - b).map(n => (
                <span key={n} className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                  orden.estadoPago === 'confirmado' ? 'bg-verde-500 text-white' : 'bg-primary-100 text-primary-700'
                }`}>
                  {n.toString().padStart(digits, '0')}
                </span>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
            <span className="font-bold text-gray-900">Total</span>
            <span className="text-2xl font-black text-primary-600">{formatBs(orden.total)}</span>
          </div>
        </div>

        {/* Instrucciones si está pendiente y NO es USDT */}
        {orden.estadoPago === 'pendiente' && !esUsdt && (
          <div className="card p-6 mb-5 bg-amber-50 border border-amber-200">
            <h3 className="font-bold text-amber-800 mb-3">📋 ¿Qué sigue?</h3>
            <ol className="text-sm text-amber-700 space-y-2 list-decimal list-inside">
              <li>Realiza el pago por <strong>{metodoPagoLabel(orden.metodoPago)}</strong></li>
              <li>Envíanos el comprobante por WhatsApp</li>
              <li>Confirmaremos en menos de 24 horas</li>
              <li>Recibirás un email de confirmación</li>
            </ol>
          </div>
        )}

        {/* WhatsApp si no es USDT */}
        {orden.estadoPago !== 'confirmado' && !esUsdt && (
          <a
            href={`https://wa.me/59170000000?text=${encodeURIComponent(`Hola, hice un pedido en RifaBolivia. N° de orden: ${orden.id}. Nombre: ${orden.comprador.nombre}. Total: ${formatBs(orden.total)}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-4 rounded-xl transition-all mb-4 shadow-md"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Enviar comprobante por WhatsApp
          </a>
        )}

        {/* Descargar comprobante — solo si está confirmado */}
        {orden.estadoPago === 'confirmado' && (
          <div className="mb-4">
            <ComprobantePDF orden={orden} />
          </div>
        )}

        <div className="text-center">
          <Link href="/" className="text-primary-600 hover:underline text-sm font-medium">
            ← Ver más rifas
          </Link>
        </div>
      </div>
    </>
  )
}
