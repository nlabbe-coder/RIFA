'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { formatBs } from '@/lib/utils'
import toast from 'react-hot-toast'

interface CheckoutData { rifaId: string; numeros: number[] }
interface ConfigPago {
  tipoPago: string; habilitado: boolean
  banco?: string; numeroCuenta?: string; titular?: string
  numeroTigo?: string; nombreTigo?: string; qrImagen?: string
}
interface Rifa { id: string; titulo: string; precio: number; totalNumeros: number }

const METODOS = [
  { id: 'transferencia', label: 'Transferencia Bancaria', icon: '🏦', desc: 'Transfiere a nuestra cuenta bancaria' },
  { id: 'qr',           label: 'QR Interoperable',       icon: '📱', desc: 'Escanea el código QR con tu app bancaria' },
  { id: 'tigo_money',   label: 'Tigo Money',             icon: '📲', desc: 'Paga con tu billetera Tigo Money' },
  { id: 'tarjeta',      label: 'Tarjeta Crédito/Débito', icon: '💳', desc: 'Próximamente disponible' },
]

export default function CheckoutPage() {
  const router = useRouter()
  const [data, setData] = useState<CheckoutData | null>(null)
  const [rifa, setRifa] = useState<Rifa | null>(null)
  const [configPagos, setConfigPagos] = useState<ConfigPago[]>([])
  const [metodo, setMetodo] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ nombre: '', ci: '', telefono: '', email: '', comprobante: '' })

  // Foto CI
  const fileRef = useRef<HTMLInputElement>(null)
  const camaraRef = useRef<HTMLInputElement>(null)
  const [fotoCI, setFotoCI] = useState<string | null>(null)
  const [fotoCIUrl, setFotoCIUrl] = useState<string>('')
  const [uploadingCI, setUploadingCI] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('checkout_data')
    if (!raw) { router.push('/'); return }
    const parsed: CheckoutData = JSON.parse(raw)
    setData(parsed)
    fetch(`/api/rifas/${parsed.rifaId}`).then(r => r.json()).then(setRifa)
    fetch('/api/config-pagos').then(r => r.json()).then(setConfigPagos)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const subirFotoCI = async (file: File) => {
    setFotoCI(URL.createObjectURL(file))
    setUploadingCI(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      setFotoCIUrl(result.url)
      toast.success('Foto del CI subida correctamente')
    } catch (err: any) {
      toast.error(err.message)
      setFotoCI(null)
      setFotoCIUrl('')
    } finally {
      setUploadingCI(false)
    }
  }

  const handleFotoCI = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) subirFotoCI(file)
  }

  const total = (data?.numeros.length ?? 0) * (rifa?.precio ?? 0)
  const digits = rifa?.totalNumeros.toString().length ?? 1
  const configMetodo = configPagos.find(c => c.tipoPago === metodo)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!metodo) { toast.error('Selecciona un método de pago'); return }
    if (!form.nombre || !form.ci || !form.telefono || !form.email) {
      toast.error('Completa todos tus datos'); return
    }
    if (!fotoCIUrl) { toast.error('Debes subir una foto de tu carnet de identidad'); return }
    if (uploadingCI) { toast.error('Espera a que termine de subir la foto'); return }
    if (!data || !rifa) return

    setLoading(true)
    try {
      const res = await fetch('/api/ordenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rifaId: data.rifaId,
          numeros: data.numeros,
          metodoPago: metodo,
          comprador: form,
          comprobante: form.comprobante,
          fotoCI: fotoCIUrl,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error ?? 'Error al procesar')
      sessionStorage.setItem('orden_id', result.id)
      sessionStorage.removeItem('checkout_data')
      router.push('/confirmacion')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!data || !rifa) return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full"/>
      </div>
    </>
  )

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-gray-900 mb-6">Checkout</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">

            {/* Datos personales */}
            <div className="card p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-5">Tus datos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Nombre completo *</label>
                  <input name="nombre" value={form.nombre} onChange={handleChange} className="input" placeholder="Ej: Juan Mamani" required/>
                </div>
                <div>
                  <label className="label">Carnet de identidad (CI) *</label>
                  <input name="ci" value={form.ci} onChange={handleChange} className="input" placeholder="Ej: 1234567 LP" required/>
                </div>
                <div>
                  <label className="label">Teléfono / WhatsApp *</label>
                  <input name="telefono" value={form.telefono} onChange={handleChange} className="input" placeholder="Ej: 70000000" required/>
                </div>
                <div>
                  <label className="label">Correo electrónico *</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} className="input" placeholder="tu@correo.com" required/>
                </div>
              </div>
            </div>

            {/* Foto CI */}
            <div className="card p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-1">Foto de tu Carnet de Identidad *</h2>
              <p className="text-gray-400 text-sm mb-5">Necesitamos verificar tu identidad. Toma una foto de la parte frontal de tu CI.</p>

              {!fotoCI ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Subir archivo */}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 hover:border-primary-400 hover:bg-primary-50 rounded-xl p-6 transition-all"
                  >
                    <span className="text-4xl">📁</span>
                    <div className="text-center">
                      <p className="font-semibold text-gray-700 text-sm">Subir desde galería</p>
                      <p className="text-gray-400 text-xs mt-0.5">JPG, PNG o WebP</p>
                    </div>
                  </button>

                  {/* Tomar foto con cámara */}
                  <button
                    type="button"
                    onClick={() => camaraRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 hover:border-primary-400 hover:bg-primary-50 rounded-xl p-6 transition-all"
                  >
                    <span className="text-4xl">📷</span>
                    <div className="text-center">
                      <p className="font-semibold text-gray-700 text-sm">Tomar foto con cámara</p>
                      <p className="text-gray-400 text-xs mt-0.5">Usa la cámara de tu teléfono</p>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <img src={fotoCI} alt="Foto CI" className="w-full max-h-56 object-contain rounded-xl border-2 border-primary-200 bg-gray-50"/>
                  {uploadingCI && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 rounded-xl gap-2">
                      <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"/>
                      <p className="text-sm text-gray-600 font-medium">Subiendo foto...</p>
                    </div>
                  )}
                  {!uploadingCI && (
                    <div className="absolute top-2 right-2 flex gap-2">
                      <span className="bg-verde-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">✓ Verificada</span>
                      <button
                        type="button"
                        onClick={() => { setFotoCI(null); setFotoCIUrl('') }}
                        className="bg-white text-gray-500 hover:text-red-500 text-xs font-bold px-2.5 py-1 rounded-full border border-gray-200 shadow-sm"
                      >
                        Cambiar
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Inputs ocultos */}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFotoCI}/>
              <input ref={camaraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFotoCI}/>

              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
                🔒 Tu foto es privada y solo la verá el administrador para verificar tu identidad.
              </p>
            </div>

            {/* Método de pago */}
            <div className="card p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-5">Método de pago</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {METODOS.map(m => {
                  const config = configPagos.find(c => c.tipoPago === m.id)
                  const disabled = m.id === 'tarjeta' || (config && !config.habilitado)
                  return (
                    <button
                      key={m.id}
                      type="button"
                      disabled={!!disabled}
                      onClick={() => !disabled && setMetodo(m.id)}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        metodo === m.id
                          ? 'border-primary-600 bg-primary-50'
                          : disabled
                          ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{m.icon}</span>
                        <div>
                          <p className="font-semibold text-sm text-gray-800">{m.label}</p>
                          <p className="text-xs text-gray-500">{disabled && m.id === 'tarjeta' ? 'Próximamente' : m.desc}</p>
                        </div>
                        {metodo === m.id && (
                          <div className="ml-auto w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center shrink-0">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Instrucciones del método */}
              {metodo && configMetodo && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <p className="font-semibold text-blue-800 mb-2">
                    {metodo === 'transferencia' && '📋 Datos para transferencia'}
                    {metodo === 'qr' && '📱 Escanea el QR'}
                    {metodo === 'tigo_money' && '📲 Datos para Tigo Money'}
                  </p>
                  {metodo === 'transferencia' && (
                    <div className="text-sm text-blue-700 space-y-1">
                      <p><strong>Banco:</strong> {configMetodo.banco}</p>
                      <p><strong>N° Cuenta:</strong> {configMetodo.numeroCuenta}</p>
                      <p><strong>Titular:</strong> {configMetodo.titular}</p>
                    </div>
                  )}
                  {metodo === 'tigo_money' && (
                    <div className="text-sm text-blue-700 space-y-1">
                      <p><strong>Número:</strong> {configMetodo.numeroTigo}</p>
                      <p><strong>Nombre:</strong> {configMetodo.nombreTigo}</p>
                    </div>
                  )}
                  {metodo === 'qr' && (
                    <div className="text-sm text-blue-700">
                      {configMetodo.qrImagen
                        ? <img src={configMetodo.qrImagen} alt="QR" className="w-48 h-48 mx-auto my-2 rounded-xl border border-blue-200"/>
                        : <p>Te enviaremos el QR por WhatsApp al confirmar tu pedido.</p>
                      }
                    </div>
                  )}
                </div>
              )}

              {metodo && metodo !== 'tarjeta' && (
                <div>
                  <label className="label">Número/referencia del comprobante (opcional)</label>
                  <input name="comprobante" value={form.comprobante} onChange={handleChange} className="input" placeholder="Ej: REF-12345"/>
                  <p className="text-xs text-gray-400 mt-1">También puedes enviarlo por WhatsApp. Tu pedido queda pendiente hasta confirmar el pago.</p>
                </div>
              )}
            </div>
          </div>

          {/* Resumen */}
          <div className="lg:col-span-1">
            <div className="card p-5 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4">Resumen</h3>
              <p className="text-sm text-gray-500 mb-1 font-medium">{rifa.titulo}</p>
              <div className="flex flex-wrap gap-1 mb-4">
                {data.numeros.sort((a, b) => a - b).map(n => (
                  <span key={n} className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-1 rounded-lg">
                    {n.toString().padStart(digits, '0')}
                  </span>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>{data.numeros.length} número{data.numeros.length > 1 ? 's' : ''}</span>
                  <span>{formatBs(rifa.precio)} c/u</span>
                </div>
                <div className="flex justify-between font-black text-lg">
                  <span>Total</span>
                  <span className="text-primary-600">{formatBs(total)}</span>
                </div>
              </div>

              {/* Checklist */}
              <div className="mt-4 space-y-1.5">
                {[
                  { ok: !!form.nombre && !!form.ci && !!form.telefono && !!form.email, label: 'Datos personales' },
                  { ok: !!fotoCIUrl && !uploadingCI, label: 'Foto del CI' },
                  { ok: !!metodo, label: 'Método de pago' },
                ].map(item => (
                  <div key={item.label} className={`flex items-center gap-2 text-xs ${item.ok ? 'text-verde-600' : 'text-gray-400'}`}>
                    <span>{item.ok ? '✓' : '○'}</span>
                    {item.label}
                  </div>
                ))}
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-5 flex items-center justify-center gap-2">
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Procesando...</>
                  : 'Confirmar pedido'
                }
              </button>
              <p className="text-xs text-gray-400 text-center mt-3">🔒 Tu información está protegida</p>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}
