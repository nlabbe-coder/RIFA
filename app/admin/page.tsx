import { prisma } from '@/lib/db'
import { formatBs } from '@/lib/utils'
import Link from 'next/link'

async function getStats() {
  const [rifas, ordenes, compradores] = await Promise.all([
    prisma.rifa.findMany(),
    prisma.orden.findMany({ include: { rifa: { select: { titulo: true } } } }),
    prisma.comprador.count(),
  ])

  const ventas = ordenes.filter(o => o.estadoPago === 'confirmado')
  const pendientes = ordenes.filter(o => o.estadoPago === 'pendiente')
  const totalRecaudado = ventas.reduce((s, o) => s + o.total, 0)
  const rifasActivas = rifas.filter(r => r.estado === 'activa')

  return { rifas, ordenes, ventas, pendientes, compradores, totalRecaudado, rifasActivas }
}

export default async function AdminDashboard() {
  const { rifas, ordenes, ventas, pendientes, compradores, totalRecaudado, rifasActivas } = await getStats()

  const stats = [
    { label: 'Total recaudado', value: formatBs(totalRecaudado), icon: '💰', color: 'bg-verde-500', sub: 'Pagos confirmados' },
    { label: 'Rifas activas', value: rifasActivas.length.toString(), icon: '🎟️', color: 'bg-primary-600', sub: `${rifas.length} total` },
    { label: 'Ventas confirmadas', value: ventas.length.toString(), icon: '✅', color: 'bg-blue-500', sub: 'Pagos verificados' },
    { label: 'Pagos pendientes', value: pendientes.length.toString(), icon: '⏳', color: 'bg-amber-500', sub: 'Por confirmar', alert: pendientes.length > 0 },
    { label: 'Compradores', value: compradores.toString(), icon: '👥', color: 'bg-purple-500', sub: 'Registrados' },
  ]

  const ultimasOrdenes = ordenes.slice(0, 10)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">Resumen de tu plataforma</p>
        </div>
        <Link href="/admin/rifas/nueva" className="btn-primary text-sm py-2.5">
          + Nueva rifa
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className={`card p-5 ${s.alert ? 'ring-2 ring-amber-400' : ''}`}>
            <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center text-lg mb-3`}>
              {s.icon}
            </div>
            <p className="text-2xl font-black text-gray-900">{s.value}</p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">{s.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rifas activas */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Rifas activas</h2>
            <Link href="/admin/rifas" className="text-sm text-primary-600 hover:underline">Ver todas</Link>
          </div>
          <div className="space-y-3">
            {rifasActivas.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No hay rifas activas</p>}
            {rifasActivas.map(r => {
              const pct = Math.round(r.numerosVendidos / r.totalNumeros * 100)
              return (
                <div key={r.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800 line-clamp-1">{r.titulo}</p>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                      <div className="h-1.5 bg-primary-600 rounded-full" style={{ width: `${pct}%` }}/>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{pct}%</span>
                  <Link href={`/admin/rifas/${r.id}`} className="text-xs text-primary-600 hover:underline">Ver</Link>
                </div>
              )
            })}
          </div>
        </div>

        {/* Últimas órdenes */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Últimas órdenes</h2>
            <Link href="/admin/ventas" className="text-sm text-primary-600 hover:underline">Ver todas</Link>
          </div>
          <div className="space-y-2">
            {ultimasOrdenes.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Sin órdenes aún</p>}
            {ultimasOrdenes.map(o => (
              <div key={o.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800 line-clamp-1">{o.rifa.titulo}</p>
                  <p className="text-xs text-gray-400">{o.metodoPago} · {formatBs(o.total)}</p>
                </div>
                <span className={`badge text-xs ${
                  o.estadoPago === 'confirmado' ? 'bg-green-100 text-green-700'
                  : o.estadoPago === 'pendiente' ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
                }`}>
                  {o.estadoPago}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
