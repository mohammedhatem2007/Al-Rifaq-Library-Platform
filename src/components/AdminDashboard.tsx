import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  X, 
  RefreshCw, 
  Eye, 
  Save, 
  MessageCircle, 
  LogOut,
  Download,
  AlertCircle,
  Plus,
  Trash2,
  Edit,
  Tag,
  KeyRound,
  Search,
  Sliders,
  Package,
  Truck,
  CreditCard,
} from 'lucide-react';
import { Logo } from './Logo';
import { Order, PricingConfig, SectionAvailability, OrderStatus, Product, ProductCategory, DeliveryArea, PaymentAccounts } from '../types';
import { 
  fetchAdminOrders, 
  updateOrderStatus, 
  updateAppConfig, 
  updateAdminPassword,
  fetchProducts,
  fetchDeliveryZones,
  updateDeliveryZones,
  addProduct,
  updateProduct,
  deleteProduct,
  openWhatsAppChat
} from '../services/api';
import { downloadOrdersCSV } from '../utils/csvHelper';
import { getPaymentAccounts, savePaymentAccounts } from '../utils/paymentAccounts';

const ADMIN_PASSWORD = 'rifaq2026';
const ADMIN_SESSION_KEY = 'isAdmin';
const LEGACY_ADMIN_SESSION_KEY = 'rifaq_admin_authenticated';
const PRODUCT_IMAGE_PLACEHOLDER = 'https://placehold.co/600x800?text=Product';

interface AdminDashboardProps {
  onClose: () => void;
  currentPricing: PricingConfig;
  currentAvailability: SectionAvailability;
  deliveryAreas?: DeliveryArea[];
  products: Product[];
  onConfigUpdated: (pricing: PricingConfig, availability: SectionAvailability, deliveryAreas?: DeliveryArea[]) => void;
  onProductsUpdated: (products: Product[]) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onClose,
  currentPricing,
  currentAvailability,
  deliveryAreas,
  products,
  onConfigUpdated,
  onProductsUpdated,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return window.localStorage.getItem(ADMIN_SESSION_KEY) === 'true'
        || window.localStorage.getItem(LEGACY_ADMIN_SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string>('admin_token_2026');

  // Navigation tab inside admin
  const [adminTab, setAdminTab] = useState<'orders' | 'products' | 'pricing' | 'delivery' | 'payments' | 'password'>('orders');
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccounts>(() => getPaymentAccounts());
  const [paymentSaveMessage, setPaymentSaveMessage] = useState<string | null>(null);

  // Orders Management
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>('');
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);

  // Delivery Areas Management State
  const [areaList, setAreaList] = useState<DeliveryArea[]>(() => {
    if (deliveryAreas) return deliveryAreas;
    return [];
  });
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<DeliveryArea | null>(null);
  const [areaForm, setAreaForm] = useState({ name: '', fee: '' });
  const [areaActionMsg, setAreaActionMsg] = useState<string | null>(null);

  // Pricing Editor
  const [pricingForm, setPricingForm] = useState<PricingConfig>(currentPricing);
  const [pricingJsonText, setPricingJsonText] = useState<string>('');
  const [availability, setAvailability] = useState<SectionAvailability>(currentAvailability);
  const [pricingSaveMessage, setPricingSaveMessage] = useState<string | null>(null);

  // Password Change State
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwChangeMsg, setPwChangeMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isChangingPw, setIsChangingPw] = useState(false);

  // Products Management State
  const [productList, setProductList] = useState<Product[]>(products);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'printing' as ProductCategory,
    price: '',
    originalPrice: '',
    description: '',
    image: '',
    inStock: true,
    tag: '',
  });
  const [productActionMsg, setProductActionMsg] = useState<string | null>(null);

  useEffect(() => {
    setProductList(products);
  }, [products]);

  useEffect(() => {
    if (deliveryAreas) {
      setAreaList(deliveryAreas);
    }
  }, [deliveryAreas]);

  useEffect(() => {
    setAvailability(currentAvailability);
    setPricingForm(currentPricing);
    
    const jsonFormatted = {
      bwPriceA4: currentPricing.bwPriceA4,
      colorPriceA4: currentPricing.colorPriceA4,
      bwPriceA5: currentPricing.bwPriceA5,
      colorPriceA5: currentPricing.colorPriceA5,
      bwPriceA3: currentPricing.bwPriceA3,
      colorPriceA3: currentPricing.colorPriceA3,
      bindingSpiralPrice: currentPricing.bindingSpiralPrice,
      bindingThermalPrice: currentPricing.bindingThermalPrice,
      bindingHardcoverPrice: currentPricing.bindingHardcoverPrice,
      deliveryFeeGaza: currentPricing.deliveryFeeGaza,
      deliveryFeeUniversities: currentPricing.deliveryFeeUniversities,
      deliveryFeeOther: currentPricing.deliveryFeeOther,
      layoutDivisor1PerPage: currentPricing.layoutDivisor1PerPage ?? 1,
      layoutDivisor2PerPage: currentPricing.layoutDivisor2PerPage ?? 2,
      layoutDivisor4PerPage: currentPricing.layoutDivisor4PerPage ?? 4,
      layoutDivisorCustomDefault: currentPricing.layoutDivisorCustomDefault ?? 6,
    };
    setPricingJsonText(JSON.stringify(jsonFormatted, null, 2));
  }, [currentPricing, currentAvailability]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (passwordInput === ADMIN_PASSWORD) {
      setAuthToken('admin_token_2026');
      setIsAuthenticated(true);
      window.localStorage.setItem(ADMIN_SESSION_KEY, 'true');
      window.localStorage.removeItem(LEGACY_ADMIN_SESSION_KEY);
    } else {
      setPasswordInput('');
      setAuthToken('admin_token_2026');
      setIsAuthenticated(false);
      setAuthError('كلمة المرور غير صحيحة');
    }
  };

  const loadOrders = async (token?: string) => {
    setIsLoadingOrders(true);
    try {
      const list = await fetchAdminOrders(token || authToken);
      setOrders(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const loadLatestProducts = async () => {
    try {
      const prods = await fetchProducts();
      setProductList(prods);
      onProductsUpdated(prods);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const ok = await updateOrderStatus(orderId, newStatus);
    if (ok) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    }
  };

  const handleToggleAvailability = (section: keyof SectionAvailability) => {
    setAvailability((prev) => {
      const updated = { ...prev, [section]: !prev[section] };
      onConfigUpdated(pricingForm, updated, areaList);
      updateAppConfig(pricingForm, updated, passwordInput, areaList);
      return updated;
    });
  };

  // Save Dynamic Pricing Form
  const handleSavePricingForm = () => {
    onConfigUpdated(pricingForm, availability, areaList);
    updateAppConfig(pricingForm, availability, passwordInput, areaList);
    setPricingSaveMessage('تم حفظ وتحديث أسعار الطباعة والتجليد بنجاح!');
    setTimeout(() => setPricingSaveMessage(null), 3500);
  };

  // Save Pricing JSON
  const handleSavePricingJson = () => {
    try {
      const parsed = JSON.parse(pricingJsonText);
      const newPricing: PricingConfig = {
        ...pricingForm,
        ...parsed,
      };
      setPricingForm(newPricing);
      onConfigUpdated(newPricing, availability, areaList);
      updateAppConfig(newPricing, availability, passwordInput, areaList);
      setPricingSaveMessage('تم حفظ الأسعار من نص JSON بنجاح!');
      setTimeout(() => setPricingSaveMessage(null), 3500);
    } catch {
      alert('صيغة JSON غير صحيحة، يرجى التحقق من الأقواس والفواصل.');
    }
  };

  // Delivery Areas Management Handlers
  const handleOpenAddArea = () => {
    setEditingArea(null);
    setAreaForm({ name: '', fee: '5' });
    setAreaActionMsg(null);
    setIsAreaModalOpen(true);
  };

  const handleOpenEditArea = (area: DeliveryArea) => {
    setEditingArea(area);
    setAreaForm({ name: area.name, fee: area.fee.toString() });
    setAreaActionMsg(null);
    setIsAreaModalOpen(true);
  };

  const handleSaveArea = async (e: React.FormEvent) => {
    e.preventDefault();
    setAreaActionMsg(null);
    if (!areaForm.name.trim()) {
      setAreaActionMsg('يرجى إدخال اسم المنطقة أو الجامعة');
      return;
    }
    const feeNum = Math.max(0, parseFloat(areaForm.fee) || 0);

    let updatedAreas: DeliveryArea[];
    if (editingArea) {
      updatedAreas = areaList.map((a) =>
        a.id === editingArea.id ? { ...a, name: areaForm.name.trim(), fee: feeNum } : a
      );
    } else {
      const newArea: DeliveryArea = {
        id: `area-${Date.now()}`,
        name: areaForm.name.trim(),
        fee: feeNum,
      };
      updatedAreas = [...areaList, newArea];
    }

    const [configResult, zonesResult] = await Promise.all([
      updateAppConfig(pricingForm, availability, passwordInput, updatedAreas),
      updateDeliveryZones(updatedAreas),
    ]);
    if (configResult.success && zonesResult.success) {
      setAreaList(updatedAreas);
      onConfigUpdated(pricingForm, availability, updatedAreas);
      setIsAreaModalOpen(false);
    } else {
      const errorMessage = configResult.error || zonesResult.error || 'تعذر حفظ المنطقة';
      console.error('Supabase Error:', errorMessage);
      alert(errorMessage);
      setAreaActionMsg(errorMessage);
    }
  };

  const handleDeleteArea = async (areaId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المنطقة؟')) return;
    const updatedAreas = areaList.filter((a) => a.id !== areaId);
    const [configResult, zonesResult] = await Promise.all([
      updateAppConfig(pricingForm, availability, passwordInput, updatedAreas),
      updateDeliveryZones(updatedAreas),
    ]);
    if (configResult.success && zonesResult.success) {
      setAreaList(updatedAreas);
      onConfigUpdated(pricingForm, availability, updatedAreas);
      return;
    }
    const errorMessage = configResult.error || zonesResult.error || 'تعذر حذف المنطقة';
    console.error('Supabase Error:', errorMessage);
    alert(errorMessage);
  };

  const handleUpdateAreaFeeQuick = async (areaId: string, newFee: number) => {
    const feeNum = Math.max(0, newFee);
    const updatedAreas = areaList.map((a) => (a.id === areaId ? { ...a, fee: feeNum } : a));
    const [configResult, zonesResult] = await Promise.all([
      updateAppConfig(pricingForm, availability, passwordInput, updatedAreas),
      updateDeliveryZones(updatedAreas),
    ]);
    if (configResult.success && zonesResult.success) {
      setAreaList(updatedAreas);
      onConfigUpdated(pricingForm, availability, updatedAreas);
      return;
    }
    const errorMessage = configResult.error || zonesResult.error || 'تعذر تحديث رسوم المنطقة';
    console.error('Supabase Error:', errorMessage);
    alert(errorMessage);
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwChangeMsg(null);

    if (newPw.length < 4) {
      setPwChangeMsg({ text: 'كلمة المرور الجديدة يجب أن تكون 4 خانات على الأقل', isError: true });
      return;
    }

    if (newPw !== confirmPw) {
      setPwChangeMsg({ text: 'كلمتا المرور الجديدتان غير متطابقتين', isError: true });
      return;
    }

    setIsChangingPw(true);
    try {
      const res = await updateAdminPassword(currentPw, newPw);
      if (res.success) {
        setPwChangeMsg({ text: 'تم تغيير كلمة المرور بنجاح! احتفظ بكلمة المرور الجديدة.', isError: false });
        setPasswordInput(newPw);
        setCurrentPw('');
        setNewPw('');
        setConfirmPw('');
      } else {
        setPwChangeMsg({ text: res.error || 'تعذر تغيير كلمة المرور، تحقق من الكلمة الحالية', isError: true });
      }
    } catch (err: any) {
      setPwChangeMsg({ text: err.message || 'حدث خطأ أثناء تغيير كلمة المرور', isError: true });
    } finally {
      setIsChangingPw(false);
    }
  };

  // Open Product Modal for Create or Edit
  const handleOpenProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        category: product.category,
        price: product.price.toString(),
        originalPrice: product.originalPrice ? product.originalPrice.toString() : '',
        description: product.description,
        image: product.image,
        inStock: product.inStock,
        tag: product.tag || '',
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        category: 'printing',
        price: '',
        originalPrice: '',
        description: '',
        image: '',
        inStock: true,
        tag: '',
      });
    }
    setIsProductModalOpen(true);
  };

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProductActionMsg('يرجى اختيار ملف صورة صالح');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setProductForm((current) => ({ ...current, image: PRODUCT_IMAGE_PLACEHOLDER }));
        setProductActionMsg('تعذر معالجة الصورة، تم استخدام صورة افتراضية');
        return;
      }

      const image = new Image();
      image.onload = () => {
        const maxDimension = 1200;
        const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) {
          setProductForm((current) => ({ ...current, image: PRODUCT_IMAGE_PLACEHOLDER }));
          setProductActionMsg('تعذر ضغط الصورة، تم استخدام صورة افتراضية');
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const compressedImage = canvas.toDataURL('image/jpeg', 0.8);
        setProductForm((current) => ({ ...current, image: compressedImage }));
        setProductActionMsg(null);
      };
      image.onerror = () => {
        setProductForm((current) => ({ ...current, image: PRODUCT_IMAGE_PLACEHOLDER }));
        setProductActionMsg('تعذر تحميل الصورة، تم استخدام صورة افتراضية');
      };
      image.src = reader.result;
    };
    reader.onerror = () => {
      setProductForm((current) => ({ ...current, image: PRODUCT_IMAGE_PLACEHOLDER }));
      setProductActionMsg('تعذر قراءة الصورة، تم استخدام صورة افتراضية');
    };
    reader.readAsDataURL(file);
  };

  // Save Product (Create or Update with Automatic Discount Calculation)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(productForm.price) || 0;
    const origPriceNum = productForm.originalPrice ? parseFloat(productForm.originalPrice) : undefined;
    
    let calculatedDiscount = undefined;
    let autoTag = productForm.tag;

    if (origPriceNum && origPriceNum > priceNum) {
      calculatedDiscount = Math.round(((origPriceNum - priceNum) / origPriceNum) * 100);
      if (!autoTag) {
        autoTag = `خصم ${calculatedDiscount}%`;
      }
    }

    const productDetails: Omit<Product, 'id' | 'categoryLabel'> = {
      name: productForm.name.trim(),
      category: productForm.category,
      price: priceNum,
      originalPrice: origPriceNum,
      discountPercentage: calculatedDiscount,
      description: productForm.description.trim(),
      image: productForm.image,
      inStock: productForm.inStock,
      tag: autoTag,
    };

    if (editingProduct) {
      const result = await updateProduct(editingProduct.id, productDetails, passwordInput);
      if (!result.success || !result.product) {
        const errorMessage = result.error || 'تعذر تعديل المنتج';
        console.error('Supabase Error:', errorMessage);
        alert(errorMessage);
        setProductActionMsg(errorMessage);
        return;
      }
      const updated = productList.map((product) => product.id === editingProduct.id ? result.product as Product : product);
      setProductList(updated);
      onProductsUpdated(updated);
      setProductActionMsg('تم تعديل المنتج والخصم بنجاح!');
    } else {
      const categoryLabels: Record<ProductCategory, string> = {
        printing: 'قسم الطباعة',
        stationery: 'قسم القرطاسية',
        gifts: 'قسم الهدايا',
        bundle: 'قسم الرزم التعليمية',
        engineering: 'قسم الأدوات الهندسية',
        medical: 'قسم الأدوات الطبية',
        notebooks: 'قسم الدفاتر',
      };
      const result = await addProduct({ ...productDetails, categoryLabel: categoryLabels[productForm.category] }, passwordInput);
      if (!result.success || !result.product) {
        const errorMessage = result.error || 'تعذر إضافة المنتج';
        console.error('Supabase Error:', errorMessage);
        alert('Supabase Error: ' + errorMessage);
        setProductActionMsg(errorMessage);
        return;
      }
      const updated = await fetchProducts();
      setProductList(updated);
      onProductsUpdated(updated);
      setProductActionMsg('تمت إضافة المنتج الجديد بنجاح!');
    }

    console.log('Product saved successfully');
    setIsProductModalOpen(false);
    setTimeout(() => setProductActionMsg(null), 3000);
  };

  // Delete Product
  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج نهائياً؟')) return;
    const result = await deleteProduct(id, passwordInput);
    if (!result.success) {
      const errorMessage = result.error || 'تعذر حذف المنتج';
      console.error('Supabase Error:', errorMessage);
      alert(errorMessage);
      setProductActionMsg(errorMessage);
      return;
    }
    const updated = productList.filter((product) => product.id !== id);
    setProductList(updated);
    onProductsUpdated(updated);
    setProductActionMsg('تم حذف المنتج بنجاح');
    setTimeout(() => setProductActionMsg(null), 3000);
  };

  // Filter and Search Orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    if (!matchesStatus) return false;

    if (!orderSearchQuery.trim()) return true;
    const q = orderSearchQuery.toLowerCase().trim();
    const orderNum = (o.orderNumber || o.id).toLowerCase();
    const custName = (o.customer?.fullName || '').toLowerCase();
    const custPhone = (o.customer?.phone || '').toLowerCase();

    return orderNum.includes(q) || custName.includes(q) || custPhone.includes(q);
  });

  const handleDownloadPrintFiles = (order: Order) => {
    const files = order.printJobs.flatMap((job) => job.files || []).filter((file) => file.dataBase64);

    files.forEach((file, index) => {
      const link = document.createElement('a');
      link.href = file.dataBase64 as string;
      link.download = file.name || `print-file-${index + 1}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  };

  const handleSavePaymentAccounts = (e: React.FormEvent) => {
    e.preventDefault();
    savePaymentAccounts(paymentAccounts);
    setPaymentSaveMessage('تم حفظ بيانات الدفع وتحديثها في صفحة الدفع');
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-900" dir="rtl">
      
      {!isAuthenticated ? (
        /* Login Screen */
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
          <div className="bg-white text-slate-900 rounded-3xl w-full max-w-md p-8 shadow-2xl space-y-6 text-center animate-scaleUp">
          <div className="w-20 h-20 rounded-full bg-[#fcf8ed] border-2 border-[#caa242] flex items-center justify-center mx-auto shadow-sm">
            <Logo size={54} />
          </div>

          <div className="space-y-1">
            <h3 className="font-heading font-extrabold text-2xl text-slate-900">
              لوحة تحكم الإدارة
            </h3>
            <p className="text-xs text-slate-500">
              مكتبة الرفاق للطباعة والخدمات الطلابية
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-bold flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-right">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                كلمة مرور المشرف:
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPasswordInput(value);
                    setAuthError(null);
                    if (value === ADMIN_PASSWORD) {
                      setAuthToken('admin_token_2026');
                      setIsAuthenticated(true);
                    }
                  }}
                  placeholder="أدخل كلمة المرور..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#caa242] text-slate-900 font-mono"
                  dir="ltr"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-[#caa242] hover:bg-[#b88f34] text-slate-950 font-extrabold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              تسجيل الدخول للوحة الإدارة
            </button>
          </form>

          <div>
            <button
              onClick={onClose}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              العودة إلى الموقع
            </button>
          </div>
          </div>
        </div>
      ) : (
        /* Authenticated Dashboard View */
        <div className="w-full min-h-screen bg-[#f8fafc] text-slate-900 overflow-hidden flex flex-col border border-slate-200 animate-fadeIn">
          
          {/* Top Header */}
          <div className="bg-[#0c1524] text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="font-heading font-extrabold text-lg sm:text-xl text-white flex items-center gap-2">
                  <span>لوحة تحكم مكتبة الرفاق</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#caa242]/20 text-[#caa242] border border-[#caa242]/40">مشرف</span>
                </h3>
                <p className="text-xs text-slate-400">إدارة الطلبات، المنتجات، الأسعار، وحسابات الدفع</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  loadOrders();
                  loadLatestProducts();
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="تحديث البيانات"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">تحديث</span>
              </button>

              <button
                onClick={() => {
                  window.localStorage.removeItem(ADMIN_SESSION_KEY);
                  window.localStorage.removeItem(LEGACY_ADMIN_SESSION_KEY);
                  setIsAuthenticated(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">خروج</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Sub-header */}
          <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto shrink-0">
            <button
              onClick={() => setAdminTab('orders')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                adminTab === 'orders'
                  ? 'bg-[#0c1524] text-[#caa242] shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>إدارة الطلبات ({orders.length})</span>
            </button>

            <button
              onClick={() => setAdminTab('products')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                adminTab === 'products'
                  ? 'bg-[#0c1524] text-[#caa242] shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>إدارة الأصناف والخصومات ({productList.length})</span>
            </button>

            <button
              onClick={() => setAdminTab('pricing')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                adminTab === 'pricing'
                  ? 'bg-[#0c1524] text-[#caa242] shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>أسعار الطباعة والتجليد</span>
            </button>

            <button
              onClick={() => setAdminTab('delivery')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                adminTab === 'delivery'
                  ? 'bg-[#0c1524] text-[#caa242] shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>أماكن ورسوم التوصيل ({areaList.length})</span>
            </button>

            <button
              onClick={() => setAdminTab('payments')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                adminTab === 'payments'
                  ? 'bg-[#0c1524] text-[#caa242] shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>طرق الدفع</span>
            </button>

            <button
              onClick={() => setAdminTab('password')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                adminTab === 'password'
                  ? 'bg-[#0c1524] text-[#caa242] shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>تغيير كلمة المرور</span>
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

            {/* TAB 1: ORDERS MANAGEMENT */}
            {adminTab === 'orders' && (
              <div className="space-y-4">
                
                {/* Search & Filter Header Bar */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
                  
                  {/* Search Bar */}
                  <div className="relative flex-1 min-w-[240px]">
                    <input
                      type="text"
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      placeholder="بحث برقم الطلب #RIFAQ أو اسم العميل أو رقم الجوال..."
                      className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-[#caa242]"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Filter & CSV Export Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
                    >
                      <option value="all">جميع الحالات ({orders.length})</option>
                      <option value="new">جديد</option>
                      <option value="processing">قيد المعالجة</option>
                      <option value="ready">جاهز</option>
                      <option value="delivered">مكتمل</option>
                      <option value="cancelled">ملغي</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => downloadOrdersCSV(filteredOrders)}
                      disabled={filteredOrders.length === 0}
                      className="py-2.5 px-4 bg-[#fcf8ed] hover:bg-[#f6ebd0] text-[#927022] border border-[#caa242]/50 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                      title="تصدير ملف CSV محمي ومطابق للمعايير"
                    >
                      <Download className="w-4 h-4 text-[#caa242]" />
                      <span>تصدير CSV ({filteredOrders.length})</span>
                    </button>
                  </div>

                </div>

                {/* Orders List */}
                <div className="space-y-3">
                  {filteredOrders.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center text-slate-400 space-y-2 border border-slate-200">
                      <Package className="w-10 h-10 mx-auto text-slate-300" />
                      <p className="font-bold text-sm text-slate-600">لا توجد طلبات مطابقة للبحث أو الفلتر</p>
                      <p className="text-xs text-slate-400">ستظهر الطلبات الجديدة هنا فور قيام الطلاب بإرسالها من المنصة</p>
                    </div>
                  ) : (
                    filteredOrders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all shadow-xs space-y-3"
                      >
                        {/* Row 1: Header & Status Control */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-black text-slate-900 text-base">
                              {order.orderNumber || `#${order.id}`}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {order.createdAt ? new Date(order.createdAt).toLocaleString('ar-EG') : ''}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 font-bold">الحالة:</span>
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                              className={`text-xs rounded-xl px-3 py-1.5 font-bold outline-none border cursor-pointer ${
                                order.status === 'delivered'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : order.status === 'ready'
                                  ? 'bg-teal-50 text-teal-800 border-teal-300'
                                  : order.status === 'processing' || order.status === 'printing'
                                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                                  : order.status === 'cancelled'
                                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                                  : 'bg-blue-50 text-blue-900 border-blue-300'
                              }`}
                            >
                              <option value="new">جديد ✨</option>
                              <option value="processing">قيد المعالجة ⚙️</option>
                              <option value="ready">جاهز للاستلام 📦</option>
                              <option value="delivered">مكتمل ومسلّم ✅</option>
                              <option value="cancelled">ملغي ❌</option>
                            </select>
                          </div>
                        </div>

                        {/* Row 2: Customer & Delivery Info */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-700">
                          <div>
                            <span className="text-slate-400 block text-[11px]">العميل:</span>
                            <span className="font-bold text-slate-900">{order.customer?.fullName}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">الجوال:</span>
                            <a 
                              href={`tel:${order.customer?.phone}`} 
                              className="font-bold text-blue-600 font-mono hover:underline"
                              dir="ltr"
                            >
                              {order.customer?.phone}
                            </a>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">طريقة الاستلام:</span>
                            <span className="font-bold text-slate-900">
                              {order.customer?.deliveryMethod === 'pickup' ? 'استلام من الفرع' : `${order.customer?.area || 'توصيل'}`}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">المبلغ الإجمالي:</span>
                            <span className="font-black text-[#caa242] text-sm font-heading">{order.totalAmount} ₪</span>
                          </div>
                        </div>

                        {/* Row 3: Items & Actions */}
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                          
                          <div className="text-slate-600 flex-1">
                            {order.printJobs && order.printJobs.length > 0 && (
                              <span className="inline-block ml-3">
                                📄 ملفات طباعة ({order.printJobs.reduce((a, b) => a + (b.files?.length || 1), 0)} ملف - {order.printJobs.reduce((a, b) => a + b.pageCount, 0)} صفحة)
                              </span>
                            )}
                            {order.cartItems && order.cartItems.length > 0 && (
                              <span className="inline-block">
                                📦 منتجات ({order.cartItems.map((i) => `${i.product.name} × ${i.quantity}`).join('، ')})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {order.paymentReceipt && (
                              <button
                                type="button"
                                onClick={() => setSelectedReceiptUrl(order.paymentReceipt?.dataBase64 || null)}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#caa242]" />
                                <span>إشعار الدفع</span>
                              </button>
                            )}

                            {order.printJobs.some((job) => job.files?.some((file) => file.dataBase64)) && (
                              <button
                                type="button"
                                onClick={() => handleDownloadPrintFiles(order)}
                                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>تحميل ملفات الطباعة</span>
                              </button>
                            )}

                            {order.customer?.phone && (
                              <button
                                type="button"
                                onClick={() => openWhatsAppChat(order.customer.phone, `مرحباً ${order.customer.fullName}، بخصوص طلبك رقم ${order.orderNumber || order.id} من مكتبة الرفاق...`)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>مراسلة واتساب</span>
                              </button>
                            )}
                          </div>

                        </div>

                      </div>
                    ))
                  )}
                </div>

              </div>
            )}

            {/* TAB 2: PRODUCTS & DISCOUNT MANAGEMENT */}
            {adminTab === 'products' && (
              <div className="space-y-6">
                
                {/* Header & Add Button */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="font-heading font-extrabold text-base text-slate-900">
                      إدارة الأصناف والمنتجات والخصومات
                    </h4>
                    <p className="text-xs text-slate-500">
                      أضف أصناف جديدة لقسم الطباعة والقرطاسية والهدايا وحدد الخصومات
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenProductModal()}
                    className="px-5 py-2.5 bg-[#caa242] hover:bg-[#b88f34] text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-slate-950" />
                    <span>إضافة صنف جديد</span>
                  </button>
                </div>

                {productActionMsg && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold text-center">
                    {productActionMsg}
                  </div>
                )}

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {productList.map((prod) => {
                    const hasDiscount = Boolean(prod.originalPrice && prod.originalPrice > prod.price);
                    const discountPercent = prod.discountPercentage || (hasDiscount && prod.originalPrice 
                      ? Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100)
                      : null);

                    return (
                      <div
                        key={prod.id}
                        className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {prod.category === 'printing' ? 'قسم الطباعة' : prod.category === 'gifts' ? 'قسم الهدايا' : 'قسم القرطاسية'}
                            </span>
                            {discountPercent ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                                خصم {discountPercent}%
                              </span>
                            ) : null}
                          </div>

                          <div className="flex gap-3 items-center">
                            <img
                              src={prod.image || 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=600&q=80'}
                              alt={prod.name}
                              className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <h5 className="font-heading font-bold text-xs text-slate-900 truncate">
                                {prod.name}
                              </h5>
                              <p className="text-[11px] text-slate-500 line-clamp-1">{prod.description}</p>
                              <div className="flex items-baseline gap-2 pt-1">
                                <span className="font-black text-[#caa242] text-sm font-heading">{prod.price.toFixed(2)} ₪</span>
                                {hasDiscount && (
                                  <span className="text-[11px] text-slate-400 line-through font-mono">{prod.originalPrice?.toFixed(2)} ₪</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${prod.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {prod.inStock ? 'متوفر' : 'غير متوفر'}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenProductModal(prod)}
                              className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="تعديل وتطبيق الخصم"
                            >
                              <Edit className="w-4 h-4 text-[#caa242]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            )}

            {/* TAB 3: PRICING & SECTIONS AVAILABILITY */}
            {adminTab === 'pricing' && (
              <div className="space-y-6">
                
                {/* 1. Section Availability Toggles */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
                  <h4 className="font-heading font-extrabold text-base text-slate-900">
                    حالة وتفعيل أقسام المنصة
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-xs font-bold text-slate-800">حاسبة الطباعة:</span>
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability('printingCalculator')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          availability.printingCalculator ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {availability.printingCalculator ? 'مفعلة' : 'معطلة'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-xs font-bold text-slate-800">قسم الرزم والطباعة:</span>
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability('educationalBundles')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          availability.educationalBundles ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {availability.educationalBundles ? 'مفعل' : 'معطل'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-xs font-bold text-slate-800">خدمة التوصيل:</span>
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability('deliveryService')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          availability.deliveryService ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {availability.deliveryService ? 'مفعل' : 'معطل'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Interactive Paper & Binding Prices Editor */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-heading font-extrabold text-base text-slate-900">
                        أسعار الطباعة بالصفحة والتجليد (شواكل ₪)
                      </h4>
                      <p className="text-xs text-slate-500">
                        تعديل أسعار الورق والتجليد ينعكس مباشرة وفورياً على حاسبة الطباعة لجميع الطلاب
                      </p>
                    </div>
                  </div>

                  {pricingSaveMessage && (
                    <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold text-center">
                      {pricingSaveMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                    
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <label className="font-bold text-slate-700 block">A4 أبيض وأسود:</label>
                      <input
                        type="number"
                        step="0.01"
                        value={pricingForm.bwPriceA4}
                        onChange={(e) => setPricingForm({ ...pricingForm, bwPriceA4: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 font-bold bg-white border border-slate-300 rounded-lg text-center"
                      />
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <label className="font-bold text-slate-700 block">A4 ملون:</label>
                      <input
                        type="number"
                        step="0.01"
                        value={pricingForm.colorPriceA4}
                        onChange={(e) => setPricingForm({ ...pricingForm, colorPriceA4: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 font-bold bg-white border border-slate-300 rounded-lg text-center"
                      />
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <label className="font-bold text-slate-700 block">A5 أبيض وأسود:</label>
                      <input
                        type="number"
                        step="0.01"
                        value={pricingForm.bwPriceA5}
                        onChange={(e) => setPricingForm({ ...pricingForm, bwPriceA5: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 font-bold bg-white border border-slate-300 rounded-lg text-center"
                      />
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <label className="font-bold text-slate-700 block">A5 ملون:</label>
                      <input
                        type="number"
                        step="0.01"
                        value={pricingForm.colorPriceA5}
                        onChange={(e) => setPricingForm({ ...pricingForm, colorPriceA5: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 font-bold bg-white border border-slate-300 rounded-lg text-center"
                      />
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <label className="font-bold text-slate-700 block">A3 أبيض وأسود:</label>
                      <input
                        type="number"
                        step="0.01"
                        value={pricingForm.bwPriceA3}
                        onChange={(e) => setPricingForm({ ...pricingForm, bwPriceA3: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 font-bold bg-white border border-slate-300 rounded-lg text-center"
                      />
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <label className="font-bold text-slate-700 block">A3 ملون:</label>
                      <input
                        type="number"
                        step="0.01"
                        value={pricingForm.colorPriceA3}
                        onChange={(e) => setPricingForm({ ...pricingForm, colorPriceA3: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 font-bold bg-white border border-slate-300 rounded-lg text-center"
                      />
                    </div>

                  </div>

                  {/* Binding Prices */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <label className="font-bold text-slate-700 block">تجليد حلزوني سلك (₪):</label>
                      <input
                        type="number"
                        value={pricingForm.bindingSpiralPrice}
                        onChange={(e) => setPricingForm({ ...pricingForm, bindingSpiralPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 font-bold bg-white border border-slate-300 rounded-lg text-center"
                      />
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <label className="font-bold text-slate-700 block">تجليد حراري (₪):</label>
                      <input
                        type="number"
                        value={pricingForm.bindingThermalPrice}
                        onChange={(e) => setPricingForm({ ...pricingForm, bindingThermalPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 font-bold bg-white border border-slate-300 rounded-lg text-center"
                      />
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <label className="font-bold text-slate-700 block">غلاف كرتون مقوى فاخر (₪):</label>
                      <input
                        type="number"
                        value={pricingForm.bindingHardcoverPrice}
                        onChange={(e) => setPricingForm({ ...pricingForm, bindingHardcoverPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 font-bold bg-white border border-slate-300 rounded-lg text-center"
                      />
                    </div>
                  </div>

                  {/* 2.1 Printing Division Factors (معاملات تقسيم الصفحات بالحاسبة) */}
                  <div className="pt-3 border-t border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-heading font-extrabold text-sm text-slate-900">
                          معاملات تقسيم الصفحات (Division Factors) في حاسبة الطباعة
                        </h5>
                        <p className="text-[11px] text-slate-500">
                          حدد معامل التقسيم المعتمد لكل خيار توزيع، ويتم قسمة عدد الصفحات عليه آلياً لحساب الأوراق الفعلية والسعر الإجمالي
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-[#fcf8ed] rounded-xl border border-[#caa242]/40 space-y-1">
                        <label className="font-bold text-slate-800 block truncate">1. خيار صورة واحدة (÷):</label>
                        <input
                          type="number"
                          min="1"
                          max="16"
                          value={pricingForm.layoutDivisor1PerPage ?? 1}
                          onChange={(e) => setPricingForm({ ...pricingForm, layoutDivisor1PerPage: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="w-full p-2 font-bold bg-white border border-slate-300 rounded-lg text-center text-slate-900"
                        />
                        <span className="text-[10px] text-slate-500 block text-center">الافتراضي: 1 (بدون تقسيم)</span>
                      </div>

                      <div className="p-3 bg-[#fcf8ed] rounded-xl border border-[#caa242]/40 space-y-1">
                        <label className="font-bold text-slate-800 block truncate">2. خيار صورتين (÷):</label>
                        <input
                          type="number"
                          min="1"
                          max="16"
                          value={pricingForm.layoutDivisor2PerPage ?? 2}
                          onChange={(e) => setPricingForm({ ...pricingForm, layoutDivisor2PerPage: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="w-full p-2 font-bold bg-white border border-slate-300 rounded-lg text-center text-slate-900"
                        />
                        <span className="text-[10px] text-slate-500 block text-center">الافتراضي: 2 (قسمة على 2)</span>
                      </div>

                      <div className="p-3 bg-[#fcf8ed] rounded-xl border border-[#caa242]/40 space-y-1">
                        <label className="font-bold text-slate-800 block truncate">3. خيار أربع صور (÷):</label>
                        <input
                          type="number"
                          min="1"
                          max="16"
                          value={pricingForm.layoutDivisor4PerPage ?? 4}
                          onChange={(e) => setPricingForm({ ...pricingForm, layoutDivisor4PerPage: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="w-full p-2 font-bold bg-white border border-slate-300 rounded-lg text-center text-slate-900"
                        />
                        <span className="text-[10px] text-slate-500 block text-center">الافتراضي: 4 (قسمة على 4)</span>
                      </div>

                      <div className="p-3 bg-[#fcf8ed] rounded-xl border border-[#caa242]/40 space-y-1">
                        <label className="font-bold text-slate-800 block truncate">4. افتراضي التخصيص (÷):</label>
                        <input
                          type="number"
                          min="1"
                          max="32"
                          value={pricingForm.layoutDivisorCustomDefault ?? 6}
                          onChange={(e) => setPricingForm({ ...pricingForm, layoutDivisorCustomDefault: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="w-full p-2 font-bold bg-white border border-slate-300 rounded-lg text-center text-slate-900"
                        />
                        <span className="text-[10px] text-slate-500 block text-center">الافتراضي: 6 (أو إدخال يدوي)</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSavePricingForm}
                    className="w-full py-3 rounded-xl bg-[#caa242] hover:bg-[#b88f34] text-slate-950 font-extrabold text-xs sm:text-sm shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>حفظ وتطبيق الأسعار الجديدة</span>
                  </button>
                </div>

                {/* 3. Raw JSON Pricing Editor */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
                  <h4 className="font-heading font-extrabold text-sm text-slate-900">
                    محرر الأسعار بصيغة JSON المباشرة
                  </h4>
                  <textarea
                    value={pricingJsonText}
                    onChange={(e) => setPricingJsonText(e.target.value)}
                    rows={6}
                    className="w-full p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl outline-none focus:ring-2 focus:ring-[#caa242] text-left"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={handleSavePricingJson}
                    className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer"
                  >
                    تطبيق من كود JSON
                  </button>
                </div>

              </div>
            )}

            {/* TAB: DELIVERY AREAS & FEES MANAGEMENT */}
            {adminTab === 'delivery' && (
              <div className="space-y-6">
                
                {/* Header Action Card */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-[#caa242]" />
                      <span>إدارة مناطق وأسعار التوصيل</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      أضف أو عدل أو احذف الجامعات والمناطق السكنية مع ضبط رسوم التوصيل المعتمدة لكل منطقة
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddArea}
                    className="px-4 py-2.5 rounded-xl bg-[#caa242] hover:bg-[#b88f34] text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة منطقة توصيل جديدة</span>
                  </button>
                </div>

                {/* Delivery Areas Grid / Table */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {areaList.map((area, idx) => (
                    <div
                      key={area.id}
                      className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-[#caa242]/60 transition-all shadow-xs flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-[#fcf8ed] text-[#caa242] text-xs font-bold font-mono flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <h4 className="font-bold text-sm text-slate-900 leading-snug">
                              {area.name}
                            </h4>
                          </div>
                        </div>

                        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                          <span className="text-xs text-slate-600 font-medium">رسوم التوصيل:</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={area.fee}
                              onChange={(e) => handleUpdateAreaFeeQuick(area.id, parseFloat(e.target.value) || 0)}
                              className="w-16 px-2 py-1 text-center font-extrabold text-sm text-[#caa242] bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#caa242]"
                            />
                            <span className="text-xs font-bold text-slate-800">₪</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleOpenEditArea(area)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteArea(area.id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {areaList.length === 0 && (
                  <div className="bg-white rounded-2xl p-12 text-center text-slate-400 space-y-2 border border-slate-200">
                    <Truck className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="font-bold text-sm text-slate-600">لا توجد مناطق توصيل مضافة</p>
                    <p className="text-xs text-slate-400">انقر على زر "إضافة منطقة توصيل جديدة" لبدء إضافة الجامعات والمناطق</p>
                  </div>
                )}

              </div>
            )}

            {adminTab === 'payments' && (
              <div className="max-w-2xl mx-auto bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-5">
                <div className="space-y-1 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#fcf8ed] border border-[#caa242] flex items-center justify-center mx-auto text-[#caa242]">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <h4 className="font-heading font-extrabold text-lg text-slate-900">إعدادات طرق الدفع</h4>
                  <p className="text-xs text-slate-500">حدّث أرقام التحويل والمحافظ التي تظهر للعملاء في صفحة الدفع</p>
                </div>

                {paymentSaveMessage && (
                  <div className="p-3.5 rounded-xl text-xs font-bold text-center border bg-emerald-50 border-emerald-300 text-emerald-800">
                    {paymentSaveMessage}
                  </div>
                )}

                <form onSubmit={handleSavePaymentAccounts} className="space-y-5">
                  <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <h5 className="font-bold text-sm text-slate-900">تحويل بنكي - بنك فلسطين</h5>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <label className="space-y-1.5">
                        <span className="text-xs font-bold text-slate-700">رقم الحساب</span>
                        <input
                          type="text"
                          required
                          value={paymentAccounts.bankOfPalestine.accountNumber}
                          onChange={(e) => setPaymentAccounts({ ...paymentAccounts, bankOfPalestine: { ...paymentAccounts.bankOfPalestine, accountNumber: e.target.value } })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-[#caa242]"
                          dir="ltr"
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-xs font-bold text-slate-700">رقم IBAN</span>
                        <input
                          type="text"
                          required
                          value={paymentAccounts.bankOfPalestine.iban}
                          onChange={(e) => setPaymentAccounts({ ...paymentAccounts, bankOfPalestine: { ...paymentAccounts.bankOfPalestine, iban: e.target.value } })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-[#caa242]"
                          dir="ltr"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <h5 className="font-bold text-sm text-slate-900">المحافظ الإلكترونية</h5>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <label className="space-y-1.5">
                        <span className="text-xs font-bold text-slate-700">رقم محفظة PalPay</span>
                        <input
                          type="text"
                          required
                          value={paymentAccounts.palPay.walletNumber}
                          onChange={(e) => setPaymentAccounts({ ...paymentAccounts, palPay: { ...paymentAccounts.palPay, walletNumber: e.target.value } })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-[#caa242]"
                          dir="ltr"
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-xs font-bold text-slate-700">رقم حساب / محفظة Jawwal Pay</span>
                        <input
                          type="text"
                          required
                          value={paymentAccounts.jawwalPay.walletNumber}
                          onChange={(e) => setPaymentAccounts({ ...paymentAccounts, jawwalPay: { ...paymentAccounts.jawwalPay, walletNumber: e.target.value } })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-[#caa242]"
                          dir="ltr"
                        />
                      </label>
                    </div>
                  </div>

                  <button type="submit" className="w-full py-3 rounded-xl bg-[#caa242] hover:bg-[#b88f34] text-slate-950 font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer">
                    حفظ وتحديث بيانات الدفع
                  </button>
                </form>
              </div>
            )}

            {/* TAB 4: PASSWORD CHANGE MANAGEMENT */}
            {adminTab === 'password' && (
              <div className="max-w-md mx-auto bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-5">
                <div className="space-y-1 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#fcf8ed] border border-[#caa242] flex items-center justify-center mx-auto text-[#caa242]">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h4 className="font-heading font-extrabold text-lg text-slate-900">
                    تغيير كلمة مرور المشرف
                  </h4>
                  <p className="text-xs text-slate-500">
                    قم بتحديث كلمة المرور لحماية لوحة الإدارة وسيرفر التطبيق
                  </p>
                </div>

                {pwChangeMsg && (
                  <div
                    className={`p-3.5 rounded-xl text-xs font-bold text-center border ${
                      pwChangeMsg.isError
                        ? 'bg-rose-50 border-rose-300 text-rose-800'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    }`}
                  >
                    {pwChangeMsg.text}
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      كلمة المرور الحالية:
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-[#caa242]"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      كلمة المرور الجديدة:
                    </label>
                    <input
                      type="password"
                      required
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-[#caa242]"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      تأكيد كلمة المرور الجديدة:
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-[#caa242]"
                      dir="ltr"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingPw}
                    className="w-full py-3 rounded-xl bg-[#caa242] hover:bg-[#b88f34] text-slate-950 font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isChangingPw ? 'جاري التحديث...' : 'تحديث وحفظ كلمة المرور'}
                  </button>
                </form>
              </div>
            )}

          </div>

        </div>
      )}

      {/* Modal: Add/Edit Product & Apply Discount */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-scaleUp text-right max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h4 className="font-heading font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#caa242]" />
                <span>{editingProduct ? 'تعديل الصنف وتطبيق الخصم' : 'إضافة صنف جديد للمتجر'}</span>
              </h4>
              <button onClick={() => setIsProductModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">اسم الصنف / المنتج:</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="مثال: رزمة التميز في الفيزياء"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#caa242]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">القسم الرئيسي:</label>
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value as ProductCategory })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold cursor-pointer"
                >
                  <option value="printing">1. قسم الطباعة والرزم التعليمية</option>
                  <option value="stationery">2. قسم القرطاسية والأدوات الهندسية</option>
                  <option value="gifts">3. قسم الهدايا وبوكسات التخرج</option>
                </select>
              </div>

              {/* Price and Discount Section */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-900 block">السعر الحالي (المطلوب دفعه ₪):</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="36"
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl outline-none font-bold text-center"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">السعر الأصلي قبل الخصم (اختياري ₪):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={productForm.originalPrice}
                    onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })}
                    placeholder="45"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none font-bold text-center"
                  />
                </div>

                {parseFloat(productForm.originalPrice) > parseFloat(productForm.price) && (
                  <div className="col-span-2 text-center text-xs font-extrabold text-emerald-800">
                    ✨ سيتم تطبيق خصم بنسبة {Math.round(((parseFloat(productForm.originalPrice) - parseFloat(productForm.price)) / parseFloat(productForm.originalPrice)) * 100)}% وعرض شارة الخصم تلقائياً!
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">صورة المنتج:</label>
                <input
                  type="file"
                  accept="image/*"
                  required={!productForm.image}
                  onChange={handleProductImageUpload}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none text-xs file:mr-3 file:px-3 file:py-1.5 file:border-0 file:rounded-lg file:bg-[#caa242] file:text-slate-950 file:font-bold"
                  dir="ltr"
                />
                {productForm.image && (
                  <div className="flex items-center gap-3 pt-2">
                    <img src={productForm.image} alt="معاينة صورة المنتج" className="w-16 h-16 rounded-xl object-cover border border-slate-200" />
                    <span className="text-[11px] text-slate-500">تم تحويل الصورة وتخزينها داخل بيانات المنتج</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">الوصف:</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="وصف مختصر لمحتويات الصنف..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="stockToggle"
                  checked={productForm.inStock}
                  onChange={(e) => setProductForm({ ...productForm, inStock: e.target.checked })}
                  className="w-4 h-4 text-[#caa242] rounded"
                />
                <label htmlFor="stockToggle" className="font-bold text-slate-800 cursor-pointer">
                  الصنف متوفر في المخزن حالياً
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#caa242] hover:bg-[#b88f34] text-slate-950 font-extrabold shadow-sm active:scale-95 cursor-pointer"
                >
                  حفظ الصنف
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal: Add/Edit Delivery Area */}
      {isAreaModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-scaleUp space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#fcf8ed] text-[#caa242] flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <h4 className="font-heading font-extrabold text-base text-slate-900">
                  {editingArea ? 'تعديل منطقة / جامعة التوصيل' : 'إضافة منطقة توصيل جديدة'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsAreaModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {areaActionMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl text-center">
                {areaActionMsg}
              </div>
            )}

            <form onSubmit={handleSaveArea} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  اسم المنطقة أو الجامعة:
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: جامعة فلسطين - الزهراء، تل الهوا، حي النصر..."
                  value={areaForm.name}
                  onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#caa242]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  سعر / رسوم التوصيل (₪ شيكل):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    placeholder="5"
                    value={areaForm.fee}
                    onChange={(e) => setAreaForm({ ...areaForm, fee: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono outline-none focus:ring-2 focus:ring-[#caa242]"
                  />
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    ₪ شيكل
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAreaModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#caa242] hover:bg-[#b88f34] text-slate-950 font-extrabold text-xs shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingArea ? 'تحديث المنطقة' : 'إضافة المنطقة'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Modal: Payment Receipt Preview */}
      {selectedReceiptUrl && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white p-5 rounded-3xl max-w-lg w-full space-y-3 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h5 className="font-heading font-extrabold text-sm text-slate-900">صورة إشعار التحويل البنكي / الإلكتروني</h5>
              <button onClick={() => setSelectedReceiptUrl(null)} className="p-1 text-slate-400 hover:text-slate-900 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center p-2">
              <img src={selectedReceiptUrl} alt="إشعار الدفع" className="max-h-[70vh] w-auto object-contain rounded-lg shadow-sm" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
