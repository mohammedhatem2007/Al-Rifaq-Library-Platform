import { AppConfig, DeliveryArea, Order, PricingConfig, SectionAvailability, Product } from '../types';
import { DEFAULT_PRICING, DEFAULT_AVAILABILITY, PRODUCTS_DATA } from '../data/mockData';
import { createClient } from '@supabase/supabase-js';
import { isSupabaseConfigured, readSetting, writeSetting } from './supabaseRest';

const CONFIG_KEY = 'rifaq_app_config';
const ORDERS_KEY = 'rifaq_orders';
const PASSWORD_KEY = 'rifaq_admin_password';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

type ProductRow = { id: string; data: Product };
type DeliveryZoneRow = DeliveryArea;

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}

function defaultConfig(): AppConfig {
  return {
    pricing: DEFAULT_PRICING,
    availability: DEFAULT_AVAILABILITY,
    deliveryAreas: [],
    adminEmail: 'mnassar37@smail.ucas.edu.ps',
    whatsappNumber: '+972592480383',
  };
}

export async function fetchAppConfig(): Promise<AppConfig> {
  const localConfig = { ...defaultConfig(), ...readStorage<Partial<AppConfig>>(CONFIG_KEY, {}) };
  if (isSupabaseConfigured()) {
    try {
      const cloudConfig = await readSetting<AppConfig>('app_config');
      if (cloudConfig) {
        writeStorage(CONFIG_KEY, cloudConfig);
        return cloudConfig;
      }
    } catch (error) {
      console.warn('Using local config fallback:', error);
    }
  }
  return localConfig;
}

export async function updateAppConfig(
  pricing: PricingConfig,
  availability: SectionAvailability,
  _adminPassword: string,
  deliveryAreas?: import('../types').DeliveryArea[]
): Promise<{ success: boolean; error?: string }> {
  const config = await fetchAppConfig();
  const updatedConfig = { ...config, pricing, availability, deliveryAreas: deliveryAreas || config.deliveryAreas };
  writeStorage(CONFIG_KEY, updatedConfig);
  if (isSupabaseConfigured()) {
    try {
      await writeSetting('app_config', updatedConfig);
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'تعذر حفظ الإعدادات السحابية' };
    }
  }
  return { success: true };
}

export async function updateAdminPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const current = readStorage(PASSWORD_KEY, 'rifaq2026');
  if (currentPassword !== current) return { success: false, error: 'كلمة المرور الحالية غير صحيحة' };
  writeStorage(PASSWORD_KEY, newPassword);
  return { success: true };
}

export async function fetchProducts(): Promise<Product[]> {
  if (supabase) {
    try {
      const { data: rows, error } = await supabase
        .from('products')
        .select('id,data')
        .order('created_at', { ascending: true });
      if (error) throw error;

      if (rows && rows.length > 0) {
        const products = (rows as ProductRow[]).map((row) => row.data || ({ id: row.id } as Product));
        return products;
      }

      const { error: seedError } = await supabase.from('products').upsert(
        PRODUCTS_DATA.map((product) => ({ id: product.id, data: product })),
        { onConflict: 'id' }
      );
      if (seedError) throw seedError;
      return PRODUCTS_DATA;
    } catch (error) {
      console.warn('Using local products fallback:', error);
    }
  }
  return PRODUCTS_DATA;
}

export async function fetchDeliveryZones(): Promise<DeliveryArea[]> {
  if (supabase) {
    try {
      const { data: zones, error } = await supabase
        .from('delivery_zones')
        .select('id,name,fee')
        .order('name', { ascending: true });
      if (error) throw error;
      const cloudZones = (zones || []) as DeliveryZoneRow[];
      return cloudZones;
    } catch (error) {
      console.warn('Using local delivery zones fallback:', error);
    }
  }
  return [];
}

export async function updateDeliveryZones(zones: DeliveryArea[]): Promise<{ success: boolean; error?: string }> {
  if (supabase) {
    try {
      const { data: existingZones, error: readError } = await supabase
        .from('delivery_zones')
        .select('id');
      if (readError) throw readError;

      const { error: upsertError } = await supabase
        .from('delivery_zones')
        .upsert(zones, { onConflict: 'id' });
      if (upsertError) throw upsertError;

      const retainedIds = new Set(zones.map((zone) => zone.id));
      const removedIds = (existingZones || [])
        .map((zone) => zone.id as string)
        .filter((id) => !retainedIds.has(id));
      if (removedIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('delivery_zones')
          .delete()
          .in('id', removedIds);
        if (deleteError) throw deleteError;
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'تعذر حفظ مناطق التوصيل السحابية' };
    }
  }
  return { success: true };
}

export async function createProduct(
  productData: Partial<Product>,
  _adminPassword: string
): Promise<{ success: boolean; product?: Product; error?: string }> {
  const product = { id: productData.id || `product-${Date.now()}`, categoryLabel: '', ...productData } as Product;
  try {
    if (supabase) {
      const { error } = await supabase
        .from('products')
        .upsert({ id: product.id, data: product }, { onConflict: 'id' });
      if (error) throw error;
    }
    return { success: true, product };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'تعذر حفظ المنتج' };
  }
}

export async function updateProduct(
  productId: string,
  productData: Partial<Product>,
  _adminPassword: string
): Promise<{ success: boolean; product?: Product; error?: string }> {
  try {
    const products = await fetchProducts();
    const existing = products.find((item) => item.id === productId);
    if (!existing) return { success: false, error: 'المنتج غير موجود' };
    const product = { ...existing, ...productData };
    if (supabase) {
      const { error } = await supabase
        .from('products')
        .upsert({ id: product.id, data: product }, { onConflict: 'id' });
      if (error) throw error;
    }
    return { success: true, product };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'تعذر تعديل المنتج' };
  }
}

export async function deleteProduct(
  productId: string,
  _adminPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (supabase) {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'تعذر حذف المنتج' };
  }
}

export async function submitOrder(orderData: Partial<Order>): Promise<{ success: boolean; order?: Order; error?: string }> {
  const orders = readStorage<Order[]>(ORDERS_KEY, []);
  const id = `RIFAQ-${Math.floor(1000 + Math.random() * 9000)}`;
  const order = {
    ...orderData,
    id,
    orderNumber: `#${id}`,
    createdAt: new Date().toISOString(),
    status: 'new',
  } as Order;
  writeStorage(ORDERS_KEY, [order, ...orders]);
  return { success: true, order };
}

export async function lookupOrder(identifier: string): Promise<{ success: boolean; order?: Order; error?: string }> {
  const normalized = identifier.replace(/^#/, '').toLowerCase();
  const order = readStorage<Order[]>(ORDERS_KEY, []).find((item) =>
    item.id.toLowerCase() === normalized || item.orderNumber.toLowerCase() === identifier.toLowerCase()
  );
  return order ? { success: true, order } : { success: false, error: 'لم يتم العثور على الطلب' };
}

export async function fetchAdminOrders(_token: string): Promise<Order[]> {
  return readStorage<Order[]>(ORDERS_KEY, []);
}

export async function updateOrderStatus(orderId: string, status: string): Promise<boolean> {
  const orders = readStorage<Order[]>(ORDERS_KEY, []);
  const updated = orders.map((order) => order.id === orderId ? { ...order, status: status as Order['status'] } : order);
  writeStorage(ORDERS_KEY, updated);
  return updated.some((order) => order.id === orderId);
}

export async function adminLogin(password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  const current = readStorage(PASSWORD_KEY, 'rifaq2026');
  return password === current
    ? { success: true, token: 'admin_token_2026' }
    : { success: false, error: 'كلمة المرور غير صحيحة' };
}

export async function fetchEmailLogs(): Promise<any[]> {
  return readStorage<any[]>('rifaq_email_logs', []);
}

/**
 * Formats WhatsApp Message with exact header: "طلبية جديدة من منصة الرفاق"
 */
export function generateWhatsAppOrderMessage(order: {
  orderId: string;
  customerName: string;
  phone: string;
  addressOrPickup: string;
  deliveryMethod: string;
  paymentMethod: string;
  totalAmount: number | string;
  cartItems?: Array<{ name: string; quantity: number }>;
  printJobs?: Array<{
    filesCount: number;
    layoutOption: string;
    totalPages: number;
    printType: string;
    paperSize: string;
    binding: string;
  }>;
  receiptStatus: string;
  notes?: string;
}): string {
  // Construct Stationery lines
  let stationerySection = '';
  if (order.cartItems && order.cartItems.length > 0) {
    const itemsList = order.cartItems
      .map((item) => `• الصنف: ${item.name} | الكمية: ${item.quantity}`)
      .join('\n');
    stationerySection = `🛒 *القرطاسية:*\n${itemsList}`;
  } else {
    stationerySection = `🛒 *القرطاسية:*\n• لا يوجد منتجات قرطاسية`;
  }

  // Construct Print files lines
  let printSection = '';
  if (order.printJobs && order.printJobs.length > 0) {
    const totalFiles = order.printJobs.reduce((acc, job) => acc + (job.filesCount || 1), 0);
    const totalPages = order.printJobs.reduce((acc, job) => acc + (job.totalPages || 0), 0);
    const primaryJob = order.printJobs[0];
    
    printSection = `🖨️ *ملفات الطباعة:*
*عدد ملفات الطباعة:* ${totalFiles}
*نظام الطباعة على الوجه الواحد:* ${primaryJob.layoutOption}
*عدد الصفحات:* ${totalPages}
*تفاصيل التجليد واللون:* ${primaryJob.printType} | ${primaryJob.paperSize} | تجليد: ${primaryJob.binding}`;
  } else {
    printSection = `🖨️ *ملفات الطباعة:*
*عدد ملفات الطباعة:* 0 (طلب قرطاسية فقط)`;
  }

  const notesText = order.notes && order.notes.trim() ? order.notes.trim() : 'لا يوجد';

  const message = `🧾 *طلبية جديدة من منصة الرفاق*
━━━━━━━━━━━━━━━━━━━━━━━━━
*رقم الطلب:* #${order.orderId}
*الاسم:* ${order.customerName}
*رقم الجوال:* ${order.phone}
*العنوان:* ${order.addressOrPickup}
*التوصيل:* ${order.deliveryMethod}
*وسيلة الدفع:* ${order.paymentMethod}
*المبلغ:* ${order.totalAmount}₪

📋 *بيانات الطلب:*
${stationerySection}

${printSection}

📎 *الملفات والإشعارات:*
• حالة الإشعار: ${order.receiptStatus}

📝 *ملاحظات:* ${notesText}
━━━━━━━━━━━━━━━━━━━━━━━━━`;

  return message;
}

export function openWhatsAppChat(phone: string, message: string) {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(message);
  const url = `https://wa.me/${cleanPhone}?text=${encodedText}`;
  window.open(url, '_blank');
}
