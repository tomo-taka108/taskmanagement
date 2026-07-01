import type { CardResponse } from '../../types/api';
import type { DropIndicatorInfo } from './BoardView';
import { CardItem } from '../card/CardItem';
import { DropLine } from './Column';

interface Props {
  cards: CardResponse[];
  onCardClick: (card: CardResponse) => void;
  dropIndicator?: DropIndicatorInfo | null;
  activeCardId?: number | null;
  columnId?: number;
}

export function CardList({ cards, onCardClick, dropIndicator, activeCardId, columnId }: Props) {
  return (
    <>
      {cards.map((card) => {
        const isActive = card.id === activeCardId;

        // ドラッグ中のカード自身の直前には表示しない。それ以外で over されているカードの直前に表示する。
        const showBeforeIndicator =
          !isActive &&
          dropIndicator?.overCardId === card.id &&
          dropIndicator.overColumnId === columnId &&
          !dropIndicator.isOverColumn;

        return (
          <div key={card.id}>
            {showBeforeIndicator && <DropLine />}
            <CardItem
              card={card}
              onClick={() => onCardClick(card)}
            />
          </div>
        );
      })}
    </>
  );
}
