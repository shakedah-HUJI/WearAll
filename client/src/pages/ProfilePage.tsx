import { useWardrobe } from '../hooks/useWardrobe'
import type { Category } from '../types/clothing'

const CATEGORIES: Category[] = ['Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories']

export default function ProfilePage() {
  const { items } = useWardrobe()

  const totalPieces = items.length
  const totalWears = items.reduce((s, i) => s + i.wears, 0)
  const avgPerItem = totalPieces > 0 ? (totalWears / totalPieces).toFixed(1) : '0'
  const worn = items.filter(i => i.wears > 0).length
  const neverWorn = totalPieces - worn
  const utilization = totalPieces > 0 ? Math.round((worn / totalPieces) * 100) : 0

  const mostLoved = items.length > 0
    ? items.reduce((a, b) => a.wears >= b.wears ? a : b)
    : null

  const catCounts = CATEGORIES.map(cat => ({
    cat,
    count: items.filter(i => i.category === cat).length,
  }))
  const maxCount = Math.max(...catCounts.map(c => c.count), 1)

  return (
    <div className="profile">
      <div className="profile-header">
        <h2 className="profile-header__title">My Profile</h2>
      </div>

      <div className="profile-avatar-wrap">
        <div className="profile-avatar">S</div>
        <div className="profile-avatar__cam">📷</div>
      </div>
      <p className="profile-name">Shaked</p>
      <p className="profile-edit">Tap to edit</p>

      <div className="profile-section-label">WARDROBE</div>

      <div className="profile-card">
        <div className="util-row">
          <span className="util-label">Utilization</span>
          <span className="util-pct">{utilization}%</span>
        </div>
        <div className="util-bar">
          <div className="util-bar__fill" style={{ width: `${utilization}%` }} />
        </div>
        <div className="util-sub">
          <span>✓ {worn} worn</span>
          <span className="util-sub__right">{neverWorn} never worn</span>
        </div>
      </div>

      <div className="profile-stats">
        <div className="stat-box"><p className="stat-box__val">{totalPieces}</p><p className="stat-box__label">PIECES</p></div>
        <div className="stat-box"><p className="stat-box__val">{totalWears}</p><p className="stat-box__label">WEARS</p></div>
        <div className="stat-box"><p className="stat-box__val">{avgPerItem}</p><p className="stat-box__label">AVG / ITEM</p></div>
      </div>

      {mostLoved && mostLoved.wears > 0 && (
        <div className="profile-card profile-card--loved">
          <p className="loved-label">MOST LOVED</p>
          <div className="loved-row">
            <img src={mostLoved.imageUrl} alt={mostLoved.name} className="loved-img" />
            <div>
              <p className="loved-name">{mostLoved.name}</p>
              <p className="loved-worn">worn {mostLoved.wears}×</p>
            </div>
          </div>
        </div>
      )}

      <div className="profile-section-label">BY CATEGORY</div>
      <div className="profile-card">
        {catCounts.map(({ cat, count }) => (
          <div key={cat} className="cat-row">
            <span className="cat-row__label">{cat}</span>
            <div className="cat-bar">
              <div className="cat-bar__fill" style={{ width: `${(count / maxCount) * 100}%` }} />
            </div>
            <span className="cat-row__count">{count}</span>
          </div>
        ))}
      </div>

      <button className="signout-btn">↪ Sign out</button>
    </div>
  )
}
