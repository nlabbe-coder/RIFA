'use client'
import { useState } from 'react'

interface Props {
  orden: {
    id: string
    numeros: string
    total: number
    metodoPago: string
    creadoEn: string
    rifa: { titulo: string; totalNumeros: number }
    comprador: { nombre: string; telefono: string; email: string }
  }
}

function metodoPagoLabel(m: string) {
  const map: Record<string, string> = {
    transferencia: 'Transferencia Bancaria',
    qr: 'QR Interoperable',
    tigo_money: 'Tigo Money',
    usdt: 'USDT (Cripto)',
  }
  return map[m] ?? m
}

export default function ComprobantePDF({ orden }: Props) {
  const [generando, setGenerando] = useState(false)

  const descargar = async () => {
    setGenerando(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const numeros: number[] = JSON.parse(orden.numeros)
      const digits = orden.rifa.totalNumeros.toString().length
      const fecha = new Date(orden.creadoEn).toLocaleDateString('es-BO', {
        day: '2-digit', month: 'long', year: 'numeric',
      })

      const W = doc.internal.pageSize.getWidth()
      let y = 0

      // ── Encabezado ──────────────────────────────────────────────
      doc.setFillColor(220, 38, 38) // rojo bolivia
      doc.rect(0, 0, W, 38, 'F')
      doc.setFillColor(253, 224, 71) // amarillo bolivia
      doc.rect(0, 38, W, 8, 'F')
      doc.setFillColor(22, 163, 74) // verde bolivia
      doc.rect(0, 46, W, 8, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(22)
      doc.setTextColor(255, 255, 255)
      doc.text('RifaBolivia', W / 2, 18, { align: 'center' })
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text('Comprobante de Participación', W / 2, 27, { align: 'center' })

      y = 68

      // ── Número de orden ─────────────────────────────────────────
      doc.setFillColor(249, 250, 251)
      doc.roundedRect(14, y, W - 28, 18, 3, 3, 'F')
      doc.setFontSize(8)
      doc.setTextColor(107, 114, 128)
      doc.text('N° DE ORDEN', 20, y + 7)
      doc.setFontSize(10)
      doc.setTextColor(17, 24, 39)
      doc.setFont('helvetica', 'bold')
      doc.text(orden.id, 20, y + 14)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(107, 114, 128)
      doc.text('FECHA', W - 60, y + 7)
      doc.setFontSize(10)
      doc.setTextColor(17, 24, 39)
      doc.text(fecha, W - 60, y + 14)

      y += 28

      // ── Rifa ────────────────────────────────────────────────────
      doc.setFontSize(8)
      doc.setTextColor(107, 114, 128)
      doc.text('RIFA', 14, y)
      y += 5
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(17, 24, 39)
      doc.text(orden.rifa.titulo, 14, y)
      y += 10

      // ── Datos comprador ─────────────────────────────────────────
      doc.setDrawColor(229, 231, 235)
      doc.line(14, y, W - 14, y)
      y += 8

      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(17, 24, 39)
      doc.text('DATOS DEL PARTICIPANTE', 14, y)
      y += 7

      const campos = [
        ['Nombre', orden.comprador.nombre],
        ['Teléfono', orden.comprador.telefono],
        ['Email', orden.comprador.email],
        ['Método de pago', metodoPagoLabel(orden.metodoPago)],
        ['Total pagado', `Bs. ${orden.total.toFixed(2)}`],
      ]
      doc.setFont('helvetica', 'normal')
      for (const [label, valor] of campos) {
        doc.setFontSize(8)
        doc.setTextColor(107, 114, 128)
        doc.text(label, 14, y)
        doc.setTextColor(17, 24, 39)
        doc.setFontSize(9)
        doc.text(valor, 65, y)
        y += 7
      }

      y += 3
      doc.line(14, y, W - 14, y)
      y += 8

      // ── Números ─────────────────────────────────────────────────
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(17, 24, 39)
      doc.text(`TUS NÚMEROS (${numeros.length})`, 14, y)
      y += 7

      const numerosFormateados = numeros.sort((a, b) => a - b).map(n => n.toString().padStart(digits, '0'))
      const cols = 8
      const cellW = (W - 28) / cols
      const cellH = 8

      numerosFormateados.forEach((n, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)
        const x = 14 + col * cellW
        const cy = y + row * (cellH + 2)

        // Nueva página si es necesario
        if (cy + cellH > 270) {
          doc.addPage()
          y = 20
        }

        doc.setFillColor(239, 246, 255)
        doc.setDrawColor(191, 219, 254)
        doc.roundedRect(x, cy, cellW - 2, cellH, 1.5, 1.5, 'FD')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7)
        doc.setTextColor(37, 99, 235)
        doc.text(n, x + (cellW - 2) / 2, cy + 5.5, { align: 'center' })
      })

      const filas = Math.ceil(numerosFormateados.length / cols)
      y += filas * (cellH + 2) + 10

      // ── Pie ─────────────────────────────────────────────────────
      doc.setFillColor(249, 250, 251)
      doc.rect(0, 272, W, 25, 'F')
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(107, 114, 128)
      doc.text('Este comprobante es válido como constancia de participación en la rifa.', W / 2, 280, { align: 'center' })
      doc.text('rifabolivia.com', W / 2, 287, { align: 'center' })

      doc.save(`Comprobante_${orden.id.slice(-8).toUpperCase()}.pdf`)
    } finally {
      setGenerando(false)
    }
  }

  return (
    <button
      onClick={descargar}
      disabled={generando}
      className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all shadow-md"
    >
      {generando ? (
        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Generando PDF...</>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          Descargar comprobante PDF
        </>
      )}
    </button>
  )
}
