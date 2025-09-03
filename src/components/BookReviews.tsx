    'use client'

import { useState } from 'react'
import ReviewForm from '@/components/ReviewForm'
import ReviewList from '@/components/ReviewList'

export default function BookReviews({ bookId }: { bookId: string }) {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Reseñas</h2>
      <ReviewForm
        bookId={bookId}
        onCreated={() => setRefreshKey(k => k + 1)}
      />
      <ReviewList bookId={bookId} refreshKey={refreshKey} />
    </section>
  )
}
