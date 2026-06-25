import { create } from 'zustand';
import type { BoardColumnResponse, CreateCardRequest, FilterState } from '../types/api';
import { createCard, fetchColumns } from '../api/client';

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
  addCard: (columnId: number, data: CreateCardRequest) => Promise<void>;

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

  addCard: async (columnId, data) => {
    const card = await createCard(columnId, data);
    set((s) => ({
      columns: s.columns.map((col) =>
        col.id === columnId ? { ...col, cards: [...col.cards, card] } : col
      ),
    }));
  },

  filter: initialFilter,
  setKeyword: (keyword) => set((s) => ({ filter: { ...s.filter, keyword } })),
  setLabelId: (labelId) => set((s) => ({ filter: { ...s.filter, labelId } })),
  setDue: (due) => set((s) => ({ filter: { ...s.filter, due } })),
}));
