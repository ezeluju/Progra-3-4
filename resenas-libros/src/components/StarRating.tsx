'use client'
import { useState } from 'react'

export function StarRating({ value=0, onChange }: { value?: number; onChange?: (n:number)=>void }) {
  const [hover, setHover] = useState<number | null>(null)
  return (
    <div role="radiogroup" aria-label="Calificación" className="inline-flex">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(null)}
          onClick={() => onChange?.(n)}
          className="p-1 text-2xl"
          title={`${n} estrellas`}
        >
          {(hover ?? value) >= n ? '★' : '☆'}
        </button>
      ))}
    </div>
  )
}