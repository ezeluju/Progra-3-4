import { create } from 'zustand';

type Filtro = 'todas' | 'activas' | 'completadas';

interface UIState {
  filtro: Filtro;
  setFiltro: (f: Filtro) => void;
  /* edición */
  editId: string | null;
  editTexto: string;
  startEdit: (id: string, texto: string) => void;
  cancelEdit: () => void;
  setEditTexto: (t: string) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  filtro: 'todas',
  setFiltro: (f) => set({ filtro: f }),
  editId: null,
  editTexto: '',
  startEdit: (id, texto) => set({ editId: id, editTexto: texto }),
  cancelEdit: () => set({ editId: null, editTexto: '' }),
  setEditTexto: (t) => set({ editTexto: t }),
}));
