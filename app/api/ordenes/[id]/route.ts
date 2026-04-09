import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const orden = await prisma.orden.findUnique({
    where: { id },
    include: {
      rifa: { select: { titulo: true, totalNumeros: true } },
      comprador: { select: { nombre: true, telefono: true, email: true } },
    },
  })
  if (!orden) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  return NextResponse.json(orden)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const orden = await prisma.orden.update({
    where: { id },
    data: { estadoPago: body.estadoPago, notas: body.notas },
    include: { comprador: true, rifa: { select: { titulo: true } } },
  })

  if (body.estadoPago === 'rechazado') {
    const numeros: number[] = JSON.parse(orden.numeros)
    await prisma.ticket.updateMany({
      where: { rifaId: orden.rifaId, numero: { in: numeros } },
      data: { ordenId: null },
    })
    await prisma.rifa.update({
      where: { id: orden.rifaId },
      data: { numerosVendidos: { decrement: numeros.length } },
    })
  }

  return NextResponse.json(orden)
}
