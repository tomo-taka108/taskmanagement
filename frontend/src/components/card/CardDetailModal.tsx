import { useEffect, useRef, useState } from 'react';
import { useBoardStore } from '../../store/boardStore';
import type { CardResponse, Priority } from '../../types/api';

interface Props {
  card: CardResponse;
  onClose: () => void;
  onUpdated: (updated: CardResponse) => void;
}

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'HIGH', label: '高' },
  { value: 'MEDIUM', label: '中' },
  { value: 'LOW', label: '低' },
];

export function CardDetailModal({ card, onClose, onUpdated }: Props) {
  const { updateCardAsync } = useBoardStore();

  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? '');
  const [priority, setPriority] = useState<Priority | ''>(card.priority ?? '');
  const [dueDate, setDueDate] = useState(card.dueDate ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('タイトルは必須です');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const updated = await updateCardAsync(card.id, {
        title: title.trim(),
        description: description || undefined,
        priority: priority || undefined,
        dueDate: dueDate || undefined,
      });
      onUpdated(updated);
      onClose();
    } catch {
      setError('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const columnName = useBoardStore
    .getState()
    .columns.find((c) => c.id === card.columnId)?.title ?? '';

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={handleOverlayClick}
    >
      <div
        className="relative w-full max-w-lg rounded-xl shadow-2xl p-6 flex flex-col gap-4"
        style={{ backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-main)' }}
      >
        {/* ヘッダー */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-xs mb-1" style={{ color: 'var(--color-text-sub)' }}>
              {columnName}
            </p>
            <input
              className="w-full text-base font-semibold bg-transparent border-b outline-none pb-1 focus:border-blue-500"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="タイトル"
            />
          </div>
          <button
            className="text-xl leading-none shrink-0 hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-text-sub)' }}
            onClick={onClose}
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        {/* 説明 */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: 'var(--color-text-sub)' }}>
            説明
          </label>
          <textarea
            className="w-full rounded-md p-2 text-sm outline-none resize-none focus:ring-2 focus:ring-blue-500"
            style={{
              backgroundColor: 'var(--color-bg-column)',
              color: 'var(--color-text-main)',
              border: '1px solid var(--color-border)',
            }}
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="説明を入力..."
          />
        </div>

        {/* 優先度 */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: 'var(--color-text-sub)' }}>
            優先度
          </label>
          <select
            className="rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              backgroundColor: 'var(--color-bg-column)',
              color: 'var(--color-text-main)',
              border: '1px solid var(--color-border)',
            }}
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority | '')}
          >
            <option value="">なし</option>
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* 期限日 */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: 'var(--color-text-sub)' }}>
            期限日
          </label>
          <input
            type="date"
            className="rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              backgroundColor: 'var(--color-bg-column)',
              color: 'var(--color-text-main)',
              border: '1px solid var(--color-border)',
            }}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        {/* ラベル表示（読み取り専用） */}
        {card.labels.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-sub)' }}>
              ラベル
            </p>
            <div className="flex flex-wrap gap-1">
              {card.labels.map((label) => (
                <span
                  key={label.id}
                  className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                  style={{ backgroundColor: label.color }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* エラー */}
        {error && (
          <p className="text-sm" style={{ color: 'var(--color-overdue)' }}>
            {error}
          </p>
        )}

        {/* アクション */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            className="px-4 py-2 text-sm rounded-md hover:brightness-95 transition-all"
            style={{
              backgroundColor: 'var(--color-bg-column)',
              color: 'var(--color-text-main)',
            }}
            onClick={onClose}
          >
            キャンセル
          </button>
          <button
            className="px-4 py-2 text-sm rounded-md font-medium text-white disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-bg-header)' }}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
