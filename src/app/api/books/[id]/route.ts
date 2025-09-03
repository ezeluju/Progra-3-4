import { NextResponse } from 'next/server'
import { getBookById } from '@/lib/googleBooks'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const book = await getBookById(params.id)
  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(book) // ← devuelve TODO
}
