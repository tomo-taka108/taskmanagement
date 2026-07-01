import { useEffect, useRef, useState } from 'react';
import { useBoardStore } from '../../store/boardStore';
import type { CardResponse, ChecklistItemResponse, Priority } from '../../types/api';

interface Props {
  card: CardResponse;
  onClose: () => void;
  onUpdated: (updated: CardResponse) => void;
  onDeleted: () => void;
}

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'HIGH', label: '高' },
  { value: 'MEDIUM', label: '中' },
  { value: 'LOW', label: '低' },
];

export function CardDetailModal({ card, onClose, onUpdated, onDeleted }: Props) {
  const {
    updateCardAsync,
    deleteCardAsync,
    addChecklistItemAsync,
    updateChecklistItemAsync,
    deleteChecklistItemAsync,
    labels,
    loadLabels,
    addLabelToCardAsync,
    removeLabelFromCardAsync,
    columns,
  } = useBoardStore();

  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? '');
  const [priority, setPriority] = useState<Priority | ''>(card.priority ?? '');
  const [dueDate, setDueDate] = useState(card.dueDate ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // チェックリスト: ストアから最新のカード状態を読む
  const currentCard = columns
    .flatMap((col) => col.cards)
    .find((c) => c.id === card.id) ?? card;
  const checklistItems = currentCard.checklistItems;
  const cardLabels = currentCard.labels;

  const [newItemText, setNewItemText] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingItemText, setEditingItemText] = useState('');

  const overlayRef = useRef<HTMLDivElement>(null);
  const newItemInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadLabels();
  }, [loadLabels]);

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

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteCardAsync(card.id, card.columnId);
      onDeleted();
    } catch {
      setError('削除に失敗しました');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleAddChecklistItem = async () => {
    const text = newItemText.trim();
    if (!text) return;
    setIsAddingItem(true);
    try {
      await addChecklistItemAsync(card.id, text);
      setNewItemText('');
      newItemInputRef.current?.focus();
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleToggleItem = async (item: ChecklistItemResponse) => {
    await updateChecklistItemAsync(card.id, item.id, { completed: !item.completed });
  };

  const handleStartEditItem = (item: ChecklistItemResponse) => {
    setEditingItemId(item.id);
    setEditingItemText(item.text);
  };

  const handleSaveEditItem = async (itemId: number) => {
    const text = editingItemText.trim();
    if (text) {
      await updateChecklistItemAsync(card.id, itemId, { text });
    }
    setEditingItemId(null);
  };

  const handleDeleteChecklistItem = async (itemId: number) => {
    await deleteChecklistItemAsync(card.id, itemId);
  };

  const handleToggleLabel = async (labelId: number) => {
    const hasLabel = cardLabels.some((l) => l.id === labelId);
    if (hasLabel) {
      await removeLabelFromCardAsync(card.id, card.columnId, labelId);
    } else {
      await addLabelToCardAsync(card.id, card.columnId, labelId);
    }
  };

  const columnName = columns.find((c) => c.id === card.columnId)?.title ?? '';

  const completedCount = checklistItems.filter((i) => i.completed).length;
  const totalCount = checklistItems.length;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={handleOverlayClick}
    >
      <div
        className="relative w-full max-w-lg rounded-xl shadow-2xl p-6 flex flex-col gap-4 overflow-y-auto max-h-[90vh]"
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
            rows={3}
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

        {/* ラベル */}
        {labels.length > 0 && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-sub)' }}>
              ラベル
            </label>
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => {
                const isSelected = cardLabels.some((l) => l.id === label.id);
                return (
                  <button
                    key={label.id}
                    onClick={() => handleToggleLabel(label.id)}
                    className="text-xs px-3 py-1 rounded-full font-medium transition-all"
                    style={{
                      backgroundColor: isSelected ? label.color : 'var(--color-bg-column)',
                      color: isSelected ? '#fff' : 'var(--color-text-main)',
                      border: `2px solid ${label.color}`,
                      opacity: 1,
                    }}
                  >
                    {label.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* チェックリスト */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-sub)' }}>
              チェックリスト
              {totalCount > 0 && (
                <span className="ml-2 font-normal">
                  {completedCount}/{totalCount}
                </span>
              )}
            </label>
          </div>

          {/* 進捗バー */}
          {totalCount > 0 && (
            <div
              className="h-1.5 w-full rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--color-border)' }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.round((completedCount / totalCount) * 100)}%`,
                  backgroundColor: completedCount === totalCount ? '#22c55e' : '#3b82f6',
                }}
              />
            </div>
          )}

          {/* アイテム一覧 */}
          <ul className="flex flex-col gap-1">
            {[...checklistItems]
              .sort((a, b) => a.position - b.position)
              .map((item) => (
                <li key={item.id} className="flex items-center gap-2 group">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => handleToggleItem(item)}
                    className="shrink-0 w-4 h-4 cursor-pointer accent-blue-500"
                  />
                  {editingItemId === item.id ? (
                    <input
                      className="flex-1 text-sm bg-transparent border-b outline-none focus:border-blue-500"
                      style={{
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-main)',
                      }}
                      value={editingItemText}
                      onChange={(e) => setEditingItemText(e.target.value)}
                      onBlur={() => handleSaveEditItem(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEditItem(item.id);
                        if (e.key === 'Escape') setEditingItemId(null);
                      }}
                      autoFocus
                    />
                  ) : (
                    <span
                      className="flex-1 text-sm cursor-pointer"
                      style={{
                        color: item.completed ? 'var(--color-text-sub)' : 'var(--color-text-main)',
                        textDecoration: item.completed ? 'line-through' : 'none',
                      }}
                      onClick={() => handleStartEditItem(item)}
                    >
                      {item.text}
                    </span>
                  )}
                  <button
                    className="text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                    style={{ color: 'var(--color-text-sub)' }}
                    onClick={() => handleDeleteChecklistItem(item.id)}
                    aria-label="削除"
                  >
                    ✕
                  </button>
                </li>
              ))}
          </ul>

          {/* アイテム追加 */}
          <div className="flex gap-2 mt-1">
            <input
              ref={newItemInputRef}
              className="flex-1 text-sm rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                backgroundColor: 'var(--color-bg-column)',
                color: 'var(--color-text-main)',
                border: '1px solid var(--color-border)',
              }}
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddChecklistItem();
              }}
              placeholder="アイテムを追加..."
            />
            <button
              className="px-3 py-1 text-sm rounded-md font-medium text-white disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-bg-header)' }}
              onClick={handleAddChecklistItem}
              disabled={isAddingItem || !newItemText.trim()}
            >
              追加
            </button>
          </div>
        </div>

        {/* エラー */}
        {error && (
          <p className="text-sm" style={{ color: 'var(--color-overdue)' }}>
            {error}
          </p>
        )}

        {/* アクション */}
        <div className="flex justify-between items-center pt-2">
          <button
            className="px-4 py-2 text-sm rounded-md font-medium text-white disabled:opacity-60"
            style={{ backgroundColor: '#dc2626' }}
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isSaving || isDeleting}
          >
            削除
          </button>
          <div className="flex gap-2">
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
              disabled={isSaving || isDeleting}
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>

        {/* 削除確認ダイアログ */}
        {showDeleteConfirm && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-xl"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <div
              className="rounded-xl p-6 shadow-xl flex flex-col gap-4 w-72"
              style={{ backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-main)' }}
            >
              <p className="text-sm font-medium">このカードを削除しますか？</p>
              <p className="text-xs" style={{ color: 'var(--color-text-sub)' }}>
                「{card.title}」を削除します。この操作は元に戻せません。
              </p>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 text-sm rounded-md hover:brightness-95 transition-all"
                  style={{
                    backgroundColor: 'var(--color-bg-column)',
                    color: 'var(--color-text-main)',
                  }}
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  キャンセル
                </button>
                <button
                  className="px-4 py-2 text-sm rounded-md font-medium text-white disabled:opacity-60"
                  style={{ backgroundColor: '#dc2626' }}
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? '削除中...' : '削除する'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
