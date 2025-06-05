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

/* ---------- PUT /api/tareas/:id ---------- */
export const PUT: APIRoute = async ({ params, request }) => {
  const { id } = params;
  await db.read();

  const tarea = db.data!.tareas.find((t) => t.id === id);
  if (!tarea) return new Response('No encontrada', { status: 404 });

  /* si viene texto ⇒ editar, sino ⇒ toggle */
  const body = await request.json().catch(() => ({}));
  if (body.texto !== undefined) {
    tarea.texto = (body.texto as string).trim() || tarea.texto;
  } else {
    tarea.completada = !tarea.completada;
  }

  await db.write();
  return new Response(JSON.stringify(tarea), {
    headers: { 'Content-Type': 'application/json' },
  });
};

/* ---------- DELETE /api/tareas/:id ---------- */
export const DELETE: APIRoute = async ({ params }) => {
  const { id } = params;
  await db.read();
  db.data!.tareas = db.data!.tareas.filter((t) => t.id !== id);
  await db.write();
  return new Response(null, { status: 204 });
};
