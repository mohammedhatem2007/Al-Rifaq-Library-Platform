import React, { useState } from 'react';
import { Product, CartItem } from '../types';
import { 
  ShoppingCart, 
  Check, 
  Package, 
  Printer, 
  Gift, 
  BookOpen, 
  FileText, 
  Calculator, 
  PenTool, 
  Sparkles,
  Tag,
  CheckCircle2
} from 'lucide-react';

interface ProductsSectionProps {
  products: Product[];
  isBundlesAvailable?: boolean;
  isStationeryAvailable?: boolean;
  offlineMessage?: string;
  onAddToCart: (product: Product) => void;
  cartItems: CartItem[];
}

export const ProductsSection: React.FC<ProductsSectionProps> = ({
  products,
  onAddToCart,
  cartItems,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'printing' | 'stationery' | 'gifts'>('all');
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  // Group products by 3 main categories
  const printingProducts = products.filter((p) => p.category === 'printing' || p.category === 'bundle');
  const stationeryProducts = products.filter((p) => p.category === 'stationery' || p.category === 'notebooks' || p.category === 'engineering');
  const giftProducts = products.filter((p) => p.category === 'gifts');

  const filteredProducts = activeTab === 'all' 
    ? products 
    : products.filter((p) => {
        if (activeTab === 'printing') return p.category === 'printing' || p.category === 'bundle';
        if (activeTab === 'stationery') return p.category === 'stationery' || p.category === 'notebooks' || p.category === 'engineering';
        if (activeTab === 'gifts') return p.category === 'gifts';
        return true;
      });

  const handleAdd = (product: Product) => {
    onAddToCart(product);
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 1500);
  };

  const getProductQuantityInCart = (productId: string) => {
    const item = cartItems.find((ci) => ci.product.id === productId);
    return item ? item.quantity : 0;
  };

  const renderProductCard = (product: Product) => {
    const isAdded = addedProductId === product.id;
    const qtyInCart = getProductQuantityInCart(product.id);

    // Calculate discount if available
    const hasDiscount = Boolean(product.originalPrice && product.originalPrice > product.price);
    const discountPercent = product.discountPercentage || (hasDiscount && product.originalPrice 
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null);

    return (
      <div
        key={product.id}
        className="bg-[#0c1524] text-white rounded-2xl p-5 border border-slate-800 shadow-md hover:border-[#caa242]/70 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
      >
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {product.category === 'printing' ? 'طباعة ورزم' : product.category === 'gifts' ? 'هدايا وتخرج' : 'قرطاسية'}
          </span>

          {discountPercent ? (
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
              <Tag className="w-3 h-3 text-rose-400" />
              <span>خصم {discountPercent}%</span>
            </span>
          ) : product.tag ? (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#caa242]/20 text-[#caa242] border border-[#caa242]/40">
              {product.tag}
            </span>
          ) : null}
        </div>

        <div className="space-y-4">
          {/* Image Thumbnail */}
          <div className="w-full h-44 rounded-xl bg-[#142033] overflow-hidden border border-slate-800 relative group-hover:border-[#caa242]/40 transition-colors">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#caa242]">
                {product.category === 'printing' ? <Printer className="w-10 h-10" /> : product.category === 'gifts' ? <Gift className="w-10 h-10" /> : <Package className="w-10 h-10" />}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-2 text-right">
            <h3 className="font-heading font-extrabold text-base text-white line-clamp-1 group-hover:text-[#caa242] transition-colors">
              {product.name}
            </h3>
            
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed min-h-[2rem]">
              {product.description}
            </p>

            {/* Items included in bundle */}
            {product.itemsIncluded && product.itemsIncluded.length > 0 && (
              <div className="pt-1 pb-1 space-y-1">
                {product.itemsIncluded.slice(0, 2).map((inc, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                    <CheckCircle2 className="w-3 h-3 text-[#caa242] shrink-0" />
                    <span className="truncate">{inc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom: Pricing & Cart Action */}
        <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
          
          <div className="text-right">
            <div className="flex items-baseline gap-2">
              <span className="font-heading font-black text-lg sm:text-xl text-[#caa242]">
                {product.price.toFixed(2)} ₪
              </span>
              {hasDiscount && product.originalPrice && (
                <span className="text-xs text-slate-500 line-through font-mono">
                  {product.originalPrice.toFixed(2)} ₪
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            disabled={!product.inStock}
            onClick={() => handleAdd(product)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-sm shrink-0 cursor-pointer ${
              !product.inStock
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : isAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-[#caa242] hover:bg-[#b88f34] text-slate-950 active:scale-95'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span>تمت الإضافة</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 text-slate-950" />
                <span>{qtyInCart > 0 ? `في السلة (${qtyInCart})` : 'أضف للسلة'}</span>
              </>
            )}
          </button>

        </div>
      </div>
    );
  };

  return (
    <section id="store" className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10" dir="rtl">
      
      {/* Anchor targets for direct navigation */}
      <div id="printing" className="relative -top-24"></div>
      <div id="stationery" className="relative -top-24"></div>
      <div id="gifts" className="relative -top-24"></div>

      {/* Header & Categories Selector */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#caa242]/40 bg-[#caa242]/10 text-[#caa242] text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>متجر الرفاق الشامل</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
          تصفح الأقسام والمنتجات
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm max-w-xl mx-auto">
          نوفر لك كافة مستلزمات الطباعة والرزم التعليمية والقرطاسية وبوكسات الهدايا بأعلى جودة وأفضل الأسعار
        </p>

        {/* 3 Categories Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#0c1524] text-[#caa242] shadow-md border border-[#caa242]'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            جميع الأقسام ({products.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('printing')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'printing'
                ? 'bg-[#0c1524] text-[#caa242] shadow-md border border-[#caa242]'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Printer className="w-4 h-4 text-[#caa242]" />
            <span>1. قسم الطباعة ({printingProducts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stationery')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'stationery'
                ? 'bg-[#0c1524] text-[#caa242] shadow-md border border-[#caa242]'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#caa242]" />
            <span>2. قسم القرطاسية ({stationeryProducts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gifts')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'gifts'
                ? 'bg-[#0c1524] text-[#caa242] shadow-md border border-[#caa242]'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Gift className="w-4 h-4 text-[#caa242]" />
            <span>3. قسم الهدايا ({giftProducts.length})</span>
          </button>
        </div>
      </div>

      {/* When "All" is active, display the 3 Structured Sections */}
      {activeTab === 'all' ? (
        <div className="space-y-12">
          
          {/* Section 1: قسم الطباعة */}
          {printingProducts.length > 0 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#0c1524] text-[#caa242]">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
                      قسم الطباعة والرزم التعليمية
                    </h3>
                    <p className="text-xs text-slate-500">ملازم، دوسيات، طباعة أبحاث ومشاريع تخرج</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('printing')}
                  className="text-xs font-bold text-[#caa242] hover:underline"
                >
                  عرض الكل ({printingProducts.length})
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {printingProducts.map(renderProductCard)}
              </div>
            </div>
          )}

          {/* Section 2: قسم القرطاسية */}
          {stationeryProducts.length > 0 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#0c1524] text-[#caa242]">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
                      قسم القرطاسية والأدوات الهندسية
                    </h3>
                    <p className="text-xs text-slate-500">دفاتر جامعية، أقلام فاخرة، آلات حاسبة، وأدوات هندسية</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('stationery')}
                  className="text-xs font-bold text-[#caa242] hover:underline"
                >
                  عرض الكل ({stationeryProducts.length})
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {stationeryProducts.map(renderProductCard)}
              </div>
            </div>
          )}

          {/* Section 3: قسم الهدايا */}
          {giftProducts.length > 0 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#0c1524] text-[#caa242]">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
                      قسم الهدايا وبوكسات التخرج
                    </h3>
                    <p className="text-xs text-slate-500">أكواب حرارية مخصصة، دروع تخرج، وأطقم أقلام محفورة بالليزر</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('gifts')}
                  className="text-xs font-bold text-[#caa242] hover:underline"
                >
                  عرض الكل ({giftProducts.length})
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {giftProducts.map(renderProductCard)}
              </div>
            </div>
          )}

        </div>
      ) : (
        /* Filtered single category view */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-fadeIn">
          {filteredProducts.map(renderProductCard)}
        </div>
      )}

    </section>
  );
};
