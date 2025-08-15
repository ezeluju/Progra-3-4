import { wilsonScore } from './ranking'

export type Review = {
  id: string
  bookId: string
  user: { id: string; name: string }
  rating: number // 1..5
  content: string
  upVotes: number
  downVotes: number
  score: number
  createdAt: string
  updatedAt: string
}

// bookId -> Review[]
const store = new Map<string, Review[]>()

// reviewId -> {userId, value}
const votes = new Map<string, Map<string, 1 | -1>>()

function uuid() { return Math.random().toString(36).slice(2) }

export function listReviews(bookId: string, sort: 'best'|'new'|'rating' = 'best'): Review[] {
  const arr = [...(store.get(bookId) ?? [])]
  if (sort === 'new') arr.sort((a,b)=> b.createdAt.localeCompare(a.createdAt))
  else if (sort === 'rating') arr.sort((a,b)=> b.rating - a.rating)
  else arr.sort((a,b)=> b.score - a.score)
  return arr
}

export function addReview(bookId: string, userId: string, userName: string, rating: number, content: string): Review {
  const now = new Date().toISOString()
  const r: Review = {
    id: uuid(), bookId,
    user: { id: userId, name: userName },
    rating, content,
    upVotes: 0, downVotes: 0, score: 0,
    createdAt: now, updatedAt: now,
  }
  const arr = store.get(bookId) ?? []
  arr.push(r)
  store.set(bookId, arr)
  return r
}

export function voteReview(reviewId: string, userId: string, value: 1 | -1) {
  // encontrar review
  let found: Review | undefined
  for (const arr of store.values()) {
    const r = arr.find(x=>x.id === reviewId)
    if (r) { found = r; break }
  }
  if (!found) return null

  let userVotes = votes.get(reviewId)
  if (!userVotes) { userVotes = new Map(); votes.set(reviewId, userVotes) }

  const prev = userVotes.get(userId)
  if (prev === value) {
    // quitar voto
    userVotes.delete(userId)
    if (value === 1) found.upVotes -= 1; else found.downVotes -= 1
  } else if (prev && prev !== value) {
    // cambiar voto
    userVotes.set(userId, value)
    if (value === 1) { found.upVotes += 1; found.downVotes -= 1 }
    else { found.downVotes += 1; found.upVotes -= 1 }
  } else {
    // nuevo voto
    userVotes.set(userId, value)
    if (value === 1) found.upVotes += 1; else found.downVotes += 1
  }
  found.score = wilsonScore(found.upVotes, found.downVotes)
  found.updatedAt = new Date().toISOString()
  return found
}