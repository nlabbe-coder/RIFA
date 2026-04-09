import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Confetti from './Confetti'

export default async function GanadorPage({ params }: { params: Promise<{ rifaId: string }> }) {
  const { rifaId } = await params

  const rifa = await prisma.rifa.findUnique({
    where: { id: rifaId },
  })

  if (!rifa || rifa.estado !== 'sorteada' || !rifa.ganadorNumero) notFound()

  const digits = rifa.totalNumeros.toString().length
  const numeroFormato = rifa.ganadorNumero.toString().padStart(digits, '0')

  // Buscar nombre del ganador si tiene dueño
  const ganador = rifa.ganadorId
    ? await prisma.comprador.findUnique({ where: { id: rifa.ganadorId } })
    : null
  const nombreGanador = ganador?.nombre ?? null

  return (
    <>
      <Navbar />
      <Confetti />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">

          {/* Trophy animation */}
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-2xl mb-8 animate-bounce">
            <span className="text-6xl">🏆</span>
          </div>

          <p className="text-amber-600 font-bold uppercase tracking-widest text-sm mb-3">¡Tenemos ganador!</p>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-2">{rifa.titulo}</h1>
          <p className="text-gray-500 mb-10">Sorteo realizado el {formatDate(new Date().toISOString())}</p>

          {/* Winning number */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-3xl p-10 mb-8 shadow-2xl">
            <p className="text-white/80 text-sm uppercase tracking-widest mb-4">Número ganador</p>
            <p className="text-8xl md:text-9xl font-black text-white tracking-wider mb-6">{numeroFormato}</p>

            {/* Prize */}
            <div className="bg-white/20 rounded-2xl py-4 px-6 inline-block">
              <p className="text-white/80 text-xs uppercase tracking-widest mb-1">Premio</p>
              <p className="text-white font-black text-2xl">{rifa.premio}</p>
            </div>
          </div>

          {/* Winner name */}
          {nombreGanador ? (
            <div className="card p-8 mb-8 border-2 border-amber-200 bg-amber-50">
              <p className="text-amber-700 text-sm uppercase tracking-widest mb-3 font-semibold">Ganador</p>
              <p className="text-4xl font-black text-gray-900 mb-2">🎉 {nombreGanador}</p>
              <p className="text-gray-500 text-sm">Felicitaciones, nos pondremos en contacto contigo</p>
            </div>
          ) : (
            <div className="card p-8 mb-8 border border-gray-200 bg-gray-50">
              <p className="text-gray-500">⚠️ Este número no fue vendido — el organizador definirá cómo proceder</p>
            </div>
          )}

          {/* Share */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`🏆 ¡El número ganador de "${rifa.titulo}" es el ${numeroFormato}! 🎉`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Compartir en WhatsApp
            </a>
          </div>

          <Link href="/" className="text-primary-600 hover:underline text-sm font-medium">
            ← Ver más rifas
          </Link>
        </div>
      </div>
    </>
  )
}
