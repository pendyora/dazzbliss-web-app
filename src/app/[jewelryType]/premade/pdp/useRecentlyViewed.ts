'use client';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'recentlyViewedProducts';
const LIMIT = 10;

/** Card props in the same shape as the suggestion slice, so ProductProfile can render them. */
export interface RecentlyViewedCard {
  jewelry_id: string;
  sku_master_id: string;
  slug: string;
  productName: string;
  productImage: string;
  productHoverImage: string;
  productPrice: number | string;
  jewelryTypeData: string;
  jewelry_type?: string;
  jewelryDetails: Record<string, any>;
  is_customizable: boolean;
  isWishlist?: string | null;
  discount_type?: any;
  discount_value?: any;
  discounted_price?: any;
}

function read(): RecentlyViewedCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Records `current` (when given) and returns the other recently viewed products, newest first. */
export default function useRecentlyViewed(current: RecentlyViewedCard | null) {
  const [items, setItems] = useState<RecentlyViewedCard[]>([]);
  const currentId = current?.jewelry_id ?? null;

  useEffect(() => {
    const stored = read();
    if (!current) {
      setItems(stored);
      return;
    }
    const next = [current, ...stored.filter((p) => p.jewelry_id !== current.jewelry_id)].slice(0, LIMIT);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage full or blocked: the strip just stays session-less.
    }
    setItems(next);
    // Re-record only when the product (or its selected SKU) changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, current?.sku_master_id]);

  return items.filter((p) => p.jewelry_id !== currentId);
}
