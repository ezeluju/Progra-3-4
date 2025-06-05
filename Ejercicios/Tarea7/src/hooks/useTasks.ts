import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

export type Task = { id: string; texto: string; completada: boolean };

const PAGE_SIZE = 8;
const BASE = '/api/tareas';

async function fetchTasks(page = 1) {
  const r = await fetch(`${BASE}?page=${page}&limit=${PAGE_SIZE}`);
  if (!r.ok) throw new Error('Error al cargar tareas');
  return r.json() as Promise<{ tareas: Task[]; total: number }>;
}

export function useTasks(page: number) {
  return useQuery({
    queryKey: ['tareas', page],
    queryFn: () => fetchTasks(page),
    placeholderData: keepPreviousData,
  });
}

/* ---------- mutaciones ---------- */
const invalidateAll = (qc: ReturnType<typeof useQueryClient>) =>
  qc.invalidateQueries({ queryKey: ['tareas'] });

export const useAddTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (texto: string) => {
      const r = await fetch(BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto }),
      });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      invalidateAll(qc);
      toast.success('Tarea agregada');
    },
    onError: () => toast.error('No se pudo agregar'),
  });
};

export const useToggleTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      fetch(`${BASE}/${id}`, { method: 'PUT' }),
    onSuccess: () => invalidateAll(qc),
    onError: () => toast.error('Error al cambiar estado'),
  });
};

export const useUpdateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, texto }: { id: string; texto: string }) =>
      fetch(`${BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto }),
      }),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success('Tarea actualizada');
    },
    onError: () => toast.error('No se pudo actualizar'),
  });
};

export const useDeleteTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      fetch(`${BASE}/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success('Tarea eliminada');
    },
    onError: () => toast.error('Error al eliminar'),
  });
};

export const useClearCompleted = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () =>
      fetch(`${BASE}?completadas=true`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success('Completadas borradas');
    },
    onError: () => toast.error('No se pudo limpiar'),
  });
};
