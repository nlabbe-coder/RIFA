import Link from 'next/link'
import { formatBs, formatDate, porcentajeVendido } from '@/lib/utils'

interface RaffleCardProps {
  rifa: {
    id: string
    titulo: string
    descripcion: string
    imagen?: string | null
    precio: number
    totalNumeros: number
    numerosVendidos: number
    fechaSorteo: Date
    premio: string
    estado: string
  }
}

export default function RaffleCard({ rifa }: RaffleCardProps) {
  const pct = porcentajeVendido(rifa.numerosVendidos, rifa.totalNumeros)
  const disponibles = rifa.totalNumeros - rifa.numerosVendidos

  return (
    <div className="card hover:shadow-lg transition-all duration-300 group">
      {/* Imagen */}
      <div className="relative h-52 bg-gradient-to-br from-primary-600 to-primary-800 overflow-hidden">
        {rifa.imagen ? (
          <img src={rifa.imagen} alt={rifa.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-6xl mb-2">🏆</div>
              <p className="font-bold text-lg px-4">{rifa.premio}</p>
            </div>
          </div>
        )}
        {/* Badge estado */}
        <div className="absolute top-3 left-3">
          <span className={`badge ${rifa.estado === 'activa' ? 'bg-verde-500 text-white' : 'bg-gray-500 text-white'}`}>
            {rifa.estado === 'activa' ? '● Activa' : rifa.estado}
          </span>
        </div>
        {/* Precio */}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur rounded-xl px-3 py-1.5 shadow">
          <p className="text-primary-700 font-bold text-sm">{formatBs(rifa.precio)}</p>
          <p className="text-gray-500 text-xs">por número</p>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-5">
        <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">{rifa.titulo}</h3>
        <p className="text-gray-500 text-sm mb-4 line-clamp-2">{rifa.descripcion}</p>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>{rifa.numerosVendidos.toLocaleString()} vendidos</span>
            <span className="font-semibold text-primary-600">{pct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="progress-bar h-2.5 rounded-full bg-gradient-to-r from-primary-500 to-primary-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{disponibles.toLocaleString()} números disponibles</p>
        </div>

        {/* Fecha sorteo */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          Sorteo: <span className="font-medium text-gray-700">{formatDate(rifa.fechaSorteo)}</span>
        </div>

        <Link
          href={`/rifa/${rifa.id}`}
          className={`w-full block text-center font-bold py-3 rounded-xl transition-all duration-200 ${
            rifa.estado === 'activa'
              ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-md hover:shadow-lg active:scale-95'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {rifa.estado === 'activa' ? '¡Quiero participar!' : 'Rifa cerrada'}
        </Link>
      </div>
    </div>
  )
}
