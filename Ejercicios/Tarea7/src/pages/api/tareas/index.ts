import type { APIRoute } from 'astro';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

type Tarea = { id: string; texto: string; completada: boolean };
type DB = { tareas: Tarea[] };

const adapter = new JSONFile<DB>('db.json');
const db      = new Low(adapter, { tareas: [] });

await db.read();
db.data ||= { tareas: [] };
export const prerender = false;

/* helpers */
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

/* ---------- GET /api/tareas ---------- */
export const GET: APIRoute = async ({ request }) => {
  await db.read();
  const url   = new URL(request.url);
  const page  = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '8', 10);

  const start = (page - 1) * limit;
  const end   = start + limit;

  const tareas = db.data!.tareas.slice(start, end);
  const total  = db.data!.tareas.length;

  return new Response(JSON.stringify({ tareas, total }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

/* ---------- POST /api/tareas ---------- */
export const POST: APIRoute = async ({ request }) => {
  const { texto = '' } = await request.json();
  if (!texto.trim()) return new Response('Falta texto', { status: 400 });

  await db.read();
  const nueva = { id: genId(), texto: texto.trim(), completada: false };
  db.data!.tareas.push(nueva);
  await db.write();

  return new Response(JSON.stringify(nueva), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};

/* ---------- DELETE completadas ---------- */
export const DELETE: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  if (!url.searchParams.get('completadas')) {
    return new Response('Solo soporta ?completadas=true', { status: 400 });
  }

  await db.read();
  db.data!.tareas = db.data!.tareas.filter((t) => !t.completada);
  await db.write();
  return new Response(null, { status: 204 });
};
