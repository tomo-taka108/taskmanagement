interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: Props) {
  return (
    <input
      type="search"
      placeholder="カードを検索..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-1.5 rounded-md text-sm outline-none w-52"
      style={{
        backgroundColor: 'rgba(255,255,255,0.15)',
        color: '#fff',
      }}
    />
  );
}
