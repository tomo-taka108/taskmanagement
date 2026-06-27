import { useDraggable } from '@dnd-kit/core';
import type { CardResponse, Priority } from '../../types/api';
import { LabelBadge } from '../ui/LabelBadge';
import { DueBadge } from '../ui/DueBadge';
import { ProgressBar } from '../ui/ProgressBar';

interface Props {
  card: CardResponse;
  onClick?: () => void;
  isDragging?: boolean;
  // ドラッグ中に元の場所を示すゴースト表示
  isGhost?: boolean;
}

const PRIORITY_LABEL: Record<Priority, string> = {
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低',
};

const PRIORITY_STYLE: Record<Priority, string> = {
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW: 'bg-green-100 text-green-700',
};

export function CardItem({ card, onClick, isDragging, isGhost }: Props) {
  const { attributes, listeners, setNodeRef, isDragging: isDraggingNow } = useDraggable({
    id: card.id,
  });

  const handleClick = (e: React.MouseEvent) => {
    if (isDraggingNow) return;
    onClick?.();
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="rounded-md p-3 shadow-sm cursor-grab active:cursor-grabbing hover:brightness-95 transition-all"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        color: 'var(--color-text-main)',
        opacity: isGhost ? 0.35 : 1,
        ...(isDragging
          ? { boxShadow: '0 8px 24px rgba(0,0,0,0.22)', transform: 'rotate(1.5deg)' }
          : {}),
      }}
      onClick={handleClick}
    >
      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.labels.map((label) => (
            <LabelBadge key={label.id} label={label} />
          ))}
        </div>
      )}

      <p className="text-sm font-medium leading-snug">{card.title}</p>

      {card.priority && (
        <div className="mt-2">
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_STYLE[card.priority]}`}>
            優先度: {PRIORITY_LABEL[card.priority]}
          </span>
        </div>
      )}

      {card.dueDate && (
        <div className="mt-2">
          <DueBadge dueDate={card.dueDate} />
        </div>
      )}

      {card.checklistItems.length > 0 && (
        <ProgressBar items={card.checklistItems} />
      )}
    </div>
  );
}
