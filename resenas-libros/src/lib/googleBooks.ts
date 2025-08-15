export type BookResult = {
    id: string
    title: string
    authors: string[]
    description?: string
    thumbnail?: string
    pageCount?: number
    categories: string[]
    publishedDate?: string
    publisher?: string
    language?: string
  }
  
  const GOOGLE = 'https://www.googleapis.com/books/v1/volumes'
  
  export async function searchBooks(q: string, startIndex = 0, maxResults = 20): Promise<BookResult[]> {
    const url = `${GOOGLE}?q=${encodeURIComponent(q)}&startIndex=${startIndex}&maxResults=${maxResults}`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) throw new Error(`Google Books error: ${res.status}`)
    const data = await res.json()
    const items = data.items ?? []
    return items.map((it: any) => toBookResult(it))
  }
  
  export async function getBookById(id: string): Promise<BookResult | null> {
    const res = await fetch(`${GOOGLE}/${id}`, { next: { revalidate: 86400 } })
    if (!res.ok) return null
    const it = await res.json()
    const v = it.volumeInfo ?? {}
    return {
      id: it.id,
      title: v.title ?? 'Untitled',
      authors: v.authors ?? [],
      description: v.description,
      pageCount: v.pageCount,
      categories: v.categories ?? [],
      publishedDate: v.publishedDate,
      publisher: v.publisher,
      language: v.language,
    }
  }
  
  function toBookResult(it: any): BookResult {
    const v = it.volumeInfo ?? {}
    const img = v.imageLinks ?? {}
    return {
      id: it.id,
      title: v.title ?? 'Untitled',
      authors: v.authors ?? [],
      description: v.description,
      thumbnail: img.thumbnail || img.smallThumbnail,
      pageCount: v.pageCount,
      categories: v.categories ?? [],
      publishedDate: v.publishedDate,
    }
  }