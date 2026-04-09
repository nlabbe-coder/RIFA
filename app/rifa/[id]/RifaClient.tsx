'use client'
import { useEffect, useState } from 'react'
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

const PAGE_SIZE = 200

export default function RifaClient({ id }: { id: string }) {
  const router = useRouter()
  const [rifa, setRifa] = useState<Rifa | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [seleccionados, setSeleccionados] = useState<number[]>([])
  const [pagina, setPagina] = useState(0)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    fetch(`/api/rifas/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('No encontrada')
        return r.json()
      })
      .then(data => { setRifa(data); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [id])

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
    setSeleccionados(prev =>
      prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]
    )
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
            <div className="md:w-2/5 h-64 md:h-auto bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
              {rifa.imagen ? (
                <img src={rifa.imagen} alt={rifa.titulo} className="w-full h-full object-cover"/>
              ) : (
                <div className="text-center text-white p-8">
                  <div className="text-7xl mb-3">🏆</div>
                  <p className="font-bold text-xl">{rifa.premio}</p>
                </div>
              )}
            </div>
            <div className="md:w-3/5 p-6 md:p-8">
              <div className="flex items-start justify-between mb-3">
                <span className="badge bg-verde-500 text-white">● Activa</span>
                <span className="text-2xl font-black text-primary-600">
                  {formatBs(rifa.precio)}<span className="text-sm font-normal text-gray-500">/número</span>
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-3">{rifa.titulo}</h1>
              <p className="text-gray-600 mb-5">{rifa.descripcion}</p>
              <div className="grid grid-cols-2 gap-4 text-sm mb-5">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">Premio</p>
                  <p className="font-bold text-gray-800">🏆 {rifa.premio}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">Fecha sorteo</p>
                  <p className="font-bold text-gray-800">📅 {formatDate(rifa.fechaSorteo)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">Total números</p>
                  <p className="font-bold text-gray-800">🎟️ {rifa.totalNumeros.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">Disponibles</p>
                  <p className="font-bold text-verde-600">✓ {(rifa.totalNumeros - rifa.numerosVendidos).toLocaleString()}</p>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mb-1">
                <div
                  className="h-2 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full"
                  style={{ width: `${Math.round(rifa.numerosVendidos / rifa.totalNumeros * 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">{Math.round(rifa.numerosVendidos / rifa.totalNumeros * 100)}% vendido</p>
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
    </>
  )
}
