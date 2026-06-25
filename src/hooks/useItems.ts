import useSWR from "swr";
import { useMemo } from "react";
import { ClothingItem, ItemCategory } from "@/types/item";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export interface ItemFilters {
  category?: ItemCategory | "all";
  color?: string;
}

export function useItems(filters?: ItemFilters) {
  const { data, error, isLoading, mutate } = useSWR<ClothingItem[]>(
    "/api/items",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );

  const filtered = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return data.filter((item) => {
      if (filters?.category && filters.category !== "all") {
        if (item.category !== filters.category) return false;
      }
      if (filters?.color) {
        const q = filters.color.toLowerCase();
        if (
          !item.primary_color?.toLowerCase().includes(q) &&
          !item.secondary_colors?.some((c) => c.toLowerCase().includes(q))
        ) {
          return false;
        }
      }
      return true;
    });
  }, [data, filters?.category, filters?.color]);

  async function deleteItem(id: string) {
    // Optimistic update
    mutate(data?.filter((i) => i.id !== id), false);
    await fetch(`/api/items/${id}`, { method: "DELETE" });
    mutate();
  }

  return {
    items: filtered,
    allItems: Array.isArray(data) ? data : [],
    isLoading,
    error,
    mutate,
    deleteItem,
  };
}
