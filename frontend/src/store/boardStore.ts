import { create } from 'zustand';
import type { BoardColumnResponse, CardResponse, CreateCardRequest, CreateColumnRequest, FilterState, MoveCardRequest, ReorderColumnsRequest, UpdateCardRequest, UpdateColumnRequest } from '../types/api';
import { createCard, createColumn, deleteCard, deleteColumn, fetchColumns, moveCard, reorderColumns, updateCard, updateColumn } from '../api/client';

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

  addColumnAsync: (data: CreateColumnRequest) => Promise<void>;
  updateColumnAsync: (id: number, data: UpdateColumnRequest) => Promise<void>;
  deleteColumnAsync: (id: number) => Promise<void>;
  reorderColumnsAsync: (data: ReorderColumnsRequest) => Promise<void>;

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

  setColumns: (updater) => set((s) => ({ columns: updater(s.columns) })),

  moveCardAsync: async (cardId, data) => {
    try {
      await moveCard(cardId, data);
    } catch {
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

  addColumnAsync: async (data) => {
    const newColumn = await createColumn(data);
    set((s) => ({
      columns: [...s.columns, newColumn].sort((a, b) => a.position - b.position),
    }));
  },

  updateColumnAsync: async (id, data) => {
    const updated = await updateColumn(id, data);
    set((s) => ({
      columns: s.columns.map((col) => (col.id === id ? { ...col, title: updated.title } : col)),
    }));
  },

  deleteColumnAsync: async (id) => {
    await deleteColumn(id);
    set((s) => ({
      columns: s.columns.filter((col) => col.id !== id),
    }));
  },

  reorderColumnsAsync: async (data) => {
    const prevColumns = get().columns;
    // 楽観的更新: columnIds の順番で並び替え
    const reordered = data.columnIds
      .map((id, idx) => {
        const col = prevColumns.find((c) => c.id === id);
        return col ? { ...col, position: idx + 1 } : null;
      })
      .filter((c): c is BoardColumnResponse => c !== null);
    set({ columns: reordered });

    try {
      await reorderColumns(data);
    } catch {
      // 失敗時はサーバーの正しい状態に戻す
      const columns = await fetchColumns();
      set({ columns: [...columns].sort((a, b) => a.position - b.position) });
    }
  },

  filter: initialFilter,
  setKeyword: (keyword) => set((s) => ({ filter: { ...s.filter, keyword } })),
  setLabelId: (labelId) => set((s) => ({ filter: { ...s.filter, labelId } })),
  setDue: (due) => set((s) => ({ filter: { ...s.filter, due } })),
}));
