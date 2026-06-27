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
  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) return pointerHits;
  return rectIntersection(args);
};

// ── ヘルパー ──────────────────────────────────────────────────────

function sortedCards(cards: CardResponse[]) {
  return [...cards].sort((a, b) => a.position - b.position);
}

function findColByCardId(cols: BoardColumnResponse[], cardId: number) {
  return cols.find((c) => c.cards.some((card) => card.id === cardId));
}

function isColId(cols: BoardColumnResponse[], id: number) {
  return cols.some((c) => c.id === id);
}

// cols の中で activeId を overColumnId の overIndex 位置に移動した新配列を返す
function applyMove(
  cols: BoardColumnResponse[],
  activeId: number,
  overColumnId: number,
  overIndex: number,
): BoardColumnResponse[] {
  const activeColId = findColByCardId(cols, activeId)!.id;
  const activeCol   = cols.find((c) => c.id === activeColId)!;
  const overCol     = cols.find((c) => c.id === overColumnId)!;

  const activeSorted = sortedCards(activeCol.cards);
  const activeIdx    = activeSorted.findIndex((c) => c.id === activeId);
  const movedCard    = { ...activeSorted[activeIdx], columnId: overColumnId };

  if (activeColId === overColumnId) {
    // 同カラム内：arrayMove で並び替え
    const reordered = arrayMove(activeSorted, activeIdx, overIndex)
      .map((c, i) => ({ ...c, position: i + 1 }));
    return cols.map((col) =>
      col.id === activeColId ? { ...col, cards: reordered } : col
    );
  }

  // 別カラムへ
  const newActiveCards = activeSorted
    .filter((c) => c.id !== activeId)
    .map((c, i) => ({ ...c, position: i + 1 }));

  const overSorted     = sortedCards(overCol.cards);
  const newOverCards   = [
    ...overSorted.slice(0, overIndex),
    movedCard,
    ...overSorted.slice(overIndex),
  ].map((c, i) => ({ ...c, position: i + 1 }));

  return cols.map((col) => {
    if (col.id === activeColId)  return { ...col, cards: newActiveCards };
    if (col.id === overColumnId) return { ...col, cards: newOverCards };
    return col;
  });
}

// ── コンポーネント ────────────────────────────────────────────────

export function BoardView() {
  const { isLoading, error, loadBoard, moveCardAsync, columns, setColumns } = useBoardStore();

  const [activeCard, setActiveCard]     = useState<CardResponse | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardResponse | null>(null);

  // ドラッグ中の作業配列（store とは独立）
  const workingCols = useRef<BoardColumnResponse[]>([]);
  // DragEnd 時に API へ送るパラメータ
  const pendingMove = useRef<{ cardId: number; targetColumnId: number; newPosition: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const activeId = Number(event.active.id);
    // 開始時点の columns をディープコピーして作業用に保持
    workingCols.current = columns.map((col) => ({ ...col, cards: [...col.cards] }));
    pendingMove.current = null;
    const card = findColByCardId(workingCols.current, activeId)
      ?.cards.find((c) => c.id === activeId);
    if (card) setActiveCard(card);
  }, [columns]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = Number(active.id);
    const overId   = Number(over.id);
    if (activeId === overId) return;

    const cols = workingCols.current;
    if (!findColByCardId(cols, activeId)) return;

    let overColumnId: number;
    let overIndex: number;

    if (isColId(cols, overId)) {
      // カラムの余白エリアにいる → 末尾に追加
      overColumnId = overId;
      overIndex    = sortedCards(cols.find((c) => c.id === overId)!.cards).length;
    } else {
      // 別カードの上にいる
      const overCol = findColByCardId(cols, overId);
      if (!overCol) return;
      overColumnId = overCol.id;

      const overSorted   = sortedCards(overCol.cards);
      const overCardIdx  = overSorted.findIndex((c) => c.id === overId);
      if (overCardIdx === -1) return;

      const activeColId = findColByCardId(cols, activeId)!.id;

      if (activeColId === overColumnId) {
        // 同カラム内：ポインターがカードの中心より下なら +1 先に挿入
        const translated = active.rect.current.translated;
        const pointerY   = translated ? translated.top + translated.height / 2 : 0;
        const cardMidY   = over.rect.top + over.rect.height / 2;
        const activeIdx  = overSorted.findIndex((c) => c.id === activeId);
        // arrayMove の to インデックスに使う
        overIndex = pointerY > cardMidY
          ? (activeIdx < overCardIdx ? overCardIdx : overCardIdx + 1)
          : (activeIdx > overCardIdx ? overCardIdx : overCardIdx - 1);
        overIndex = Math.max(0, Math.min(overIndex, overSorted.length - 1));
      } else {
        // 別カラムへ：ポインターがカードの中心より下なら後ろに挿入
        const translated = active.rect.current.translated;
        const pointerY   = translated ? translated.top + translated.height / 2 : 0;
        const cardMidY   = over.rect.top + over.rect.height / 2;
        overIndex = pointerY > cardMidY ? overCardIdx + 1 : overCardIdx;
      }
    }

    const newCols = applyMove(cols, activeId, overColumnId, overIndex);
    workingCols.current = newCols;

    const targetCol   = newCols.find((c) => c.id === overColumnId)!;
    const newPosition = sortedCards(targetCol.cards).findIndex((c) => c.id === activeId) + 1;
    pendingMove.current = { cardId: activeId, targetColumnId: overColumnId, newPosition };

    setColumns(() => newCols);
  }, [setColumns]);

  const handleDragEnd = useCallback((_event: DragEndEvent) => {
    setActiveCard(null);
    workingCols.current = [];

    if (!pendingMove.current) {
      // ドロップ先なし → サーバー状態に戻す
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
