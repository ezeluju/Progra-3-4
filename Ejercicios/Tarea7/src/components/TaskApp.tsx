import React, { useState } from 'react';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import {
  useTasks,
  useAddTask,
  useToggleTask,
  useDeleteTask,
  useUpdateTask,
  useClearCompleted,
} from '../hooks/useTasks';
import { useUIStore } from '../store/useUIStore';

const qc = new QueryClient();

export default function TaskApp() {
  return (
    <QueryClientProvider client={qc}>
      <Toaster position="top-right" />
      <InnerApp />
    </QueryClientProvider>
  );
}

function InnerApp() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, isFetching } = useTasks(page);

  const add = useAddTask();
  const toggle = useToggleTask();
  const del = useDeleteTask();
  const upd = useUpdateTask();
  const clear = useClearCompleted();

  const {
    filtro,
    setFiltro,
    editId,
    editTexto,
    startEdit,
    cancelEdit,
    setEditTexto,
  } = useUIStore();

  const [texto, setTexto] = useState('');

  if (isError) return <p className="text-center mt-10">😢 Error al cargar</p>;

  const tareasFiltradas =
    data?.tareas.filter((t) =>
      filtro === 'activas'
        ? !t.completada
        : filtro === 'completadas'
        ? t.completada
        : true,
    ) ?? [];

  const totalPages = data ? Math.ceil(data.total / 8) : 1;

  return (
    <section className="max-w-xl mx-auto my-12 p-8 bg-white rounded-lg shadow-xl">
      <h1 className="text-4xl font-bold text-center text-blue-700 mb-8">
        📝 Lista de Tareas
      </h1>

      {/* form alta / edición */}
      <div className="flex gap-2 mb-4">
        <input
          className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Escribe una tarea…"
          value={editId ? editTexto : texto}
          onChange={(e) =>
            editId ? setEditTexto(e.target.value) : setTexto(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            editId
              ? handleSave(upd, editId, editTexto, cancelEdit)
              : handleAdd(add, texto, setTexto);
          }}
        />
        {editId ? (
          <>
            <button
              onClick={() => handleSave(upd, editId, editTexto, cancelEdit)}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Guardar
            </button>
            <button
              onClick={cancelEdit}
              className="bg-gray-300 px-4 py-2 rounded"
            >
              Cancelar
            </button>
          </>
        ) : (
          <button
            onClick={() => handleAdd(add, texto, setTexto)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Agregar
          </button>
        )}
      </div>

      {/* filtros + limpiar */}
      <div className="flex justify-between items-center mb-6">
        <div className="space-x-2">
          {(['todas', 'activas', 'completadas'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1 rounded-full ${
                filtro === f
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={() => clear.mutate()} className="text-red-500">
          Limpiar Completadas
        </button>
      </div>

      {/* lista */}
      {isLoading ? (
        <p className="text-center">Cargando…</p>
      ) : (
        <ul className="space-y-3">
          {tareasFiltradas.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg shadow-sm"
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={t.completada}
                  onChange={() => toggle.mutate(t.id)}
                  className="mr-3 w-5 h-5 text-blue-500"
                />
                <span className={t.completada ? 'line-through text-gray-400' : ''}>
                  {t.texto}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => startEdit(t.id, t.texto)}
                  className="text-blue-500"
                >
                  ✎
                </button>
                <button
                  onClick={() => del.mutate(t.id)}
                  className="text-red-500"
                >
                  ✖
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* paginación */}
      <div className="flex justify-center gap-4 mt-6">
        <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          ⬅ Anterior
        </button>
        <span>
          {page} / {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Siguiente ➡
        </button>
        {isFetching && <span className="ml-3 text-gray-400">Actualizando…</span>}
      </div>
    </section>
  );
}

/* helpers */
const handleAdd = (
  add: ReturnType<typeof useAddTask>,
  texto: string,
  reset: (v: string) => void,
) => {
  if (!texto.trim()) return;
  add.mutate(texto);
  reset('');
};

const handleSave = (
  upd: ReturnType<typeof useUpdateTask>,
  id: string,
  texto: string,
  cancel: () => void,
) => {
  if (!texto.trim()) return;
  upd.mutate({ id, texto });
  cancel();
};
