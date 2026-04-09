'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Ganador {
  numeroGanador: number
  tieneDueno: boolean
  comprador?: { nombre: string; telefono: string; email: string; ci: string }
}

export default function SorteoBtn({ rifaId, rifaTitulo }: { rifaId: string; rifaTitulo: string }) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [modo, setModo] = useState<'automatico' | 'manual'>('automatico')
  const [numeroManual, setNumeroManual] = useState('')
  const [sorteando, setSorteando] = useState(false)
  const [ganador, setGanador] = useState<Ganador | null>(null)
  const [contador, setContador] = useState<number | null>(null)

  const realizarSorteo = async () => {
    if (modo === 'manual' && !numeroManual) {
      toast.error('Ingresa el número ganador'); return
    }

    // Cuenta regresiva dramática
    setSorteando(true)
    for (let i = 5; i >= 1; i--) {
      setContador(i)
      await new Promise(r => setTimeout(r, 800))
    }
    setContador(0)
    await new Promise(r => setTimeout(r, 500))

    try {
      const res = await fetch(`/api/rifas/${rifaId}/sortear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modo === 'manual' ? { numeroManual } : {}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGanador(data)
      setContador(null)
    } catch (err: any) {
      toast.error(err.message)
      setSorteando(false)
      setContador(null)
    }
  }

  if (!abierto) return (
    <button
      onClick={() => setAbierto(true)}
      className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition-all"
    >
      🏆 Realizar sorteo
    </button>
  )

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Cuenta regresiva */}
        {sorteando && contador !== null && (
          <div className="bg-gray-900 p-12 text-center">
            {contador > 0 ? (
              <>
                <p className="text-gray-400 text-sm mb-3 uppercase tracking-widest">Sorteando en</p>
                <p className="text-8xl font-black text-white animate-pulse">{contador}</p>
              </>
            ) : (
              <>
                <p className="text-gray-400 text-sm mb-3 uppercase tracking-widest">¡Sorteando!</p>
                <div className="text-6xl animate-spin inline-block">🎰</div>
              </>
            )}
          </div>
        )}

        {/* Resultado ganador */}
        {ganador && (
          <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-8 text-center">
            <div className="text-5xl mb-3">🏆</div>
            <p className="text-white/80 text-sm uppercase tracking-widest mb-2">¡Número ganador!</p>
            <p className="text-7xl font-black text-white mb-4">{ganador.numeroGanador}</p>

            {ganador.tieneDueno && ganador.comprador ? (
              <div className="bg-white/20 rounded-2xl p-4 text-white">
                <p className="text-2xl font-bold mb-1">{ganador.comprador.nombre}</p>
                <p className="text-sm opacity-80">CI: {ganador.comprador.ci}</p>
                <p className="text-sm opacity-80">📱 {ganador.comprador.telefono}</p>
                <p className="text-sm opacity-80">✉️ {ganador.comprador.email}</p>
                <p className="text-xs mt-3 opacity-70">✅ Se envió email de notificación al ganador</p>
              </div>
            ) : (
              <div className="bg-white/20 rounded-2xl p-4 text-white">
                <p className="font-semibold">⚠️ Este número no fue vendido</p>
                <p className="text-sm opacity-80 mt-1">Puedes volver a sortear o ingresar otro número</p>
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setAbierto(false); router.push(`/ganador/${rifaId}`) }}
                className="flex-1 bg-white text-amber-700 font-bold py-3 rounded-xl hover:bg-amber-50 transition-all"
              >
                Ver página pública
              </button>
              <button
                onClick={() => setAbierto(false)}
                className="px-4 bg-white/20 text-white font-bold py-3 rounded-xl hover:bg-white/30 transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Formulario sorteo */}
        {!sorteando && !ganador && (
          <>
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-black text-gray-900">🏆 Realizar sorteo</h2>
              <p className="text-gray-500 text-sm mt-1 line-clamp-1">{rifaTitulo}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setModo('automatico')}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${modo === 'automatico' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-amber-300'}`}
                >
                  <div className="text-2xl mb-1">🎲</div>
                  <p className="font-semibold text-sm text-gray-800">Aleatorio</p>
                  <p className="text-xs text-gray-500 mt-0.5">Entre tickets pagados</p>
                </button>
                <button
                  onClick={() => setModo('manual')}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${modo === 'manual' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-amber-300'}`}
                >
                  <div className="text-2xl mb-1">✏️</div>
                  <p className="font-semibold text-sm text-gray-800">Manual</p>
                  <p className="text-xs text-gray-500 mt-0.5">Ingresar número</p>
                </button>
              </div>

              {modo === 'manual' && (
                <div>
                  <label className="label">Número ganador</label>
                  <input
                    type="number"
                    className="input text-center text-2xl font-bold"
                    value={numeroManual}
                    onChange={e => setNumeroManual(e.target.value)}
                    placeholder="Ej: 4521"
                    min={1}
                  />
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                ⚠️ Esta acción es irreversible. La rifa quedará marcada como sorteada y se notificará al ganador por email.
              </div>

              <div className="flex gap-3">
                <button onClick={() => setAbierto(false)} className="btn-secondary flex-1 text-sm py-2.5">
                  Cancelar
                </button>
                <button onClick={realizarSorteo} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl transition-all text-sm">
                  🎰 ¡Sortear!
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
