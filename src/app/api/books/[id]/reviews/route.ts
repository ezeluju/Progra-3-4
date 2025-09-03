import { NextResponse } from 'next/server'
import { addReview, listReviews } from '@/lib/reviewsStore'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url)
  const sort = (searchParams.get('sort') || 'best') as 'best'|'new'|'rating'
  const items = listReviews(params.id, sort)
  return NextResponse.json({ items })
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(()=> ({}))
  const { rating, content, userId = 'u-demo', userName = 'Demo User' } = body
  if (!rating || rating < 1 || rating > 5) return NextResponse.json({ error: 'rating 1..5' }, { status: 400 })
  if (!content || content.length < 10) return NextResponse.json({ error: 'contenido mínimo 10 chars' }, { status: 400 })
  const r = addReview(params.id, userId, userName, rating, content)
  return NextResponse.json(r, { status: 201 })
}