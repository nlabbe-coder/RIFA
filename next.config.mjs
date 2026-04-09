/** @type {import('next').NextConfig} */

const PRODUCTION_URL = process.env.NEXT_PUBLIC_URL || 'https://rifa-six-hazel.vercel.app'

const securityHeaders = [
  // Forzar HTTPS por 1 año + subdomains
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Evitar clickjacking
  { key: 'X-Frame-Options', value: 'DENY' },
  // Evitar MIME sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Referrer seguro
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Deshabilitar características innecesarias del navegador
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe necesario para Next.js
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self'",
      `connect-src 'self' ${PRODUCTION_URL} https://p2p.binance.com https://apilist.tronscan.org https://bsc-dataseed.binance.org https://polygon-rpc.com https://ethereum.publicnode.com`,
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
]

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  async headers() {
    return [
      {
        // Aplicar a todas las rutas
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        // CORS — solo para rutas API públicas
        source: '/api/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: PRODUCTION_URL },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PATCH,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
    ]
  },
}

export default nextConfig
