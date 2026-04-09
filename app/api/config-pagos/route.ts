import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const config = await prisma.configPago.findMany()
  return NextResponse.json(config)
}

export async function PUT(req: Request) {
  const body = await req.json()
  const { tipoPago, ...data } = body
  const config = await prisma.configPago.upsert({
    where: { tipoPago },
    update: data,
    create: { tipoPago, ...data },
  })
  return NextResponse.json(config)
}
