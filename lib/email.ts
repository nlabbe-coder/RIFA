const METODO_LABELS: Record<string, string> = {
  transferencia: 'Transferencia Bancaria',
  qr:            'QR Interoperable',
  tigo_money:    'Tigo Money',
  usdt:          'USDT (Crypto)',
  tarjeta:       'Tarjeta',
}

interface EmailConfirmacion {
  nombre: string
  email: string
  ordenId: string
  rifaTitulo: string
  numeros: number[]
  total: number
  metodoPago: string
}

export async function enviarConfirmacionPago(data: EmailConfirmacion) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY no configurado — email no enviado')
    return
  }

  const numerosHtml = data.numeros
    .sort((a, b) => a - b)
    .map(n => `<span style="background:#fee2e2;color:#b91c1c;padding:4px 10px;border-radius:8px;font-weight:700;font-size:14px;margin:3px;display:inline-block;">${n}</span>`)
    .join('')

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#c41e3a,#e53e3e);padding:40px 40px 30px;text-align:center;">
            <div style="font-size:48px;margin-bottom:12px;">🎟️</div>
            <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:900;">¡Pago Confirmado!</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:16px;">Tu participación en RifaBolivia está asegurada</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="color:#374151;font-size:16px;margin:0 0 24px;">Hola <strong>${data.nombre}</strong>,</p>
            <p style="color:#374151;font-size:16px;margin:0 0 28px;">
              Tu pago en <strong>USDT</strong> fue verificado exitosamente en la blockchain.
              ¡Ya estás participando en la rifa!
            </p>

            <!-- Detalles orden -->
            <div style="background:#f9fafb;border-radius:14px;padding:24px;margin-bottom:28px;border:1px solid #f3f4f6;">
              <h3 style="color:#111827;margin:0 0 16px;font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Detalles de tu orden</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color:#6b7280;font-size:14px;padding:6px 0;">Rifa</td>
                  <td style="color:#111827;font-size:14px;font-weight:600;text-align:right;">${data.rifaTitulo}</td>
                </tr>
                <tr>
                  <td style="color:#6b7280;font-size:14px;padding:6px 0;">N° de orden</td>
                  <td style="color:#111827;font-size:12px;font-family:monospace;text-align:right;">${data.ordenId}</td>
                </tr>
                <tr>
                  <td style="color:#6b7280;font-size:14px;padding:6px 0;">Método de pago</td>
                  <td style="color:#111827;font-size:14px;font-weight:600;text-align:right;">${METODO_LABELS[data.metodoPago] ?? data.metodoPago}</td>
                </tr>
                <tr style="border-top:1px solid #e5e7eb;">
                  <td style="color:#111827;font-size:16px;font-weight:700;padding:12px 0 0;">Total pagado</td>
                  <td style="color:#c41e3a;font-size:18px;font-weight:900;text-align:right;padding-top:12px;">Bs. ${data.total.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <!-- Números -->
            <div style="background:#fff1f2;border:2px solid #fecaca;border-radius:14px;padding:24px;margin-bottom:28px;">
              <h3 style="color:#b91c1c;margin:0 0 14px;font-size:15px;font-weight:700;">🎟️ Tus números de la suerte</h3>
              <div>${numerosHtml}</div>
              <p style="color:#dc2626;font-size:12px;margin:14px 0 0;">Guarda este correo como comprobante de tu participación.</p>
            </div>

            <!-- Suerte -->
            <div style="text-align:center;background:linear-gradient(135deg,#fef3c7,#fde68a);border-radius:14px;padding:24px;">
              <p style="font-size:32px;margin:0 0 8px;">⭐</p>
              <p style="color:#92400e;font-weight:700;font-size:16px;margin:0;">¡Mucha suerte en el sorteo!</p>
              <p style="color:#b45309;font-size:13px;margin:8px 0 0;">El sorteo se transmitirá en vivo por nuestras redes sociales.</p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #f3f4f6;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">
              © ${new Date().getFullYear()} RifaBolivia · Este es un correo automático, no responder.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'RifaBolivia <notificaciones@rifabolivia.com>',
        to: [data.email],
        subject: `✅ ¡Pago confirmado! Tus números para "${data.rifaTitulo}"`,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      console.error('Error Resend:', err)
    }
  } catch (err) {
    console.error('Error enviando email:', err)
  }
}
