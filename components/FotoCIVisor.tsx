'use client'
import { useState, useCallback } from 'react'
import Image from 'next/image'

export default function FotoCIVisor({ url, nombre, ci }: { url: string; nombre: string; ci: string }) {
  const [abierto, setAbierto] = useState(false)
  const [zoom, setZoom] = useState(false)
  const [descargando, setDescargando] = useState(false)

  const descargar = useCallback(async () => {
    setDescargando(true)
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const ext = blob.type.includes('png') ? 'png' : 'jpg'
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `CI_${ci}_${nombre.replace(/\s+/g, '_')}.${ext}`
      link.click()
      URL.revokeObjectURL(link.href)
    } finally {
      setDescargando(false)
    }
  }, [url, ci, nombre])

  const cerrar = () => { setAbierto(false); setZoom(false) }

  return (
    <>
      {/* Miniatura en tabla */}
      <button
        onClick={() => setAbierto(true)}
        className="group relative w-10 h-10 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-primary-400 transition-all shadow-sm"
        title="Ver foto CI"
      >
        <Image src={url} alt={`CI de ${nombre}`} fill className="object-cover" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
          <svg className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>
      </button>

      {/* Modal visor */}
      {abierto && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col"
          onClick={cerrar}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 bg-black/40"
            onClick={e => e.stopPropagation()}
          >
            <div>
              <p className="font-bold text-white">{nombre}</p>
              <p className="text-sm text-white/60">CI: {ci}</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Zoom toggle */}
              <button
                onClick={() => setZoom(z => !z)}
                title={zoom ? 'Ajustar a pantalla' : 'Ver tamaño real'}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all"
              >
                {zoom ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    Ajustar
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Zoom
                  </>
                )}
              </button>

              {/* Descargar */}
              <button
                onClick={descargar}
                disabled={descargando}
                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all"
              >
                {descargando ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                )}
                {descargando ? 'Descargando...' : 'Descargar'}
              </button>

              {/* Cerrar */}
              <button
                onClick={cerrar}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Imagen */}
          <div
            className="flex-1 overflow-auto flex items-center justify-center p-4"
            onClick={e => e.stopPropagation()}
          >
            {zoom ? (
              // Tamaño real — scrolleable
              <img
                src={url}
                alt={`CI de ${nombre}`}
                className="max-w-none cursor-zoom-out"
                style={{ maxHeight: 'none' }}
                onClick={() => setZoom(false)}
              />
            ) : (
              // Ajustado a pantalla
              <div className="relative w-full max-w-3xl" style={{ aspectRatio: '3/2' }}>
                <Image
                  src={url}
                  alt={`CI de ${nombre}`}
                  fill
                  className="object-contain cursor-zoom-in"
                  onClick={() => setZoom(true)}
                  sizes="(max-width: 768px) 100vw, 896px"
                />
              </div>
            )}
          </div>

          {/* Pie */}
          <div
            className="px-5 py-3 bg-black/40 flex items-center justify-center gap-2"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-white/40 text-xs">
              {zoom ? 'Clic en la imagen para ajustar · ' : 'Clic en la imagen para ampliar · '}
              Clic fuera del visor para cerrar
            </p>
          </div>
        </div>
      )}
    </>
  )
}
