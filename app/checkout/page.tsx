'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
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
  { id: 'usdt',         label: 'USDT (Crypto)',           icon: '₮',  desc: 'TRC20, BEP20, Polygon, ERC20' },
  { id: 'tarjeta',      label: 'Tarjeta Crédito/Débito', icon: '💳', desc: 'Próximamente disponible' },
]

const REDES_USDT = [
  { id: 'trc20',   label: 'TRON (TRC20)',            field: 'usdtTrc20',   color: '#ef4444', explorer: 'https://tronscan.org/#/address/' },
  { id: 'bep20',   label: 'BNB Smart Chain (BEP20)', field: 'usdtBep20',   color: '#f59e0b', explorer: 'https://bscscan.com/address/' },
  { id: 'polygon', label: 'Polygon (MATIC)',          field: 'usdtPolygon', color: '#8b5cf6', explorer: 'https://polygonscan.com/address/' },
  { id: 'erc20',   label: 'Ethereum (ERC20)',         field: 'usdtErc20',   color: '#3b82f6', explorer: 'https://etherscan.io/address/' },
]

export default function CheckoutPage() {
  const router = useRouter()
  const [data, setData] = useState<CheckoutData | null>(null)
  const [rifa, setRifa] = useState<Rifa | null>(null)
  const [configPagos, setConfigPagos] = useState<ConfigPago[]>([])
  const [metodo, setMetodo] = useState('')
  const [redUsdt, setRedUsdt] = useState('')
  const [loading, setLoading] = useState(false)
  const [precioUsdt, setPrecioUsdt] = useState<{ precio: number; minimo?: number; maximo?: number; actualizadoEn?: string } | null>(null)
  const [cargandoPrecio, setCargandoPrecio] = useState(false)
  const [form, setForm] = useState({ nombre: '', ci: '', telefono: '', email: '', comprobante: '' })

  // Cliente reconocido
  const [clienteConocido, setClienteConocido] = useState(false)
  const [buscandoCI, setBuscandoCI] = useState(false)

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

  // Buscar cliente cuando el CI tiene al menos 5 caracteres
  const buscarCliente = useCallback(async (ci: string) => {
    if (ci.length < 5) return
    setBuscandoCI(true)
    try {
      const res = await fetch(`/api/compradores?ci=${encodeURIComponent(ci)}`)
      const data = await res.json()
      if (data) {
        setForm(p => ({
          ...p,
          nombre: data.nombre,
          telefono: data.telefono,
          email: data.email,
        }))
        if (data.fotoCI) {
          setFotoCI(data.fotoCI)
          setFotoCIUrl(data.fotoCI)
        }
        setClienteConocido(true)
        toast.success(`¡Bienvenido de nuevo, ${data.nombre}! Tus datos fueron recuperados.`)
      } else {
        setClienteConocido(false)
      }
    } finally {
      setBuscandoCI(false)
    }
  }, [])

  // Cargar precio USDT cuando el cliente elige ese método
  const cargarPrecioUsdt = async () => {
    if (precioUsdt) return // ya cargado
    setCargandoPrecio(true)
    try {
      const res = await fetch('/api/precio-usdt')
      const data = await res.json()
      if (data.precio) setPrecioUsdt(data)
    } finally {
      setCargandoPrecio(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))

    // Si cambia el CI, resetear y buscar cliente
    if (name === 'ci') {
      setClienteConocido(false)
      setFotoCI(null)
      setFotoCIUrl('')
      if (value.length >= 5) {
        const timer = setTimeout(() => buscarCliente(value), 600)
        return () => clearTimeout(timer)
      }
    }
  }

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
          redUsdt: metodo === 'usdt' ? redUsdt : undefined,
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

              {/* CI primero — trigger de búsqueda */}
              <div className="mb-4">
                <label className="label">Carnet de identidad (CI) *</label>
                <div className="relative">
                  <input
                    name="ci"
                    value={form.ci}
                    onChange={handleChange}
                    className="input pr-10"
                    placeholder="Ej: 1234567 LP"
                    required
                  />
                  {buscandoCI && (
                    <div className="absolute right-3 top-3.5">
                      <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"/>
                    </div>
                  )}
                </div>
                {clienteConocido && (
                  <p className="text-xs text-verde-600 mt-1.5 font-medium">
                    ✓ Cliente registrado — datos cargados automáticamente
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Nombre completo *</label>
                  <input
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    className={`input ${clienteConocido ? 'bg-gray-50' : ''}`}
                    placeholder="Ej: Juan Mamani"
                    required
                  />
                </div>
                <div>
                  <label className="label">Teléfono / WhatsApp *</label>
                  <input
                    name="telefono"
                    value={form.telefono}
                    onChange={handleChange}
                    className={`input ${clienteConocido ? 'bg-gray-50' : ''}`}
                    placeholder="Ej: 70000000"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Correo electrónico *</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className={`input ${clienteConocido ? 'bg-gray-50' : ''}`}
                    placeholder="tu@correo.com"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Foto CI */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-bold text-gray-900 text-lg">Foto de tu Carnet de Identidad *</h2>
                {clienteConocido && fotoCIUrl && (
                  <span className="badge bg-verde-500 text-white text-xs">✓ Ya registrada</span>
                )}
              </div>

              {clienteConocido && fotoCIUrl ? (
                // Cliente conocido: mostrar foto existente
                <div>
                  <p className="text-gray-400 text-sm mb-3">Ya tenemos tu foto en el sistema. No necesitas subirla de nuevo.</p>
                  <div className="relative inline-block">
                    <img src={fotoCI!} alt="CI registrado" className="h-32 rounded-xl border-2 border-verde-300 object-contain bg-gray-50"/>
                    <div className="absolute top-2 right-2 bg-verde-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">✓</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setFotoCI(null); setFotoCIUrl(''); setClienteConocido(false) }}
                    className="block text-xs text-gray-400 hover:text-primary-600 mt-2 underline"
                  >
                    Actualizar foto
                  </button>
                </div>
              ) : (
                // Cliente nuevo: pedir foto
                <div>
                  <p className="text-gray-400 text-sm mb-4">Necesitamos verificar tu identidad. Toma una foto de la parte frontal de tu CI.</p>
                  {!fotoCI ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button type="button" onClick={() => fileRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 hover:border-primary-400 hover:bg-primary-50 rounded-xl p-6 transition-all">
                        <span className="text-4xl">📁</span>
                        <div className="text-center">
                          <p className="font-semibold text-gray-700 text-sm">Subir desde galería</p>
                          <p className="text-gray-400 text-xs mt-0.5">JPG, PNG o WebP</p>
                        </div>
                      </button>
                      <button type="button" onClick={() => camaraRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 hover:border-primary-400 hover:bg-primary-50 rounded-xl p-6 transition-all">
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
                          <button type="button" onClick={() => { setFotoCI(null); setFotoCIUrl('') }}
                            className="bg-white text-gray-500 hover:text-red-500 text-xs font-bold px-2.5 py-1 rounded-full border border-gray-200 shadow-sm">
                            Cambiar
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFotoCI}/>
              <input ref={camaraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFotoCI}/>
              <p className="text-xs text-gray-400 mt-3">🔒 Tu foto es privada y solo la verá el administrador.</p>
            </div>

            {/* Método de pago */}
            <div className="card p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-5">Método de pago</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {METODOS.map(m => {
                  const config = configPagos.find(c => c.tipoPago === m.id)
                  const disabled = m.id === 'tarjeta' || (config && !config.habilitado)
                  return (
                    <button key={m.id} type="button" disabled={!!disabled}
                      onClick={() => { if (!disabled) { setMetodo(m.id); if (m.id === 'usdt') cargarPrecioUsdt() } }}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        metodo === m.id ? 'border-primary-600 bg-primary-50'
                        : disabled ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                      }`}>
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
                  {metodo === 'usdt' && (
                    <div className="text-sm text-blue-700">

                      {/* Precio estimado en USDT */}
                      <div className="bg-gray-900 text-white rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Precio Binance P2P · USDT/BOB</span>
                          <button
                            type="button"
                            onClick={() => { setPrecioUsdt(null); cargarPrecioUsdt() }}
                            className="text-gray-400 hover:text-white text-xs"
                          >↻ Actualizar</button>
                        </div>

                        {cargandoPrecio ? (
                          <div className="flex items-center gap-2 py-2">
                            <div className="w-4 h-4 border-2 border-gray-500 border-t-white rounded-full animate-spin"/>
                            <span className="text-gray-400 text-sm">Consultando Binance P2P...</span>
                          </div>
                        ) : precioUsdt ? (
                          <>
                            <div className="flex items-end gap-3 mb-3">
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">Tasa actual</p>
                                <p className="text-2xl font-black text-white">
                                  1 USDT = <span className="text-amber-400">Bs. {precioUsdt.precio.toFixed(2)}</span>
                                </p>
                              </div>
                            </div>

                            {/* Estimado a pagar */}
                            <div className="bg-white/10 rounded-xl p-3">
                              <p className="text-xs text-gray-300 mb-1">Debes enviar aproximadamente:</p>
                              <p className="text-3xl font-black text-amber-400">
                                {(total / precioUsdt.precio).toFixed(2)} <span className="text-lg">USDT</span>
                              </p>
                              {precioUsdt.minimo && precioUsdt.maximo && (
                                <p className="text-xs text-gray-400 mt-1">
                                  Rango: {(total / precioUsdt.maximo).toFixed(2)} – {(total / precioUsdt.minimo).toFixed(2)} USDT
                                  <span className="ml-1">(según el vendedor)</span>
                                </p>
                              )}
                              <p className="text-xs text-gray-300 mt-2">
                                Total en bolivianos: <strong className="text-white">Bs. {total.toFixed(2)}</strong>
                              </p>
                            </div>

                            <p className="text-xs text-gray-500 mt-2">
                              ⚠️ El monto puede variar. Usa la tasa del vendedor al momento de pagar.
                              {precioUsdt.actualizadoEn && ` · Actualizado: ${new Date(precioUsdt.actualizadoEn).toLocaleTimeString('es-BO')}`}
                            </p>
                          </>
                        ) : (
                          <p className="text-gray-400 text-sm py-1">No se pudo obtener el precio. Consulta en Binance P2P.</p>
                        )}
                      </div>

                      <p className="font-semibold mb-2">Selecciona la red:</p>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {REDES_USDT.map(red => {
                          const wallet = (configMetodo as any)[red.field]
                          if (!wallet) return null
                          return (
                            <button key={red.id} type="button"
                              onClick={() => setRedUsdt(red.id)}
                              className={`text-left p-2.5 rounded-xl border-2 transition-all ${
                                redUsdt === red.id ? 'border-blue-500 bg-blue-50' : 'border-blue-200 hover:border-blue-400'
                              }`}>
                              <span className="font-bold text-xs" style={{ color: red.color }}>● {red.label}</span>
                            </button>
                          )
                        })}
                      </div>
                      {redUsdt && (() => {
                        const red = REDES_USDT.find(r => r.id === redUsdt)!
                        const wallet = (configMetodo as any)[red.field]
                        return (
                          <div className="bg-white border border-blue-200 rounded-xl p-3">
                            <p className="text-xs text-gray-500 mb-1">Dirección de wallet ({red.label}):</p>
                            <p className="font-mono text-xs break-all text-gray-800 bg-gray-50 p-2 rounded-lg select-all">{wallet}</p>
                            <button type="button"
                              onClick={() => { navigator.clipboard.writeText(wallet); toast.success('Dirección copiada') }}
                              className="mt-2 text-xs text-blue-600 hover:underline font-medium">
                              📋 Copiar dirección
                            </button>
                            <p className="text-xs text-amber-600 mt-2 font-medium">⚠️ Solo envía USDT en red {red.label}. Otras redes pueden resultar en pérdida de fondos.</p>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>
              )}

              {metodo && metodo !== 'tarjeta' && (
                <div>
                  <label className="label">
                    {metodo === 'usdt' ? 'Hash de la transacción (TX Hash) *' : 'Número/referencia del comprobante (opcional)'}
                  </label>
                  <input
                    name="comprobante"
                    value={form.comprobante}
                    onChange={handleChange}
                    className="input font-mono text-sm"
                    placeholder={metodo === 'usdt' ? '0x... o hash de la transacción' : 'Ej: REF-12345'}
                    required={metodo === 'usdt'}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {metodo === 'usdt'
                      ? 'Copia el TX Hash de tu billetera después de enviar. Lo usaremos para verificar en el explorador de blockchain.'
                      : 'También puedes enviarlo por WhatsApp.'
                    }
                  </p>
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
                {metodo === 'usdt' && precioUsdt && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-400">≈ en USDT</span>
                    <span className="font-bold text-amber-600">~ {(total / precioUsdt.precio).toFixed(2)} USDT</span>
                  </div>
                )}
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
