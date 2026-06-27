import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useBoardStore } from '../../store/boardStore';
import { Column } from './Column';
import { CardItem } from '../card/CardItem';
import { CardDetailModal } from '../card/CardDetailModal';
import type { CardResponse } from '../../types/api';

export function BoardView() {
  const { isLoading, error, loadBoard, moveCardAsync, columns, setColumns } = useBoardStore();

  const [activeCard, setActiveCard]     = useState<CardResponse | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardResponse | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const activeId = Number(event.active.id);
    for (const col of columns) {
      const card = col.cards.find((c) => c.id === activeId);
      if (card) { setActiveCard(card); break; }
    }
  }, [columns]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeId  = Number(active.id);
    const overId    = String(over.id);   // "before:N" | "after:N" | "col:N"

    // ── ドロップ先を解析 ──────────────────────────────────────────
    let targetColId: number;
    let insertBeforeCardId: number | null = null; // null = 末尾

    if (overId.startsWith('before:')) {
      const refCardId = Number(overId.slice(7));
      const col = columns.find((c) => c.cards.some((card) => card.id === refCardId));
      if (!col) return;
      targetColId        = col.id;
      insertBeforeCardId = refCardId;
    } else if (overId.startsWith('after:')) {
      const refCardId = Number(overId.slice(6));
      const col = columns.find((c) => c.cards.some((card) => card.id === refCardId));
      if (!col) return;
      targetColId = col.id;
      // "after:N" → N の次のカードの前に挿入（= N の後ろ）
      const sorted = [...col.cards].sort((a, b) => a.position - b.position);
      const idx    = sorted.findIndex((c) => c.id === refCardId);
      insertBeforeCardId = idx >= 0 && idx < sorted.length - 1
        ? sorted[idx + 1].id
        : null; // 末尾
    } else if (overId.startsWith('col:')) {
      targetColId        = Number(overId.slice(4));
      insertBeforeCardId = null; // 末尾
    } else {
      return;
    }

    // ── 元の位置と同じなら何もしない ────────────────────────────
    const sourceCol = columns.find((c) => c.cards.some((card) => card.id === activeId));
    if (!sourceCol) return;
    const sourceSorted = [...sourceCol.cards].sort((a, b) => a.position - b.position);
    const activeIdx    = sourceSorted.findIndex((c) => c.id === activeId);

    if (targetColId === sourceCol.id) {
      // 同カラム内：自分の真上・真下への移動は無操作
      if (insertBeforeCardId === activeId) return;
      // 「自分の次のカードの前」= 実質移動なし
      const nextCard = activeIdx < sourceSorted.length - 1
        ? sourceSorted[activeIdx + 1]
        : null;
      if (insertBeforeCardId === null && activeIdx === sourceSorted.length - 1) return;
      if (nextCard && insertBeforeCardId === nextCard.id) return;
    }

    // ── 楽観的更新 ───────────────────────────────────────────────
    setColumns((cols) => {
      const srcCol  = cols.find((c) => c.id === sourceCol.id)!;
      const dstCol  = cols.find((c) => c.id === targetColId)!;
      const card    = srcCol.cards.find((c) => c.id === activeId)!;
      const movedCard = { ...card, columnId: targetColId };

      // ソース側からカードを抜く
      const srcCards = [...srcCol.cards]
        .filter((c) => c.id !== activeId)
        .sort((a, b) => a.position - b.position)
        .map((c, i) => ({ ...c, position: i + 1 }));

      // デスト側に挿入
      const dstBase = targetColId === sourceCol.id
        ? srcCards  // 同カラムなら抜いた後の配列を使う
        : [...dstCol.cards].sort((a, b) => a.position - b.position);

      const insertIdx = insertBeforeCardId === null
        ? dstBase.length
        : dstBase.findIndex((c) => c.id === insertBeforeCardId);
      const safeIdx   = insertIdx === -1 ? dstBase.length : insertIdx;

      const dstCards = [
        ...dstBase.slice(0, safeIdx),
        movedCard,
        ...dstBase.slice(safeIdx),
      ].map((c, i) => ({ ...c, position: i + 1 }));

      const newPosition = dstCards.findIndex((c) => c.id === activeId) + 1;

      // API 呼び出しは楽観的更新の後に非同期で実行
      moveCardAsync(activeId, { targetColumnId: targetColId, newPosition });

      return cols.map((col) => {
        if (col.id === sourceCol.id && col.id === targetColId) {
          return { ...col, cards: dstCards };
        }
        if (col.id === sourceCol.id)  return { ...col, cards: srcCards };
        if (col.id === targetColId)   return { ...col, cards: dstCards };
        return col;
      });
    });
  }, [columns, moveCardAsync, setColumns]);

  if (isLoading && columns.length === 0) {
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
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-1 gap-4 p-4 overflow-x-auto">
        {columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            ghostCardId={activeCard?.id ?? null}
            onCardClick={(card) => setSelectedCard(card)}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
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
