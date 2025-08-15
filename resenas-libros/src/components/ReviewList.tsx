// src/components/ReviewList.tsx
'use client'
import { useEffect, useState } from 'react'

type Review = {
  id: string
  user: { id: string; name: string }
  rating: number
  content: string
  upVotes: number
  downVotes: number
  score: number
  createdAt: string
}

export default function ReviewList({
  bookId,
  refreshKey = 0,
}: {
  bookId: string
  refreshKey?: number
}) {
  const [items, setItems] = useState<Review[]>([])
  const [sort, setSort] = useState<'best' | 'new' | 'rating'>('best')

  async function load() {
    const res = await fetch(`/api/books/${bookId}/reviews?sort=${sort}`, { cache: 'no-store' })
    const data = await res.json()
    setItems(data.items ?? [])
  }

  useEffect(() => { load() }, [sort, refreshKey])

  async function vote(id: string, value: 1 | -1) {
    await fetch(`/api/reviews/${id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    })
    await load()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Ordenar:</span>
        <select value={sort} onChange={e=>setSort(e.target.value as any)} className="border rounded p-1">
          <option value="best">Mejores</option>
          <option value="new">Más nuevas</option>
          <option value="rating">Mayor rating</option>
        </select>
      </div>

      {items.length === 0 && <div className="text-gray-500">Sé el primero en reseñar ✍️</div>}

      {items.map(r => (
        <div key={r.id} className="border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="font-medium">{r.user.name}</div>
            <div className="text-yellow-500">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</div>
          </div>
          <p className="mt-2 whitespace-pre-wrap">{r.content}</p>
          <div className="mt-3 flex items-center gap-3 text-sm">
            <button onClick={()=>vote(r.id, 1)} className="px-2 py-1 rounded border">👍 {r.upVotes}</button>
            <button onClick={()=>vote(r.id, -1)} className="px-2 py-1 rounded border">👎 {r.downVotes}</button>
            <span className="text-gray-500">Score: {r.score.toFixed(3)}</span>
            <span className="text-gray-400">{new Date(r.createdAt).toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  )
}