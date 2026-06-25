type Tab = 'home' | 'closet' | 'chat' | 'profile'

interface Props {
  active: Tab
  onChange: (tab: Tab) => void
}

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#1a1a1a' : '#bbb'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  )
}

function IconCloset({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#1a1a1a' : '#bbb'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4a2 2 0 100 4 2 2 0 000-4z"/>
      <path d="M12 8c-5 0-8 2.5-8 5l8 7 8-7c0-2.5-3-5-8-5z"/>
    </svg>
  )
}

function IconChat({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#1a1a1a' : '#bbb'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 4.8L20 8l-4 3.9.9 5.6L12 15l-4.9 2.5.9-5.6L4 8l5.6-1.2L12 2z"/>
      <path d="M18 18l3 3" strokeWidth="2"/>
      <circle cx="18" cy="18" r="0.5" fill={active ? '#1a1a1a' : '#bbb'}/>
    </svg>
  )
}

function IconProfile({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#1a1a1a' : '#bbb'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  )
}

const tabs: { id: Tab; label: string }[] = [
  { id: 'home',    label: 'Home' },
  { id: 'closet',  label: 'Closet' },
  { id: 'chat',    label: 'Chat' },
  { id: 'profile', label: 'Profile' },
]

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="bottom-nav">
      {tabs.map(t => (
        <button key={t.id} className={`nav-item ${active === t.id ? 'nav-item--active' : ''}`} onClick={() => onChange(t.id)}>
          {t.id === 'home'    && <IconHome    active={active === t.id} />}
          {t.id === 'closet'  && <IconCloset  active={active === t.id} />}
          {t.id === 'chat'    && <IconChat    active={active === t.id} />}
          {t.id === 'profile' && <IconProfile active={active === t.id} />}
          <span className="nav-label">{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
