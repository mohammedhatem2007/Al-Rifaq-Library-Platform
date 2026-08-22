import { AppConfig, Order, PricingConfig, SectionAvailability, Product } from '../types';
import { DEFAULT_PRICING, DEFAULT_AVAILABILITY, PRODUCTS_DATA } from '../data/mockData';

const BASE_URL = '';

export async function fetchAppConfig(): Promise<AppConfig> {
  try {
    const res = await fetch(`${BASE_URL}/api/config`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Using default app config fallback:', e);
  }
  return {
    pricing: DEFAULT_PRICING,
    availability: DEFAULT_AVAILABILITY,
    adminEmail: 'mnassar37@smail.ucas.edu.ps',
    whatsappNumber: '+972592480383',
  };
}

export async function updateAppConfig(
  pricing: PricingConfig,
  availability: SectionAvailability,
  adminPassword: string,
  deliveryAreas?: import('../types').DeliveryArea[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/api/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pricing, availability, adminPassword, deliveryAreas }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'فشل تحديث الإعدادات' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateAdminPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/api/admin/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'تعذر تغيير كلمة المرور' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/products`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    console.warn('Using fallback products data:', e);
  }
  return PRODUCTS_DATA;
}

export async function createProduct(
  productData: Partial<Product>,
  adminPassword: string
): Promise<{ success: boolean; product?: Product; error?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...productData, adminPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'فشل إضافة المنتج' };
    }
    return { success: true, product: data.product };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateProduct(
  productId: string,
  productData: Partial<Product>,
  adminPassword: string
): Promise<{ success: boolean; product?: Product; error?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/api/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...productData, adminPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'فشل تعديل المنتج' };
    }
    return { success: true, product: data.product };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteProduct(
  productId: string,
  adminPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/api/products/${productId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'فشل حذف المنتج' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function submitOrder(orderData: Partial<Order>): Promise<{ success: boolean; order?: Order; error?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'تعذر إرسال الطلب' };
    }
    return { success: true, order: data.order };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function lookupOrder(identifier: string): Promise<{ success: boolean; order?: Order; error?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/api/orders/${encodeURIComponent(identifier)}`);
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'لم يتم العثور على الطلب' };
    }
    return { success: true, order: data.order };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchAdminOrders(token: string): Promise<Order[]> {
  const res = await fetch(`${BASE_URL}/api/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error('غير مصرح لك بالوصول');
  }
  return await res.json();
}

export async function updateOrderStatus(orderId: string, status: string): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return res.ok;
}

export async function adminLogin(password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'كلمة المرور غير صحيحة' };
    }
    return { success: true, token: data.token };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchEmailLogs(): Promise<any[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/logs/emails`);
    if (res.ok) return await res.json();
  } catch {}
  return [];
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
