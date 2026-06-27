import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { BoardColumnResponse, CardResponse } from '../../types/api';
import { CardList } from './CardList';
import { AddCardForm } from '../card/AddCardForm';

interface Props {
  column: BoardColumnResponse;
  onCardClick: (card: CardResponse) => void;
}

export function Column({ column, onCardClick }: Props) {
  const [isAdding, setIsAdding] = useState(false);

  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  const sortedCards = [...column.cards].sort((a, b) => a.position - b.position);
  const allCardIds  = sortedCards.map((c) => c.id);

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

      <SortableContext items={allCardIds} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex flex-col gap-2" style={{ minHeight: '60px' }}>
          <CardList cards={sortedCards} onCardClick={onCardClick} />
        </div>
      </SortableContext>

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
