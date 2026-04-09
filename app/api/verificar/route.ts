import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ci = searchParams.get('ci')?.trim()
  if (!ci) return NextResponse.json([])

  const comprador = await prisma.comprador.findFirst({ where: { ci } })
  if (!comprador) return NextResponse.json([])

  const ordenes = await prisma.orden.findMany({
    where: { compradorId: comprador.id },
    include: { rifa: { select: { titulo: true, fechaSorteo: true } } },
    orderBy: { creadoEn: 'desc' },
  })

  return NextResponse.json(ordenes)
}
