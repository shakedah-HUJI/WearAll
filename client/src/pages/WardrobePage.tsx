import { useRef, useState } from 'react'
import { useWardrobe } from '../hooks/useWardrobe'
import AddItemModal from '../components/AddItemModal'
import type { Category } from '../types/clothing'

const FILTERS: Array<Category | 'All'> = ['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories']

export default function WardrobePage() {
  const { items, addItem, removeItem } = useWardrobe()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const [filter, setFilter] = useState<Category | 'All'>('All')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPendingImage(reader.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function handleSave(name: string, category: Category, color?: string) {
    if (!pendingImage) return
    addItem(pendingImage, name, category, color)
    setPendingImage(null)
  }

  const filtered = filter === 'All' ? items : items.filter(i => i.category === filter)
  const rarelyWorn = filtered.filter(i => i.wears === 0)
  const categories = FILTERS.slice(1) as Category[]

  return (
    <div className="closet">
      {pendingImage && (
        <AddItemModal
          imageUrl={pendingImage}
          onSave={handleSave}
          onCancel={() => setPendingImage(null)}
        />
      )}

      <div className="closet-header">
        <div>
          <h2 className="closet-title">MY CLOSET</h2>
          <p className="closet-count">{items.length} items</p>
        </div>
        <div className="closet-header-actions">
          <button className="btn-basics" onClick={() => inputRef.current?.click()}>+ ADD BASICS</button>
          <button className="btn-plus" onClick={() => inputRef.current?.click()}>+</button>
        </div>
        <input ref={inputRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFileChange} />
      </div>

      <div className="filter-pills">
        {FILTERS.map(f => (
          <button key={f} className={`filter-pill ${filter === f ? 'filter-pill--active' : ''}`} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      <div className="closet-content">
        {rarelyWorn.length > 0 && (
          <section className="closet-section">
            <p className="closet-section__label">RARELY WORN <span>{rarelyWorn.length} items</span></p>
            <div className="closet-grid">
              {rarelyWorn.map(item => (
                <div key={item.id} className="item-card">
                  <div className="item-card__img-wrap">
                    <img src={item.imageUrl} alt={item.name} className="item-card__img" />
                    <button className="item-card__remove" onClick={() => removeItem(item.id)}>×</button>
                  </div>
                  <p className="item-card__name">{item.name}</p>
                  <p className="item-card__worn">worn {item.wears}×</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {categories.map(cat => {
          const catItems = filtered.filter(i => i.category === cat && i.wears > 0)
          if (catItems.length === 0) return null
          return (
            <section key={cat} className="closet-section">
              <p className="closet-section__label">{cat.toUpperCase()} <span>{catItems.length} items</span></p>
              <div className="closet-grid">
                {catItems.map(item => (
                  <div key={item.id} className="item-card">
                    <div className="item-card__img-wrap">
                      <img src={item.imageUrl} alt={item.name} className="item-card__img" />
                      {item.color && <span className="item-card__color">{item.color.toUpperCase()}</span>}
                      <button className="item-card__remove" onClick={() => removeItem(item.id)}>×</button>
                    </div>
                    <p className="item-card__name">{item.name}</p>
                    <p className="item-card__worn">worn {item.wears}×</p>
                  </div>
                ))}
              </div>
            </section>
          )
        })}

        {filtered.length === 0 && (
          <div className="closet-empty">
            <p>No items yet.</p>
            <p>Tap <strong>+</strong> to add your first piece.</p>
          </div>
        )}
      </div>
    </div>
  )
}
