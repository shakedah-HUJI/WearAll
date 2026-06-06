"use client";

import { useState, useCallback, useRef } from "react";
import { ChatMessage } from "@/types/chat";

interface UseChatOptions {
  threadId?: string;
  initialMessages?: ChatMessage[];
}

export function useChat({ threadId: initialThreadId, initialMessages = [] }: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [threadId, setThreadId] = useState<string | undefined>(initialThreadId);
  const [isLoading, setIsLoading] = useState(false);
  const locationRef = useRef<{ lat: number; lon: number } | null>(null);

  // Grab geolocation once
  function captureLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        locationRef.current = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        };
      },
      () => {} // silently ignore denial
    );
  }

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      // Optimistically add user message
      const tempUserMsg: ChatMessage = {
        id: `temp-${Date.now()}`,
        thread_id: threadId ?? "",
        user_id: "",
        role: "user",
        content: { type: "text", text },
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMsg]);
      setIsLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            threadId,
            lat: locationRef.current?.lat,
            lon: locationRef.current?.lon,
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        if (!threadId && data.threadId) {
          setThreadId(data.threadId);
        }

        // Replace temp message + add assistant response
        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => m.id !== tempUserMsg.id);
          const assistant = data.message as ChatMessage;
          return [...withoutTemp, tempUserMsg, assistant];
        });
      } catch {
        // Keep the user's message visible and show a retry prompt
        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          thread_id: threadId ?? "",
          user_id: "",
          role: "assistant",
          content: { type: "text", text: "Something went wrong on my end — please try sending that again." },
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [threadId, isLoading]
  );

  return { messages, threadId, isLoading, sendMessage, captureLocation };
}
