import { Product } from '../types';

const STORAGE_KEY = 'rifaq_products';

export function getStoredProducts(): Product[] | null {
  if (typeof window === 'undefined') return null;

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const products = JSON.parse(saved);
    return Array.isArray(products) ? products : null;
  } catch {
    return null;
  }
}

export function saveProducts(products: Product[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}