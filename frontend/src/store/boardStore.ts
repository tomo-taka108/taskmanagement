import { create } from 'zustand';
import type { BoardColumnResponse, FilterState } from '../types/api';
import { fetchColumns } from '../api/client';

const initialFilter: FilterState = {
  keyword: '',
  labelId: '',
  due: '',
};

interface BoardStore {
  columns: BoardColumnResponse[];
  isLoading: boolean;
  error: string | null;
  loadBoard: () => Promise<void>;

  filter: FilterState;
  setKeyword: (keyword: string) => void;
  setLabelId: (labelId: string) => void;
  setDue: (due: FilterState['due']) => void;
}

export const useBoardStore = create<BoardStore>((set) => ({
  columns: [],
  isLoading: false,
  error: null,

  loadBoard: async () => {
    set({ isLoading: true, error: null });
    try {
      const columns = await fetchColumns();
      const sorted = [...columns].sort((a, b) => a.position - b.position);
      set({ columns: sorted, isLoading: false });
    } catch {
      set({ error: 'データの取得に失敗しました', isLoading: false });
    }
  },

  filter: initialFilter,
  setKeyword: (keyword) => set((s) => ({ filter: { ...s.filter, keyword } })),
  setLabelId: (labelId) => set((s) => ({ filter: { ...s.filter, labelId } })),
  setDue: (due) => set((s) => ({ filter: { ...s.filter, due } })),
}));
