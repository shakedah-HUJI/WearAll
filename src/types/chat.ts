export interface OutfitSuggestion {
  outfit_id: string;
  item_ids: string[];
  rationale: string;
  highlight_item_id: string | null;
}

export type MessageContentType = "text" | "outfit" | "clarify";

export interface MessageContent {
  type: MessageContentType;
  text?: string;
  questions?: string[];
  outfits?: OutfitSuggestion[];
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: MessageContent;
  created_at: string;
}

export interface ChatThread {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
}

export interface WeatherContext {
  temp_c: number;
  feels_like_c: number;
  condition: string;
  humidity: number;
  wind_kph: number;
  description: string;
}
