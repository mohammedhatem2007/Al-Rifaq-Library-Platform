import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Clock, 
  CheckCircle2, 
  Package, 
  Printer, 
  Truck, 
  AlertCircle, 
  Phone, 
  MessageCircle, 
  Sparkles, 
  Settings, 
  PackageCheck, 
  CheckCheck, 
  Store, 
  FileText, 
  Calendar, 
  User, 
  CreditCard,
  Ban
} from 'lucide-react';
import { Logo } from './Logo';
import { Order, OrderStatus } from '../types';
import { lookupOrder, openWhatsAppChat } from '../services/api';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderId?: string;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  initialOrderId = '',
}) => {
  const [searchTerm, setSearchTerm] = useState(initialOrderId);
  const [isLoading, setIsLoading] = useState(false);
  const [orderResult, setOrderResult] = useState<Order | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-search if initialOrderId is provided
  useEffect(() => {
    if (isOpen && initialOrderId) {
      setSearchTerm(initialOrderId);
      executeSearch(initialOrderId);
    }
  }, [isOpen, initialOrderId]);

  if (!isOpen) return null;

  const executeSearch = async (term: string) => {
    if (!term.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);
    setOrderResult(null);

    try {
      const res = await lookupOrder(term.trim());
      if (res.success && res.order) {
        setOrderResult(res.order);
      } else {
        setErrorMsg(res.error || 'لم يتم العثور على طلب بهذا الرقم أو برقم الجوال المدخل');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء البحث عن الطلب، يرجى المحاولة ثانية');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchTerm);
  };

  // Map order status to numeric stage index (0 to 3)
  const getStatusStageIndex = (status: OrderStatus) => {
    switch (status) {
      case 'new':
        return 0; // جديد
      case 'processing':
      case 'printing':
        return 1; // قيد المعالجة
      case 'ready':
        return 2; // جاهز
      case 'delivered':
        return 3; // مكتمل
      case 'cancelled':
        return -1;
      default:
        return 0;
    }
  };

  // 4 Stages definition as requested
  const stages = [
    {
      id: 'new',
      title: 'جديد',
      badge: 'تم الاستلام',
      description: 'تم تسجيل الطلب في النظام وتأكيد البيانات وبانتظار بدء التجهيز.',
      icon: Sparkles,
      color: 'from-blue-500 to-cyan-500',
      activeBorder: 'border-blue-500',
      activeBg: 'bg-blue-50 text-blue-900',
      iconBg: 'bg-blue-600',
    },
    {
      id: 'processing',
      title: 'قيد المعالجة',
      badge: 'جاري التجهيز والطباعة',
      description: 'جاري مراجعة الملفات، الطباعة بجودة عالية، التجليد وتجهيز القرطاسية.',
      icon: Printer,
      color: 'from-amber-500 to-orange-500',
      activeBorder: 'border-[#caa242]',
      activeBg: 'bg-amber-50 text-amber-950',
      iconBg: 'bg-[#caa242]',
    },
    {
      id: 'ready',
      title: 'جاهز',
      badge: 'جاهز للاستلام / التسليم',
      description: 'تم تجهيز الطلب بالكامل وتغليفه، وهو بانتظار استلامك أو تسليمه للمندوب.',
      icon: PackageCheck,
      color: 'from-emerald-500 to-teal-500',
      activeBorder: 'border-emerald-500',
      activeBg: 'bg-emerald-50 text-emerald-950',
      iconBg: 'bg-emerald-600',
    },
    {
      id: 'delivered',
      title: 'مكتمل',
      badge: 'تم التسليم بنجاح',
      description: 'تم تسليم الطلب بنجاح. نتمنى لكم التوفيق والنجاح الدائم!',
      icon: CheckCheck,
      color: 'from-emerald-600 to-teal-700',
      activeBorder: 'border-emerald-600',
      activeBg: 'bg-emerald-100 text-emerald-950',
      iconBg: 'bg-emerald-700',
    },
  ];

  const currentStageIndex = orderResult ? getStatusStageIndex(orderResult.status) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 text-right animate-scaleUp max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-[#0c1524] text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <Logo size={40} />
            <div>
              <h3 className="font-heading font-extrabold text-lg sm:text-xl text-white flex items-center gap-2">
                <span>تتبع حالة الطلب</span>
              </h3>
              <p className="text-xs text-slate-400">تابع مسار تجهيز وطباعة طلبك خطوة بخطوة</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1">
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              رقم الطلب أو رقم الجوال:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  required
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="مثال: RIFAQ-6053 أو 059XXXXXXX"
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#caa242] transition-all"
                  dir="ltr"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-[#caa242] hover:bg-[#b88f34] text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-sm shrink-0 disabled:opacity-50 active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                {isLoading ? (
                  <span>جاري البحث...</span>
                ) : (
                  <>
                    <Search className="w-4 h-4 text-slate-950" />
                    <span>تتبع الطلب</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Order Details & Timeline Display */}
          {orderResult && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Top Overview Badge */}
              <div className="bg-[#0c1524] text-white rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-4 shadow-md">
                
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">رقم الطلب</span>
                    <span className="font-heading font-black text-lg sm:text-xl text-[#caa242] font-mono">
                      {orderResult.orderNumber || `#${orderResult.id}`}
                    </span>
                  </div>

                  <div className="text-left">
                    <span className="text-[11px] text-slate-400 block font-medium">الحالة الحالية</span>
                    {orderResult.status === 'cancelled' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold">
                        <Ban className="w-3.5 h-3.5" />
                        <span>ملغي</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#caa242]/20 text-[#caa242] border border-[#caa242]/40 text-xs font-bold">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{stages[currentStageIndex]?.badge || 'قيد المتابعة'}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 flex items-center gap-1">
                      <User className="w-3 h-3 text-[#caa242]" />
                      <span>العميل:</span>
                    </span>
                    <p className="font-bold text-slate-200">{orderResult.customer.fullName}</p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Truck className="w-3 h-3 text-[#caa242]" />
                      <span>الاستلام:</span>
                    </span>
                    <p className="font-bold text-slate-200">
                      {orderResult.customer.deliveryMethod === 'pickup' ? 'استلام من الفرع' : orderResult.customer.area || 'توصيل'}
                    </p>
                  </div>

                  <div className="space-y-0.5 col-span-2 sm:col-span-1">
                    <span className="text-slate-400 flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-[#caa242]" />
                      <span>الإجمالي:</span>
                    </span>
                    <p className="font-black text-[#caa242] text-sm font-heading">{orderResult.totalAmount} ₪</p>
                  </div>
                </div>

              </div>

              {/* Visual Timeline Section */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-6">
                
                <div className="flex items-center justify-between">
                  <h4 className="font-heading font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#caa242]" />
                    <span>المسار الزمني للطلب (Timeline)</span>
                  </h4>
                  <span className="text-xs text-slate-500">
                    {orderResult.status === 'delivered' ? 'اكتملت جميع المراحل' : 'متابعة حية'}
                  </span>
                </div>

                {orderResult.status === 'cancelled' ? (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold text-center flex items-center justify-center gap-2">
                    <Ban className="w-4 h-4 text-rose-600" />
                    <span>تم إلغاء هذا الطلب من قِبل إدارة المكتبة</span>
                  </div>
                ) : (
                  <>
                    {/* 1. Horizontal Stepper Header Bar */}
                    <div className="relative pt-2 pb-4">
                      {/* Background Bar */}
                      <div className="absolute top-7 right-6 left-6 h-1 bg-slate-200 -translate-y-1/2 rounded-full"></div>
                      {/* Active Filled Bar */}
                      <div 
                        className="absolute top-7 right-6 h-1 bg-[#caa242] -translate-y-1/2 rounded-full transition-all duration-700"
                        style={{
                          width: `${(currentStageIndex / (stages.length - 1)) * 100}%`
                        }}
                      ></div>

                      <div className="relative flex justify-between items-start">
                        {stages.map((stage, idx) => {
                          const isPast = idx < currentStageIndex;
                          const isCurrent = idx === currentStageIndex;
                          const isUpcoming = idx > currentStageIndex;
                          const StageIcon = stage.icon;

                          return (
                            <div key={stage.id} className="flex flex-col items-center space-y-1.5 z-10">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                                  isPast
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : isCurrent
                                    ? 'bg-[#caa242] text-slate-950 ring-4 ring-[#caa242]/30 scale-110 shadow-md animate-pulse'
                                    : 'bg-slate-100 text-slate-400 border border-slate-300'
                                }`}
                              >
                                {isPast ? (
                                  <CheckCircle2 className="w-5 h-5" />
                                ) : (
                                  <StageIcon className="w-5 h-5" />
                                )}
                              </div>
                              <span
                                className={`text-[11px] sm:text-xs text-center font-bold transition-colors ${
                                  isCurrent
                                    ? 'text-slate-950 font-black'
                                    : isPast
                                    ? 'text-emerald-700'
                                    : 'text-slate-400'
                                }`}
                              >
                                {stage.title}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. Detailed Vertical Interactive Timeline */}
                    <div className="space-y-3 pt-2">
                      {stages.map((stage, idx) => {
                        const isPast = idx < currentStageIndex;
                        const isCurrent = idx === currentStageIndex;
                        const isUpcoming = idx > currentStageIndex;
                        const StageIcon = stage.icon;

                        return (
                          <div
                            key={stage.id}
                            className={`p-4 rounded-2xl border transition-all duration-300 flex items-start gap-3.5 ${
                              isCurrent
                                ? 'bg-[#fcf8ed] border-[#caa242] shadow-xs'
                                : isPast
                                ? 'bg-slate-50 border-slate-200/80 opacity-90'
                                : 'bg-slate-50/50 border-slate-200/50 opacity-50'
                            }`}
                          >
                            {/* Icon Node */}
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                isPast
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : isCurrent
                                  ? 'bg-[#caa242] text-slate-950 shadow-sm'
                                  : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              <StageIcon className="w-4 h-4" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 space-y-1 text-right">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-heading font-extrabold text-sm text-slate-900">
                                    {stage.title}
                                  </h5>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                    isCurrent
                                      ? 'bg-[#caa242] text-slate-950'
                                      : isPast
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-slate-200 text-slate-600'
                                  }`}>
                                    {stage.badge}
                                  </span>
                                </div>

                                {isPast && (
                                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>مكتملة</span>
                                  </span>
                                )}
                                {isCurrent && (
                                  <span className="text-[11px] font-bold text-amber-700 animate-pulse flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    <span>المرحلة الحالية</span>
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-slate-600 leading-relaxed">
                                {stage.description}
                              </p>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

              </div>

              {/* Order Items Details */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3 text-xs">
                <h5 className="font-heading font-bold text-slate-900 text-xs">
                  محتويات الطلب:
                </h5>

                <div className="space-y-2">
                  {orderResult.printJobs?.map((job, idx) => (
                    <div key={idx} className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 block">
                          📄 ملف طباعة ({job.paperSize} - {job.printType === 'bw' ? 'أبيض وأسود' : 'ملون'})
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {job.pageCount} صفحة × {job.copyCount} نسخة | تجليد: {job.binding === 'none' ? 'بدون' : job.binding}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900">{job.totalPrice} ₪</span>
                    </div>
                  ))}

                  {orderResult.cartItems?.map((item, idx) => (
                    <div key={idx} className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                      <span className="font-bold text-slate-800">
                        📦 {item.product.name} × {item.quantity}
                      </span>
                      <span className="font-bold text-slate-900">
                        {(item.product.price * item.quantity).toFixed(2)} ₪
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* WhatsApp Support Action */}
              <button
                type="button"
                onClick={() => openWhatsAppChat('+972592480383', `مرحباً مكتبة الرفاق، أود الاستفسار عن حالة طلبي رقم ${orderResult.orderNumber || orderResult.id}`)}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>الاستفسار المباشر عبر واتساب عن الطلب</span>
              </button>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
