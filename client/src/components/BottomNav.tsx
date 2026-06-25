type Tab = 'home' | 'closet' | 'chat' | 'profile'

interface Props {
  active: Tab
  onChange: (tab: Tab) => void
}

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'home',    label: 'Home',    icon: '⌂' },
  { id: 'closet',  label: 'Closet',  icon: '◫' },
  { id: 'chat',    label: 'Chat',    icon: '✦' },
  { id: 'profile', label: 'Profile', icon: '◯' },
]

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="bottom-nav">
      {tabs.map(t => (
        <button
          key={t.id}
          className={`nav-item ${active === t.id ? 'nav-item--active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          <span className="nav-icon">{t.icon}</span>
          <span className="nav-label">{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
