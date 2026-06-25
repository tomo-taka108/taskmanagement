import { useState, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
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

  // ドラッグ開始時点のカラム状態を保存（キャンセル時の復元用）
  const snapshotRef = useRef<typeof columns | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const findColumnByCardId = (cardId: number) =>
    columns.find((col) => col.cards.some((c) => c.id === cardId));

  const handleDragStart = (event: DragStartEvent) => {
    const id = Number(event.active.id);
    const col = findColumnByCardId(id);
    const card = col?.cards.find((c) => c.id === id);
    if (card) setActiveCard(card);
    snapshotRef.current = columns;
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = Number(active.id);
    const overId = Number(over.id);
    if (activeId === overId) return;

    const activeCol = findColumnByCardId(activeId);
    if (!activeCol) return;

    // over がカラム自体か、別カラムのカードかを判定
    const overCol =
      columns.find((c) => c.id === overId) ??       // over がカラム
      findColumnByCardId(overId);                    // over がカード

    if (!overCol || activeCol.id === overCol.id) return;

    // カラムをまたぐ場合だけここで楽観的更新
    setColumns((cols) => {
      const activeCard = activeCol.cards.find((c) => c.id === activeId)!;
      const overSorted = [...overCol.cards].sort((a, b) => a.position - b.position);

      // over がカードの場合はその位置に、カラムの場合は末尾に
      const overIsCard = overCol.cards.some((c) => c.id === overId);
      const insertIndex = overIsCard
        ? overSorted.findIndex((c) => c.id === overId)
        : overSorted.length;

      const newActive = { ...activeCard, columnId: overCol.id };
      const newOverCards = [...overSorted.slice(0, insertIndex), newActive, ...overSorted.slice(insertIndex)]
        .map((c, i) => ({ ...c, position: i + 1 }));

      return cols.map((col) => {
        if (col.id === activeCol.id) {
          return { ...col, cards: col.cards.filter((c) => c.id !== activeId).map((c, i) => ({ ...c, position: i + 1 })) };
        }
        if (col.id === overCol.id) {
          return { ...col, cards: newOverCards };
        }
        return col;
      });
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) {
      // ドロップ先なし → スナップショットに戻す
      if (snapshotRef.current) setColumns(() => snapshotRef.current!);
      snapshotRef.current = null;
      return;
    }

    const activeId = Number(active.id);
    const overId = Number(over.id);
    snapshotRef.current = null;

    // ドロップ先のカラムを特定
    const targetCol =
      columns.find((c) => c.id === overId) ??
      findColumnByCardId(overId);
    if (!targetCol) return;

    const sorted = [...targetCol.cards].sort((a, b) => a.position - b.position);
    const oldIndex = sorted.findIndex((c) => c.id === activeId);
    const newIndex = sorted.findIndex((c) => c.id === overId);

    let finalPosition: number;

    if (oldIndex === -1) {
      // 別カラムから来た場合：over がカードならその位置、カラムなら末尾
      const overIsCard = targetCol.cards.some((c) => c.id === overId);
      finalPosition = overIsCard ? (newIndex + 1) : (sorted.length + 1);
    } else if (oldIndex === newIndex || overId === activeId) {
      // 動かしていない
      return;
    } else {
      // 同カラム内並び替え：arrayMove で正しい位置を算出
      const reordered = arrayMove(sorted, oldIndex, newIndex);
      finalPosition = reordered.findIndex((c) => c.id === activeId) + 1;

      // 楽観的更新（同カラム内）
      setColumns((cols) =>
        cols.map((col) =>
          col.id === targetCol.id
            ? { ...col, cards: reordered.map((c, i) => ({ ...c, position: i + 1 })) }
            : col
        )
      );
    }

    moveCardAsync(activeId, { targetColumnId: targetCol.id, newPosition: finalPosition });
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
      collisionDetection={closestCenter}
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
