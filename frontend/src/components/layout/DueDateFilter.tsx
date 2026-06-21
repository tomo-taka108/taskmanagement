import type { DueFilter } from '../../types/api';

interface Props {
  value: DueFilter;
  onChange: (value: DueFilter) => void;
}

export function DueDateFilter({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as DueFilter)}
      className="px-2 py-1.5 rounded-md text-sm outline-none"
      style={{
        backgroundColor: 'rgba(255,255,255,0.15)',
        color: '#fff',
      }}
    >
      <option value="" style={{ color: '#172b4d' }}>
        期限: すべて
      </option>
      <option value="overdue" style={{ color: '#172b4d' }}>
        期限超過
      </option>
      <option value="this-week" style={{ color: '#172b4d' }}>
        今週中
      </option>
    </select>
  );
}
