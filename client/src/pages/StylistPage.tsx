import { useState, useEffect, useRef } from 'react'
import { useStylist } from '../hooks/useStylist'
import ChatBubble from '../components/ChatBubble'

const SCENARIOS = [
  { icon: '✈️', title: 'Pack for a Trip',      subtitle: 'Capsule wardrobe for your destination', prompt: 'Help me pack for a trip.' },
  { icon: '💼', title: 'Daily Casual / Work',   subtitle: 'University, office, errands',          prompt: 'Suggest a daily casual or work outfit.' },
  { icon: '🌙', title: 'Night Out / Event',     subtitle: 'Dinner, party, special occasion',      prompt: 'What should I wear for a night out?' },
]

interface Props {
  prefill?: string
  onPrefillUsed?: () => void
}

export default function StylistPage({ prefill, onPrefillUsed }: Props) {
  const { messages, loading, sendMessage } = useStylist()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const started = messages.some(m => m.role === 'user')

  useEffect(() => {
    if (prefill) {
      sendMessage(prefill)
      onPrefillUsed?.()
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    setInput('')
    sendMessage(text)
  }

  return (
    <div className="chat">
      {!started ? (
        <div className="mia-intro">
          <div className="mia-intro__avatar">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4a2 2 0 100 4 2 2 0 000-4z"/>
              <path d="M12 8c-5 0-8 2.5-8 5l8 7 8-7c0-2.5-3-5-8-5z"/>
            </svg>
          </div>
          <h2 className="mia-intro__name">Mia</h2>
          <p className="mia-intro__role">YOUR AI STYLIST</p>
          <p className="mia-intro__desc">Tell me your plans and I'll build looks from your closet.</p>
          <p className="mia-intro__or">OR PICK A SCENARIO</p>
          <div className="mia-scenarios">
            {SCENARIOS.map(s => (
              <button key={s.title} className="scenario-card" onClick={() => sendMessage(s.prompt)}>
                <span className="scenario-card__icon">{s.icon}</span>
                <div className="scenario-card__text">
                  <p className="scenario-card__title">{s.title}</p>
                  <p className="scenario-card__subtitle">{s.subtitle}</p>
                </div>
                <span className="scenario-card__chevron">›</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="chat-thread">
          {messages.map(msg => <ChatBubble key={msg.id} message={msg} />)}
          {loading && (
            <div className="bubble-row bubble-row--mia">
              <div className="bubble-avatar">M</div>
              <div className="bubble bubble--mia bubble--typing"><span /><span /><span /></div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      <form className="chat-input-bar" onSubmit={handleSubmit}>
        <input
          className="chat-input"
          type="text"
          placeholder="Reply or ask for a tweak..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button className="chat-send" type="submit" disabled={!input.trim()}>↑</button>
      </form>
    </div>
  )
}
