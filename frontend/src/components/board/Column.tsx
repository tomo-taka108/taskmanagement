import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { BoardColumnResponse, CardResponse } from '../../types/api';
import { useFilteredBoard } from '../../hooks/useFilteredBoard';
import { CardList } from './CardList';
import { AddCardForm } from '../card/AddCardForm';

interface Props {
  column: BoardColumnResponse;
  ghostCardId: number | null;
  onCardClick: (card: CardResponse) => void;
}

export function Column({ column, ghostCardId, onCardClick }: Props) {
  const [isAdding, setIsAdding] = useState(false);

  // カラム余白へのドロップ（末尾追加）
  const { setNodeRef, isOver } = useDroppable({ id: `col:${column.id}` });

  // 表示はフィルター適用済みを使う
  const filteredColumns = useFilteredBoard();
  const filteredColumn  = filteredColumns.find((c) => c.id === column.id);
  const displayCards    = filteredColumn ? filteredColumn.cards : column.cards;
  const displaySorted   = [...displayCards].sort((a, b) => a.position - b.position);

  return (
    <div
      className="flex flex-col rounded-lg w-72 shrink-0 p-3 gap-3 transition-colors"
      style={{
        backgroundColor: isOver ? 'var(--color-border)' : 'var(--color-bg-column)',
      }}
    >
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-main)' }}>
          {column.title}
        </h2>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text-sub)' }}
        >
          {column.cards.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className="flex flex-col gap-2"
        style={{ minHeight: '48px' }}
      >
        <CardList
          cards={displaySorted}
          ghostCardId={ghostCardId}
          onCardClick={onCardClick}
        />
      </div>

      {isAdding ? (
        <AddCardForm columnId={column.id} onClose={() => setIsAdding(false)} />
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full py-1.5 text-sm rounded text-left px-2 hover:brightness-95 transition-all"
          style={{ color: 'var(--color-text-sub)', backgroundColor: 'transparent' }}
        >
          + カードを追加
        </button>
      )}
    </div>
  );
}
