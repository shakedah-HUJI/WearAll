import { useState } from 'react'
import type { Category } from '../types/clothing'

const CATEGORIES: Category[] = ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories']

interface Props {
  imageUrl: string
  onSave: (name: string, category: Category, color?: string) => void
  onCancel: () => void
}

export default function AddItemModal({ imageUrl, onSave, onCancel }: Props) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category | null>(null)
  const [color, setColor] = useState('')

  function handleSave() {
    if (!name.trim() || !category) return
    onSave(name.trim(), category, color.trim() || undefined)
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <img src={imageUrl} alt="preview" className="modal-preview" />
        <div className="modal-body">
          <input
            className="modal-input"
            type="text"
            placeholder="Item name (e.g. White T-Shirt)"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            className="modal-input"
            type="text"
            placeholder="Color (optional)"
            value={color}
            onChange={e => setColor(e.target.value)}
          />
          <div className="modal-cats">
            {CATEGORIES.map(c => (
              <button
                key={c}
                className={`modal-cat ${category === c ? 'modal-cat--active' : ''}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="modal-actions">
            <button className="modal-btn modal-btn--cancel" onClick={onCancel}>Cancel</button>
            <button
              className="modal-btn modal-btn--save"
              onClick={handleSave}
              disabled={!name.trim() || !category}
            >
              Add to Closet
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
