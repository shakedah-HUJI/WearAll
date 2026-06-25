type Tab = 'wardrobe' | 'stylist'

interface Props {
  active: Tab
  onChange: (tab: Tab) => void
}

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="bottom-nav">
      <button
        className={`nav-item ${active === 'wardrobe' ? 'nav-item--active' : ''}`}
        onClick={() => onChange('wardrobe')}
      >
        <span className="nav-icon">👗</span>
        <span className="nav-label">Wardrobe</span>
      </button>
      <button
        className={`nav-item ${active === 'stylist' ? 'nav-item--active' : ''}`}
        onClick={() => onChange('stylist')}
      >
        <span className="nav-icon">✨</span>
        <span className="nav-label">Mia</span>
      </button>
    </nav>
  )
}
