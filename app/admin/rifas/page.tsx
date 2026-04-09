import { prisma } from '@/lib/db'
import { formatBs, formatDate } from '@/lib/utils'
import Link from 'next/link'

export default async function AdminRifas() {
  const rifas = await prisma.rifa.findMany({ orderBy: { creadoEn: 'desc' } })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Rifas</h1>
          <p className="text-gray-400 text-sm">{rifas.length} rifas en total</p>
        </div>
        <Link href="/admin/rifas/nueva" className="btn-primary text-sm py-2.5">+ Nueva rifa</Link>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-gray-500 font-semibold">Rifa</th>
                <th className="text-left px-5 py-3 text-gray-500 font-semibold">Premio</th>
                <th className="text-left px-5 py-3 text-gray-500 font-semibold">Precio</th>
                <th className="text-left px-5 py-3 text-gray-500 font-semibold">Números</th>
                <th className="text-left px-5 py-3 text-gray-500 font-semibold">Vendidos</th>
                <th className="text-left px-5 py-3 text-gray-500 font-semibold">Sorteo</th>
                <th className="text-left px-5 py-3 text-gray-500 font-semibold">Estado</th>
                <th className="text-left px-5 py-3 text-gray-500 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rifas.map(r => {
                const pct = Math.round(r.numerosVendidos / r.totalNumeros * 100)
                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900 max-w-xs line-clamp-1">{r.titulo}</p>
                      <p className="text-xs text-gray-400 font-mono">{r.id.slice(0, 8)}...</p>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{r.premio}</td>
                    <td className="px-5 py-4 font-semibold text-primary-600">{formatBs(r.precio)}</td>
                    <td className="px-5 py-4 text-gray-600">{r.totalNumeros.toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-gray-800 font-medium">{r.numerosVendidos.toLocaleString()} <span className="text-gray-400 text-xs">({pct}%)</span></p>
                        <div className="w-24 bg-gray-100 rounded-full h-1.5 mt-1">
                          <div className="h-1.5 bg-primary-600 rounded-full" style={{ width: `${pct}%` }}/>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{formatDate(r.fechaSorteo)}</td>
                    <td className="px-5 py-4">
                      <span className={`badge ${r.estado === 'activa' ? 'bg-green-100 text-green-700' : r.estado === 'sorteada' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                        {r.estado}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Link href={`/admin/rifas/${r.id}`} className="text-primary-600 hover:underline text-sm font-medium">
                          Ver
                        </Link>
                        <Link href={`/admin/rifas/${r.id}/editar`} className="text-gray-500 hover:underline text-sm font-medium">
                          Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {rifas.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-400">
                    No hay rifas. <Link href="/admin/rifas/nueva" className="text-primary-600 hover:underline">Crea la primera</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
