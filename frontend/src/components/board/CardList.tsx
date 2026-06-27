import type { CardResponse } from '../../types/api';
import { DroppableCard } from '../card/DroppableCard';

interface Props {
  cards: CardResponse[];
  ghostCardId: number | null;
  onCardClick: (card: CardResponse) => void;
}

export function CardList({ cards, ghostCardId, onCardClick }: Props) {
  return (
    <>
      {cards.map((card) => (
        <DroppableCard
          key={card.id}
          card={card}
          isGhost={card.id === ghostCardId}
          onCardClick={onCardClick}
        />
      ))}
    </>
  );
}
