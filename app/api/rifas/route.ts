import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const rifas = await prisma.rifa.findMany({ orderBy: { creadoEn: 'desc' } })
  return NextResponse.json(rifas)
}
