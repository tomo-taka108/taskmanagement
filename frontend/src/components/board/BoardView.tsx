import { useState, useRef, useCallback } from 'react';
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
import { Column } from './Column';
import { CardItem } from '../card/CardItem';
import { CardDetailModal } from '../card/CardDetailModal';
import type { BoardColumnResponse, CardResponse } from '../../types/api';

// ── ヘルパー（純粋関数） ──────────────────────────────────────────

function sorted(cards: CardResponse[]) {
  return [...cards].sort((a, b) => a.position - b.position);
}

function findColByCardId(cols: BoardColumnResponse[], cardId: number) {
  return cols.find((c) => c.cards.some((card) => card.id === cardId));
}

function isColId(cols: BoardColumnResponse[], id: number) {
  return cols.some((c) => c.id === id);
}

// カードをカラム間またはカラム内で移動した新しい配列を返す
function applyMove(
  cols: BoardColumnResponse[],
  activeId: number,
  overColumnId: number,
  overIndex: number          // 挿入先インデックス（0始まり）
): BoardColumnResponse[] {
  const activeColId = findColByCardId(cols, activeId)!.id;
  const activeCol = cols.find((c) => c.id === activeColId)!;
  const overCol = cols.find((c) => c.id === overColumnId)!;

  const activeSorted = sorted(activeCol.cards);
  const activeIdx = activeSorted.findIndex((c) => c.id === activeId);
  const movedCard = { ...activeSorted[activeIdx], columnId: overColumnId };

  if (activeColId === overColumnId) {
    // 同カラム内
    const reordered = arrayMove(activeSorted, activeIdx, overIndex)
      .map((c, i) => ({ ...c, position: i + 1 }));
    return cols.map((col) =>
      col.id === activeColId ? { ...col, cards: reordered } : col
    );
  } else {
    // 別カラムへ
    const newActiveCards = activeSorted
      .filter((c) => c.id !== activeId)
      .map((c, i) => ({ ...c, position: i + 1 }));

    const overSorted = sorted(overCol.cards);
    const newOverCards = [
      ...overSorted.slice(0, overIndex),
      movedCard,
      ...overSorted.slice(overIndex),
    ].map((c, i) => ({ ...c, position: i + 1 }));

    return cols.map((col) => {
      if (col.id === activeColId) return { ...col, cards: newActiveCards };
      if (col.id === overColumnId) return { ...col, cards: newOverCards };
      return col;
    });
  }
}

// ── コンポーネント ────────────────────────────────────────────────

export function BoardView() {
  const { isLoading, error, loadBoard, moveCardAsync, columns, setColumns } = useBoardStore();

  const [activeCard, setActiveCard] = useState<CardResponse | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardResponse | null>(null);

  // ドラッグ中に操作する「作業用カラム配列」。
  // store の columns とは独立させ、DragEnd 時だけ store に反映する。
  const workingCols = useRef<BoardColumnResponse[]>([]);
  // handleDragEnd でAPIに送るパラメータ
  const pendingMove = useRef<{ cardId: number; targetColumnId: number; newPosition: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const activeId = Number(event.active.id);
    // ドラッグ開始時点の store 状態をコピーして作業用とする
    workingCols.current = columns.map((col) => ({
      ...col,
      cards: [...col.cards],
    }));
    pendingMove.current = null;

    const card = findColByCardId(workingCols.current, activeId)
      ?.cards.find((c) => c.id === activeId);
    if (card) setActiveCard(card);
  }, [columns]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = Number(active.id);
    const overId = Number(over.id);
    if (activeId === overId) return;

    const cols = workingCols.current;
    const activeColId = findColByCardId(cols, activeId)?.id;
    if (activeColId === undefined) return;

    let overColumnId: number;
    let overIndex: number;

    if (isColId(cols, overId)) {
      // カラム自体の上：末尾に追加
      overColumnId = overId;
      const overCol = cols.find((c) => c.id === overId)!;
      overIndex = sorted(overCol.cards).length;
    } else {
      // 別のカードの上
      const overCol = findColByCardId(cols, overId);
      if (!overCol) return;
      overColumnId = overCol.id;
      overIndex = sorted(overCol.cards).findIndex((c) => c.id === overId);
      if (overIndex === -1) return;
    }

    const newCols = applyMove(cols, activeId, overColumnId, overIndex);
    workingCols.current = newCols;

    // pendingMove を更新（DragEnd で使う）
    const targetCol = newCols.find((c) => c.id === overColumnId)!;
    const newPosition = sorted(targetCol.cards).findIndex((c) => c.id === activeId) + 1;
    pendingMove.current = { cardId: activeId, targetColumnId: overColumnId, newPosition };

    // store に反映して画面を更新
    setColumns(() => newCols);
  }, [setColumns]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveCard(null);
    workingCols.current = [];

    if (!event.over || !pendingMove.current) {
      // ドロップ先なし → store をサーバー状態に戻す
      loadBoard();
      pendingMove.current = null;
      return;
    }

    const { cardId, targetColumnId, newPosition } = pendingMove.current;
    pendingMove.current = null;
    moveCardAsync(cardId, { targetColumnId, newPosition });
  }, [loadBoard, moveCardAsync]);

  // 初回ロード中のみスピナー
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
      collisionDetection={closestCorners}
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
