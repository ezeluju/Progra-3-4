import { NextResponse } from 'next/server'
import { searchBooks } from '@/lib/googleBooks'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const startIndex = Number(searchParams.get('startIndex') || 0)
  const maxResults = Number(searchParams.get('maxResults') || 20)
  if (!q) return NextResponse.json({ items: [] })
  const items = await searchBooks(q, startIndex, maxResults)
  return NextResponse.json({ items })
}