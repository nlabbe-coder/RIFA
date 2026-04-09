import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const allowed = ['jpg', 'jpeg', 'png', 'webp']
  if (!allowed.includes(ext)) {
    return NextResponse.json({ error: 'Solo se permiten imágenes JPG, PNG o WebP' }, { status: 400 })
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey    = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Cloudinary no configurado' }, { status: 500 })
  }

  try {
    // Convertir a base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const dataUri = `data:${file.type};base64,${base64}`

    // Firma para autenticación
    const timestamp = Math.floor(Date.now() / 1000)
    const paramsToSign = `folder=rifabolivia&timestamp=${timestamp}`

    // Generar firma HMAC-SHA1
    const encoder = new TextEncoder()
    const keyData = encoder.encode(apiSecret)
    const msgData = encoder.encode(paramsToSign)
    const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
    const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData)
    const signature = Array.from(new Uint8Array(sigBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

    // Subir a Cloudinary
    const body = new FormData()
    body.append('file', dataUri)
    body.append('api_key', apiKey)
    body.append('timestamp', timestamp.toString())
    body.append('signature', signature)
    body.append('folder', 'rifabolivia')

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body,
    })

    const data = await res.json()
    if (!res.ok) {
      console.error('Cloudinary error:', data)
      return NextResponse.json({ error: data.error?.message ?? 'Error al subir' }, { status: 500 })
    }

    return NextResponse.json({ url: data.secure_url })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Error al subir la imagen' }, { status: 500 })
  }
}
