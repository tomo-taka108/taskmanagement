import { useState, useRef, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type CollisionDetection,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useBoardStore } from '../../store/boardStore';
import { Column } from './Column';
import { CardItem } from '../card/CardItem';
import { CardDetailModal } from '../card/CardDetailModal';
import type { BoardColumnResponse, CardResponse } from '../../types/api';

// ── カスタム衝突検出 ──────────────────────────────────────────────
// ポインター直下を優先、なければ矩形交差にフォールバック
const customCollision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length > 0 ? hits : rectIntersection(args);
};

// ── ヘルパー ──────────────────────────────────────────────────────

function byPosition(cards: CardResponse[]) {
  return [...cards].sort((a, b) => a.position - b.position);
}

function findColByCardId(cols: BoardColumnResponse[], cardId: number) {
  return cols.find((c) => c.cards.some((card) => card.id === cardId));
}

function isColId(cols: BoardColumnResponse[], id: number) {
  return cols.some((c) => c.id === id);
}

// ── コンポーネント ────────────────────────────────────────────────

export function BoardView() {
  const { isLoading, error, loadBoard, moveCardAsync, columns, setColumns } = useBoardStore();

  const [activeCard, setActiveCard]     = useState<CardResponse | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardResponse | null>(null);

  // ドラッグ開始時の元配列（毎回ここから計算し直す）
  const originCols  = useRef<BoardColumnResponse[]>([]);
  // DragEnd 時に API へ送るパラメータ（最後に確定した移動先）
  const pendingMove = useRef<{ cardId: number; targetColumnId: number; newPosition: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const activeId = Number(event.active.id);
    // ドラッグ開始時点の状態を保存（以後この配列は変更しない）
    originCols.current = columns.map((col) => ({
      ...col,
      cards: [...col.cards],
    }));
    pendingMove.current = null;

    const card = findColByCardId(originCols.current, activeId)
      ?.cards.find((c) => c.id === activeId);
    if (card) setActiveCard(card);
  }, [columns]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = Number(active.id);
    const overId   = Number(over.id);
    if (activeId === overId) return;

    // 常に元配列から計算し直す（累積ずれを防ぐ）
    const cols = originCols.current;

    const activeColId = findColByCardId(cols, activeId)?.id;
    if (activeColId === undefined) return;

    let overColumnId: number;
    let newCols: BoardColumnResponse[];

    if (isColId(cols, overId)) {
      // ── カラムの余白エリア → 末尾に追加 ──
      overColumnId = overId;
      const activeCol    = cols.find((c) => c.id === activeColId)!;
      const overCol      = cols.find((c) => c.id === overColumnId)!;
      const activeSorted = byPosition(activeCol.cards);
      const activeIdx    = activeSorted.findIndex((c) => c.id === activeId);
      const movedCard    = { ...activeSorted[activeIdx], columnId: overColumnId };

      if (activeColId === overColumnId) {
        // 同カラムの余白 = 末尾へ
        const reordered = [
          ...activeSorted.filter((c) => c.id !== activeId),
          movedCard,
        ].map((c, i) => ({ ...c, position: i + 1 }));
        newCols = cols.map((col) =>
          col.id === activeColId ? { ...col, cards: reordered } : col
        );
      } else {
        // 別カラムの余白 = 末尾へ
        const newActiveCards = activeSorted
          .filter((c) => c.id !== activeId)
          .map((c, i) => ({ ...c, position: i + 1 }));
        const overSorted   = byPosition(overCol.cards);
        const newOverCards = [...overSorted, movedCard]
          .map((c, i) => ({ ...c, position: i + 1 }));
        newCols = cols.map((col) => {
          if (col.id === activeColId)  return { ...col, cards: newActiveCards };
          if (col.id === overColumnId) return { ...col, cards: newOverCards };
          return col;
        });
      }
    } else {
      // ── 別のカードの上にいる ──
      const overCol = findColByCardId(cols, overId);
      if (!overCol) return;
      overColumnId = overCol.id;

      const activeCol    = cols.find((c) => c.id === activeColId)!;
      const activeSorted = byPosition(activeCol.cards);
      const activeIdx    = activeSorted.findIndex((c) => c.id === activeId);
      const movedCard    = { ...activeSorted[activeIdx], columnId: overColumnId };

      // ポインターがカードの上半分か下半分かを判定
      const translated = active.rect.current.translated;
      const pointerY   = translated ? translated.top + translated.height / 2 : 0;
      const cardMidY   = over.rect.top + over.rect.height / 2;
      const isBelow    = pointerY > cardMidY;

      if (activeColId === overColumnId) {
        // ── 同カラム内の並び替え ──
        const overIdx = activeSorted.findIndex((c) => c.id === overId);
        if (overIdx === -1) return;

        // arrayMove の to インデックス：
        //   上半分 → overIdx のひとつ前へ
        //   下半分 → overIdx のひとつ後へ
        // ただし activeIdx と overIdx の前後関係で補正不要（arrayMove が処理する）
        const toIdx = isBelow
          ? (activeIdx <= overIdx ? overIdx : overIdx + 1)
          : (activeIdx >= overIdx ? overIdx : overIdx - 1);
        const clampedToIdx = Math.max(0, Math.min(toIdx, activeSorted.length - 1));

        const reordered = arrayMove(activeSorted, activeIdx, clampedToIdx)
          .map((c, i) => ({ ...c, position: i + 1 }));
        newCols = cols.map((col) =>
          col.id === activeColId ? { ...col, cards: reordered } : col
        );
      } else {
        // ── 別カラムへの移動 ──
        const overSorted = byPosition(overCol.cards);
        const overIdx    = overSorted.findIndex((c) => c.id === overId);
        if (overIdx === -1) return;

        const insertIdx  = isBelow ? overIdx + 1 : overIdx;

        const newActiveCards = activeSorted
          .filter((c) => c.id !== activeId)
          .map((c, i) => ({ ...c, position: i + 1 }));
        const newOverCards = [
          ...overSorted.slice(0, insertIdx),
          movedCard,
          ...overSorted.slice(insertIdx),
        ].map((c, i) => ({ ...c, position: i + 1 }));

        newCols = cols.map((col) => {
          if (col.id === activeColId)  return { ...col, cards: newActiveCards };
          if (col.id === overColumnId) return { ...col, cards: newOverCards };
          return col;
        });
      }
    }

    // 確定した移動先を記録
    const targetCol   = newCols.find((c) => c.id === overColumnId)!;
    const newPosition = byPosition(targetCol.cards).findIndex((c) => c.id === activeId) + 1;
    pendingMove.current = { cardId: activeId, targetColumnId: overColumnId, newPosition };

    setColumns(() => newCols);
  }, [setColumns]);

  const handleDragEnd = useCallback((_event: DragEndEvent) => {
    setActiveCard(null);
    originCols.current = [];

    if (!pendingMove.current) {
      loadBoard();
      return;
    }

    const { cardId, targetColumnId, newPosition } = pendingMove.current;
    pendingMove.current = null;
    moveCardAsync(cardId, { targetColumnId, newPosition });
  }, [loadBoard, moveCardAsync]);

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
      collisionDetection={customCollision}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-1 gap-4 p-4 overflow-x-auto">
        {columns.map((column) => (
          <Column
            key={column.id}
            column={column}
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
