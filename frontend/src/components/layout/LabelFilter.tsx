import type { LabelResponse } from '../../types/api';

interface Props {
  labels: LabelResponse[];
  value: string;
  onChange: (value: string) => void;
}

export function LabelFilter({ labels, value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-2 py-1.5 rounded-md text-sm outline-none"
      style={{
        backgroundColor: 'rgba(255,255,255,0.15)',
        color: '#fff',
      }}
    >
      <option value="" style={{ color: '#172b4d' }}>
        ラベル: すべて
      </option>
      {labels.map((label) => (
        <option key={label.id} value={String(label.id)} style={{ color: '#172b4d' }}>
          {label.name}
        </option>
      ))}
    </select>
  );
}
