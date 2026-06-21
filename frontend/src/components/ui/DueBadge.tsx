interface Props {
  dueDate: string;
}

function getStatus(dueDate: string): 'overdue' | 'soon' | 'normal' {
  const today = new Date().toISOString().split('T')[0];
  if (dueDate < today) return 'overdue';
  const soon = new Date();
  soon.setDate(soon.getDate() + 3);
  const soonStr = soon.toISOString().split('T')[0];
  if (dueDate <= soonStr) return 'soon';
  return 'normal';
}

export function DueBadge({ dueDate }: Props) {
  const status = getStatus(dueDate);

  const styles = {
    overdue: 'text-[var(--color-overdue)]',
    soon: 'text-[var(--color-soon)]',
    normal: 'text-[var(--color-text-sub)]',
  };

  const icons = {
    overdue: '🔴 ',
    soon: '🟡 ',
    normal: '📅 ',
  };

  return (
    <span className={`text-xs ${styles[status]}`}>
      {icons[status]}
      {dueDate}
    </span>
  );
}
