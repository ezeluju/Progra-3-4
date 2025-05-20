// src/pages/api/tareas/[id].ts
import type { APIRoute } from 'astro';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

type Tarea = { id: string; texto: string; completada: boolean };
type Data  = { tareas: Tarea[] };

const adapter     = new JSONFile<Data>('db.json');
const defaultData = { tareas: [] };
const db          = new Low<Data>(adapter, defaultData);

await db.read();
db.data ||= defaultData;

export const prerender = false;   // ← imprescindible en mode server/ssr

/* ---------- PUT /api/tareas/:id ---------- */
export const PUT: APIRoute = async ({ params }) => {
  const { id } = params;                // id de la URL
  await db.read();
  db.data ||= defaultData;

  const tarea = db.data.tareas.find(t => t.id === id);
  if (!tarea) return new Response('No encontrada', { status: 404 });

  tarea.completada = !tarea.completada;
  await db.write();

  return new Response(
    JSON.stringify({ tarea }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};

/* ---------- DELETE /api/tareas/:id ---------- */
export const DELETE: APIRoute = async ({ params }) => {
  const { id } = params;
  await db.read();
  db.data ||= defaultData;

  const inicial = db.data.tareas.length;
  db.data.tareas = db.data.tareas.filter(t => t.id !== id);
  if (db.data.tareas.length === inicial) {
    return new Response('No encontrada', { status: 404 });
  }

  await db.write();
  return new Response(null, { status: 204 });
};
