import { NextResponse } from 'next/server'
import { addReview, listReviews } from '@/lib/reviewsStore'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const sort = (searchParams.get('sort') || 'best') as 'best' | 'new' | 'rating'
  const items = listReviews(id, sort)
  return NextResponse.json({ items })
}

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const { rating, content, userId = 'u-demo', userName = 'Demo User' } = body
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'rating 1..5' }, { status: 400 })
  }
  if (!content || content.length < 10) {
    return NextResponse.json({ error: 'contenido mínimo 10 chars' }, { status: 400 })
  }
  const r = addReview(id, userId, userName, rating, content)
  return NextResponse.json(r, { status: 201 })
}
