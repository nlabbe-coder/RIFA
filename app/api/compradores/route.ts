import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ci = searchParams.get('ci')?.trim()
  if (!ci) return NextResponse.json(null)

  const comprador = await prisma.comprador.findFirst({
    where: { ci },
    include: {
      ordenes: {
        where: { fotoCI: { not: null } },
        select: { fotoCI: true },
        orderBy: { creadoEn: 'desc' },
        take: 1,
      },
    },
  })

  if (!comprador) return NextResponse.json(null)

  return NextResponse.json({
    nombre: comprador.nombre,
    ci: comprador.ci,
    telefono: comprador.telefono,
    email: comprador.email,
    fotoCI: comprador.ordenes[0]?.fotoCI ?? null,
  })
}
