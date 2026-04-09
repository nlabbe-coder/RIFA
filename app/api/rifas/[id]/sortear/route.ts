import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAdminSession } from '@/lib/auth'
import { enviarConfirmacionPago } from '@/lib/email'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const rifa = await prisma.rifa.findUnique({
    where: { id },
    include: { tickets: { where: { ordenId: { not: null } } } },
  })
  if (!rifa) return NextResponse.json({ error: 'Rifa no encontrada' }, { status: 404 })

  let numeroGanador: number

  if (body.numeroManual) {
    // Número ingresado manualmente por el admin
    numeroGanador = parseInt(body.numeroManual)
    if (isNaN(numeroGanador) || numeroGanador < 1 || numeroGanador > rifa.totalNumeros) {
      return NextResponse.json({ error: 'Número inválido' }, { status: 400 })
    }
  } else {
    // Sorteo aleatorio entre tickets vendidos con pago confirmado
    const ticketsConfirmados = await prisma.ticket.findMany({
      where: {
        rifaId: id,
        ordenId: { not: null },
        orden: { estadoPago: 'confirmado' },
      },
      select: { numero: true },
    })

    if (ticketsConfirmados.length === 0) {
      return NextResponse.json({ error: 'No hay tickets confirmados para sortear' }, { status: 400 })
    }

    const idx = Math.floor(Math.random() * ticketsConfirmados.length)
    numeroGanador = ticketsConfirmados[idx].numero
  }

  // Buscar la orden que tiene ese número
  const ticketGanador = await prisma.ticket.findUnique({
    where: { rifaId_numero: { rifaId: id, numero: numeroGanador } },
    include: {
      orden: {
        include: { comprador: true },
      },
    },
  })

  const ganadorId = ticketGanador?.orden?.compradorId ?? null
  const comprador = ticketGanador?.orden?.comprador ?? null

  // Actualizar rifa con ganador
  const rifaActualizada = await prisma.rifa.update({
    where: { id },
    data: {
      estado: 'sorteada',
      ganadorNumero: numeroGanador,
      ganadorId,
    },
  })

  // Enviar email al ganador si tiene correo
  if (comprador) {
    await enviarEmailGanador({
      nombre:     comprador.nombre,
      email:      comprador.email,
      numero:     numeroGanador,
      rifaTitulo: rifa.titulo,
      premio:     rifa.premio,
      rifaId:     id,
    })
  }

  return NextResponse.json({
    numeroGanador,
    comprador: comprador ? {
      nombre:   comprador.nombre,
      telefono: comprador.telefono,
      email:    comprador.email,
      ci:       comprador.ci,
    } : null,
    tieneDueno: !!comprador,
  })
}

async function enviarEmailGanador({ nombre, email, numero, rifaTitulo, premio, rifaId }: {
  nombre: string; email: string; numero: number
  rifaTitulo: string; premio: string; rifaId: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  const html = `
<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#f8f9fa;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:50px 40px;text-align:center;">
            <div style="font-size:64px;margin-bottom:12px;">🏆</div>
            <h1 style="color:#fff;margin:0;font-size:32px;font-weight:900;">¡GANASTE!</h1>
            <p style="color:rgba(255,255,255,0.9);margin:10px 0 0;font-size:18px;">Eres el ganador de la rifa</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="color:#374151;font-size:17px;margin:0 0 24px;">Felicitaciones <strong>${nombre}</strong> 🎉</p>
            <p style="color:#374151;font-size:15px;">Tu número <strong style="color:#d97706;font-size:20px;">${numero}</strong> fue seleccionado como ganador de:</p>

            <div style="background:#fffbeb;border:2px solid #f59e0b;border-radius:16px;padding:24px;margin:24px 0;text-align:center;">
              <p style="color:#92400e;font-size:14px;margin:0 0 8px;font-weight:600;">${rifaTitulo}</p>
              <p style="color:#d97706;font-size:28px;font-weight:900;margin:0;">🏆 ${premio}</p>
            </div>

            <p style="color:#374151;font-size:15px;">Nos pondremos en contacto contigo en las próximas horas para coordinar la entrega del premio.</p>
            <p style="color:#6b7280;font-size:13px;margin-top:24px;">Puedes ver el anuncio oficial en: <a href="${process.env.NEXT_PUBLIC_URL}/ganador/${rifaId}" style="color:#d97706;">rifabolivia.com/ganador/${rifaId}</a></p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} RifaBolivia</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'RifaBolivia <notificaciones@rifabolivia.com>',
      to: [email],
      subject: `🏆 ¡GANASTE! Tu número ${numero} es el ganador`,
      html,
    }),
  }).catch(console.error)
}
