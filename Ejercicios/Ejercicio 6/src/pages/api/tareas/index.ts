import type { APIRoute } from 'astro';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
export const prerender = false;


/* ---------- Tipos ---------- */
type Tarea = { id: string; texto: string; completada: boolean };
type Data  = { tareas: Tarea[] };

/* ---------- DB ---------- */
const adapter     = new JSONFile<Data>('db.json');
const defaultData = { tareas: [] };
const db          = new Low<Data>(adapter, defaultData);

await db.read();                     // lee (si existe)
db.data ||= defaultData;             // ← garantiza estructura

const generarId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2);

/* ---------- GET /api/tareas ---------- */
export const GET: APIRoute = async () => {
  await db.read();
  db.data ||= defaultData;           // seguridad
  return new Response(
    JSON.stringify({ tareas: db.data.tareas }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};

/* ---------- POST /api/tareas ---------- */
export const POST: APIRoute = async ({ request }) => {
  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return new Response('Cuerpo vacío o JSON mal formado', { status: 400 });
  }

  const texto = (payload?.texto ?? '').trim();
  if (!texto) return new Response('Falta texto', { status: 400 });

  await db.read();
  db.data ||= defaultData;           // seguridad
  const nueva = { id: generarId(), texto, completada: false };
  db.data.tareas.push(nueva);
  await db.write();

  return new Response(
    JSON.stringify({ tarea: nueva }),
    { status: 201, headers: { 'Content-Type': 'application/json' } }
  );
};

/* ---------- PUT /api/tareas/:id ---------- */
export const PUT: APIRoute = async ({ params }) => {
  await db.read();
  db.data ||= defaultData;
  const tarea = db.data.tareas.find(t => t.id === params.id);
  if (!tarea) return new Response('No encontrada', { status: 404 });

  tarea.completada = !tarea.completada;
  await db.write();

  return new Response(
    JSON.stringify({ tarea }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};

/* ---------- DELETE /api/tareas/:id ---------- */
export const DELETE: APIRoute = async ({ request, params }) => {
  await db.read();
  db.data ||= defaultData;

  const url = new URL(request.url);
  if (url.searchParams.get('completadas')) {
    db.data.tareas = db.data.tareas.filter(t => !t.completada);
  } else {
    db.data.tareas = db.data.tareas.filter(t => t.id !== params.id);
  }

  await db.write();
  return new Response(null, { status: 204 });
};
