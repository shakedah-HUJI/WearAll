import { useState } from 'react'
import type { ClothingItem } from '../types/clothing'

const STORAGE_KEY = 'wearall_wardrobe'

function load(): ClothingItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function save(items: ClothingItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function useWardrobe() {
  const [items, setItems] = useState<ClothingItem[]>(load)

  function addItem(imageUrl: string) {
    const next = [...items, { id: crypto.randomUUID(), imageUrl, addedAt: Date.now() }]
    setItems(next)
    save(next)
  }

  function removeItem(id: string) {
    const next = items.filter(item => item.id !== id)
    setItems(next)
    save(next)
  }

  return { items, addItem, removeItem }
}
