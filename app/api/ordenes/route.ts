import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  const body = await req.json()
  const { rifaId, numeros, metodoPago, comprador, comprobante, fotoCI, redUsdt } = body

  if (!rifaId || !numeros?.length || !metodoPago || !comprador) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const rifa = await prisma.rifa.findUnique({ where: { id: rifaId } })
  if (!rifa || rifa.estado !== 'activa') {
    return NextResponse.json({ error: 'Rifa no disponible' }, { status: 400 })
  }

  // Verificar que el hash USDT no haya sido usado en otra orden
  if (metodoPago === 'usdt' && comprobante) {
    const hashExistente = await prisma.orden.findFirst({
      where: { comprobante: comprobante.trim(), estadoPago: { not: 'rechazado' } },
      select: { id: true },
    })
    if (hashExistente) {
      return NextResponse.json(
        { error: 'Este hash de transacción ya fue registrado en otra orden. Cada pago debe tener su propio hash.' },
        { status: 409 }
      )
    }
  }

  // Verificar que los números estén disponibles
  const ocupados = await prisma.ticket.findMany({
    where: { rifaId, numero: { in: numeros }, ordenId: { not: null } },
  })
  if (ocupados.length > 0) {
    const nums = ocupados.map(t => t.numero).join(', ')
    return NextResponse.json({ error: `Los números ${nums} ya están vendidos. Vuelve y elige otros.` }, { status: 409 })
  }

  // Crear comprador o encontrar existente
  let compradorRecord = await prisma.comprador.findFirst({
    where: { ci: comprador.ci },
  })
  if (!compradorRecord) {
    compradorRecord = await prisma.comprador.create({
      data: {
        nombre: comprador.nombre,
        ci: comprador.ci,
        telefono: comprador.telefono,
        email: comprador.email,
      },
    })
  }

  const total = numeros.length * rifa.precio

  // Crear orden y tickets en transacción
  const orden = await prisma.$transaction(async (tx) => {
    const nuevaOrden = await tx.orden.create({
      data: {
        rifaId,
        compradorId: compradorRecord!.id,
        numeros: JSON.stringify(numeros),
        total,
        metodoPago,
        estadoPago: 'pendiente',
        comprobante: comprobante || null,
        fotoCI: fotoCI || null,
        notas: metodoPago === 'usdt' && redUsdt ? `USDT_RED:${redUsdt}` : null,
      },
    })

    // Crear o actualizar tickets
    for (const numero of numeros) {
      await tx.ticket.upsert({
        where: { rifaId_numero: { rifaId, numero } },
        update: { ordenId: nuevaOrden.id },
        create: { rifaId, numero, ordenId: nuevaOrden.id },
      })
    }

    await tx.rifa.update({
      where: { id: rifaId },
      data: { numerosVendidos: { increment: numeros.length } },
    })

    return nuevaOrden
  })

  return NextResponse.json(orden, { status: 201 })
}

export async function GET(req: Request) {
  const ordenes = await prisma.orden.findMany({
    include: { comprador: true, rifa: { select: { titulo: true } } },
    orderBy: { creadoEn: 'desc' },
  })
  return NextResponse.json(ordenes)
}
