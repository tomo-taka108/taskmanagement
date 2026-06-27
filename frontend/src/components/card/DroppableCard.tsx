import { useDroppable } from '@dnd-kit/core';
import { CardItem } from './CardItem';
import type { CardResponse } from '../../types/api';

interface Props {
  card: CardResponse;
  isGhost?: boolean;
  onCardClick: (card: CardResponse) => void;
}

// カード1枚を「上半分ドロップゾーン」「カード本体」「下半分ドロップゾーン」に分割する。
// ドロップID の命名規則：
//   `before:{cardId}` … カードの前（上）に挿入
//   `after:{cardId}`  … カードの後（下）に挿入
export function DroppableCard({ card, isGhost, onCardClick }: Props) {
  const { setNodeRef: setBeforeRef, isOver: isOverBefore } = useDroppable({
    id: `before:${card.id}`,
  });
  const { setNodeRef: setAfterRef, isOver: isOverAfter } = useDroppable({
    id: `after:${card.id}`,
  });

  return (
    <div style={{ position: 'relative' }}>
      {/* 上半分ドロップゾーン */}
      <div
        ref={setBeforeRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          zIndex: 10,
          pointerEvents: 'auto',
        }}
      />

      {/* インジケーター（上） */}
      {isOverBefore && (
        <div
          style={{
            position: 'absolute',
            top: -2,
            left: 0,
            right: 0,
            height: 3,
            backgroundColor: 'var(--color-bg-header)',
            borderRadius: 2,
            zIndex: 20,
            pointerEvents: 'none',
          }}
        />
      )}

      <CardItem card={card} isGhost={isGhost} onClick={() => onCardClick(card)} />

      {/* インジケーター（下） */}
      {isOverAfter && (
        <div
          style={{
            position: 'absolute',
            bottom: -2,
            left: 0,
            right: 0,
            height: 3,
            backgroundColor: 'var(--color-bg-header)',
            borderRadius: 2,
            zIndex: 20,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* 下半分ドロップゾーン */}
      <div
        ref={setAfterRef}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '50%',
          zIndex: 10,
          pointerEvents: 'auto',
        }}
      />
    </div>
  );
}
