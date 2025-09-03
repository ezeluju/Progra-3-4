import { describe, expect, it, vi } from 'vitest'
import { searchBooks, getBookById } from './googleBooks'

const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe('googleBooks api', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })
|
  it('searchBooks maps results', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          { id: '1', volumeInfo: { title: 't', authors: ['a'], categories: ['c'], imageLinks: { thumbnail: 'img' }, pageCount: 10 } },
        ],
      }),
    })
    const res = await searchBooks('harry')
    expect(mockFetch).toHaveBeenCalled()
    expect(res[0]).toMatchObject({ id: '1', title: 't', authors: ['a'], categories: ['c'] })
  })

  it('searchBooks throws on error status', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })
    await expect(searchBooks('x')).rejects.toThrow('Google Books error: 500')
  })

  it('getBookById returns null on non-ok', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })
    expect(await getBookById('1')).toBeNull()
  })

  it('getBookById maps volume info', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'a', volumeInfo: { title: 'T', authors: ['A'] } }),
    })
    const book = await getBookById('a')
    expect(book).toMatchObject({ id: 'a', title: 'T', authors: ['A'], categories: [] })
  })
})

