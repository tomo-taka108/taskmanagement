import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  closestCenter,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type CollisionDetection,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useBoardStore } from '../../store/boardStore';
import { useFilteredBoard } from '../../hooks/useFilteredBoard';
import { Column } from './Column';
import { CardItem } from '../card/CardItem';
import { CardDetailModal } from '../card/CardDetailModal';
import type { BoardColumnResponse, CardResponse } from '../../types/api';

export interface DropIndicatorInfo {
  overCardId: number | null;
  overColumnId: number | null;
  isOverColumn: boolean;
  // 同カラム内で下方向へのドラッグ時: overCard の「後」に線を出す
  insertAfter: boolean;
}

// pointerWithin で最初に試し、ヒットがなければ closestCenter にフォールバック
const collisionDetection: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length > 0 ? hits : closestCenter(args);
};

function byPos(cards: CardResponse[]) {
  return [...cards].sort((a, b) => a.position - b.position);
}

function colOfCard(cols: BoardColumnResponse[], cardId: number) {
  return cols.find((c) => c.cards.some((card) => card.id === cardId));
}

export function BoardView() {
  const { isLoading, error, loadBoard, moveCardAsync, columns, setColumns } = useBoardStore();
  const filteredColumns = useFilteredBoard();

  const [localColumns, setLocalColumns] = useState<BoardColumnResponse[]>(columns);
  const [activeCard, setActiveCard]     = useState<CardResponse | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardResponse | null>(null);
  const [isDragging, setIsDragging]     = useState(false);
  const [dropIndicator, setDropIndicator] = useState<DropIndicatorInfo | null>(null);
  const draggingRef = useRef(false);

  // ドラッグ開始時点のスナップショットを保持し、インジケーター計算に使う
  const snapRef = useRef<BoardColumnResponse[]>([]);

  useEffect(() => {
    if (!draggingRef.current) {
      setLocalColumns(columns);
    }
  }, [columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    draggingRef.current = true;
    setIsDragging(true);
    setDropIndicator(null);
    const activeId = Number(event.active.id);
    const snap = columns.map((c) => ({ ...c, cards: [...c.cards] }));
    snapRef.current = snap;
    setLocalColumns(snap);
    const card = snap.flatMap((c) => c.cards).find((c) => c.id === activeId);
    if (card) setActiveCard(card);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setDropIndicator(null);
      return;
    }

    const activeId = Number(active.id);
    const overId   = Number(over.id);
    if (activeId === overId) {
      setDropIndicator(null);
      return;
    }

    // スナップショット（ドラッグ開始時点の並び順）でカラムを判定する
    // → 楽観的更新と無関係にインジケーター位置を計算できる
    const snap = snapRef.current;
    const isOverColId = snap.some((c) => c.id === overId);
    const overColId   = isOverColId
      ? overId
      : (snap.find((c) => c.cards.some((card) => card.id === overId))?.id ?? null);

    // 同カラム内で下方向へドラッグ中かを判定して insertAfter を決める
    let insertAfter = false;
    if (!isOverColId && overColId !== null) {
      const overColSnap = snap.find((c) => c.id === overColId);
      const activeColSnap = snap.find((c) => c.cards.some((card) => card.id === activeId));
      if (overColSnap && activeColSnap && overColSnap.id === activeColSnap.id) {
        const sorted = byPos(overColSnap.cards);
        const activeIdx = sorted.findIndex((c) => c.id === activeId);
        const overIdx   = sorted.findIndex((c) => c.id === overId);
        insertAfter = activeIdx < overIdx;
      }
    }

    setDropIndicator({
      overCardId:   isOverColId ? null : overId,
      overColumnId: overColId,
      isOverColumn: isOverColId,
      insertAfter,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    draggingRef.current = false;
    setIsDragging(false);
    setDropIndicator(null);
    const { active, over } = event;
    setActiveCard(null);

    if (!over) {
      setLocalColumns(columns);
      return;
    }

    const activeId = Number(active.id);
    const overId   = Number(over.id);
    const snap     = snapRef.current;

    const activeCol = colOfCard(snap, activeId);
    if (!activeCol) {
      setLocalColumns(columns);
      return;
    }

    const isOverColId = snap.some((c) => c.id === overId);
    const overCol     = isOverColId
      ? snap.find((c) => c.id === overId)!
      : colOfCard(snap, overId);
    if (!overCol) {
      setLocalColumns(columns);
      return;
    }

    const activeSorted = byPos(activeCol.cards);
    const activeIdx    = activeSorted.findIndex((c) => c.id === activeId);
    if (activeIdx === -1) {
      setLocalColumns(columns);
      return;
    }

    let newCols: BoardColumnResponse[];

    if (activeCol.id === overCol.id) {
      // 同カラム内並び替え
      if (isOverColId) {
        // カラム余白にドロップ → 末尾へ
        const reordered = [
          ...activeSorted.filter((c) => c.id !== activeId),
          activeSorted[activeIdx],
        ].map((c, i) => ({ ...c, position: i + 1 }));
        newCols = snap.map((c) =>
          c.id === activeCol.id ? { ...c, cards: reordered } : c
        );
      } else {
        const overIdx = activeSorted.findIndex((c) => c.id === overId);
        if (overIdx === -1 || activeIdx === overIdx) {
          setLocalColumns(columns);
          return;
        }
        const reordered = arrayMove(activeSorted, activeIdx, overIdx)
          .map((c, i) => ({ ...c, position: i + 1 }));
        newCols = snap.map((c) =>
          c.id === activeCol.id ? { ...c, cards: reordered } : c
        );
      }
    } else {
      // 別カラムへ移動
      const overSorted = byPos(overCol.cards);
      const insertIdx  = isOverColId
        ? overSorted.length
        : (() => {
            const idx = overSorted.findIndex((c) => c.id === overId);
            return idx === -1 ? overSorted.length : idx;
          })();

      const movedCard      = { ...activeSorted[activeIdx], columnId: overCol.id };
      const newActiveCards = activeSorted
        .filter((c) => c.id !== activeId)
        .map((c, i) => ({ ...c, position: i + 1 }));
      const newOverCards   = [
        ...overSorted.slice(0, insertIdx),
        movedCard,
        ...overSorted.slice(insertIdx),
      ].map((c, i) => ({ ...c, position: i + 1 }));

      newCols = snap.map((c) => {
        if (c.id === activeCol.id) return { ...c, cards: newActiveCards };
        if (c.id === overCol.id)   return { ...c, cards: newOverCards };
        return c;
      });
    }

    setLocalColumns(newCols);
    const targetCol  = colOfCard(newCols, activeId)!;
    const newPosition = byPos(targetCol.cards).findIndex((c) => c.id === activeId) + 1;
    setColumns(() => newCols);
    moveCardAsync(activeId, { targetColumnId: targetCol.id, newPosition });
  };

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

  const displayColumns = isDragging ? localColumns : filteredColumns;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-1 gap-4 p-4 overflow-x-auto">
        {displayColumns.map((column) => (
          <Column
            key={column.id}
            column={column}
            onCardClick={(card) => {
              if (!isDragging) setSelectedCard(card);
            }}
            dropIndicator={isDragging ? dropIndicator : null}
            activeCardId={activeCard?.id ?? null}
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
          onDeleted={() => setSelectedCard(null)}
        />
      )}
    </DndContext>
  );
}
