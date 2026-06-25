import { useState } from 'react'
import BottomNav from './components/BottomNav'
import HomePage from './pages/HomePage'
import WardrobePage from './pages/WardrobePage'
import StylistPage from './pages/StylistPage'
import ProfilePage from './pages/ProfilePage'

type Tab = 'home' | 'closet' | 'chat' | 'profile'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [chatPrefill, setChatPrefill] = useState<string | undefined>()

  function navigateTo(tab: string, prefill?: string) {
    setActiveTab(tab as Tab)
    if (prefill) setChatPrefill(prefill)
  }

  return (
    <div className="app-shell">
      <main className="app-content">
        {activeTab === 'home'    && <HomePage onNavigate={navigateTo} />}
        {activeTab === 'closet'  && <WardrobePage />}
        {activeTab === 'chat'    && <StylistPage prefill={chatPrefill} onPrefillUsed={() => setChatPrefill(undefined)} />}
        {activeTab === 'profile' && <ProfilePage />}
      </main>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  )
}
