'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import Link from 'next/link'

const OPCIONES_NUMEROS = [1000, 5000, 10000, 25000, 50000, 100000]
const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')

interface Rifa {
  id: string
  titulo: string
  descripcion: string
  imagen?: string | null
  precio: number
  totalNumeros: number
  numerosVendidos: number
  fechaSorteo: string
  premio: string
  estado: string
}

export default function EditarRifa() {
  const { id } = useParams()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [tienVentas, setTieneVentas] = useState(false)

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    imagen: '',
    precio: '',
    totalNumeros: '10000',
    fechaSorteo: '',
    premio: '',
    estado: 'activa',
  })

  useEffect(() => {
    fetch(`/api/rifas/${id}`)
      .then(r => r.json())
      .then((rifa: Rifa) => {
        const fecha = new Date(rifa.fechaSorteo)
        const fechaLocal = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000)
          .toISOString().slice(0, 16)

        setForm({
          titulo: rifa.titulo,
          descripcion: rifa.descripcion,
          imagen: rifa.imagen ?? '',
          precio: rifa.precio.toString(),
          totalNumeros: rifa.totalNumeros.toString(),
          fechaSorteo: fechaLocal,
          premio: rifa.premio,
          estado: rifa.estado,
        })
        setPreview(rifa.imagen ?? null)
        setTieneVentas(rifa.numerosVendidos > 0)
        setLoadingData(false)
      })
      .catch(() => { toast.error('Error al cargar la rifa'); setLoadingData(false) })
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  const handleImagen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setUploadingImg(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setForm(p => ({ ...p, imagen: data.url }))
      toast.success('Imagen actualizada')
    } catch (err: any) {
      toast.error(err.message)
      setPreview(form.imagen || null)
    } finally {
      setUploadingImg(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (uploadingImg) { toast.error('Espera a que termine de subir la imagen'); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/rifas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          precio: parseFloat(form.precio),
          totalNumeros: parseInt(form.totalNumeros),
          fechaSorteo: new Date(form.fechaSorteo).toISOString(),
          imagen: form.imagen || null,
        }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      toast.success('Rifa actualizada')
      router.push(`/admin/rifas/${id}`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) return (
    <div className="flex items-center justify-center py-32">
      <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full"/>
    </div>
  )

  const total = parseInt(form.totalNumeros || '0')
  const precio = parseFloat(form.precio || '0')

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-2">
        <Link href={`/admin/rifas/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">← Volver</Link>
      </div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Editar rifa</h1>
        <p className="text-gray-400 text-sm">Modifica los datos de la rifa</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-900">Información general</h2>

          <div>
            <label className="label">Título *</label>
            <input name="titulo" value={form.titulo} onChange={handleChange} className="input" required/>
          </div>

          <div>
            <label className="label">Premio *</label>
            <input name="premio" value={form.premio} onChange={handleChange} className="input" required/>
          </div>

          <div>
            <label className="label">Descripción</label>
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange} className="input resize-none h-24"/>
          </div>

          {/* Imagen */}
          <div>
            <label className="label">Foto del premio</label>
            <div
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
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
                  <p className="text-gray-400 text-xs mt-1">JPG, PNG o WebP</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImagen}/>
            {preview && (
              <button type="button" onClick={() => { setPreview(null); setForm(p => ({ ...p, imagen: '' })) }}
                className="text-xs text-red-500 hover:underline mt-1">
                Quitar imagen
              </button>
            )}
          </div>

          {/* Estado */}
          <div>
            <label className="label">Estado</label>
            <select name="estado" value={form.estado} onChange={handleChange} className="input">
              <option value="activa">Activa</option>
              <option value="cerrada">Cerrada</option>
              <option value="sorteada">Sorteada</option>
            </select>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-900">Configuración de números</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Precio por número (Bs.) *</label>
              {tienVentas && (
                <p className="text-xs text-amber-600 mb-1">⚠️ Ya hay ventas. Cambiar el precio no afecta órdenes existentes.</p>
              )}
              <input name="precio" type="number" step="0.5" min="1" value={form.precio} onChange={handleChange} className="input" required/>
            </div>
            <div>
              <label className="label">Total de números *</label>
              {tienVentas ? (
                <>
                  <p className="text-xs text-red-500 mb-1">🔒 No se puede reducir, ya hay números vendidos.</p>
                  <select name="totalNumeros" value={form.totalNumeros} onChange={handleChange} className="input">
                    {OPCIONES_NUMEROS.filter(n => n >= parseInt(form.totalNumeros)).map(n => (
                      <option key={n} value={n}>{fmt(n)} números</option>
                    ))}
                  </select>
                </>
              ) : (
                <select name="totalNumeros" value={form.totalNumeros} onChange={handleChange} className="input">
                  {OPCIONES_NUMEROS.map(n => (
                    <option key={n} value={n}>{fmt(n)} números</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div>
            <label className="label">Fecha del sorteo *</label>
            <input name="fechaSorteo" type="datetime-local" value={form.fechaSorteo} onChange={handleChange} className="input" required/>
          </div>

          {precio > 0 && total > 0 && (
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
              <p className="text-sm text-primary-700 font-medium">Recaudación potencial máxima</p>
              <p className="text-2xl font-black text-primary-700">Bs. {(total * precio).toLocaleString()}</p>
              <p className="text-xs text-primary-500">{fmt(total)} números × Bs. {precio}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Link href={`/admin/rifas/${id}`} className="btn-secondary flex-1 text-center">
            Cancelar
          </Link>
          <button type="submit" disabled={loading || uploadingImg} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Guardando...</>
              : '💾 Guardar cambios'
            }
          </button>
        </div>
      </form>
    </div>
  )
}
