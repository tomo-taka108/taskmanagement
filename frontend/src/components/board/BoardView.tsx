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
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable';
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
  insertAfter: boolean;
}

// pointerWithin で試し、ヒットがなければ closestCenter にフォールバック
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

function isColId(id: string | number) {
  return typeof id === 'string' && id.startsWith('col-');
}

function colNumId(id: string | number) {
  return Number(String(id).replace('col-', ''));
}

export function BoardView() {
  const { isLoading, error, loadBoard, moveCardAsync, columns, setColumns, addColumnAsync, reorderColumnsAsync } = useBoardStore();
  const filteredColumns = useFilteredBoard();

  const [localColumns, setLocalColumns] = useState<BoardColumnResponse[]>(columns);
  const [activeCard, setActiveCard]         = useState<CardResponse | null>(null);
  const [activeColumn, setActiveColumn]     = useState<BoardColumnResponse | null>(null);
  const [selectedCard, setSelectedCard]     = useState<CardResponse | null>(null);
  const [isDragging, setIsDragging]         = useState(false);
  const [isColumnDragging, setIsColumnDragging] = useState(false);
  // カラムD&D中に「over」しているカラムのID
  const [overColumnId, setOverColumnId]     = useState<number | null>(null);
  const [dropIndicator, setDropIndicator]   = useState<DropIndicatorInfo | null>(null);
  const draggingRef = useRef(false);
  const snapRef     = useRef<BoardColumnResponse[]>([]);

  // カラム追加フォーム
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const addColumnInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!draggingRef.current) setLocalColumns(columns);
  }, [columns]);

  useEffect(() => {
    if (isAddingColumn) addColumnInputRef.current?.focus();
  }, [isAddingColumn]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // ─── DragStart ──────────────────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    draggingRef.current = true;
    setIsDragging(true);
    setDropIndicator(null);
    setOverColumnId(null);

    const snap = columns.map((c) => ({ ...c, cards: [...c.cards] }));
    snapRef.current = snap;
    setLocalColumns(snap);

    if (isColId(event.active.id)) {
      setIsColumnDragging(true);
      const col = snap.find((c) => c.id === colNumId(event.active.id));
      if (col) setActiveColumn(col);
    } else {
      setIsColumnDragging(false);
      const card = snap.flatMap((c) => c.cards).find((c) => c.id === Number(event.active.id));
      if (card) setActiveCard(card);
    }
  };

  // ─── DragOver ───────────────────────────────────────────────
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) {
      setDropIndicator(null);
      setOverColumnId(null);
      return;
    }

    // ── カラムD&D ──
    if (isColId(active.id)) {
      // over 先が col-{id} のときだけ並び替えプレビュー
      if (isColId(over.id) && active.id !== over.id) {
        const activeColId = colNumId(active.id);
        const overColId   = colNumId(over.id);
        const snap = snapRef.current;
        const activeIdx = snap.findIndex((c) => c.id === activeColId);
        const overIdx   = snap.findIndex((c) => c.id === overColId);
        if (activeIdx !== -1 && overIdx !== -1 && activeIdx !== overIdx) {
          // リアルタイムで並び順を更新（Trello風）
          const reordered = arrayMove(snap, activeIdx, overIdx);
          setLocalColumns(reordered);
          snapRef.current = reordered; // スナップも更新して連続移動に対応
          setOverColumnId(overColId);
        }
      }
      return;
    }

    // ── カードD&D ──
    const activeId = Number(active.id);
    const overId   = Number(over.id);
    if (activeId === overId) {
      setDropIndicator(null);
      return;
    }

    const snap = snapRef.current;
    const isOverCol = snap.some((c) => c.id === overId);
    const overColId = isOverCol
      ? overId
      : (snap.find((c) => c.cards.some((card) => card.id === overId))?.id ?? null);

    let insertAfter = false;
    if (!isOverCol && overColId !== null) {
      const overColSnap   = snap.find((c) => c.id === overColId);
      const activeColSnap = snap.find((c) => c.cards.some((card) => card.id === activeId));
      if (overColSnap && activeColSnap && overColSnap.id === activeColSnap.id) {
        const sorted     = byPos(overColSnap.cards);
        const activeIdx  = sorted.findIndex((c) => c.id === activeId);
        const overIdx    = sorted.findIndex((c) => c.id === overId);
        insertAfter = activeIdx < overIdx;
      }
    }

    setDropIndicator({ overCardId: isOverCol ? null : overId, overColumnId: overColId, isOverColumn: isOverCol, insertAfter });
  };

  // ─── DragEnd ────────────────────────────────────────────────
  const handleDragEnd = (event: DragEndEvent) => {
    draggingRef.current = false;
    setIsDragging(false);
    setDropIndicator(null);
    setOverColumnId(null);
    const { active, over } = event;
    setActiveCard(null);
    setActiveColumn(null);

    if (!over) {
      // キャンセル: スナップに戻す
      setLocalColumns(columns);
      setIsColumnDragging(false);
      return;
    }

    // ── カラムD&D 確定 ──
    if (isColId(active.id)) {
      setIsColumnDragging(false);
      // handleDragOver で localColumns はすでに並び替え済み
      // → そのまま store に反映して API を叩く
      const current = localColumns;
      const reordered = current.map((c, i) => ({ ...c, position: i + 1 }));
      setColumns(() => reordered);
      reorderColumnsAsync({ columnIds: reordered.map((c) => c.id) });
      return;
    }

    setIsColumnDragging(false);

    // ── カードD&D 確定 ──
    const activeId = Number(active.id);
    const overId   = Number(over.id);
    const snap     = snapRef.current;

    const activeCol = colOfCard(snap, activeId);
    if (!activeCol) { setLocalColumns(columns); return; }

    const isOverColId = snap.some((c) => c.id === overId);
    const overCol     = isOverColId ? snap.find((c) => c.id === overId)! : colOfCard(snap, overId);
    if (!overCol) { setLocalColumns(columns); return; }

    const activeSorted = byPos(activeCol.cards);
    const activeIdx    = activeSorted.findIndex((c) => c.id === activeId);
    if (activeIdx === -1) { setLocalColumns(columns); return; }

    let newCols: BoardColumnResponse[];

    if (activeCol.id === overCol.id) {
      if (isOverColId) {
        const reordered = [
          ...activeSorted.filter((c) => c.id !== activeId),
          activeSorted[activeIdx],
        ].map((c, i) => ({ ...c, position: i + 1 }));
        newCols = snap.map((c) => c.id === activeCol.id ? { ...c, cards: reordered } : c);
      } else {
        const overIdx = activeSorted.findIndex((c) => c.id === overId);
        if (overIdx === -1 || activeIdx === overIdx) { setLocalColumns(columns); return; }
        const reordered = arrayMove(activeSorted, activeIdx, overIdx).map((c, i) => ({ ...c, position: i + 1 }));
        newCols = snap.map((c) => c.id === activeCol.id ? { ...c, cards: reordered } : c);
      }
    } else {
      const overSorted = byPos(overCol.cards);
      const insertIdx  = isOverColId
        ? overSorted.length
        : (() => { const idx = overSorted.findIndex((c) => c.id === overId); return idx === -1 ? overSorted.length : idx; })();
      const movedCard      = { ...activeSorted[activeIdx], columnId: overCol.id };
      const newActiveCards = activeSorted.filter((c) => c.id !== activeId).map((c, i) => ({ ...c, position: i + 1 }));
      const newOverCards   = [...overSorted.slice(0, insertIdx), movedCard, ...overSorted.slice(insertIdx)].map((c, i) => ({ ...c, position: i + 1 }));
      newCols = snap.map((c) => {
        if (c.id === activeCol.id) return { ...c, cards: newActiveCards };
        if (c.id === overCol.id)   return { ...c, cards: newOverCards };
        return c;
      });
    }

    setLocalColumns(newCols);
    const targetCol   = colOfCard(newCols, activeId)!;
    const newPosition = byPos(targetCol.cards).findIndex((c) => c.id === activeId) + 1;
    setColumns(() => newCols);
    moveCardAsync(activeId, { targetColumnId: targetCol.id, newPosition });
  };

  // ─── カラム追加 ──────────────────────────────────────────────
  const handleAddColumn = async () => {
    const trimmed = newColumnTitle.trim();
    if (!trimmed) return;
    setIsAddingColumn(false);
    setNewColumnTitle('');
    await addColumnAsync({ title: trimmed });
  };

  const handleAddColumnKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddColumn();
    if (e.key === 'Escape') { setIsAddingColumn(false); setNewColumnTitle(''); }
  };

  // ─── ローディング / エラー ───────────────────────────────────
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

  // カラムD&D中は localColumns を使う（リアルタイム並び替えのため）
  // カードフィルタ中はフィルタ済みリスト、それ以外はstoreのcolumns
  const displayColumns = isColumnDragging ? localColumns : (isDragging ? localColumns : filteredColumns);
  const columnSortIds  = displayColumns.map((c) => `col-${c.id}`);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={columnSortIds} strategy={horizontalListSortingStrategy}>
        <div className="flex flex-1 gap-4 p-4 overflow-x-auto">
          {displayColumns.map((column) => (
            <Column
              key={column.id}
              column={column}
              onCardClick={(card) => { if (!isDragging) setSelectedCard(card); }}
              dropIndicator={isDragging && !isColumnDragging ? dropIndicator : null}
              activeCardId={activeCard?.id ?? null}
              isColumnDragging={isColumnDragging}
              isColumnOver={isColumnDragging && overColumnId === column.id}
            />
          ))}

          {/* カラム追加エリア */}
          {isAddingColumn ? (
            <div
              className="flex flex-col rounded-lg w-72 shrink-0 p-3 gap-2"
              style={{ backgroundColor: 'var(--color-bg-column)' }}
            >
              <input
                ref={addColumnInputRef}
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                onKeyDown={handleAddColumnKeyDown}
                placeholder="カラム名を入力..."
                className="w-full px-2 py-1.5 rounded border text-sm bg-transparent outline-none"
                style={{ color: 'var(--color-text-main)', borderColor: 'var(--color-border)' }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddColumn}
                  className="px-3 py-1 text-sm rounded font-medium text-white"
                  style={{ backgroundColor: 'var(--color-bg-header)' }}
                >
                  追加
                </button>
                <button
                  onClick={() => { setIsAddingColumn(false); setNewColumnTitle(''); }}
                  className="px-3 py-1 text-sm rounded"
                  style={{ color: 'var(--color-text-sub)' }}
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingColumn(true)}
              className="flex items-center gap-2 rounded-lg w-72 shrink-0 p-3 text-sm hover:brightness-95 transition-colors"
              style={{ backgroundColor: 'var(--color-bg-column)', color: 'var(--color-text-sub)' }}
            >
              <span className="text-lg leading-none">＋</span>
              カラムを追加
            </button>
          )}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {activeCard && <CardItem card={activeCard} isDragging />}
        {activeColumn && (
          <div
            className="flex flex-col rounded-lg w-72 shrink-0 p-3 shadow-2xl"
            style={{ backgroundColor: 'var(--color-bg-column)', opacity: 0.95, rotate: '2deg' }}
          >
            <h2 className="text-xl font-semibold px-1" style={{ color: 'var(--color-text-main)' }}>
              {activeColumn.title}
            </h2>
            <p className="text-xs px-1 mt-1" style={{ color: 'var(--color-text-sub)' }}>
              {activeColumn.cards.length} 枚のカード
            </p>
          </div>
        )}
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
