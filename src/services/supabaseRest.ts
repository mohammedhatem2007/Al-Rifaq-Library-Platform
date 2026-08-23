import { AppConfig, DeliveryArea, PaymentAccounts, Product } from '../types';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const configured = Boolean(supabaseUrl && supabaseAnonKey);
const supabase = configured ? createClient(supabaseUrl as string, supabaseAnonKey as string) : null;

type SettingRow = { id: string; data: unknown };
type ProductRow = {
  id: string;
  name: string;
  category: Product['category'];
  price: number;
  originalprice: number | null;
  discount: number | null;
  image: string;
  description: string;
  instock: boolean;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!configured) throw new Error('Supabase is not configured');
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
      ...options,
      headers: {
        apikey: supabaseAnonKey as string,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    if (!response.ok) throw new Error(`Supabase request failed (${response.status})`);
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  } catch (error) {
    console.error('Supabase connection error:', error);
    throw error;
  }
}

export function isSupabaseConfigured(): boolean {
  return configured;
}

export async function readSetting<T>(id: string): Promise<T | null> {
  const rows = await request<SettingRow[]>(`platform_settings?id=eq.${encodeURIComponent(id)}&select=data`);
  return rows[0] ? rows[0].data as T : null;
}

export async function writeSetting(id: string, data: unknown): Promise<void> {
  await request('platform_settings?on_conflict=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ id, data, updated_at: new Date().toISOString() }),
  });
}

export async function readProducts(): Promise<Product[] | null> {
  const rows = await request<ProductRow[]>('products?select=id,name,category,price,originalprice,discount,image,description,instock&order=id.asc');
  return rows.length > 0 ? rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    categoryLabel: row.category,
    price: row.price,
    originalPrice: row.originalprice ?? undefined,
    discountPercentage: row.discount ?? undefined,
    image: row.image,
    description: row.description,
    inStock: row.instock,
  })) : null;
}

type DeliveryZoneRow = { id: string; name: string; fee: number };

export async function readDeliveryZones(): Promise<DeliveryArea[] | null> {
  const rows = await request<DeliveryZoneRow[]>('delivery_zones?select=id,name,fee&order=name.asc');
  return rows.length > 0 ? rows : null;
}

export async function writeDeliveryZones(zones: DeliveryArea[]): Promise<void> {
  const existing = await readDeliveryZones();
  await request('delivery_zones?on_conflict=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(zones.map((zone) => ({ ...zone, updated_at: new Date().toISOString() }))),
  });

  const retained = new Set(zones.map((zone) => zone.id));
  const removed = (existing || []).filter((zone) => !retained.has(zone.id)).map((zone) => zone.id);
  if (removed.length > 0) {
    await request(`delivery_zones?id=in.(${removed.map(encodeURIComponent).join(',')})`, { method: 'DELETE' });
  }
}

export function subscribeToCatalog(
  onProductsChanged: (products: Product[]) => void,
  onZonesChanged: (zones: DeliveryArea[]) => void
): (() => void) | null {
  if (!supabase) return null;

  let products: Product[] = [];
  let zones: DeliveryArea[] = [];
  let productsLoaded = false;
  let zonesLoaded = false;

  const channel: RealtimeChannel = supabase
    .channel('catalog-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
      products = (await readProducts()) || [];
      productsLoaded = true;
      onProductsChanged(products);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_zones' }, async () => {
      zones = (await readDeliveryZones()) || [];
      zonesLoaded = true;
      onZonesChanged(zones);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        void Promise.all([readProducts(), readDeliveryZones()]).then(([latestProducts, latestZones]) => {
          if (!productsLoaded) onProductsChanged(latestProducts || products);
          if (!zonesLoaded) onZonesChanged(latestZones || zones);
        }).catch((error) => console.warn('Catalog realtime sync failed:', error));
      }
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}

export type CloudSettings = {
  config?: AppConfig;
  paymentAccounts?: PaymentAccounts;
};