import { NextResponse } from 'next/server'

// Cache en memoria para no saturar Binance
let cache: { precio: number; timestamp: number } | null = null
const CACHE_MS = 3 * 60 * 1000 // 3 minutos

export async function GET() {
  // Usar cache si está vigente
  if (cache && Date.now() - cache.timestamp < CACHE_MS) {
    return NextResponse.json({
      precio: cache.precio,
      fuente: 'cache',
      actualizadoEn: new Date(cache.timestamp).toISOString(),
    })
  }

  try {
    const res = await fetch('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify({
        fiat: 'BOB',
        page: 1,
        rows: 10,
        tradeType: 'SELL', // Precio al que venden USDT (cliente compra USDT)
        asset: 'USDT',
        countries: [],
        proMerchantAds: false,
        shieldMerchantAds: false,
        filterType: 'all',
        periods: [],
        additionalKycVerifyFilter: 0,
        publisherType: null,
        payTypes: [],
        classifies: ['mass', 'profession'],
      }),
      signal: AbortSignal.timeout(6000),
    })

    const data = await res.json()
    const anuncios: any[] = data?.data ?? []

    if (anuncios.length === 0) throw new Error('Sin datos')

    // Promediar los primeros 5 anuncios para mayor precisión
    const precios = anuncios
      .slice(0, 5)
      .map(a => parseFloat(a.adv?.price ?? '0'))
      .filter(p => p > 0)

    const promedio = precios.reduce((s, p) => s + p, 0) / precios.length
    const precio = Math.round(promedio * 100) / 100

    // Guardar en cache
    cache = { precio, timestamp: Date.now() }

    return NextResponse.json({
      precio,
      minimo: Math.min(...precios),
      maximo: Math.max(...precios),
      muestras: precios.length,
      fuente: 'binance_p2p',
      actualizadoEn: new Date().toISOString(),
    })
  } catch (err) {
    // Si falla, devolver cache viejo o un precio de referencia
    if (cache) {
      return NextResponse.json({
        precio: cache.precio,
        fuente: 'cache_fallback',
        actualizadoEn: new Date(cache.timestamp).toISOString(),
      })
    }

    return NextResponse.json(
      { error: 'No se pudo obtener el precio', precio: null },
      { status: 503 }
    )
  }
}
