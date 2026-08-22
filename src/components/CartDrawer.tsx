import React from 'react';
import { X, Trash2, Plus, Minus, Printer, Package, ArrowRight, ShoppingBag, FileText } from 'lucide-react';
import { CartItem, PrintJob } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  printJobs: PrintJob[];
  onUpdateCartItemQty: (productId: string, delta: number) => void;
  onRemoveCartItem: (productId: string) => void;
  onRemovePrintJob: (jobId: string) => void;
  onClearAll: () => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  printJobs,
  onUpdateCartItemQty,
  onRemoveCartItem,
  onRemovePrintJob,
  onClearAll,
  onProceedToCheckout,
}) => {
  if (!isOpen) return null;

  const stationerySubtotal = cartItems.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );
  const printingSubtotal = printJobs.reduce((acc, job) => acc + job.totalPrice, 0);
  const grandTotal = parseFloat((stationerySubtotal + printingSubtotal).toFixed(2));
  const totalCount = cartItems.reduce((acc, i) => acc + i.quantity, 0) + printJobs.length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 left-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-[#0f172a] text-white flex flex-col shadow-2xl border-r border-slate-800 animate-slideLeft">
          
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500 text-slate-950">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-slate-100">سلة المشتريات والطباعة</h3>
                <span className="text-xs text-slate-400">({totalCount} عناصر في السلة)</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {totalCount === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-300">سلة التسوق فارغة حالياً</p>
                  <p className="text-xs text-slate-500">
                    يمكنك حساب وطباعة ملفاتك أو اختيار الرزم والقرطاسية
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md"
                >
                  تصفح الخدمات والمنتجات
                </button>
              </div>
            ) : (
              <>
                {/* 1. Print Jobs Section */}
                {printJobs.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-400 border-b border-slate-800 pb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Printer className="w-4 h-4" />
                        <span>طلبات الطباعة المخصصة ({printJobs.length})</span>
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {printJobs.map((job) => (
                        <div
                          key={job.id}
                          className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                              <div>
                                <h4 className="font-bold text-xs sm:text-sm text-slate-100">
                                  طباعة {job.printType === 'bw' ? 'أبيض وأسود' : 'ملونة'} ({job.paperSize})
                                </h4>
                                <p className="text-[11px] text-slate-400">
                                  {job.files.length > 0
                                    ? `${job.files.length} ملفات مرفوعة`
                                    : 'بدون ملف مرفق مسبقاً'}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => onRemovePrintJob(job.id)}
                              className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition-colors"
                              title="حذف طلب الطباعة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Options pills */}
                          <div className="flex flex-wrap gap-1 text-[10px] text-slate-300">
                            <span className="px-2 py-0.5 rounded bg-slate-700/60">
                              {job.layout === '1_per_page' && 'صورة/صفحة'}
                              {job.layout === '2_per_page' && 'صورتين/صفحة'}
                              {job.layout === '4_per_page' && '4 صور/صفحة'}
                              {job.layout === 'custom' && `${job.customLayoutPages} صور`}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-700/60">
                              تجليد: {job.binding === 'none' ? 'بدون' : job.binding === 'spiral' ? 'سلك' : job.binding === 'thermal' ? 'حراري' : 'كرتون'}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-700/60">
                              {job.pageCount} صفحة × {job.copyCount} نسخة
                            </span>
                          </div>

                          <div className="pt-1.5 border-t border-slate-700/50 flex items-center justify-between text-xs">
                            <span className="text-slate-400">الإجمالي:</span>
                            <span className="font-extrabold text-amber-400 text-sm">
                              {job.totalPrice} ₪
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Stationery Items Section */}
                {cartItems.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-400 border-b border-slate-800 pb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Package className="w-4 h-4" />
                        <span>القرطاسية والرزم التعليمية ({cartItems.length})</span>
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {cartItems.map((item) => (
                        <div
                          key={item.product.id}
                          className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-3"
                        >
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-12 h-12 rounded-lg object-cover bg-slate-700 shrink-0"
                          />

                          <div className="min-w-0 flex-1 space-y-0.5">
                            <h4 className="font-bold text-xs text-slate-100 truncate">
                              {item.product.name}
                            </h4>
                            <span className="text-[11px] text-amber-400 font-bold block">
                              {item.product.price} ₪ للقطعة
                            </span>
                          </div>

                          {/* Quantity adjustments */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => onUpdateCartItemQty(item.product.id, -1)}
                              className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center text-xs font-bold text-slate-100">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateCartItemQty(item.product.id, 1)}
                              className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => onRemoveCartItem(item.product.id)}
                              className="p-1 text-rose-400 hover:text-rose-300 ml-1"
                              title="حذف الصنف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

          </div>

          {/* Drawer Footer */}
          {totalCount > 0 && (
            <div className="p-5 border-t border-slate-800 bg-[#0b1120] space-y-4">
              
              {/* Financial Subtotals */}
              <div className="space-y-1.5 text-xs text-slate-300">
                {printingSubtotal > 0 && (
                  <div className="flex justify-between">
                    <span>مجموع الطباعة:</span>
                    <span className="font-bold text-slate-100">{printingSubtotal.toFixed(2)} ₪</span>
                  </div>
                )}
                {stationerySubtotal > 0 && (
                  <div className="flex justify-between">
                    <span>مجموع القرطاسية والرزم:</span>
                    <span className="font-bold text-slate-100">{stationerySubtotal.toFixed(2)} ₪</span>
                  </div>
                )}
                <div className="flex items-baseline justify-between pt-2 border-t border-slate-800 text-sm">
                  <span className="font-bold text-slate-100">المبلغ الإجمالي (بدون التوصيل):</span>
                  <span className="font-heading font-black text-2xl text-amber-400">
                    {grandTotal} ₪
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  id="drawer-btn-checkout"
                  onClick={onProceedToCheckout}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#c8a520] to-[#d97706] hover:from-[#d97706] hover:to-[#b45309] text-slate-950 font-black text-sm shadow-xl shadow-amber-950/40 flex items-center justify-center gap-2 active:scale-98 transition-all"
                >
                  <span>متابعة بيانات الدفع والتوصيل</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>

                <button
                  onClick={onClearAll}
                  className="w-full py-2 text-center text-xs text-slate-400 hover:text-rose-400 transition-colors"
                >
                  تفريغ السلة بالكامل
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
