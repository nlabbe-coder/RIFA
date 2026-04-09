export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { w: 120, h: 32, icon: 20, text: 14 },
    md: { w: 160, h: 42, icon: 28, text: 18 },
    lg: { w: 220, h: 58, icon: 38, text: 24 },
  }
  const s = sizes[size]

  return (
    <svg width={s.w} height={s.h} viewBox={`0 0 160 42`} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ticket shape */}
      <rect x="2" y="8" width="30" height="26" rx="4" fill="#D62839"/>
      <rect x="14" y="4" width="6" height="4" rx="2" fill="#D62839"/>
      <rect x="14" y="34" width="6" height="4" rx="2" fill="#D62839"/>
      {/* Ticket perforación */}
      <line x1="16" y1="8" x2="16" y2="34" stroke="white" strokeWidth="1.5" strokeDasharray="3,3"/>
      {/* Estrella en ticket */}
      <text x="20" y="25" textAnchor="middle" fontSize="14" fill="#F4D03F">★</text>
      {/* Texto RifaBolivia */}
      <text x="40" y="20" fontSize="15" fontWeight="800" fontFamily="Inter, system-ui, sans-serif" fill="#D62839">Rifa</text>
      <text x="40" y="36" fontSize="13" fontWeight="700" fontFamily="Inter, system-ui, sans-serif" fill="#1a1a2e">Bolivia</text>
      {/* Punto dorado */}
      <circle cx="77" cy="20" r="3" fill="#F4D03F"/>
    </svg>
  )
}
