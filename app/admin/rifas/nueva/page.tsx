'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const OPCIONES_NUMEROS = [1000, 5000, 10000, 25000, 50000, 100000]
const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')

export default function NuevaRifa() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    imagen: '',
    precio: '',
    totalNumeros: '10000',
    fechaSorteo: '',
    premio: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  const handleImagen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview local
    setPreview(URL.createObjectURL(file))
    setUploadingImg(true)

    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setForm(p => ({ ...p, imagen: data.url }))
      toast.success('Imagen subida')
    } catch (err: any) {
      toast.error(err.message)
      setPreview(null)
    } finally {
      setUploadingImg(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (uploadingImg) { toast.error('Espera a que termine de subir la imagen'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/rifas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Rifa creada exitosamente')
      router.push('/admin/rifas')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const total = parseInt(form.totalNumeros || '0')
  const precio = parseFloat(form.precio || '0')
  const recaudacionMax = total * precio

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Nueva rifa</h1>
        <p className="text-gray-400 text-sm">Completa los datos para crear una nueva rifa</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-900">Información general</h2>

          <div>
            <label className="label">Título de la rifa *</label>
            <input name="titulo" value={form.titulo} onChange={handleChange} className="input" placeholder="Ej: Gran Rifa - Toyota Yaris 0km" required/>
          </div>

          <div>
            <label className="label">Premio *</label>
            <input name="premio" value={form.premio} onChange={handleChange} className="input" placeholder="Ej: Toyota Yaris 0km 2024" required/>
          </div>

          <div>
            <label className="label">Descripción</label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              className="input resize-none h-24"
              placeholder="Describe la rifa, los términos del sorteo..."
            />
          </div>

          {/* Subida de imagen */}
          <div>
            <label className="label">Foto del premio</label>
            <div
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                preview ? 'border-primary-300 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
              }`}
            >
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-xl object-contain"/>
                  {uploadingImg && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-xl">
                      <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"/>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">Click para cambiar</p>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-2">📷</div>
                  <p className="text-gray-600 font-medium">Click para subir foto</p>
                  <p className="text-gray-400 text-xs mt-1">JPG, PNG o WebP · Máx 5MB</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImagen}/>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-900">Configuración de números</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Precio por número (Bs.) *</label>
              <input name="precio" type="number" step="0.5" min="1" value={form.precio} onChange={handleChange} className="input" placeholder="Ej: 10" required/>
            </div>
            <div>
              <label className="label">Total de números *</label>
              <select name="totalNumeros" value={form.totalNumeros} onChange={handleChange} className="input">
                {OPCIONES_NUMEROS.map(n => (
                  <option key={n} value={n}>{fmt(n)} números</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Fecha del sorteo *</label>
            <input name="fechaSorteo" type="datetime-local" value={form.fechaSorteo} onChange={handleChange} className="input" required/>
          </div>

          {precio > 0 && total > 0 && (
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
              <p className="text-sm text-primary-700 font-medium">Recaudación potencial máxima</p>
              <p className="text-2xl font-black text-primary-700">Bs. {recaudacionMax.toLocaleString()}</p>
              <p className="text-xs text-primary-500">{fmt(total)} números × Bs. {precio}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary flex-1">Cancelar</button>
          <button type="submit" disabled={loading || uploadingImg} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Creando...</>
              : '🎟️ Crear rifa'
            }
          </button>
        </div>
      </form>
    </div>
  )
}
