import { create } from 'zustand';
import type { BoardColumnResponse, CardResponse, CreateCardRequest, FilterState, MoveCardRequest, UpdateCardRequest } from '../types/api';
import { createCard, deleteCard, fetchColumns, moveCard, updateCard } from '../api/client';

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
  setColumns: (updater: (cols: BoardColumnResponse[]) => BoardColumnResponse[]) => void;
  moveCardAsync: (cardId: number, data: MoveCardRequest) => Promise<void>;
  updateCardAsync: (cardId: number, data: UpdateCardRequest) => Promise<CardResponse>;
  deleteCardAsync: (cardId: number, columnId: number) => Promise<void>;

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

  setColumns: (updater) => set((s) => ({ columns: updater(s.columns) })),

  moveCardAsync: async (cardId, data) => {
    // 楽観的更新は handleDragOver で完了済み。APIのみ呼ぶ。
    // 失敗時はリロードで復元する。
    try {
      await moveCard(cardId, data);
    } catch {
      // API失敗時はサーバーの正しい状態に戻す
      const columns = await fetchColumns();
      set({ columns: [...columns].sort((a, b) => a.position - b.position) });
    }
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

  deleteCardAsync: async (cardId, columnId) => {
    await deleteCard(cardId);
    set((s) => ({
      columns: s.columns.map((col) =>
        col.id === columnId
          ? { ...col, cards: col.cards.filter((c) => c.id !== cardId) }
          : col
      ),
    }));
  },

  filter: initialFilter,
  setKeyword: (keyword) => set((s) => ({ filter: { ...s.filter, keyword } })),
  setLabelId: (labelId) => set((s) => ({ filter: { ...s.filter, labelId } })),
  setDue: (due) => set((s) => ({ filter: { ...s.filter, due } })),
}));
