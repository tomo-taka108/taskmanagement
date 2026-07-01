import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { BoardColumnResponse, CardResponse } from '../../types/api';
import type { DropIndicatorInfo } from './BoardView';
import { CardList } from './CardList';
import { AddCardForm } from '../card/AddCardForm';
import { useBoardStore } from '../../store/boardStore';

interface Props {
  column: BoardColumnResponse;
  onCardClick: (card: CardResponse) => void;
  dropIndicator?: DropIndicatorInfo | null;
  activeCardId?: number | null;
  isColumnDragging?: boolean;
  isColumnOver?: boolean;
}

export function Column({ column, onCardClick, dropIndicator, activeCardId, isColumnDragging, isColumnOver }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const { updateColumnAsync, deleteColumnAsync } = useBoardStore();

  // カードD&D用ドロップゾーン（カラムの数値ID）
  const { setNodeRef: setCardDropRef } = useDroppable({ id: column.id });

  // カラムD&D用ソータブル（col-{id}）
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging: isThisColumnDragging,
  } = useSortable({ id: `col-${column.id}` });

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const sortedCards = [...column.cards].sort((a, b) => a.position - b.position);
  const allCardIds  = sortedCards.map((c) => c.id);

  const showBottomIndicator =
    !isColumnDragging &&
    dropIndicator?.overColumnId === column.id &&
    dropIndicator.isOverColumn &&
    sortedCards.length > 0;

  const handleTitleClick = () => {
    if (isColumnDragging) return;
    setEditTitle(column.title);
    setIsEditing(true);
  };

  const handleTitleSave = async () => {
    const trimmed = editTitle.trim();
    setIsEditing(false);
    if (trimmed && trimmed !== column.title) {
      await updateColumnAsync(column.id, { title: trimmed });
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleTitleSave();
    if (e.key === 'Escape') setIsEditing(false);
  };

  const handleDelete = async () => {
    const cardCount = column.cards.length;
    const message = cardCount > 0
      ? `「${column.title}」を削除しますか？\n配下の ${cardCount} 枚のカードも削除されます。`
      : `「${column.title}」を削除しますか？`;
    if (!window.confirm(message)) return;
    await deleteColumnAsync(column.id);
  };

  const wrapperStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // ドラッグ中の元カラムは非表示にするが幅は確保
    visibility: isThisColumnDragging ? 'hidden' : 'visible',
  };

  return (
    // outline-none でブラウザのデフォルトフォーカスアウトラインを消す
    <div ref={setSortableRef} style={wrapperStyle} className="shrink-0 w-72 outline-none" {...attributes}>
      <div
        className="flex flex-col rounded-lg p-3 gap-3 relative"
        style={{ backgroundColor: 'var(--color-bg-column)' }}
      >
        {/* Trello風: over中のカラムに薄い黒オーバーレイ */}
        {isColumnOver && !isThisColumnDragging && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '0.5rem',
              backgroundColor: 'rgba(0,0,0,0.14)',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
        )}

        <div className="flex items-center gap-1 px-1">
          {/* ドラッグハンドル */}
          <button
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:brightness-90 shrink-0"
            style={{ color: 'var(--color-text-sub)', touchAction: 'none' }}
            title="ドラッグして並び替え"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <circle cx="4" cy="3" r="1.2"/><circle cx="10" cy="3" r="1.2"/>
              <circle cx="4" cy="7" r="1.2"/><circle cx="10" cy="7" r="1.2"/>
              <circle cx="4" cy="11" r="1.2"/><circle cx="10" cy="11" r="1.2"/>
            </svg>
          </button>

          {isEditing ? (
            <input
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              className="flex-1 text-xl font-semibold bg-transparent border-b outline-none min-w-0"
              style={{ color: 'var(--color-text-main)', borderColor: 'var(--color-text-sub)' }}
            />
          ) : (
            <h2
              className="flex-1 text-xl font-semibold cursor-pointer truncate"
              style={{ color: 'var(--color-text-main)' }}
              onClick={handleTitleClick}
              title="クリックして編集"
            >
              {column.title}
            </h2>
          )}

          <span
            className="text-xs px-2 py-0.5 rounded-full shrink-0"
            style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text-sub)' }}
          >
            {column.cards.length}
          </span>

          <button
            onClick={handleDelete}
            className="shrink-0 p-0.5 rounded hover:brightness-90 transition-all"
            style={{ color: 'var(--color-text-sub)' }}
            title="カラムを削除"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>

        {/* カードD&Dのドロップゾーン（数値IDをここだけに集約） */}
        <div ref={setCardDropRef}>
          <SortableContext items={allCardIds} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2" style={{ minHeight: '60px' }}>
              <CardList
                cards={sortedCards}
                onCardClick={onCardClick}
                dropIndicator={isColumnDragging ? null : dropIndicator}
                activeCardId={activeCardId}
                columnId={column.id}
              />
              {showBottomIndicator && <DropLine />}
            </div>
          </SortableContext>
        </div>

        {isAdding ? (
          <AddCardForm columnId={column.id} onClose={() => setIsAdding(false)} />
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-1.5 text-sm rounded text-left px-2 hover:brightness-95 transition-all"
            style={{ color: 'var(--color-text-sub)', backgroundColor: 'transparent' }}
          >
            + カードを追加
          </button>
        )}
      </div>
    </div>
  );
}

export function DropLine() {
  return (
    <div
      className="rounded-full mx-1"
      style={{ height: '3px', backgroundColor: '#3b82f6', boxShadow: '0 0 6px rgba(59,130,246,0.6)' }}
    />
  );
}
