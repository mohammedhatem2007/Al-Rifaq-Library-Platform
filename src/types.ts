export type PrintType = 'bw' | 'color';
export type PaperSize = 'A4' | 'A5' | 'A3';
export type SinglePageLayout = '1_per_page' | '2_per_page' | '4_per_page' | 'custom';
export type BindingOption = 'none' | 'spiral' | 'thermal' | 'hardcover';

export interface UploadedPrintFile {
  id: string;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
  pageCount: number;
  dataBase64?: string;
  uploadedAt: string;
}

export interface PrintJob {
  id: string;
  files: UploadedPrintFile[];
  printType: PrintType;
  paperSize: PaperSize;
  layout: SinglePageLayout;
  customLayoutPages?: number;
  binding: BindingOption;
  pageCount: number;
  copyCount: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export type ProductCategory = 'printing' | 'stationery' | 'gifts' | 'bundle' | 'engineering' | 'medical' | 'notebooks';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  categoryLabel: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  image: string;
  description: string;
  inStock: boolean;
  featured?: boolean;
  tag?: string;
  itemsIncluded?: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentMethod = 'cod' | 'online_transfer';
export type DeliveryMethod = 'pickup' | 'delivery';
export type OrderStatus = 'new' | 'processing' | 'printing' | 'ready' | 'delivered' | 'cancelled';

export interface PaymentAccounts {
  bankOfPalestine: {
    name: string;
    accountNumber: string;
    iban: string;
    beneficiary: string;
  };
  palPay: {
    name: string;
    walletNumber: string;
    qrCodeLabel: string;
    beneficiary: string;
  };
  jawwalPay: {
    name: string;
    walletNumber: string;
    beneficiary: string;
  };
}

export interface OrderCustomer {
  fullName: string;
  phone: string;
  deliveryMethod: DeliveryMethod;
  address?: string;
  area?: string;
  notes?: string;
}

export interface Order {
  id: string; // e.g. RIFAQ-8492
  orderNumber: string; // #RIFAQ-8492
  createdAt: string;
  customer: OrderCustomer;
  printJobs: PrintJob[];
  cartItems: CartItem[];
  paymentMethod: PaymentMethod;
  paymentReceipt?: {
    name: string;
    url?: string;
    dataBase64?: string;
  };
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  status: OrderStatus;
  whatsappMessage: string;
}

export interface DeliveryArea {
  id: string;
  name: string;
  fee: number;
}

export interface PricingConfig {
  bwPriceA4: number; // 0.15 ₪
  colorPriceA4: number; // 0.50 ₪
  bwPriceA5: number; // 0.10 ₪
  colorPriceA5: number; // 0.35 ₪
  bwPriceA3: number; // 0.60 ₪
  colorPriceA3: number; // 1.50 ₪
  bindingSpiralPrice: number; // 3 ₪
  bindingThermalPrice: number; // 4 ₪
  bindingHardcoverPrice: number; // 5 ₪
  deliveryFeeGaza: number; // 5 ₪
  deliveryFeeUniversities: number; // 3 ₪
  deliveryFeeOther: number; // 8 ₪
  // Division factors for printing layouts (admin-configurable)
  layoutDivisor1PerPage?: number; // default 1
  layoutDivisor2PerPage?: number; // default 2
  layoutDivisor4PerPage?: number; // default 4
  layoutDivisorCustomDefault?: number; // default 6
}

export interface SectionAvailability {
  printingCalculator: boolean;
  educationalBundles: boolean;
  stationery: boolean;
  deliveryService: boolean;
  offlineMessage?: string;
}

export interface AppConfig {
  pricing: PricingConfig;
  deliveryAreas?: DeliveryArea[];
  availability: SectionAvailability;
  adminEmail: string;
  whatsappNumber: string;
}

export interface EmailLog {
  id: string;
  timestamp: string;
  recipient: string;
  subject: string;
  orderNumber: string;
  status: 'sent' | 'simulated';
  body: string;
}
