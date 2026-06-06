"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ChatMessage } from "@/types/chat";

interface UseChatOptions {
  threadId?: string;
  initialMessages?: ChatMessage[];
}

export function useChat({ threadId: initialThreadId, initialMessages = [] }: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [threadId, setThreadId] = useState<string | undefined>(initialThreadId);
  const [isLoading, setIsLoading] = useState(false);
  // Ref-based guard so sendMessage doesn't need isLoading in its deps.
  // A state-based guard causes sendMessage to be recreated on every load
  // state change, which makes chat page effects fire spuriously.
  const loadingRef = useRef(false);
  const locationRef = useRef<{ lat: number; lon: number } | null>(null);

  // Capture location once on mount
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        locationRef.current = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        };
      },
      () => {}
    );
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loadingRef.current) return;

      const tempUserMsg: ChatMessage = {
        id: `temp-${Date.now()}`,
        thread_id: threadId ?? "",
        user_id: "",
        role: "user",
        content: { type: "text", text },
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMsg]);
      loadingRef.current = true;
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

        // If the DB insert failed silently the server returns message:null,
        // which would crash ChatBubble trying to read msg.id on null.
        if (!data.message) throw new Error("empty response from server");

        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => m.id !== tempUserMsg.id);
          const assistant = data.message as ChatMessage;
          return [...withoutTemp, tempUserMsg, assistant];
        });
      } catch {
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
        loadingRef.current = false;
        setIsLoading(false);
      }
    },
    [threadId]
  );

  return { messages, threadId, isLoading, sendMessage };
}
