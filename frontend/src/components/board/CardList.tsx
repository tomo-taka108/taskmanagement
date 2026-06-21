import type { CardResponse } from '../../types/api';
import { CardItem } from '../card/CardItem';

interface Props {
  cards: CardResponse[];
}

export function CardList({ cards }: Props) {
  const sorted = [...cards].sort((a, b) => a.position - b.position);

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((card) => (
        <CardItem key={card.id} card={card} />
      ))}
    </div>
  );
}
