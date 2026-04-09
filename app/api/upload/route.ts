import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const allowed = ['jpg', 'jpeg', 'png', 'webp']
  if (!allowed.includes(ext)) {
    return NextResponse.json({ error: 'Solo se permiten imágenes JPG, PNG o WebP' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const filename = `rifa_${Date.now()}.${ext}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')

  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, filename), buffer)

  return NextResponse.json({ url: `/uploads/${filename}` })
}
