'use client';

import { useEffect, useMemo, useState } from 'react';
import { ReadingListEntry, ReadingStats } from '../types';

type ApiResult<T> = { result?: T; error?: string };

const fetchTool = async <T,>(tool: string, payload: Record<string, unknown>): Promise<ApiResult<T>> => {
  const res = await fetch(`/api/tools/${tool}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    return { error: error?.error || 'No se pudo completar la acción' };
  }
  const data = await res.json();
  return { result: data.result };
};

const priorityLabel: Record<string, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

export function ReadingDashboard() {
  const [list, setList] = useState<ReadingListEntry[]>([]);
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    const [listResponse, statsResponse] = await Promise.all([
      fetchTool<{ items: ReadingListEntry[] }>('getReadingList', { filter: 'all', limit: 20 }),
      fetchTool<{ stats: ReadingStats }>('getReadingStats', { period: 'all-time', groupBy: 'genre' }),
    ]);

    if (listResponse.error) setError(listResponse.error);
    if (statsResponse.error) setError(statsResponse.error);

    setList(listResponse.result?.items ?? []);
    setStats(statsResponse.result?.stats ?? null);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const topGenres = useMemo(
    () =>
      stats
        ? Object.entries(stats.genres)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, value]) => `${name} (${value})`)
        : [],
    [stats],
  );

  const topAuthors = useMemo(
    () =>
      stats
        ? Object.entries(stats.authors)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, value]) => `${name} (${value})`)
        : [],
    [stats],
  );

  return (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl shadow-black/50 ring-1 ring-indigo-800/40 backdrop-blur">
      <header className="flex items-center justify-between gap-2">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300">Tu biblioteca</p>
          <h2 className="text-xl font-bold text-white">Lista, historial y estadísticas</h2>
          <p className="text-sm text-slate-300">
            Todos los datos se guardan en SQLite en el backend. Puedes agregar libros con el chat o usando las tools.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="rounded-xl border border-indigo-700 bg-slate-800 px-3 py-2 text-sm font-semibold text-indigo-100 shadow-lg shadow-indigo-900/50 transition hover:-translate-y-0.5 hover:bg-slate-700"
        >
          Actualizar
        </button>
      </header>

      {error && <p className="mt-3 rounded-lg bg-rose-500/20 p-3 text-sm text-rose-200 ring-1 ring-rose-500/40">{error}</p>}

      <section className="mt-4 grid gap-3 sm:grid-cols-3">
        <StatCard label="Libros leídos" value={stats?.totalRead ?? 0} accent="bg-indigo-900/50 text-indigo-200 ring-indigo-700/60" />
        <StatCard label="Páginas estimadas" value={stats?.totalPages ?? 0} accent="bg-emerald-900/40 text-emerald-200 ring-emerald-700/60" />
        <StatCard label="Racha" value={stats?.streakDays ?? 0} accent="bg-amber-900/40 text-amber-200 ring-amber-700/60" suffix="días" />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-inner shadow-black/40">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-white">Lista de lectura</h3>
              <p className="text-xs text-slate-400">Prioridades, notas y estado guardados en base de datos.</p>
            </div>
            {loading && <span className="rounded-full bg-amber-500/20 px-2 py-1 text-xs font-semibold text-amber-200 ring-1 ring-amber-400/50">Cargando…</span>}
          </div>

          <div className="mt-3 space-y-3">
            {list.length === 0 && <p className="text-sm text-slate-300">Aún no has agregado libros.</p>}
            {list.map((item) => (
              <article key={`${item.bookId}-${item.addedAt}`} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 shadow-lg shadow-black/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">{item.title || 'Título no disponible'}</p>
                    <p className="text-xs text-slate-300">{item.authors?.join(', ') || 'Autores no disponibles'}</p>
                    <p className="text-xs text-slate-400">Guardado: {new Date(item.addedAt).toLocaleDateString()}</p>
                    {item.notes && <p className="text-xs text-slate-300">Notas: {item.notes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="rounded-full bg-indigo-600/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow shadow-indigo-900/50">
                      {priorityLabel[item.priority] || 'Media'}
                    </span>
                    {item.status === 'read' && item.rating && (
                      <span className="rounded-full bg-amber-500/20 px-3 py-1 text-[11px] font-semibold text-amber-200 ring-1 ring-amber-400/50">
                        {item.rating}/5 ⭐
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-800 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 shadow-inner shadow-black/40">
          <h3 className="text-lg font-semibold text-white">Patrones de lectura</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-200">
            <p>
              ⭐ Promedio de rating: <strong className="text-white">{stats?.averageRating?.toFixed(2) ?? 'N/A'}</strong>
            </p>
            <p>
              📚 Géneros más leídos: <strong className="text-white">{topGenres.join(' · ') || '—'}</strong>
            </p>
            <p>
              🧑‍💻 Autores frecuentes: <strong className="text-white">{topAuthors.join(' · ') || '—'}</strong>
            </p>
            <p className="text-xs text-slate-400">
              Los cálculos usan la tabla <code>read_books</code> y se filtran en backend según el periodo solicitado.
            </p>
          </div>
          {loading && <p className="mt-2 text-xs text-slate-400">Actualizando datos…</p>}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, accent, suffix }: { label: string; value: number; accent: string; suffix?: string }) {
  return (
    <div className={`rounded-xl border border-slate-800 p-4 ring-1 ${accent}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">{label}</p>
      <p className="text-2xl font-bold text-white">
        {value} {suffix && <span className="text-sm font-semibold text-slate-300">{suffix}</span>}
      </p>
    </div>
  );
}