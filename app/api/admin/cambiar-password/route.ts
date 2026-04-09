import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAdminSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { passwordActual, passwordNueva } = await req.json()

  if (!passwordActual || !passwordNueva) {
    return NextResponse.json({ error: 'Completa todos los campos' }, { status: 400 })
  }

  if (passwordNueva.length < 8) {
    return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' }, { status: 400 })
  }

  const admin = await prisma.admin.findUnique({ where: { id: session.id } })
  if (!admin) return NextResponse.json({ error: 'Admin no encontrado' }, { status: 404 })

  const valida = await bcrypt.compare(passwordActual, admin.password)
  if (!valida) return NextResponse.json({ error: 'La contraseña actual es incorrecta' }, { status: 401 })

  const hash = await bcrypt.hash(passwordNueva, 12)
  await prisma.admin.update({ where: { id: session.id }, data: { password: hash } })

  return NextResponse.json({ ok: true })
}
