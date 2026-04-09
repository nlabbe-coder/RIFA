// Rate limiter en memoria — suficiente para un servidor single-instance (Vercel serverless)
const intentos = new Map<string, { count: number; resetAt: number }>()

const MAX_INTENTOS = 5
const VENTANA_MS = 15 * 60 * 1000 // 15 minutos

export function checkRateLimit(ip: string): { permitido: boolean; restantes: number; resetEn: number } {
  const ahora = Date.now()
  const entrada = intentos.get(ip)

  if (!entrada || ahora > entrada.resetAt) {
    intentos.set(ip, { count: 1, resetAt: ahora + VENTANA_MS })
    return { permitido: true, restantes: MAX_INTENTOS - 1, resetEn: ahora + VENTANA_MS }
  }

  if (entrada.count >= MAX_INTENTOS) {
    return { permitido: false, restantes: 0, resetEn: entrada.resetAt }
  }

  entrada.count++
  return { permitido: true, restantes: MAX_INTENTOS - entrada.count, resetEn: entrada.resetAt }
}

export function resetRateLimit(ip: string) {
  intentos.delete(ip)
}
