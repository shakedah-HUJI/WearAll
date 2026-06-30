import { useState } from 'react'
import type { ClothingItem, Category } from '../types/clothing'

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

  function addItem(imageUrl: string, name: string, category: Category, color?: string) {
    const next = [...items, {
      id: crypto.randomUUID(),
      imageUrl,
      name,
      category,
      color,
      wears: 0,
      addedAt: Date.now(),
    }]
    setItems(next)
    save(next)
  }

  function removeItem(id: string) {
    const next = items.filter(i => i.id !== id)
    setItems(next)
    save(next)
  }

  function incrementWear(id: string) {
    const next = items.map(i => i.id === id ? { ...i, wears: i.wears + 1 } : i)
    setItems(next)
    save(next)
  }

  return { items, addItem, removeItem, incrementWear }
}
