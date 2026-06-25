import type { ClothingItem } from '../types/clothing'

interface Props {
  item: ClothingItem
  onRemove: (id: string) => void
}

export default function ClothingCard({ item, onRemove }: Props) {
  return (
    <div className="clothing-card">
      <img src={item.imageUrl} alt="clothing item" className="clothing-card__img" />
      <button
        className="clothing-card__remove"
        onClick={() => onRemove(item.id)}
        aria-label="Remove item"
      >
        ×
      </button>
    </div>
  )
}
