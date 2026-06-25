import { useState } from 'react'
import BottomNav from './components/BottomNav'
import WardrobePage from './pages/WardrobePage'
import StylistPage from './pages/StylistPage'

type Tab = 'wardrobe' | 'stylist'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('wardrobe')

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-logo">WearAll</span>
      </header>

      <main className="app-content">
        {activeTab === 'wardrobe' && <WardrobePage />}
        {activeTab === 'stylist' && <StylistPage />}
      </main>

      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  )
}
