'use client'
import { useEffect, useRef } from 'react'

export default function Confetti() {
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const colors = ['#f59e0b', '#d97706', '#fbbf24', '#10b981', '#3b82f6', '#ec4899']
    const pieces = 120

    for (let i = 0; i < pieces; i++) {
      setTimeout(() => {
        const el = document.createElement('div')
        const size = Math.random() * 10 + 6
        el.style.cssText = `
          position:fixed;
          top:-20px;
          left:${Math.random() * 100}vw;
          width:${size}px;
          height:${size}px;
          background:${colors[Math.floor(Math.random() * colors.length)]};
          border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
          pointer-events:none;
          z-index:9999;
          animation: fall ${Math.random() * 3 + 2}s linear forwards;
          transform: rotate(${Math.random() * 360}deg);
        `
        document.body.appendChild(el)
        setTimeout(() => el.remove(), 5000)
      }, i * 40)
    }

    // Inject keyframes once
    if (!document.getElementById('confetti-style')) {
      const style = document.createElement('style')
      style.id = 'confetti-style'
      style.textContent = `
        @keyframes fall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  return null
}
