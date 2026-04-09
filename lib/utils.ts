export function formatBs(amount: number) {
  return `Bs. ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('es-BO', {
    day: '2-digit', month: 'long', year: 'numeric'
  })
}

export function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString('es-BO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export function porcentajeVendido(vendidos: number, total: number) {
  return Math.round((vendidos / total) * 100)
}

export function estadoBadgeColor(estado: string) {
  const map: Record<string, string> = {
    activa:    'bg-verde-500 text-white',
    cerrada:   'bg-gray-500 text-white',
    sorteada:  'bg-gold-500 text-gray-900',
    pendiente: 'bg-yellow-100 text-yellow-800',
    confirmado:'bg-green-100 text-green-800',
    rechazado: 'bg-red-100 text-red-800',
  }
  return map[estado] ?? 'bg-gray-100 text-gray-800'
}

export function metodoPagoLabel(metodo: string) {
  const map: Record<string, string> = {
    transferencia: 'Transferencia Bancaria',
    qr:            'QR Interoperable',
    tigo_money:    'Tigo Money',
    tarjeta:       'Tarjeta de Crédito/Débito',
  }
  return map[metodo] ?? metodo
}
