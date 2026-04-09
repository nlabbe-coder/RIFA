import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'RifaBolivia - Rifas digitales seguras',
  description: 'Participa en las rifas más grandes de Bolivia. Compra tus números online y gana increíbles premios.',
  keywords: 'rifas, Bolivia, lotería, premios, rifa online',
  openGraph: {
    title: 'RifaBolivia',
    description: 'Las rifas más grandes de Bolivia',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '12px', fontFamily: 'Inter, sans-serif' },
          }}
        />
      </body>
    </html>
  )
}
