import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('reviewsStore', () => {
  let addReview: any
  let listReviews: any
  let voteReview: any

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('./reviewsStore')
    addReview = mod.addReview
    listReviews = mod.listReviews
    voteReview = mod.voteReview
  })

  it('adds and lists reviews', () => {
    const r1 = addReview('b1', 'u1', 'Alice', 4, 'good')
    const r2 = addReview('b1', 'u2', 'Bob', 5, 'great')
    const list = listReviews('b1', 'rating')
    expect(list).toHaveLength(2)
    expect(list[0].id).toBe(r2.id) // highest rating first
    expect(list[1].id).toBe(r1.id)
  })

  it('returns null when voting unknown review', () => {
    expect(voteReview('nope', 'u1', 1)).toBeNull()
  })

  it('updates votes and toggles', () => {
    const r = addReview('b1', 'u1', 'Alice', 3, 'ok')
    const v1 = voteReview(r.id, 'voter', 1)!
    expect(v1.upVotes).toBe(1)
    const v2 = voteReview(r.id, 'voter', 1)!
    expect(v2.upVotes).toBe(0) // removed
  })

  it('uses wilson score to update review score', async () => {
    vi.resetModules()
    const ranking = await import('./ranking')
    const scoreMock = vi.spyOn(ranking, 'wilsonScore').mockReturnValue(0.42)
    const mod = await import('./reviewsStore')
    const add = mod.addReview
    const vote = mod.voteReview
    const r = add('b1', 'u1', 'Alice', 3, 'ok')
    const updated = vote(r.id, 'me', 1)!
    expect(scoreMock).toHaveBeenCalledWith(1, 0)
    expect(updated.score).toBe(0.42)
  })
})

