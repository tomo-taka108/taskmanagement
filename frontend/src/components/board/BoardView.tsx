import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  rectIntersection,
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
import type { BoardColumnResponse, CardResponse } from '../../types/api';

function byPos(cards: CardResponse[]) {
  return [...cards].sort((a, b) => a.position - b.position);
}

function colOfCard(cols: BoardColumnResponse[], cardId: number) {
  return cols.find((c) => c.cards.some((card) => card.id === cardId));
}

export function BoardView() {
  const { isLoading, error, loadBoard, moveCardAsync, columns, setColumns } = useBoardStore();
  const filteredColumns = useFilteredBoard();

  // D&D中の表示は store を触らず localColumns で管理する
  // → DndContext が unmount されないのでクラッシュが起きない
  const [localColumns, setLocalColumns] = useState<BoardColumnResponse[]>(columns);
  const [activeCard, setActiveCard]     = useState<CardResponse | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardResponse | null>(null);
  const [isDragging, setIsDragging]     = useState(false);
  const draggingRef = useRef(false);

  // store が更新されたとき（D&D後の確定 or 外部更新）に同期
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
    const activeId = Number(event.active.id);
    // ドラッグ開始時に store のスナップショットを localColumns に取る
    const snap = columns.map((c) => ({ ...c, cards: [...c.cards] }));
    setLocalColumns(snap);
    const card = snap.flatMap((c) => c.cards).find((c) => c.id === activeId);
    if (card) setActiveCard(card);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = Number(active.id);
    const overId   = Number(over.id);
    if (activeId === overId) return;

    setLocalColumns((cols) => {
      const activeCol = colOfCard(cols, activeId);
      if (!activeCol) return cols;

      const isOverCol = cols.some((c) => c.id === overId);
      const overCol   = isOverCol
        ? cols.find((c) => c.id === overId)!
        : colOfCard(cols, overId);
      if (!overCol) return cols;

      const activeSorted = byPos(activeCol.cards);
      const activeIdx    = activeSorted.findIndex((c) => c.id === activeId);
      if (activeIdx === -1) return cols;

      if (activeCol.id === overCol.id) {
        // 同カラム内: カラム余白は無視、カード上のみ反応
        if (isOverCol) return cols;
        const overIdx = activeSorted.findIndex((c) => c.id === overId);
        if (overIdx === -1 || activeIdx === overIdx) return cols;

        const reordered = arrayMove(activeSorted, activeIdx, overIdx)
          .map((c, i) => ({ ...c, position: i + 1 }));
        return cols.map((c) =>
          c.id === activeCol.id ? { ...c, cards: reordered } : c
        );
      } else {
        // 別カラムへ
        const overSorted = byPos(overCol.cards);
        const insertIdx  = isOverCol
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

        return cols.map((c) => {
          if (c.id === activeCol.id) return { ...c, cards: newActiveCards };
          if (c.id === overCol.id)   return { ...c, cards: newOverCards };
          return c;
        });
      }
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    draggingRef.current = false;
    setIsDragging(false);
    const { active, over } = event;
    setActiveCard(null);

    if (!over) {
      setLocalColumns(columns);
      return;
    }

    const activeId = Number(active.id);

    // setLocalColumns の関数形式は render 中に副作用を起こせないため
    // localColumns の最新値を直接参照してから外で store/API を呼ぶ
    setLocalColumns((latestLocal) => {
      const targetCol = colOfCard(latestLocal, activeId);
      if (!targetCol) {
        // 失敗時は元に戻す（次の tick で store と同期）
        setTimeout(() => setLocalColumns(columns), 0);
        return latestLocal;
      }

      const sorted      = byPos(targetCol.cards);
      const newPosition = sorted.findIndex((c) => c.id === activeId) + 1;

      // render フェーズの外で store と API を呼ぶ
      setTimeout(() => {
        setColumns(() => latestLocal);
        moveCardAsync(activeId, { targetColumnId: targetCol.id, newPosition });
      }, 0);

      return latestLocal;
    });
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

  // ドラッグ中は localColumns（フィルター無効）、それ以外は filteredColumns を使う
  const displayColumns = isDragging ? localColumns : filteredColumns;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
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
