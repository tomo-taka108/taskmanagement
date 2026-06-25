import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { useBoardStore } from '../../store/boardStore';
import { useFilteredBoard } from '../../hooks/useFilteredBoard';
import { Column } from './Column';
import { CardItem } from '../card/CardItem';
import { CardDetailModal } from '../card/CardDetailModal';
import type { CardResponse } from '../../types/api';

export function BoardView() {
  const { isLoading, error, loadBoard, moveCardOptimistic, moveCardAsync, columns } = useBoardStore();
  const filteredColumns = useFilteredBoard();

  const [activeCard, setActiveCard] = useState<CardResponse | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardResponse | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const findCard = (cardId: number): CardResponse | undefined => {
    for (const col of columns) {
      const card = col.cards.find((c) => c.id === cardId);
      if (card) return card;
    }
  };

  const findColumnByCardId = (cardId: number): number | undefined => {
    for (const col of columns) {
      if (col.cards.find((c) => c.id === cardId)) return col.id;
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const card = findCard(Number(event.active.id));
    if (card) setActiveCard(card);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = Number(active.id);
    const overId = over.id;

    const fromColumnId = findColumnByCardId(activeId);
    if (!fromColumnId) return;

    // ドロップ先がカラム自体の場合
    const overColumn = columns.find((c) => c.id === Number(overId));
    if (overColumn && overColumn.id !== fromColumnId) {
      const newPosition = overColumn.cards.length + 1;
      moveCardOptimistic(activeId, fromColumnId, overColumn.id, newPosition);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeId = Number(active.id);
    const overId = Number(over.id);

    const fromColumnId = findColumnByCardId(activeId);
    if (!fromColumnId) return;

    // ドロップ先がカードの場合
    const toColumnId = findColumnByCardId(overId) ?? fromColumnId;
    const toColumn = columns.find((c) => c.id === toColumnId);
    if (!toColumn) return;

    const sortedCards = [...toColumn.cards].sort((a, b) => a.position - b.position);
    const overIndex = sortedCards.findIndex((c) => c.id === overId);
    const newPosition = overIndex >= 0 ? overIndex + 1 : sortedCards.length + 1;

    // ドロップ先がカラムの場合
    const isOverColumn = columns.some((c) => c.id === overId);
    const finalColumnId = isOverColumn ? overId : toColumnId;
    const finalColumn = columns.find((c) => c.id === finalColumnId);
    const finalPosition = isOverColumn
      ? (finalColumn?.cards.length ?? 0) + 1
      : newPosition;

    moveCardOptimistic(activeId, fromColumnId, finalColumnId, finalPosition);
    moveCardAsync(activeId, { targetColumnId: finalColumnId, newPosition: finalPosition });
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div
          className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--color-bg-header)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p style={{ color: 'var(--color-overdue)' }}>{error}</p>
        <button
          className="px-4 py-2 rounded-md text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--color-bg-header)' }}
          onClick={loadBoard}
        >
          再読み込み
        </button>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-1 gap-4 p-4 overflow-x-auto">
        {filteredColumns.map((column) => (
          <Column
            key={column.id}
            column={column}
            onCardClick={(card) => setSelectedCard(card)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeCard && <CardItem card={activeCard} isDragging />}
      </DragOverlay>

      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onUpdated={(updated) => setSelectedCard(updated)}
        />
      )}
    </DndContext>
  );
}
