import { useMemo } from 'react';
import { useBoardStore } from '../store/boardStore';
import type { CardResponse } from '../types/api';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function weekEndStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}

export function useFilteredBoard() {
  const { columns, filter } = useBoardStore();

  return useMemo(() => {
    const { keyword, labelId, due } = filter;
    const today = todayStr();
    const weekEnd = weekEndStr();

    const matchesCard = (card: CardResponse): boolean => {
      if (keyword) {
        const kw = keyword.toLowerCase();
        const inTitle = card.title.toLowerCase().includes(kw);
        const inDesc = (card.description ?? '').toLowerCase().includes(kw);
        if (!inTitle && !inDesc) return false;
      }

      if (labelId) {
        const hasLabel = card.labels.some((l) => String(l.id) === labelId);
        if (!hasLabel) return false;
      }

      if (due === 'overdue') {
        if (!card.dueDate || card.dueDate >= today) return false;
      }
      if (due === 'this-week') {
        if (!card.dueDate || card.dueDate < today || card.dueDate > weekEnd) return false;
      }

      return true;
    };

    return columns.map((col) => ({
      ...col,
      cards: col.cards.filter(matchesCard),
    }));
  }, [columns, filter]);
}
