import { prisma } from '@/lib/db'
import { formatDateTime } from '@/lib/utils'

export default async function AdminCompradores() {
  const compradores = await prisma.comprador.findMany({
    include: {
      ordenes: {
        where: { estadoPago: 'confirmado' },
        select: { total: true, rifaId: true, numeros: true },
      },
    },
    orderBy: { creadoEn: 'desc' },
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Compradores</h1>
        <p className="text-gray-400 text-sm">{compradores.length} compradores registrados</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-gray-500 font-semibold">Nombre</th>
                <th className="text-left px-5 py-3 text-gray-500 font-semibold">CI</th>
                <th className="text-left px-5 py-3 text-gray-500 font-semibold">Teléfono</th>
                <th className="text-left px-5 py-3 text-gray-500 font-semibold">Email</th>
                <th className="text-left px-5 py-3 text-gray-500 font-semibold">Compras</th>
                <th className="text-left px-5 py-3 text-gray-500 font-semibold">Total gastado</th>
                <th className="text-left px-5 py-3 text-gray-500 font-semibold">Registrado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {compradores.map(c => {
                const totalGastado = c.ordenes.reduce((s, o) => s + o.total, 0)
                const totalNumeros = c.ordenes.reduce((s, o) => {
                  const nums = JSON.parse(o.numeros)
                  return s + nums.length
                }, 0)
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{c.nombre}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-600 font-mono text-xs">{c.ci}</td>
                    <td className="px-5 py-4">
                      <a href={`https://wa.me/591${c.telefono}`} target="_blank" rel="noopener noreferrer"
                        className="text-verde-600 hover:underline font-medium">
                        {c.telefono}
                      </a>
                    </td>
                    <td className="px-5 py-4 text-gray-600 text-xs">{c.email}</td>
                    <td className="px-5 py-4">
                      <p className="text-gray-800 font-medium">{c.ordenes.length} órden{c.ordenes.length !== 1 ? 'es' : ''}</p>
                      <p className="text-xs text-gray-400">{totalNumeros} número{totalNumeros !== 1 ? 's' : ''}</p>
                    </td>
                    <td className="px-5 py-4 font-bold text-primary-600">
                      Bs. {totalGastado.toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs">{formatDateTime(c.creadoEn)}</td>
                  </tr>
                )
              })}
              {compradores.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                    No hay compradores registrados aún
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
