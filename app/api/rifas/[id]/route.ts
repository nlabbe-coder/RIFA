import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rifa = await prisma.rifa.findUnique({
    where: { id },
    include: { tickets: { select: { numero: true } } },
  })
  if (!rifa) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  return NextResponse.json(rifa)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const rifa = await prisma.rifa.update({ where: { id }, data: body })
  return NextResponse.json(rifa)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.rifa.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
