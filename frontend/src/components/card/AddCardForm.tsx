import { useState } from 'react';
import type { CreateCardRequest, Priority } from '../../types/api';
import { useBoardStore } from '../../store/boardStore';

interface Props {
  columnId: number;
  onClose: () => void;
}

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'HIGH', label: '高' },
  { value: 'MEDIUM', label: '中' },
  { value: 'LOW', label: '低' },
];

export function AddCardForm({ columnId, onClose }: Props) {
  const addCard = useBoardStore((s) => s.addCard);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload: CreateCardRequest = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority: priority || undefined,
      dueDate: dueDate || undefined,
    };

    setIsSubmitting(true);
    setError(null);
    try {
      await addCard(columnId, payload);
      onClose();
    } catch {
      setError('カードの作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-bg-app)',
    color: 'var(--color-text-main)',
    borderColor: 'var(--color-border)',
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <input
        autoFocus
        type="text"
        placeholder="タイトル（必須）"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="w-full px-2 py-1.5 text-sm rounded border outline-none"
        style={inputStyle}
      />

      <textarea
        placeholder="説明（任意）"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="w-full px-2 py-1.5 text-sm rounded border outline-none resize-none"
        style={inputStyle}
      />

      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value as Priority | '')}
        className="w-full px-2 py-1.5 text-sm rounded border outline-none"
        style={inputStyle}
      >
        <option value="">優先度: なし</option>
        {PRIORITY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="w-full px-2 py-1.5 text-sm rounded border outline-none"
        style={inputStyle}
      />

      {error && (
        <p className="text-xs" style={{ color: 'var(--color-overdue)' }}>
          {error}
        </p>
      )}

      <div className="flex gap-2 mt-1">
        <button
          type="submit"
          disabled={isSubmitting || !title.trim()}
          className="flex-1 py-1.5 text-sm font-medium text-white rounded disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-bg-header)' }}
        >
          {isSubmitting ? '追加中...' : 'カードを追加'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 text-sm rounded border"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-sub)',
          }}
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
