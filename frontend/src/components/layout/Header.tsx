import { useBoardStore } from '../../store/boardStore';
import type { LabelResponse, DueFilter } from '../../types/api';
import { SearchBar } from './SearchBar';
import { LabelFilter } from './LabelFilter';
import { DueDateFilter } from './DueDateFilter';

interface Props {
  isDark: boolean;
  onThemeToggle: () => void;
}

function collectUniqueLabels(store: ReturnType<typeof useBoardStore.getState>): LabelResponse[] {
  const map = new Map<number, LabelResponse>();
  store.columns.forEach((col) => {
    col.cards.forEach((card) => {
      card.labels.forEach((label) => {
        if (!map.has(label.id)) map.set(label.id, label);
      });
    });
  });
  return Array.from(map.values());
}

export function Header({ isDark, onThemeToggle }: Props) {
  const store = useBoardStore();
  const { filter, setKeyword, setLabelId, setDue } = store;
  const labels = collectUniqueLabels(store);

  return (
    <header
      className="flex items-center gap-3 px-4 py-3 shrink-0 flex-wrap"
      style={{ backgroundColor: 'var(--color-bg-header)' }}
    >
      <span className="text-white font-bold text-lg mr-2">TaskBoard</span>

      <SearchBar value={filter.keyword} onChange={setKeyword} />
      <LabelFilter labels={labels} value={filter.labelId} onChange={setLabelId} />
      <DueDateFilter value={filter.due} onChange={setDue as (v: DueFilter) => void} />

      <button
        className="ml-auto text-xl"
        onClick={onThemeToggle}
        aria-label="ダークモード切替"
        title="ダークモード切替"
      >
        {isDark ? '☀️' : '🌙'}
      </button>
    </header>
  );
}
