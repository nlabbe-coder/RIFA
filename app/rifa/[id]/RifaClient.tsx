'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { formatBs, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Rifa {
  id: string
  titulo: string
  descripcion: string
  imagen?: string
  precio: number
  totalNumeros: number
  numerosVendidos: number
  fechaSorteo: string
  premio: string
  estado: string
  tickets: { numero: number }[]
}

interface Countdown { dias: number; horas: number; minutos: number; segundos: number; pasado: boolean }

function useCountdown(fecha: string): Countdown {
  const calc = useCallback(() => {
    const diff = new Date(fecha).getTime() - Date.now()
    if (diff <= 0) return { dias: 0, horas: 0, minutos: 0, segundos: 0, pasado: true }
    return {
      dias: Math.floor(diff / 86400000),
      horas: Math.floor((diff % 86400000) / 3600000),
      minutos: Math.floor((diff % 3600000) / 60000),
      segundos: Math.floor((diff % 60000) / 1000),
      pasado: false,
    }
  }, [fecha])

  const [cd, setCd] = useState<Countdown>(calc)
  useEffect(() => {
    const t = setInterval(() => setCd(calc()), 1000)
    return () => clearInterval(t)
  }, [calc])
  return cd
}

const PAGE_SIZE = 200

export default function RifaClient({ id }: { id: string }) {
  const router = useRouter()
  const [rifa, setRifa] = useState<Rifa | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [seleccionados, setSeleccionados] = useState<number[]>([])
  const [pagina, setPagina] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const [imgAbierta, setImgAbierta] = useState(false)

  const fetchRifa = useCallback((silencioso = false) => {
    if (!silencioso) setLoading(true)
    fetch(`/api/rifas/${id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => { setRifa(data); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [id])

  useEffect(() => { fetchRifa() }, [fetchRifa])

  // Actualizar progreso cada 30s en tiempo real
  useEffect(() => {
    const t = setInterval(() => fetchRifa(true), 30000)
    return () => clearInterval(t)
  }, [fetchRifa])

  const cd = useCountdown(rifa?.fechaSorteo ?? new Date().toISOString())

  const vendidosSet = new Set(rifa?.tickets.map(t => t.numero) ?? [])
  const totalPaginas = rifa ? Math.ceil(rifa.totalNumeros / PAGE_SIZE) : 0
  const inicio = pagina * PAGE_SIZE + 1
  const fin = Math.min((pagina + 1) * PAGE_SIZE, rifa?.totalNumeros ?? 0)
  const numerosPagina = Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i)

  const numerosFiltered = busqueda
    ? Array.from({ length: rifa?.totalNumeros ?? 0 }, (_, i) => i + 1)
        .filter(n => n.toString().includes(busqueda.trim()))
        .slice(0, 100)
    : numerosPagina

  const toggleNumero = (n: number) => {
    if (vendidosSet.has(n)) return
    setSeleccionados(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n])
  }

  const aleatorio = () => {
    if (!rifa) return
    const disponibles = Array.from({ length: rifa.totalNumeros }, (_, i) => i + 1)
      .filter(n => !vendidosSet.has(n) && !seleccionados.includes(n))
    if (disponibles.length === 0) { toast.error('No hay números disponibles'); return }
    const num = disponibles[Math.floor(Math.random() * disponibles.length)]
    setSeleccionados(prev => [...prev, num])
    setPagina(Math.floor((num - 1) / PAGE_SIZE))
    toast.success(`Número ${num.toString().padStart(digits, '0')} agregado`)
  }

  const total = seleccionados.length * (rifa?.precio ?? 0)
  const digits = rifa?.totalNumeros.toString().length ?? 1
  const pct = rifa ? Math.round(rifa.numerosVendidos / rifa.totalNumeros * 100) : 0

  const irAlCheckout = () => {
    if (seleccionados.length === 0) { toast.error('Selecciona al menos un número'); return }
    sessionStorage.setItem('checkout_data', JSON.stringify({ rifaId: id, numeros: seleccionados }))
    router.push('/checkout')
  }

  if (loading) return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full"/>
      </div>
    </>
  )

  if (error || !rifa) return (
    <>
      <Navbar />
      <div className="text-center py-32 text-gray-500">
        <div className="text-6xl mb-4">😕</div>
        <p className="text-2xl font-bold">Rifa no encontrada</p>
        <button onClick={() => router.push('/')} className="btn-primary mt-6">Volver al inicio</button>
      </div>
    </>
  )

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header rifa */}
        <div className="card mb-6 overflow-hidden">
          <div className="md:flex">

            {/* Imagen con visor */}
            <div
              className="md:w-2/5 h-72 md:h-auto bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center relative group cursor-pointer overflow-hidden"
              onClick={() => rifa.imagen && setImgAbierta(true)}
            >
              {rifa.imagen ? (
                <>
                  <img src={rifa.imagen} alt={rifa.titulo} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                    <span className="text-white text-sm font-bold opacity-0 group-hover:opacity-100 bg-black/50 px-4 py-2 rounded-xl transition-all">
                      🔍 Ver imagen
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center text-white p-8">
                  <div className="text-7xl mb-3">🏆</div>
                  <p className="font-bold text-xl">{rifa.premio}</p>
                </div>
              )}

              {/* Badge premio sobre imagen */}
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-xl">
                🏆 {rifa.premio}
              </div>
            </div>

            {/* Info */}
            <div className="md:w-3/5 p-6 md:p-8 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <span className="badge bg-verde-500 text-white">● Activa</span>
                <span className="text-2xl font-black text-primary-600">
                  {formatBs(rifa.precio)}<span className="text-sm font-normal text-gray-500">/número</span>
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-3">{rifa.titulo}</h1>
              <p className="text-gray-600 mb-5">{rifa.descripcion}</p>

              {/* Progreso en tiempo real */}
              <div className="mb-5">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-semibold text-gray-700">Boletos vendidos</span>
                  <span className="font-black text-primary-600">{pct}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-3 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{rifa.numerosVendidos.toLocaleString()} vendidos</span>
                  <span>{(rifa.totalNumeros - rifa.numerosVendidos).toLocaleString()} disponibles</span>
                </div>
              </div>

              {/* Datos */}
              <div className="grid grid-cols-2 gap-3 text-sm mb-5">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs mb-0.5">Total números</p>
                  <p className="font-bold text-gray-800">🎟️ {rifa.totalNumeros.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs mb-0.5">Fecha sorteo</p>
                  <p className="font-bold text-gray-800">📅 {formatDate(rifa.fechaSorteo)}</p>
                </div>
              </div>

              {/* Contador regresivo */}
              {!cd.pasado ? (
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-4 mt-auto">
                  <p className="text-gray-400 text-xs uppercase tracking-widest mb-3 text-center">Sorteo en</p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { v: cd.dias,    l: 'Días' },
                      { v: cd.horas,   l: 'Horas' },
                      { v: cd.minutos, l: 'Min' },
                      { v: cd.segundos,l: 'Seg' },
                    ].map(({ v, l }) => (
                      <div key={l} className="bg-white/10 rounded-xl py-2">
                        <p className="text-2xl font-black text-white">{String(v).padStart(2, '0')}</p>
                        <p className="text-gray-400 text-xs">{l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-auto text-center">
                  <p className="text-amber-700 font-bold">⏰ El sorteo ya se realizó</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selector de números */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Elige tus números</h2>
                <button onClick={aleatorio} className="btn-gold text-sm py-2 px-4">🎲 Aleatorio</button>
              </div>
              <div className="flex gap-2 mb-4">
                <input
                  type="number"
                  placeholder="Buscar número..."
                  className="input"
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  min={1}
                  max={rifa.totalNumeros}
                />
                {busqueda && (
                  <button onClick={() => setBusqueda('')} className="px-3 py-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-xl">✕</button>
                )}
              </div>
              <div className="flex gap-4 text-xs mb-4">
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded border-2 border-gray-200 bg-white inline-block"></span>Disponible</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded border-2 border-primary-600 bg-primary-600 inline-block"></span>Seleccionado</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded border-2 border-gray-200 bg-gray-100 inline-block"></span>Vendido</span>
              </div>
              <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 max-h-96 overflow-y-auto pr-1">
                {numerosFiltered.map(n => {
                  const vendido = vendidosSet.has(n)
                  const selec = seleccionados.includes(n)
                  return (
                    <button
                      key={n}
                      onClick={() => toggleNumero(n)}
                      disabled={vendido}
                      className={vendido ? 'numero-vendido' : selec ? 'numero-seleccionado' : 'numero-disponible'}
                    >
                      {n.toString().padStart(digits, '0')}
                    </button>
                  )
                })}
              </div>
              {!busqueda && totalPaginas > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                  <button onClick={() => setPagina(p => Math.max(0, p - 1))} disabled={pagina === 0}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50">
                    ← Anterior
                  </button>
                  <span className="text-sm text-gray-600 px-2">{inicio}–{fin} de {rifa.totalNumeros.toLocaleString()}</span>
                  <button onClick={() => setPagina(p => Math.min(totalPaginas - 1, p + 1))} disabled={pagina >= totalPaginas - 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50">
                    Siguiente →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Panel resumen */}
          <div className="lg:col-span-1">
            <div className="card p-5 sticky top-24">
              <h3 className="font-bold text-lg text-gray-900 mb-4">Tu pedido</h3>
              {seleccionados.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No has seleccionado ningún número</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-1.5 mb-4 max-h-40 overflow-y-auto">
                    {seleccionados.sort((a, b) => a - b).map(n => (
                      <span key={n} onClick={() => toggleNumero(n)}
                        className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-1 rounded-lg cursor-pointer hover:bg-red-100 hover:text-red-600 transition-colors"
                        title="Click para quitar">
                        {n.toString().padStart(digits, '0')} ✕
                      </span>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 pt-4 mb-4">
                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                      <span>{seleccionados.length} número{seleccionados.length > 1 ? 's' : ''}</span>
                      <span>{formatBs(rifa.precio)} c/u</span>
                    </div>
                    <div className="flex justify-between text-lg font-black">
                      <span>Total</span>
                      <span className="text-primary-600">{formatBs(total)}</span>
                    </div>
                  </div>
                </>
              )}
              <button onClick={irAlCheckout} className="btn-primary w-full text-center">
                {seleccionados.length === 0 ? 'Selecciona números' : `Pagar ${formatBs(total)}`}
              </button>
              <p className="text-xs text-gray-400 text-center mt-3">🔒 Pago 100% seguro.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Visor de imagen fullscreen */}
      {imgAbierta && rifa.imagen && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setImgAbierta(false)}
        >
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xl">✕</button>
          <img
            src={rifa.imagen}
            alt={rifa.titulo}
            className="max-w-full max-h-full object-contain rounded-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
