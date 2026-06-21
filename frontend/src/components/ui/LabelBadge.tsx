import type { LabelResponse } from '../../types/api';

interface Props {
  label: LabelResponse;
}

export function LabelBadge({ label }: Props) {
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white truncate max-w-[100px]"
      style={{ backgroundColor: label.color }}
      title={label.name}
    >
      {label.name}
    </span>
  );
}
