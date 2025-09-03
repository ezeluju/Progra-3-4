import { NextResponse } from 'next/server'
import { voteReview } from '@/lib/reviewsStore'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params

  const body = await req.json().catch(() => ({} as any))
  const { value, userId = 'u-demo' } = body as { value: 1 | -1; userId?: string }

  if (value !== 1 && value !== -1) {
    return NextResponse.json({ error: 'value must be 1 or -1' }, { status: 400 })
  }

  const r = voteReview(id, userId, value)
  if (!r) return NextResponse.json({ error: 'review not found' }, { status: 404 })

  return NextResponse.json(r)
}
