import { useState } from 'react';
import type { BoardColumnResponse } from '../../types/api';
import { CardList } from './CardList';
import { AddCardForm } from '../card/AddCardForm';

interface Props {
  column: BoardColumnResponse;
}

export function Column({ column }: Props) {
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div
      className="flex flex-col rounded-lg w-72 shrink-0 p-3 gap-3"
      style={{ backgroundColor: 'var(--color-bg-column)' }}
    >
      <div className="flex items-center justify-between px-1">
        <h2
          className="text-sm font-semibold"
          style={{ color: 'var(--color-text-main)' }}
        >
          {column.title}
        </h2>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: 'var(--color-border)',
            color: 'var(--color-text-sub)',
          }}
        >
          {column.cards.length}
        </span>
      </div>

      <CardList cards={column.cards} />

      {isAdding ? (
        <AddCardForm columnId={column.id} onClose={() => setIsAdding(false)} />
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full py-1.5 text-sm rounded text-left px-2 hover:brightness-95 transition-all"
          style={{
            color: 'var(--color-text-sub)',
            backgroundColor: 'transparent',
          }}
        >
          + カードを追加
        </button>
      )}
    </div>
  );
}
