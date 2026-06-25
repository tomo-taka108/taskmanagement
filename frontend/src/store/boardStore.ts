import { create } from 'zustand';
import type { BoardColumnResponse, CardResponse, CreateCardRequest, FilterState, MoveCardRequest, UpdateCardRequest } from '../types/api';
import { createCard, fetchColumns, moveCard, updateCard } from '../api/client';

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
  moveCardOptimistic: (cardId: number, fromColumnId: number, toColumnId: number, newPosition: number) => void;
  moveCardAsync: (cardId: number, data: MoveCardRequest) => Promise<void>;
  updateCardAsync: (cardId: number, data: UpdateCardRequest) => Promise<CardResponse>;

  filter: FilterState;
  setKeyword: (keyword: string) => void;
  setLabelId: (labelId: string) => void;
  setDue: (due: FilterState['due']) => void;
}

export const useBoardStore = create<BoardStore>((set, get) => ({
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

  moveCardOptimistic: (cardId, fromColumnId, toColumnId, newPosition) => {
    set((s) => {
      const fromCol = s.columns.find((c) => c.id === fromColumnId);
      if (!fromCol) return s;
      const card = fromCol.cards.find((c) => c.id === cardId);
      if (!card) return s;

      const updatedCard = { ...card, columnId: toColumnId, position: newPosition };

      const columns = s.columns.map((col) => {
        if (col.id === fromColumnId && col.id === toColumnId) {
          // 同じカラム内の並び替え
          const others = col.cards.filter((c) => c.id !== cardId);
          const reordered = [
            ...others.slice(0, newPosition - 1),
            updatedCard,
            ...others.slice(newPosition - 1),
          ].map((c, i) => ({ ...c, position: i + 1 }));
          return { ...col, cards: reordered };
        }
        if (col.id === fromColumnId) {
          return { ...col, cards: col.cards.filter((c) => c.id !== cardId) };
        }
        if (col.id === toColumnId) {
          const others = col.cards;
          const reordered = [
            ...others.slice(0, newPosition - 1),
            updatedCard,
            ...others.slice(newPosition - 1),
          ].map((c, i) => ({ ...c, position: i + 1 }));
          return { ...col, cards: reordered };
        }
        return col;
      });

      return { columns };
    });
  },

  moveCardAsync: async (cardId, data) => {
    await moveCard(cardId, data);
    await get().loadBoard();
  },

  updateCardAsync: async (cardId, data) => {
    const updated = await updateCard(cardId, data);
    set((s) => ({
      columns: s.columns.map((col) =>
        col.id === updated.columnId
          ? { ...col, cards: col.cards.map((c) => (c.id === cardId ? updated : c)) }
          : col
      ),
    }));
    return updated;
  },

  filter: initialFilter,
  setKeyword: (keyword) => set((s) => ({ filter: { ...s.filter, keyword } })),
  setLabelId: (labelId) => set((s) => ({ filter: { ...s.filter, labelId } })),
  setDue: (due) => set((s) => ({ filter: { ...s.filter, due } })),
}));
