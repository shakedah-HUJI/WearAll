import { useRef } from 'react'
import { useWardrobe } from '../hooks/useWardrobe'
import ClothingCard from '../components/ClothingCard'

export default function WardrobePage() {
  const { items, addItem, removeItem } = useWardrobe()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => addItem(reader.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="wardrobe">
      <div className="wardrobe-header">
        <h2 className="page-title">My Wardrobe</h2>
        <button className="btn-add" onClick={() => inputRef.current?.click()}>
          + Add Item
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={handleFileChange}
        />
      </div>

      {items.length === 0 ? (
        <div className="wardrobe-empty">
          <p>No clothes yet.</p>
          <p>Tap <strong>+ Add Item</strong> to upload your first piece.</p>
        </div>
      ) : (
        <div className="wardrobe-grid">
          {items.map(item => (
            <ClothingCard key={item.id} item={item} onRemove={removeItem} />
          ))}
        </div>
      )}
    </div>
  )
}
