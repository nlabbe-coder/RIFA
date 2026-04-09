import { prisma } from '@/lib/db'
import Navbar from '@/components/Navbar'
import RaffleCard from '@/components/RaffleCard'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getRifas() {
  return prisma.rifa.findMany({
    orderBy: { creadoEn: 'desc' },
  })
}

export default async function HomePage() {
  const rifas = await getRifas()
  const rifasActivas = rifas.filter(r => r.estado === 'activa')
  const rifasFinalizadas = rifas.filter(r => r.estado !== 'activa')

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white py-20 px-4 relative overflow-hidden">
        {/* Decoración */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-8xl">🎟️</div>
          <div className="absolute bottom-10 right-10 text-8xl">⭐</div>
          <div className="absolute top-1/2 left-1/3 text-6xl">🏆</div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur rounded-full px-4 py-2 text-sm font-medium mb-6">
            <span className="text-gold-400">★</span>
            La plataforma de rifas más confiable de Bolivia
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            ¡Tu suerte empieza<br/>
            <span className="text-gold-400">aquí!</span>
          </h1>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Compra tus números al instante, paga con todos los medios de pago bolivianos y participa por premios increíbles.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#rifas" className="btn-gold text-lg px-8 py-4 rounded-2xl">
              Ver rifas activas ↓
            </a>
            <Link href="/#como-funciona" className="bg-white/15 hover:bg-white/25 text-white font-semibold px-8 py-4 rounded-2xl transition-all">
              ¿Cómo funciona?
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-16 max-w-2xl mx-auto">
            {[
              { num: '100%', label: 'Seguro y confiable' },
              { num: rifasActivas.length.toString(), label: 'Rifas activas' },
              { num: 'QR, Banco, Tigo', label: 'Medios de pago' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl md:text-3xl font-black text-gold-400">{s.num}</p>
                <p className="text-primary-200 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rifas activas */}
      <section id="rifas" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-gray-900">Rifas activas</h2>
              <p className="text-gray-500 mt-1">¡No te quedes sin tu número!</p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm text-verde-600 font-medium bg-green-50 px-4 py-2 rounded-full">
              <span className="w-2 h-2 bg-verde-500 rounded-full animate-pulse"></span>
              {rifasActivas.length} {rifasActivas.length === 1 ? 'rifa disponible' : 'rifas disponibles'}
            </div>
          </div>

          {rifasActivas.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-6xl mb-4">🎟️</div>
              <p className="text-xl font-semibold">No hay rifas activas por el momento</p>
              <p className="text-sm mt-2">¡Vuelve pronto!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rifasActivas.map(rifa => (
                <RaffleCard key={rifa.id} rifa={rifa} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-center text-gray-900 mb-2">¿Cómo funciona?</h2>
          <p className="text-gray-500 text-center mb-12">Participar es muy fácil</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: '🎟️', step: '1', title: 'Elige tu rifa', desc: 'Selecciona la rifa que más te guste y el precio por número.' },
              { icon: '🔢', step: '2', title: 'Elige tu número', desc: 'Selecciona tu número de la suerte o déjanos asignarte uno al azar.' },
              { icon: '💳', step: '3', title: 'Paga fácil', desc: 'Paga con QR, transferencia bancaria, Tigo Money o tarjeta.' },
              { icon: '🏆', step: '4', title: '¡Gana!', desc: 'Espera el sorteo y si eres el ganador, recibe tu premio.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                  {item.icon}
                </div>
                <div className="w-7 h-7 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Medios de pago */}
      <section className="py-12 px-4 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-6">Medios de pago aceptados</p>
          <div className="flex flex-wrap justify-center items-center gap-6">
            {[
              { icon: '🏦', label: 'Transferencia Bancaria' },
              { icon: '📱', label: 'QR Interoperable' },
              { icon: '📲', label: 'Tigo Money' },
              { icon: '💳', label: 'Tarjeta de crédito/débito' },
            ].map(m => (
              <div key={m.label} className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
                <span className="text-xl">{m.icon}</span>
                <span className="text-sm font-medium text-gray-700">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rifas finalizadas */}
      {rifasFinalizadas.length > 0 && (
        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-700 mb-6">Rifas anteriores</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-70">
              {rifasFinalizadas.map(rifa => (
                <RaffleCard key={rifa.id} rifa={rifa} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer id="contacto" className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-3">RifaBolivia</h3>
            <p className="text-sm">La plataforma de rifas digitales más confiable de Bolivia. Participar es fácil, seguro y 100% transparente.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Contacto</h4>
            <p className="text-sm">📧 info@rifabolivia.com</p>
            <p className="text-sm mt-1">📱 WhatsApp: +591 7X XXX XXX</p>
            <p className="text-sm mt-1">📍 Bolivia</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Legal</h4>
            <p className="text-sm">Empresa legalmente constituida en Bolivia.</p>
            <p className="text-sm mt-2">Sorteos verificables y transparentes.</p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-gray-800 text-center text-sm">
          © {new Date().getFullYear()} RifaBolivia. Todos los derechos reservados.
        </div>
      </footer>
    </>
  )
}
