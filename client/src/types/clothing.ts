export type Category = 'Tops' | 'Bottoms' | 'Dresses' | 'Outerwear' | 'Shoes' | 'Accessories'

export interface ClothingItem {
  id: string
  imageUrl: string
  name: string
  category: Category
  color?: string
  wears: number
  addedAt: number
}
