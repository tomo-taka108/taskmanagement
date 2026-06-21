import type { CardResponse } from '../../types/api';
import { LabelBadge } from '../ui/LabelBadge';
import { DueBadge } from '../ui/DueBadge';
import { ProgressBar } from '../ui/ProgressBar';

interface Props {
  card: CardResponse;
  onClick?: () => void;
}

export function CardItem({ card, onClick }: Props) {
  return (
    <div
      className="rounded-md p-3 shadow-sm cursor-pointer hover:brightness-95 transition-all"
      style={{
        backgroundColor: card.color ?? 'var(--color-bg-card)',
        color: 'var(--color-text-main)',
      }}
      onClick={onClick}
    >
      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.labels.map((label) => (
            <LabelBadge key={label.id} label={label} />
          ))}
        </div>
      )}

      <p className="text-sm font-medium leading-snug">{card.title}</p>

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
