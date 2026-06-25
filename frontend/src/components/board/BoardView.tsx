import { useState, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useBoardStore } from '../../store/boardStore';
import { useFilteredBoard } from '../../hooks/useFilteredBoard';
import { Column } from './Column';
import { CardItem } from '../card/CardItem';
import { CardDetailModal } from '../card/CardDetailModal';
import type { CardResponse } from '../../types/api';

export function BoardView() {
  const { isLoading, error, loadBoard, moveCardAsync, columns, setColumns } = useBoardStore();
  const filteredColumns = useFilteredBoard();

  const [activeCard, setActiveCard] = useState<CardResponse | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardResponse | null>(null);

  // ドラッグ確定時にAPIへ送る情報を保持
  const pendingMoveRef = useRef<{ cardId: number; targetColumnId: number; newPosition: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // カードIDからカラムIDを返す
  const getColumnIdByCardId = (cardId: number): number | undefined =>
    columns.find((col) => col.cards.some((c) => c.id === cardId))?.id;

  // over.id がカラムIDかカードIDかを判定
  const isColumnId = (id: number): boolean =>
    columns.some((col) => col.id === id);

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = Number(event.active.id);
    const col = columns.find((c) => c.cards.some((card) => card.id === activeId));
    const card = col?.cards.find((c) => c.id === activeId);
    if (card) setActiveCard(card);
    pendingMoveRef.current = null;
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = Number(active.id);
    const overId = Number(over.id);
    if (activeId === overId) return;

    const activeColumnId = getColumnIdByCardId(activeId);
    if (activeColumnId === undefined) return;

    // over がカラムか、カードかを判定してターゲットカラムIDを決める
    const overColumnId = isColumnId(overId)
      ? overId
      : getColumnIdByCardId(overId);
    if (overColumnId === undefined) return;

    setColumns((cols) => {
      const activeCol = cols.find((c) => c.id === activeColumnId)!;
      const overCol = cols.find((c) => c.id === overColumnId)!;

      const activeSorted = [...activeCol.cards].sort((a, b) => a.position - b.position);
      const overSorted = [...overCol.cards].sort((a, b) => a.position - b.position);

      const activeIndex = activeSorted.findIndex((c) => c.id === activeId);

      if (activeColumnId === overColumnId) {
        // ── 同カラム内：over がカードのときだけ並び替え ──
        if (isColumnId(overId)) return cols; // カラム自体の上にいる間は動かさない
        const overIndex = overSorted.findIndex((c) => c.id === overId);
        if (activeIndex === overIndex) return cols;

        const reordered = arrayMove(activeSorted, activeIndex, overIndex)
          .map((c, i) => ({ ...c, position: i + 1 }));

        const newPosition = reordered.findIndex((c) => c.id === activeId) + 1;
        pendingMoveRef.current = { cardId: activeId, targetColumnId: overColumnId, newPosition };

        return cols.map((col) =>
          col.id === activeColumnId ? { ...col, cards: reordered } : col
        );
      } else {
        // ── カラムをまたぐ ──
        const movedCard = { ...activeSorted[activeIndex], columnId: overColumnId };

        // 挿入先インデックスを決める
        const overIndex = isColumnId(overId)
          ? overSorted.length          // カラム自体 → 末尾
          : overSorted.findIndex((c) => c.id === overId); // カード → その位置

        const newOverCards = [
          ...overSorted.slice(0, overIndex),
          movedCard,
          ...overSorted.slice(overIndex),
        ].map((c, i) => ({ ...c, position: i + 1 }));

        const newPosition = newOverCards.findIndex((c) => c.id === activeId) + 1;
        pendingMoveRef.current = { cardId: activeId, targetColumnId: overColumnId, newPosition };

        return cols.map((col) => {
          if (col.id === activeColumnId) {
            const remaining = activeSorted
              .filter((c) => c.id !== activeId)
              .map((c, i) => ({ ...c, position: i + 1 }));
            return { ...col, cards: remaining };
          }
          if (col.id === overColumnId) {
            return { ...col, cards: newOverCards };
          }
          return col;
        });
      }
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over } = event;
    setActiveCard(null);

    if (!over || !pendingMoveRef.current) {
      pendingMoveRef.current = null;
      return;
    }

    const { cardId, targetColumnId, newPosition } = pendingMoveRef.current;
    pendingMoveRef.current = null;

    moveCardAsync(cardId, { targetColumnId, newPosition });
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
      collisionDetection={closestCorners}
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
