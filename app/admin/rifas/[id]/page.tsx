import { prisma } from '@/lib/db'
import { formatBs, formatDate, formatDateTime } from '@/lib/utils'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import RifaEstadoSelector from '@/components/RifaEstadoSelector'
import SorteoBtn from '@/components/SorteoBtn'

export default async function AdminRifaDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rifa = await prisma.rifa.findUnique({
    where: { id },
    include: {
      ordenes: {
        include: { comprador: true },
        orderBy: { creadoEn: 'desc' },
      },
    },
  })
  if (!rifa) notFound()

  const confirmadas = rifa.ordenes.filter(o => o.estadoPago === 'confirmado')
  const pendientes = rifa.ordenes.filter(o => o.estadoPago === 'pendiente')
  const recaudado = confirmadas.reduce((s, o) => s + o.total, 0)
  const pct = Math.round(rifa.numerosVendidos / rifa.totalNumeros * 100)

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Link href="/admin/rifas" className="text-gray-400 hover:text-gray-600 text-sm">← Rifas</Link>
      </div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{rifa.titulo}</h1>
          <p className="text-gray-400 text-sm mt-0.5">{rifa.premio} · Sorteo: {formatDate(rifa.fechaSorteo)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/admin/rifas/${rifa.id}/editar`} className="btn-secondary text-sm py-2 px-4">
            ✏️ Editar
          </Link>
          <RifaEstadoSelector rifaId={rifa.id} estadoActual={rifa.estado} />
          {rifa.estado !== 'sorteada' && (
            <SorteoBtn rifaId={rifa.id} rifaTitulo={rifa.titulo} />
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Recaudado', value: formatBs(recaudado), color: 'text-verde-600', icon: '💰' },
          { label: 'Vendidos', value: `${rifa.numerosVendidos.toLocaleString()} (${pct}%)`, color: 'text-primary-600', icon: '🎟️' },
          { label: 'Confirmados', value: confirmadas.length.toString(), color: 'text-green-600', icon: '✅' },
          { label: 'Pendientes', value: pendientes.length.toString(), color: 'text-amber-600', icon: '⏳' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className="text-xl mb-0.5">{s.icon}</p>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="card p-5 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-gray-700">Progreso de ventas</span>
          <span className="font-bold text-primary-600">{pct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
          <div className="h-4 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full transition-all" style={{ width: `${pct}%` }}/>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{rifa.numerosVendidos.toLocaleString()} vendidos</span>
          <span>{(rifa.totalNumeros - rifa.numerosVendidos).toLocaleString()} disponibles</span>
        </div>
      </div>

      {/* Órdenes */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Órdenes ({rifa.ordenes.length})</h2>
          {pendientes.length > 0 && (
            <span className="badge bg-amber-100 text-amber-700">⏳ {pendientes.length} por confirmar</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-gray-500 font-semibold">Comprador</th>
                <th className="text-left px-5 py-3 text-gray-500 font-semibold">Números</th>
                <th className="text-left px-5 py-3 text-gray-500 font-semibold">Total</th>
                <th className="text-left px-5 py-3 text-gray-500 font-semibold">Pago</th>
                <th className="text-left px-5 py-3 text-gray-500 font-semibold">Estado</th>
                <th className="text-left px-5 py-3 text-gray-500 font-semibold">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rifa.ordenes.map(o => {
                const nums: number[] = JSON.parse(o.numeros)
                return (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800">{o.comprador.nombre}</p>
                      <p className="text-xs text-gray-400">{o.comprador.telefono}</p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-0.5 max-w-xs">
                        {nums.slice(0, 5).map(n => (
                          <span key={n} className="bg-primary-100 text-primary-700 text-xs px-1.5 py-0.5 rounded">{n}</span>
                        ))}
                        {nums.length > 5 && <span className="text-xs text-gray-400">+{nums.length - 5} más</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3 font-semibold text-gray-800">{formatBs(o.total)}</td>
                    <td className="px-5 py-3 text-gray-600 capitalize">{o.metodoPago.replace('_', ' ')}</td>
                    <td className="px-5 py-3">
                      <span className={`badge ${
                        o.estadoPago === 'confirmado' ? 'bg-green-100 text-green-700'
                        : o.estadoPago === 'pendiente' ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                      }`}>
                        {o.estadoPago}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{formatDateTime(o.creadoEn)}</td>
                  </tr>
                )
              })}
              {rifa.ordenes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400">Sin órdenes aún</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
