'use client'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface Config {
  tipoPago: string
  habilitado: boolean
  banco?: string
  numeroCuenta?: string
  titular?: string
  numeroTigo?: string
  nombreTigo?: string
  qrImagen?: string
  usdtTrc20?: string
  usdtBep20?: string
  usdtPolygon?: string
  usdtErc20?: string
}

export default function AdminConfig() {
  const [configs, setConfigs] = useState<Config[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/config-pagos').then(r => r.json()).then(data => {
      setConfigs(data)
      setLoading(false)
    })
  }, [])

  const updateConfig = (tipoPago: string, field: string, value: string | boolean) => {
    setConfigs(prev => prev.map(c => c.tipoPago === tipoPago ? { ...c, [field]: value } : c))
  }

  const saveConfig = async (tipoPago: string) => {
    const config = configs.find(c => c.tipoPago === tipoPago)
    if (!config) return
    setSaving(tipoPago)
    try {
      const res = await fetch('/api/config-pagos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (res.ok) toast.success('Configuración guardada')
      else toast.error('Error al guardar')
    } finally {
      setSaving(null)
    }
  }

  const getConfig = (tipo: string) => configs.find(c => c.tipoPago === tipo) ?? { tipoPago: tipo, habilitado: true }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full"/></div>

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Configuración</h1>
        <p className="text-gray-400 text-sm">Configura los medios de pago</p>
      </div>

      <div className="space-y-5">
        {/* Transferencia */}
        {(() => {
          const c = getConfig('transferencia')
          return (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">🏦 Transferencia Bancaria</h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm text-gray-500">Habilitado</span>
                  <div
                    onClick={() => updateConfig('transferencia', 'habilitado', !c.habilitado)}
                    className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${c.habilitado ? 'bg-verde-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full m-1 transition-transform ${c.habilitado ? 'translate-x-4' : ''}`}/>
                  </div>
                </label>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="label">Banco</label>
                  <input className="input" value={c.banco ?? ''} onChange={e => updateConfig('transferencia', 'banco', e.target.value)} placeholder="Ej: Banco Unión"/>
                </div>
                <div>
                  <label className="label">Número de cuenta</label>
                  <input className="input" value={c.numeroCuenta ?? ''} onChange={e => updateConfig('transferencia', 'numeroCuenta', e.target.value)} placeholder="Ej: 1234567890"/>
                </div>
                <div>
                  <label className="label">Titular de la cuenta</label>
                  <input className="input" value={c.titular ?? ''} onChange={e => updateConfig('transferencia', 'titular', e.target.value)} placeholder="Ej: RifaBolivia S.R.L."/>
                </div>
              </div>
              <button onClick={() => saveConfig('transferencia')} disabled={saving === 'transferencia'} className="btn-primary mt-4 text-sm py-2">
                {saving === 'transferencia' ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          )
        })()}

        {/* Tigo Money */}
        {(() => {
          const c = getConfig('tigo_money')
          return (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">📲 Tigo Money</h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm text-gray-500">Habilitado</span>
                  <div
                    onClick={() => updateConfig('tigo_money', 'habilitado', !c.habilitado)}
                    className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${c.habilitado ? 'bg-verde-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full m-1 transition-transform ${c.habilitado ? 'translate-x-4' : ''}`}/>
                  </div>
                </label>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="label">Número Tigo</label>
                  <input className="input" value={c.numeroTigo ?? ''} onChange={e => updateConfig('tigo_money', 'numeroTigo', e.target.value)} placeholder="Ej: 70000000"/>
                </div>
                <div>
                  <label className="label">Nombre en Tigo Money</label>
                  <input className="input" value={c.nombreTigo ?? ''} onChange={e => updateConfig('tigo_money', 'nombreTigo', e.target.value)} placeholder="Ej: RifaBolivia"/>
                </div>
              </div>
              <button onClick={() => saveConfig('tigo_money')} disabled={saving === 'tigo_money'} className="btn-primary mt-4 text-sm py-2">
                {saving === 'tigo_money' ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          )
        })()}

        {/* QR */}
        {(() => {
          const c = getConfig('qr')
          return (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">📱 QR Interoperable</h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm text-gray-500">Habilitado</span>
                  <div
                    onClick={() => updateConfig('qr', 'habilitado', !c.habilitado)}
                    className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${c.habilitado ? 'bg-verde-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full m-1 transition-transform ${c.habilitado ? 'translate-x-4' : ''}`}/>
                  </div>
                </label>
              </div>
              <div>
                <label className="label">URL de la imagen QR</label>
                <input className="input" value={c.qrImagen ?? ''} onChange={e => updateConfig('qr', 'qrImagen', e.target.value)} placeholder="https://... URL de tu código QR"/>
                <p className="text-xs text-gray-400 mt-1">Sube tu QR a Imgur o Google Drive y pega el link aquí.</p>
                {c.qrImagen && <img src={c.qrImagen} alt="QR" className="w-40 h-40 object-contain mt-3 rounded-xl border border-gray-200"/>}
              </div>
              <button onClick={() => saveConfig('qr')} disabled={saving === 'qr'} className="btn-primary mt-4 text-sm py-2">
                {saving === 'qr' ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          )
        })()}

        {/* USDT */}
        {(() => {
          const c = getConfig('usdt')
          return (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-xl">₮</span> USDT (Tether)
                </h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm text-gray-500">Habilitado</span>
                  <div
                    onClick={() => updateConfig('usdt', 'habilitado', !c.habilitado)}
                    className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${c.habilitado ? 'bg-verde-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full m-1 transition-transform ${c.habilitado ? 'translate-x-4' : ''}`}/>
                  </div>
                </label>
              </div>
              <p className="text-xs text-gray-400 mb-4">Agrega las wallets donde recibirás USDT. Puedes dejar vacías las redes que no uses.</p>
              <div className="space-y-3">
                {[
                  { field: 'usdtTrc20',   label: 'TRON (TRC20)',           placeholder: 'T...', color: 'text-red-500' },
                  { field: 'usdtBep20',   label: 'BNB Smart Chain (BEP20)', placeholder: '0x...', color: 'text-yellow-600' },
                  { field: 'usdtPolygon', label: 'Polygon (MATIC)',          placeholder: '0x...', color: 'text-purple-600' },
                  { field: 'usdtErc20',   label: 'Ethereum (ERC20)',         placeholder: '0x...', color: 'text-blue-600' },
                ].map(net => (
                  <div key={net.field}>
                    <label className="label flex items-center gap-1.5">
                      <span className={`text-xs font-bold ${net.color}`}>●</span>
                      {net.label}
                    </label>
                    <input
                      className="input font-mono text-sm"
                      value={(c as any)[net.field] ?? ''}
                      onChange={e => updateConfig('usdt', net.field, e.target.value)}
                      placeholder={net.placeholder}
                    />
                  </div>
                ))}
              </div>
              <button onClick={() => saveConfig('usdt')} disabled={saving === 'usdt'} className="btn-primary mt-4 text-sm py-2">
                {saving === 'usdt' ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          )
        })()}

        {/* Tarjeta - placeholder */}
        <div className="card p-6 opacity-60">
          <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-2">💳 Tarjeta Crédito/Débito</h2>
          <p className="text-sm text-gray-500">Para habilitar pagos con tarjeta necesitas una cuenta en un gateway de pago boliviano (Pagos Net, Kushki, o similar).</p>
        </div>
      </div>
    </div>
  )
}
