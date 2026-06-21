import type { ChecklistItemResponse } from '../../types/api';

interface Props {
  items: ChecklistItemResponse[];
}

export function ProgressBar({ items }: Props) {
  if (items.length === 0) return null;

  const completed = items.filter((i) => i.completed).length;
  const pct = Math.round((completed / items.length) * 100);

  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: 'var(--color-progress)',
          }}
        />
      </div>
      <span className="text-xs text-[var(--color-text-sub)] shrink-0">
        {completed}/{items.length}
      </span>
    </div>
  );
}
