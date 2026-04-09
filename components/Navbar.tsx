'use client'
import Link from 'next/link'
import Logo from './Logo'
import { useState } from 'react'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <Logo size="md" />
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
            Rifas
          </Link>
          <Link href="/#como-funciona" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
            ¿Cómo funciona?
          </Link>
          <Link href="/#contacto" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
            Contacto
          </Link>
          <Link href="/verificar" className="btn-secondary text-sm py-2 px-4">
            Verificar mi ticket
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-3">
          <Link href="/" onClick={() => setOpen(false)} className="text-gray-700 font-medium py-2">Rifas</Link>
          <Link href="/#como-funciona" onClick={() => setOpen(false)} className="text-gray-700 font-medium py-2">¿Cómo funciona?</Link>
          <Link href="/#contacto" onClick={() => setOpen(false)} className="text-gray-700 font-medium py-2">Contacto</Link>
          <Link href="/verificar" onClick={() => setOpen(false)} className="btn-primary text-sm text-center">Verificar mi ticket</Link>
        </div>
      )}
    </nav>
  )
}
