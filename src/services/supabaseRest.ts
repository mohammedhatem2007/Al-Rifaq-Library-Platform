import { AppConfig, DeliveryArea, PaymentAccounts, Product } from '../types';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://szdyxrszodqfnahmxjpz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6ZHl4cnN6b2RxZm5haG14anB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0MTU2MTEsImV4cCI6MjEwMjk5MTYxMX0.OHYZOujMK_Rv0enERNCIRjAOtLipAvmBzK7e1v_K8Xs';
const configured = true;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

type DeliveryZoneRow = { id: string; name: string; price: number };

function toDeliveryArea(row: DeliveryZoneRow): DeliveryArea {
  return { id: row.id, name: row.name, fee: row.price };
}

export async function getDeliveryZones(): Promise<DeliveryArea[]> {
  const { data: rows, error } = await supabase
    .from('delivery_zones')
    .select('id,name,price')
    .order('name', { ascending: true });
  if (error) throw error;
  return ((rows || []) as DeliveryZoneRow[]).map(toDeliveryArea);
}

export async function addDeliveryZone(zone: DeliveryArea): Promise<{ success: boolean; zone?: DeliveryArea; error?: string }> {
  const fallbackZone: DeliveryArea = { id: zone.id || String(Date.now()), name: zone.name, fee: zone.fee };
  try {
    const { error } = await supabase
      .from('delivery_zones')
      .upsert({ id: fallbackZone.id, name: fallbackZone.name, price: fallbackZone.fee }, { onConflict: 'id', ignoreDuplicates: false });
    if (error) throw error;
    return { success: true, zone: fallbackZone };
  } catch (error) {
    return { success: false, zone: fallbackZone, error: error instanceof Error ? error.message : 'تعذر حفظ منطقة التوصيل' };
  }
}

export async function deleteDeliveryZone(zoneId: string): Promise<void> {
  const { error } = await supabase.from('delivery_zones').delete().eq('id', zoneId);
  if (error) throw error;
}

export const readDeliveryZones = async (): Promise<DeliveryArea[] | null> => {
  const zones = await getDeliveryZones();
  return zones.length > 0 ? zones : null;
};

export async function writeDeliveryZones(zones: DeliveryArea[]): Promise<void> {
  const existing = await getDeliveryZones();
  const { error } = await supabase
    .from('delivery_zones')
    .upsert(zones.map(({ id, name, fee }) => ({ id, name, price: fee })), { onConflict: 'id' });
  if (error) throw error;

  const retained = new Set(zones.map((zone) => zone.id));
  const removed = existing.filter((zone) => !retained.has(zone.id)).map((zone) => zone.id);
  if (removed.length > 0) {
    const { error: deleteError } = await supabase.from('delivery_zones').delete().in('id', removed);
    if (deleteError) throw deleteError;
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