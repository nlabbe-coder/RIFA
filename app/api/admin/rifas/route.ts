import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAdminSession } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { titulo, descripcion, imagen, precio, totalNumeros, fechaSorteo, premio } = body

  if (!titulo || !precio || !totalNumeros || !fechaSorteo || !premio) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const rifa = await prisma.rifa.create({
    data: {
      titulo,
      descripcion: descripcion ?? '',
      imagen: imagen ?? null,
      precio: parseFloat(precio),
      totalNumeros: parseInt(totalNumeros),
      fechaSorteo: new Date(fechaSorteo),
      premio,
      estado: 'activa',
    },
  })

  return NextResponse.json(rifa, { status: 201 })
}
