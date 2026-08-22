import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;
const ADMIN_PASSWORD = 'rifaq2026';

// Body parser limits for PDF/Image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure local persistent storage directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Data files
const ORDERS_FILE = path.join(dataDir, 'orders.json');
const CONFIG_FILE = path.join(dataDir, 'config.json');
const PRODUCTS_FILE = path.join(dataDir, 'products.json');
const EMAIL_LOGS_FILE = path.join(dataDir, 'email_logs.json');

// Default initial config
const initialConfig = {
  adminPassword: ADMIN_PASSWORD,
  pricing: {
    bwPriceA4: 0.15,
    colorPriceA4: 0.50,
    bwPriceA5: 0.10,
    colorPriceA5: 0.35,
    bwPriceA3: 0.80,
    colorPriceA3: 1.80,
    bindingSpiralPrice: 3,
    bindingThermalPrice: 4,
    bindingHardcoverPrice: 5,
    deliveryFeeGaza: 5,
    deliveryFeeUniversities: 3,
    deliveryFeeOther: 8,
    layoutDivisor1PerPage: 1,
    layoutDivisor2PerPage: 2,
    layoutDivisor4PerPage: 4,
    layoutDivisorCustomDefault: 6,
  },
  deliveryAreas: [
    { id: 'ucas', name: 'الكلية الجامعية للعلوم التطبيقية (UCAS)', fee: 3 },
    { id: 'iug', name: 'الجامعة الإسلامية بغزة (IUG)', fee: 3 },
    { id: 'alazhar', name: 'جامعة الأزهر - المقر الرئيسي وحرم المغراقة', fee: 3 },
    { id: 'alaqsa', name: 'جامعة الأقصى (غزة / خانيونس)', fee: 4 },
    { id: 'gaza_center', name: 'مدينة غزة (الرمال، النصر، الصبرة، الدرج، التفاح)', fee: 5 },
    { id: 'gaza_west', name: 'غرب غزة (الميناء، أنصار، تل الهوا)', fee: 5 },
    { id: 'north_gaza', name: 'شمال غزة (جباليا، بيت لاهيا، بيت حانون)', fee: 7 },
    { id: 'middle_area', name: 'المنطقة الوسطى (دير البلح، النصيرات، الزوايدة، البريج)', fee: 5 },
    { id: 'khanyounis', name: 'خانيونس ورفح', fee: 8 },
  ],
  availability: {
    printingCalculator: true,
    educationalBundles: true,
    stationery: true,
    deliveryService: true,
    offlineMessage: 'نعتذر، هذه الخدمة تخضع للصيانة المؤقتة لتحديث الأسعار والورق. يُرجى التواصل عبر الواتساب للطلبات العاجلة.',
  },
  adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL || 'mnassar37@smail.ucas.edu.ps',
  whatsappNumber: '+972592480383',
};

const initialProducts = [
  // 1. الرزم التعليمية (Educational Bundles)
  {
    id: 'bundle-tawjihi-scientific',
    name: 'رزمة تعليمية - توجيهي علمي',
    category: 'printing',
    categoryLabel: 'الرزم التعليمية',
    price: 45.00,
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    description: 'ملخصات ودوسيات شاملة لمواد التوجيهي العلمي',
    inStock: true,
    featured: true,
    itemsIncluded: [
      'دوسيات الرياضيات والفيزياء والكيمياء',
      'بنك أسئلة امتحانات وزارية محلولة',
      'تجليد سلكي مقوى مع أغلفة شفافة',
    ],
  },
  {
    id: 'bundle-tawjihi-literary',
    name: 'رزمة تعليمية - توجيهي أدبي',
    category: 'printing',
    categoryLabel: 'الرزم التعليمية',
    price: 45.00,
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80',
    description: 'ملخصات ودوسيات شاملة لمواد التوجيهي الأدبي',
    inStock: true,
    featured: true,
    itemsIncluded: [
      'ملازم اللغة العربية والتاريخ والجغرافيا',
      'خرائط مفاهيمية وملخصات مراجعة',
      'تجليد سلكي مقوى مريح للمطالعة',
    ],
  },
  {
    id: 'bundle-uni-eng-first-year',
    name: 'رزمة جامعية - سنة أولى هندسة',
    category: 'printing',
    categoryLabel: 'الرزم التعليمية',
    price: 60.00,
    image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=600&q=80',
    description: 'دوسيات ومراجع السنة الأولى هندسة',
    inStock: true,
    featured: true,
    itemsIncluded: [
      'مراجع الكالكولس والفيزياء 1 و 2',
      'كراسة الرسم الهندسي وتطبيقاته',
      'نماذج امتحانات نصفية ونهائية سابقة',
    ],
  },
  {
    id: 'bundle-ninth-grade',
    name: 'رزمة الصف التاسع',
    category: 'printing',
    categoryLabel: 'الرزم التعليمية',
    price: 30.00,
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
    description: 'ملخصات جميع مواد الصف التاسع',
    inStock: true,
    featured: false,
    itemsIncluded: [
      'ملخصات العلوم والرياضيات واللغة العربية',
      'أوراق عمل تدريبية وأسئلة إثرائية',
    ],
  },

  // 2. القرطاسية (Stationery)
  {
    id: 'stat-notebook-200',
    name: 'دفتر 200 ورقة',
    category: 'stationery',
    categoryLabel: 'القرطاسية',
    price: 8.00,
    image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=600&q=80',
    description: 'دفتر جامعي مسطر 200 ورقة',
    inStock: true,
    featured: false,
  },
  {
    id: 'stat-pens-set-10',
    name: 'طقم أقلام حبر (10 حبات)',
    category: 'stationery',
    categoryLabel: 'القرطاسية',
    price: 10.00,
    image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&q=80',
    description: 'أقلام حبر جاف زرقاء وسوداء',
    inStock: true,
    featured: false,
  },
  {
    id: 'stat-clear-file',
    name: 'ملف بلاستيكي شفاف',
    category: 'stationery',
    categoryLabel: 'القرطاسية',
    price: 3.00,
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    description: 'ملف حفظ أوراق A4',
    inStock: true,
    featured: false,
  },
  {
    id: 'stat-scientific-calculator',
    name: 'آلة حاسبة علمية',
    category: 'stationery',
    categoryLabel: 'القرطاسية',
    price: 55.00,
    image: 'https://images.unsplash.com/photo-1611365892117-00ac5ef43759?auto=format&fit=crop&w=600&q=80',
    description: 'آلة حاسبة علمية للطلاب',
    inStock: true,
    featured: true,
  },
  {
    id: 'stat-highlighters-set',
    name: 'طقم أقلام تحديد',
    category: 'stationery',
    categoryLabel: 'القرطاسية',
    price: 12.00,
    image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&q=80',
    description: 'أقلام تظليل بألوان متعددة',
    inStock: true,
    featured: false,
  },
  {
    id: 'stat-geometry-tools',
    name: 'مسطرة وأدوات هندسية',
    category: 'stationery',
    categoryLabel: 'القرطاسية',
    price: 15.00,
    image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=600&q=80',
    description: 'طقم أدوات هندسية كامل',
    inStock: true,
    featured: false,
  },
];

function getStoredConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      return { ...initialConfig, ...data };
    } catch {
      return initialConfig;
    }
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(initialConfig, null, 2));
  return initialConfig;
}

function saveStoredConfig(newConfig: any) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
}

function getStoredProducts(): any[] {
  if (fs.existsSync(PRODUCTS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
    } catch {
      return initialProducts;
    }
  }
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(initialProducts, null, 2));
  return initialProducts;
}

function saveStoredProducts(products: any[]) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

function getStoredOrders(): any[] {
  if (fs.existsSync(ORDERS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
    } catch {
      return [];
    }
  }
  return [];
}

function saveStoredOrders(orders: any[]) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

function getEmailLogs(): any[] {
  if (fs.existsSync(EMAIL_LOGS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(EMAIL_LOGS_FILE, 'utf-8'));
    } catch {
      return [];
    }
  }
  return [];
}

function appendEmailLog(log: any) {
  const logs = getEmailLogs();
  logs.unshift(log);
  fs.writeFileSync(EMAIL_LOGS_FILE, JSON.stringify(logs.slice(0, 100), null, 2));
}

// Supabase lazy client
let supabaseClient: any = null;
function getSupabase() {
  if (supabaseClient) return supabaseClient;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (url && key) {
    try {
      supabaseClient = createClient(url, key);
      console.log('Connected to Supabase successfully.');
      return supabaseClient;
    } catch (e) {
      console.warn('Supabase initialization failed, continuing with local persistent storage:', e);
    }
  }
  return null;
}

// ----------------- API ROUTES ----------------- //

// Health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Get Config (Safe - no password)
app.get('/api/config', (_req, res) => {
  const config = getStoredConfig();
  const safeConfig = {
    pricing: config.pricing,
    deliveryAreas: config.deliveryAreas || initialConfig.deliveryAreas,
    availability: config.availability,
    adminEmail: config.adminEmail,
    whatsappNumber: config.whatsappNumber,
  };
  res.json(safeConfig);
});

// Update Config (Admin only)
app.put('/api/config', (req, res) => {
  const { pricing, deliveryAreas, availability, adminPassword } = req.body;
  const currentConfig = getStoredConfig();
  
  if (adminPassword !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'كلمة مرور الإدارة غير صحيحة' });
  }

  const updatedConfig = {
    ...currentConfig,
    pricing: pricing || currentConfig.pricing,
    deliveryAreas: Array.isArray(deliveryAreas) ? deliveryAreas : (currentConfig.deliveryAreas || initialConfig.deliveryAreas),
    availability: availability || currentConfig.availability,
  };

  saveStoredConfig(updatedConfig);
  res.json({ success: true, config: updatedConfig });
});

// Admin Login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, token: 'rifaq-auth-token-session-valid' });
  } else {
    res.status(401).json({ error: 'كلمة المرور غير صحيحة' });
  }
});

// Admin Password Update
app.put('/api/admin/password', (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (currentPassword !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'كلمة المرور الحالية غير صحيحة' });
  }

  if (!newPassword || newPassword.trim().length < 4) {
    return res.status(400).json({ error: 'كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل' });
  }

  res.status(400).json({ error: 'كلمة مرور الإدارة ثابتة في الكود ولا يمكن تغييرها' });
});

// Products: Get All
app.get('/api/products', (_req, res) => {
  const products = getStoredProducts();
  res.json(products);
});

// Products: Create New Product (Admin)
app.post('/api/products', (req, res) => {
  const { adminPassword, ...productData } = req.body;

  if (adminPassword !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'غير مصرح لك بإضافة منتجات' });
  }

  const products = getStoredProducts();
  const price = parseFloat(productData.price) || 0;
  const originalPrice = productData.originalPrice ? parseFloat(productData.originalPrice) : undefined;
  let discountPercentage = undefined;
  
  if (originalPrice && originalPrice > price) {
    discountPercentage = Math.round(((originalPrice - price) / originalPrice) * 100);
  }

  const categoryLabels: Record<string, string> = {
    printing: 'قسم الطباعة',
    stationery: 'قسم القرطاسية',
    gifts: 'قسم الهدايا',
  };

  const newProduct = {
    id: productData.id || `prod-${Date.now()}`,
    name: productData.name || 'منتج جديد',
    category: productData.category || 'stationery',
    categoryLabel: categoryLabels[productData.category] || 'عام',
    price: price,
    originalPrice: originalPrice,
    discountPercentage: discountPercentage,
    image: productData.image || 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=600&q=80',
    description: productData.description || '',
    inStock: productData.inStock !== false,
    featured: Boolean(productData.featured),
    tag: productData.tag || (discountPercentage ? `خصم ${discountPercentage}%` : undefined),
    itemsIncluded: Array.isArray(productData.itemsIncluded) ? productData.itemsIncluded : [],
  };

  products.unshift(newProduct);
  saveStoredProducts(products);

  res.status(201).json({ success: true, product: newProduct });
});

// Products: Update Product (Admin)
app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { adminPassword, ...updateData } = req.body;

  if (adminPassword !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'غير مصرح لك بتعديل المنتجات' });
  }

  const products = getStoredProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'المنتج غير موجود' });
  }

  const existing = products[index];
  const price = updateData.price !== undefined ? parseFloat(updateData.price) : existing.price;
  const originalPrice = updateData.originalPrice !== undefined 
    ? (updateData.originalPrice ? parseFloat(updateData.originalPrice) : undefined) 
    : existing.originalPrice;

  let discountPercentage = undefined;
  if (originalPrice && originalPrice > price) {
    discountPercentage = Math.round(((originalPrice - price) / originalPrice) * 100);
  }

  const categoryLabels: Record<string, string> = {
    printing: 'قسم الطباعة',
    stationery: 'قسم القرطاسية',
    gifts: 'قسم الهدايا',
  };

  const updatedProduct = {
    ...existing,
    ...updateData,
    price,
    originalPrice,
    discountPercentage,
    categoryLabel: categoryLabels[updateData.category || existing.category] || existing.categoryLabel,
    tag: updateData.tag || (discountPercentage ? `خصم ${discountPercentage}%` : undefined),
  };

  products[index] = updatedProduct;
  saveStoredProducts(products);

  res.json({ success: true, product: updatedProduct });
});

// Products: Delete Product (Admin)
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { adminPassword } = req.body;

  if (adminPassword !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'غير مصرح لك بحذف المنتجات' });
  }

  let products = getStoredProducts();
  products = products.filter((p) => p.id !== id);
  saveStoredProducts(products);

  res.json({ success: true, message: 'تم حذف المنتج بنجاح' });
});

// Create Order
app.post('/api/orders', async (req, res) => {
  try {
    const orderData = req.body;
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderId = `RIFAQ-${randomNum}`;
    const orderNumber = `#${orderId}`;

    const newOrder = {
      ...orderData,
      id: orderId,
      orderNumber: orderNumber,
      createdAt: new Date().toISOString(),
      status: 'new',
    };

    // Save to local storage
    const orders = getStoredOrders();
    orders.unshift(newOrder);
    saveStoredOrders(orders);

    // Try syncing to Supabase if configured
    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from('orders').insert([
          {
            order_id: orderId,
            customer_name: newOrder.customer?.fullName,
            customer_phone: newOrder.customer?.phone,
            delivery_method: newOrder.customer?.deliveryMethod,
            payment_method: newOrder.paymentMethod,
            total_amount: newOrder.totalAmount,
            status: 'new',
            order_details: newOrder,
            created_at: newOrder.createdAt,
          },
        ]);
      } catch (sbErr) {
        console.warn('Supabase order insert note:', sbErr);
      }
    }

    // Trigger Admin Email Notification
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'mnassar37@smail.ucas.edu.ps';
    const emailSubject = `📢 طلب جديد #${orderId} - ${newOrder.customer?.fullName || 'عميل'} (₪${newOrder.totalAmount})`;
    const emailBody = `
      تم استلام طلب جديد بنجاح في مكتبة الرفاق:
      - رقم الطلب: ${orderNumber}
      - اسم العميل: ${newOrder.customer?.fullName}
      - رقم الجوال / واتساب: ${newOrder.customer?.phone}
      - وسيلة الدفع: ${newOrder.paymentMethod === 'cod' ? 'الدفع عند الاستلام' : 'تحويل بنكي / إلكتروني مع إشعار'}
      - الإجمالي: ₪${newOrder.totalAmount}
      - عدد ملفات الطباعة: ${newOrder.printJobs?.length || 0}
      - عناصر القرطاسية: ${newOrder.cartItems?.length || 0}
    `;

    appendEmailLog({
      id: `email-${Date.now()}`,
      timestamp: new Date().toISOString(),
      recipient: adminEmail,
      subject: emailSubject,
      orderNumber: orderNumber,
      status: 'sent',
      body: emailBody,
    });

    console.log(`[EMAIL NOTIFICATION SENT] To: ${adminEmail} | Subject: ${emailSubject}`);

    res.status(201).json({
      success: true,
      order: newOrder,
      message: 'تم تسجيل الطلب بنجاح',
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء حفظ الطلب', details: error.message });
  }
});

// Admin Get Orders
app.get('/api/orders', (req, res) => {
  const authHeader = req.headers.authorization;
  // Check if token exists
  if (!authHeader || !authHeader.includes('rifaq-auth-token')) {
    return res.status(401).json({ error: 'غير مصرح لك بالوصول للوحة التحكم' });
  }
  const orders = getStoredOrders();
  res.json(orders);
});

// Single Order Lookup (Student tracker)
app.get('/api/orders/:identifier', (req, res) => {
  const { identifier } = req.params;
  const cleanId = identifier.trim().toUpperCase().replace('#', '');
  const orders = getStoredOrders();
  
  const found = orders.find(
    (o) =>
      o.id.toUpperCase() === cleanId ||
      o.orderNumber.toUpperCase().replace('#', '') === cleanId ||
      (o.customer?.phone && o.customer.phone.includes(identifier.trim()))
  );

  if (found) {
    res.json({ success: true, order: found });
  } else {
    res.status(404).json({ error: 'لم يتم العثور على طلب بهذا الرقم أو رقم الجوال' });
  }
});

// Admin Update Order Status
app.put('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const orders = getStoredOrders();
  const index = orders.findIndex((o) => o.id === id || o.orderNumber === id);

  if (index === -1) {
    return res.status(404).json({ error: 'الطلب غير موجود' });
  }

  orders[index].status = status;
  orders[index].updatedAt = new Date().toISOString();
  saveStoredOrders(orders);

  // Sync to Supabase if available
  const sb = getSupabase();
  if (sb) {
    try {
      sb.from('orders').update({ status }).eq('order_id', id);
    } catch {}
  }

  res.json({ success: true, order: orders[index] });
});

// Admin Email Logs
app.get('/api/logs/emails', (_req, res) => {
  const logs = getEmailLogs();
  res.json(logs);
});

// ----------------- VITE MIDDLEWARE / SPA FALLBACK ----------------- //

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
