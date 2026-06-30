export interface Message {
  id: string
  role: 'user' | 'mia'
  text: string
  timestamp: number
}
