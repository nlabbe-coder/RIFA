'use client'
import { useState } from 'react'
import Navbar from '@/components/Navbar'
import { formatBs, formatDateTime, metodoPagoLabel } from '@/lib/utils'

export default function VerificarPage() {
  const [ci, setCi] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/verificar?ci=${encodeURIComponent(ci)}`)
      const data = await res.json()
      setResults(data)
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Verificar mis tickets</h1>
          <p className="text-gray-500">Ingresa tu carnet de identidad para ver tus participaciones</p>
        </div>

        <form onSubmit={buscar} className="flex gap-3 mb-8">
          <input
            className="input flex-1"
            value={ci}
            onChange={e => setCi(e.target.value)}
            placeholder="Tu número de CI (Ej: 1234567 LP)"
            required
          />
          <button type="submit" disabled={loading} className="btn-primary px-6">
            {loading ? '...' : 'Buscar'}
          </button>
        </form>

        {searched && results.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-3">🔍</div>
            <p className="font-semibold">No se encontraron participaciones</p>
            <p className="text-sm mt-1">Verifica que el CI sea correcto</p>
          </div>
        )}

        <div className="space-y-4">
          {results.map((o: any) => {
            const nums = JSON.parse(o.numeros)
            return (
              <div key={o.id} className="card p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{o.rifa.titulo}</p>
                    <p className="text-sm text-gray-500">{metodoPagoLabel(o.metodoPago)} · {formatBs(o.total)}</p>
                  </div>
                  <span className={`badge ${o.estadoPago === 'confirmado' ? 'bg-green-100 text-green-700' : o.estadoPago === 'pendiente' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {o.estadoPago}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {nums.map((n: number) => (
                    <span key={n} className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-1 rounded-lg">{n}</span>
                  ))}
                </div>
                <p className="text-xs text-gray-400">{formatDateTime(o.creadoEn)}</p>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
