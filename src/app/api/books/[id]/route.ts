import { NextResponse } from 'next/server'
import { getBookById } from '@/lib/googleBooks'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_: Request, { params }: Ctx) {
  const { id } = await params
  const book = await getBookById(id)
  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(book)
}
