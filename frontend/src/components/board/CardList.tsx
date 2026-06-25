import type { CardResponse } from '../../types/api';
import { CardItem } from '../card/CardItem';

interface Props {
  cards: CardResponse[];
  onCardClick: (card: CardResponse) => void;
}

export function CardList({ cards, onCardClick }: Props) {
  return (
    <>
      {cards.map((card) => (
        <CardItem key={card.id} card={card} onClick={() => onCardClick(card)} />
      ))}
    </>
  );
}
