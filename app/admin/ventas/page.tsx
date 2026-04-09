import { prisma } from '@/lib/db'
import { formatBs, formatDateTime, metodoPagoLabel } from '@/lib/utils'
import ConfirmarPagoBtn from '@/components/ConfirmarPagoBtn'

export default async function AdminVentas() {
  const ordenes = await prisma.orden.findMany({
    include: {
      comprador: true,
      rifa: { select: { titulo: true, totalNumeros: true } },
    },
    orderBy: { creadoEn: 'desc' },
  })

  const pendientes = ordenes.filter(o => o.estadoPago === 'pendiente')
  const confirmadas = ordenes.filter(o => o.estadoPago === 'confirmado')
  const totalRecaudado = confirmadas.reduce((s, o) => s + o.total, 0)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Ventas & Pagos</h1>
        <p className="text-gray-400 text-sm">{ordenes.length} órdenes en total</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <p className="text-2xl font-black text-verde-600">{formatBs(totalRecaudado)}</p>
          <p className="text-sm text-gray-500 mt-0.5">Total recaudado</p>
        </div>
        <div className="card p-5">
          <p className="text-2xl font-black text-amber-600">{pendientes.length}</p>
          <p className="text-sm text-gray-500 mt-0.5">Pagos pendientes</p>
        </div>
        <div className="card p-5">
          <p className="text-2xl font-black text-green-600">{confirmadas.length}</p>
          <p className="text-sm text-gray-500 mt-0.5">Pagos confirmados</p>
        </div>
      </div>

      {/* Pendientes primero */}
      {pendientes.length > 0 && (
        <div className="mb-6">
          <h2 className="font-bold text-amber-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
            Pagos pendientes de confirmación ({pendientes.length})
          </h2>
          <div className="space-y-3">
            {pendientes.map(o => {
              const nums: number[] = JSON.parse(o.numeros)
              const digits = o.rifa.totalNumeros.toString().length
              return (
                <div key={o.id} className="card p-5 border-l-4 border-amber-400">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-gray-900">{o.comprador.nombre}</p>
                      <p className="text-sm text-gray-500">{o.comprador.ci} · {o.comprador.telefono} · {o.comprador.email}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>Rifa:</strong> {o.rifa.titulo}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Pago:</strong> {metodoPagoLabel(o.metodoPago)} ·
                        <strong> Monto:</strong> {formatBs(o.total)}
                      </p>
                      {o.comprobante && (
                        <p className="text-sm text-gray-600"><strong>Comprobante:</strong> {o.comprobante}</p>
                      )}
                      {(o as any).fotoCI && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1 font-medium">📋 Foto del CI:</p>
                          <a href={(o as any).fotoCI} target="_blank" rel="noopener noreferrer">
                            <img src={(o as any).fotoCI} alt="CI" className="h-20 rounded-lg border border-gray-200 hover:opacity-80 transition-opacity cursor-pointer"/>
                          </a>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {nums.slice(0, 10).map(n => (
                          <span key={n} className="bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-lg font-medium">
                            {n.toString().padStart(digits, '0')}
                          </span>
                        ))}
                        {nums.length > 10 && <span className="text-xs text-gray-400">+{nums.length - 10} más</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">{formatDateTime(o.creadoEn)}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <ConfirmarPagoBtn ordenId={o.id} accion="confirmado" />
                      <ConfirmarPagoBtn ordenId={o.id} accion="rechazado" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Historial completo */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Historial completo</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-gray-500 font-semibold">Comprador</th>
                <th className="text-left px-5 py-3 text-gray-500 font-semibold">Rifa</th>
                <th className="text-left px-5 py-3 text-gray-500 font-semibold">Números</th>
                <th className="text-left px-5 py-3 text-gray-500 font-semibold">Monto</th>
                <th className="text-left px-5 py-3 text-gray-500 font-semibold">Método</th>
                <th className="text-left px-5 py-3 text-gray-500 font-semibold">Estado</th>
                <th className="text-left px-5 py-3 text-gray-500 font-semibold">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ordenes.map(o => {
                const nums: number[] = JSON.parse(o.numeros)
                return (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800">{o.comprador.nombre}</p>
                      <p className="text-xs text-gray-400">{o.comprador.ci}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-600 text-xs max-w-[150px] line-clamp-2">{o.rifa.titulo}</td>
                    <td className="px-5 py-3">
                      <span className="text-gray-700">{nums.length} número{nums.length > 1 ? 's' : ''}</span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-gray-800">{formatBs(o.total)}</td>
                    <td className="px-5 py-3 text-gray-600 capitalize text-xs">{o.metodoPago.replace('_', ' ')}</td>
                    <td className="px-5 py-3">
                      <span className={`badge ${
                        o.estadoPago === 'confirmado' ? 'bg-green-100 text-green-700'
                        : o.estadoPago === 'pendiente' ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                      }`}>{o.estadoPago}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{formatDateTime(o.creadoEn)}</td>
                  </tr>
                )
              })}
              {ordenes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">Sin ventas aún</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
