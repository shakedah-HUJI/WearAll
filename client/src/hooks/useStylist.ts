import { useState } from 'react'
import type { Message } from '../types/chat'

const GREETING: Message = {
  id: 'greeting',
  role: 'mia',
  text: "Hi! I'm Mia, your personal stylist 👗 Tell me what you're looking for and I'll put together an outfit from your wardrobe.",
  timestamp: Date.now(),
}

export function useStylist() {
  const [messages, setMessages] = useState<Message[]>([GREETING])
  const [loading, setLoading] = useState(false)

  async function sendMessage(text: string) {
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text, timestamp: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    // Placeholder — real AI response wired in next commit
    await new Promise(r => setTimeout(r, 800))
    const miaMsg: Message = {
      id: crypto.randomUUID(),
      role: 'mia',
      text: "I'm not connected to AI yet — stay tuned! 🔌",
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, miaMsg])
    setLoading(false)
  }

  return { messages, loading, sendMessage }
}
