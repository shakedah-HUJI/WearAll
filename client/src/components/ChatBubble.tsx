import type { Message } from '../types/chat'

interface Props {
  message: Message
}

export default function ChatBubble({ message }: Props) {
  const isMia = message.role === 'mia'
  return (
    <div className={`bubble-row ${isMia ? 'bubble-row--mia' : 'bubble-row--user'}`}>
      {isMia && <div className="bubble-avatar">M</div>}
      <div className={`bubble ${isMia ? 'bubble--mia' : 'bubble--user'}`}>
        {message.text}
      </div>
    </div>
  )
}
