import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { createToken } from '@/lib/auth'
import { checkRateLimit, resetRateLimit } from '@/lib/rateLimit'

export async function POST(req: Request) {
  // Obtener IP real (Vercel pasa X-Forwarded-For)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  // 1. Rate limiting — máx 5 intentos por IP cada 15 min
  const { permitido, restantes, resetEn } = checkRateLimit(`login:${ip}`)
  if (!permitido) {
    const minutosRestantes = Math.ceil((resetEn - Date.now()) / 60000)
    return NextResponse.json(
      { error: `Demasiados intentos fallidos. Intenta en ${minutosRestantes} minutos.` },
      { status: 429 }
    )
  }

  const { email, password } = await req.json()

  // 2. Validación básica de inputs
  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  if (email.length > 254 || password.length > 128) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  // 3. Buscar admin — nunca loguear email ni password
  const admin = await prisma.admin.findUnique({
    where: { email: email.toLowerCase().trim() },
  })

  // Tiempo constante para evitar timing attacks
  const passwordValida = admin
    ? await bcrypt.compare(password, admin.password)
    : await bcrypt.compare(password, '$2b$10$invalidhashtopreventtimingattack123456789012')

  if (!admin || !passwordValida) {
    // No revelar si el email existe o no
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
  }

  // Login exitoso — limpiar rate limit
  resetRateLimit(`login:${ip}`)

  const token = await createToken({ id: admin.id, email: admin.email, nombre: admin.nombre })

  const response = NextResponse.json({ ok: true })
  response.cookies.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 horas
    path: '/',
  })

  return response
}
