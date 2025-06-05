// backend/src/pages/api/tareas/index.ts
import type { APIRoute } from 'astro'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'

export const prerender = false  // ← DESHABILITA prerender para poder usar POST/DELETE dinámicos

type Tarea = { id: string; texto: string; completada: boolean }
type Data  = { tareas: Tarea[] }

const adapter     = new JSONFile<Data>('db.json')
const defaultData = { tareas: [] }
const db          = new Low<Data>(adapter, defaultData)

await db.read()
db.data ||= defaultData

const generarId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2)

/* ---------- GET /api/tareas ---------- */
export const GET: APIRoute = async () => {
  await db.read()
  db.data ||= defaultData
  return new Response(
    JSON.stringify({ tareas: db.data.tareas }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

/* ---------- POST /api/tareas ---------- */
export const POST: APIRoute = async ({ request }) => {
  let payload: any
  try {
    payload = await request.json()
  } catch {
    return new Response('Cuerpo vacío o JSON mal formado', { status: 400 })
  }

  const texto = (payload?.texto ?? '').trim()
  if (!texto) return new Response('Falta texto', { status: 400 })

  await db.read()
  db.data ||= defaultData

  const nueva: Tarea = { id: generarId(), texto, completada: false }
  db.data.tareas.push(nueva)
  await db.write()

  return new Response(
    JSON.stringify({ tarea: nueva }),
    { status: 201, headers: { 'Content-Type': 'application/json' } }
  )
}

/* ---------- DELETE /api/tareas?completadas=true ---------- */
export const DELETE: APIRoute = async ({ request }) => {
  await db.read()
  db.data ||= defaultData

  const url = new URL(request.url)
  if (url.searchParams.get('completadas')) {
    // borra todas las completadas
    db.data.tareas = db.data.tareas.filter(t => !t.completada)
  }

  await db.write()
  return new Response(null, { status: 204 })
}
  