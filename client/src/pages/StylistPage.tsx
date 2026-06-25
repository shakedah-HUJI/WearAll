import { useState, useEffect, useRef } from 'react'
import { useStylist } from '../hooks/useStylist'
import ChatBubble from '../components/ChatBubble'

export default function StylistPage() {
  const { messages, loading, sendMessage } = useStylist()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

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
      <div className="chat-thread">
        {messages.map(msg => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        {loading && (
          <div className="bubble-row bubble-row--mia">
            <div className="bubble-avatar">M</div>
            <div className="bubble bubble--mia bubble--typing">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input-bar" onSubmit={handleSubmit}>
        <input
          className="chat-input"
          type="text"
          placeholder="Ask Mia anything..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button className="chat-send" type="submit" disabled={!input.trim()}>
          ↑
        </button>
      </form>
    </div>
  )
}
