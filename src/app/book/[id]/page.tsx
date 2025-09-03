import { headers } from 'next/headers'
import BookReviews from '@/components/BookReviews'

function getBaseUrl() {
  const h = headers()
  const host = h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  return `${proto}://${host}`
}

async function getBook(id: string) {
  const base = getBaseUrl()
  const res = await fetch(`${base}/api/books/${id}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

export default async function BookPage({ params }: { params: { id: string } }) {
  const book = await getBook(params.id)
  if (!book) return <div className="p-6">No encontrado</div>

  const meta: Array<[string, string | number | undefined]> = [
    ['Autor(es)', book.authors?.join(', ')],
    ['Editorial', book.publisher],
    ['Publicado', book.publishedDate],
    ['Páginas', book.pageCount],
    ['Categorías', (book.categories ?? []).join(' • ')],
    ['Idioma', book.language?.toUpperCase()],
  ]

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">{book.title}</h1>
        <ul className="text-sm text-gray-700 space-y-1">
          {meta.filter(([, v]) => v).map(([k, v]) => (
            <li key={k}><span className="font-medium">{k}:</span> {v as any}</li>
          ))}
        </ul>
      </header>

      {book.description && (
        <article className="prose max-w-none">
          <h2>Descripción</h2>
          <div dangerouslySetInnerHTML={{ __html: book.description }} />
        </article>
      )}

      {/* wrapper cliente que orquesta formulario + lista */}
      {/* @ts-expect-error Server rendering Client */}
      <BookReviews bookId={book.id} />
    </main>
  )
}
