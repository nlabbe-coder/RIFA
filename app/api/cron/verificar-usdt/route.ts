import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { enviarConfirmacionPago } from '@/lib/email'

// Contratos USDT oficiales por red
const USDT_CONTRATOS: Record<string, string> = {
  trc20:   'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
  bep20:   '0x55d398326f99059ff775485246999027b3197955',
  polygon: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
  erc20:   '0xdac17f958d2ee523a2206206994597c13d831ec7',
}

// RPCs públicos gratuitos
const EVM_RPC: Record<string, string> = {
  bep20:   'https://bsc-dataseed.binance.org/',
  polygon: 'https://polygon-rpc.com/',
  erc20:   'https://ethereum.publicnode.com',
}

// ── Verificación TRC20 (Tron) ─────────────────────────────────────────────
async function verificarTRC20(txHash: string, walletDestino: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://apilist.tronscan.org/api/transaction-info?hash=${txHash}`,
      { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(8000) }
    )
    const data = await res.json()
    if (!data.confirmed) return false

    const USDT = USDT_CONTRATOS.trc20
    const transfers: any[] = data.trc20TransferInfo ?? []
    return transfers.some(t =>
      t.contract_address === USDT &&
      t.to_address?.toLowerCase() === walletDestino.toLowerCase()
    )
  } catch {
    return false
  }
}

// ── Verificación EVM (BEP20, Polygon, ERC20) ─────────────────────────────
async function verificarEVM(txHash: string, walletDestino: string, red: string): Promise<boolean> {
  try {
    const rpcUrl = EVM_RPC[red]
    if (!rpcUrl) return false

    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_getTransactionReceipt', params: [txHash], id: 1 }),
      signal: AbortSignal.timeout(8000),
    })
    const data = await res.json()
    const receipt = data.result
    if (!receipt || receipt.status !== '0x1') return false

    // Verificar que la transacción fue al contrato USDT
    const contrato = USDT_CONTRATOS[red]
    if (receipt.to?.toLowerCase() !== contrato.toLowerCase()) return false

    // Buscar evento Transfer(from, to, amount) en los logs
    // Topic 0: keccak256("Transfer(address,address,uint256)")
    const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
    const destino = walletDestino.toLowerCase().replace('0x', '').padStart(64, '0')

    return receipt.logs?.some((log: any) =>
      log.address?.toLowerCase() === contrato.toLowerCase() &&
      log.topics?.[0] === TRANSFER_TOPIC &&
      log.topics?.[2]?.toLowerCase() === `0x${destino}`
    ) ?? false
  } catch {
    return false
  }
}

// ── Handler principal ─────────────────────────────────────────────────────
export async function GET() {
  // Obtener config de wallets
  const configUsdt = await prisma.configPago.findFirst({ where: { tipoPago: 'usdt' } })
  if (!configUsdt || !configUsdt.habilitado) {
    return NextResponse.json({ mensaje: 'USDT no habilitado', verificados: 0 })
  }

  const wallets: Record<string, string | null> = {
    trc20:   configUsdt.usdtTrc20   ?? null,
    bep20:   configUsdt.usdtBep20   ?? null,
    polygon: configUsdt.usdtPolygon ?? null,
    erc20:   configUsdt.usdtErc20   ?? null,
  }

  // Obtener órdenes USDT pendientes con TX hash
  const ordenesPendientes = await prisma.orden.findMany({
    where: {
      metodoPago: 'usdt',
      estadoPago: 'pendiente',
      comprobante: { not: null },
    },
    include: {
      comprador: { select: { nombre: true, email: true } },
      rifa: { select: { titulo: true } },
    },
  })

  let verificados = 0
  const resultados: { id: string; red: string; confirmado: boolean }[] = []

  for (const orden of ordenesPendientes) {
    const txHash = orden.comprobante!.trim()
    if (!txHash) continue

    // Leer la red desde notas (formato: USDT_RED:trc20)
    const red = orden.notas?.match(/USDT_RED:(\w+)/)?.[1] ?? ''
    const wallet = wallets[red]
    if (!wallet) continue

    let confirmado = false

    if (red === 'trc20') {
      confirmado = await verificarTRC20(txHash, wallet)
    } else if (['bep20', 'polygon', 'erc20'].includes(red)) {
      confirmado = await verificarEVM(txHash, wallet, red)
    }

    // Verificar que el hash no esté siendo usado en otra orden ya confirmada
    if (confirmado) {
      const hashDuplicado = await prisma.orden.findFirst({
        where: {
          comprobante: txHash,
          estadoPago: 'confirmado',
          id: { not: orden.id },
        },
        select: { id: true },
      })

      if (hashDuplicado) {
        // Marcar como rechazada por hash duplicado
        await prisma.orden.update({
          where: { id: orden.id },
          data: {
            estadoPago: 'rechazado',
            notas: `${orden.notas} | RECHAZADO: hash duplicado, ya usado en orden ${hashDuplicado.id}`,
          },
        })
        resultados.push({ id: orden.id, red, confirmado: false })
        continue
      }
    }

    resultados.push({ id: orden.id, red, confirmado })

    if (confirmado) {
      await prisma.orden.update({
        where: { id: orden.id },
        data: { estadoPago: 'confirmado', notas: `${orden.notas} | Auto-verificado blockchain` },
      })

      // Enviar email de confirmación al cliente automáticamente
      const numeros: number[] = JSON.parse(orden.numeros)
      await enviarConfirmacionPago({
        nombre:      orden.comprador.nombre,
        email:       orden.comprador.email,
        ordenId:     orden.id,
        rifaTitulo:  orden.rifa.titulo,
        numeros,
        total:       orden.total,
        metodoPago:  'usdt',
      })

      verificados++
    }
  }

  return NextResponse.json({
    mensaje: `Verificación completada`,
    pendientesRevisadas: ordenesPendientes.length,
    confirmadas: verificados,
    detalle: resultados,
  })
}
