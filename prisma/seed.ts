import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Admin por defecto
  const hash = await bcrypt.hash('admin123', 10)
  await prisma.admin.upsert({
    where: { email: 'admin@rifabolivia.com' },
    update: {},
    create: {
      email: 'admin@rifabolivia.com',
      password: hash,
      nombre: 'Administrador',
    },
  })

  // Config pagos inicial
  await prisma.configPago.upsert({
    where: { tipoPago: 'transferencia' },
    update: {},
    create: {
      tipoPago: 'transferencia',
      banco: 'Banco Unión',
      numeroCuenta: '1234567890',
      titular: 'RifaBolivia S.R.L.',
    },
  })

  await prisma.configPago.upsert({
    where: { tipoPago: 'tigo_money' },
    update: {},
    create: {
      tipoPago: 'tigo_money',
      numeroTigo: '70000000',
      nombreTigo: 'RifaBolivia',
    },
  })

  await prisma.configPago.upsert({
    where: { tipoPago: 'qr' },
    update: {},
    create: {
      tipoPago: 'qr',
      habilitado: true,
    },
  })

  await prisma.configPago.upsert({
    where: { tipoPago: 'usdt' },
    update: {},
    create: {
      tipoPago: 'usdt',
      habilitado: false,
    },
  })

  // Rifa de ejemplo
  await prisma.rifa.create({
    data: {
      titulo: 'Gran Rifa: Auto 0km Toyota Yaris',
      descripcion: 'Participa por un auto 0km Toyota Yaris 2024. ¡Solo 100,000 números disponibles! El sorteo se realizará en vivo por nuestras redes sociales.',
      precio: 10,
      totalNumeros: 1000,
      fechaSorteo: new Date('2026-06-30'),
      premio: 'Toyota Yaris 0km 2024',
      estado: 'activa',
    },
  })

  console.log('✅ Seed completado')
  console.log('📧 Admin: admin@rifabolivia.com')
  console.log('🔑 Password: admin123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
