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
        const isActive  = card.id === activeCardId;
        const isTarget  =
          !isActive &&
          dropIndicator?.overCardId === card.id &&
          dropIndicator.overColumnId === columnId &&
          !dropIndicator.isOverColumn;

        // insertAfter=false → このカードの前に線、insertAfter=true → このカードの後に線
        const showBefore = isTarget && !dropIndicator!.insertAfter;
        const showAfter  = isTarget && dropIndicator!.insertAfter;

        return (
          <div key={card.id}>
            {showBefore && <DropLine />}
            <CardItem
              card={card}
              onClick={() => onCardClick(card)}
            />
            {showAfter && <DropLine />}
          </div>
        );
      })}
    </>
  );
}
