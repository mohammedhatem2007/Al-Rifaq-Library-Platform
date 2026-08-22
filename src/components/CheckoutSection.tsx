import React, { useState } from 'react';
import { 
  AlertCircle, 
  Upload, 
  Send, 
  Store, 
  Truck
} from 'lucide-react';
import { CartItem, PrintJob, DeliveryMethod, Order, DeliveryArea } from '../types';
import { DELIVERY_AREAS as DEFAULT_DELIVERY_AREAS, PAYMENT_ACCOUNTS } from '../data/mockData';
import { submitOrder, generateWhatsAppOrderMessage, openWhatsAppChat } from '../services/api';

interface CheckoutSectionProps {
  cartItems: CartItem[];
  printJobs: PrintJob[];
  deliveryAreas?: DeliveryArea[];
  onOrderSuccess: (order: Order) => void;
}

const roundTotal = (value: number) => {
  const fractionalPart = value - Math.floor(value);
  return fractionalPart < 0.5 ? Math.floor(value) : Math.ceil(value);
};

export const CheckoutSection: React.FC<CheckoutSectionProps> = ({
  cartItems,
  printJobs,
  deliveryAreas,
  onOrderSuccess,
}) => {
  const activeAreas = deliveryAreas && deliveryAreas.length > 0 ? deliveryAreas : DEFAULT_DELIVERY_AREAS;

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('pickup');
  const [selectedAreaId, setSelectedAreaId] = useState(activeAreas[0]?.id || 'gaza_center');
  const [addressDetails, setAddressDetails] = useState('');
  const [paymentOption, setPaymentOption] = useState<'cod' | 'bop' | 'palpay' | 'jawwalpay'>('cod');
  const [receiptFile, setReceiptFile] = useState<{ name: string; preview: string; base64: string } | null>(null);
  const [notes, setNotes] = useState('');

  // Update selectedAreaId if activeAreas changes and current selected is invalid
  React.useEffect(() => {
    if (activeAreas.length > 0 && !activeAreas.some((a) => a.id === selectedAreaId)) {
      setSelectedAreaId(activeAreas[0].id);
    }
  }, [activeAreas, selectedAreaId]);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Subtotals
  const printingSubtotal = printJobs.reduce((acc, j) => acc + j.totalPrice, 0);
  const stationerySubtotal = cartItems.reduce((acc, i) => acc + i.product.price * i.quantity, 0);
  const itemsSubtotal = roundTotal(printingSubtotal + stationerySubtotal);

  // Delivery Fee Calculation
  const selectedAreaObj = activeAreas.find((a) => a.id === selectedAreaId) || activeAreas[0] || { id: 'default', name: 'المدينة', fee: 5 };
  const deliveryFee = deliveryMethod === 'delivery' ? selectedAreaObj.fee : 0;
  const grandTotal = roundTotal(itemsSubtotal + deliveryFee);

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setReceiptFile({
        name: file.name,
        preview: previewUrl,
        base64,
      });
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (itemsSubtotal <= 0 && printJobs.length === 0 && cartItems.length === 0) {
      setErrorMsg('السلة فارغة! يرجى إضافة ملفات للطباعة أو اختيار منتجات من المتجر أولاً.');
      return;
    }

    if (!fullName.trim()) {
      setErrorMsg('يرجى إدخال الاسم الكامل');
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setErrorMsg('يرجى إدخال رقم جوال أو واتساب صحيح');
      return;
    }
    if (deliveryMethod === 'delivery' && !addressDetails.trim()) {
      setErrorMsg('يرجى كتابة تفاصيل العنوان للتوصيل');
      return;
    }
    if (paymentOption !== 'cod' && !receiptFile) {
      setErrorMsg('يرجى إرفاق صورة إشعار التحويل لتأكيد الطلب');
      return;
    }

    setIsSubmitting(true);

    try {
      const addressOrPickup =
        deliveryMethod === 'pickup'
          ? 'استلام من الفرع'
          : `${selectedAreaObj.name} - ${addressDetails.trim()}`;

      const deliveryMethodLabel =
        deliveryMethod === 'pickup' ? 'استلام من الفرع' : `توصيل (${selectedAreaObj.name})`;

      const paymentMethodLabel =
        paymentOption === 'cod'
          ? 'الدفع عند الاستلام'
          : paymentOption === 'bop'
          ? 'تحويل بنكي - بنك فلسطين'
          : paymentOption === 'palpay'
          ? 'PalPay'
          : 'Jawwal Pay';

      const receiptStatusLabel =
        paymentOption !== 'cod'
          ? `تم إرفاق صورة الإشعار (${receiptFile?.name || 'مرفق'})`
          : 'غير مطلوب (دفع عند الاستلام)';

      const res = await submitOrder({
        customer: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          deliveryMethod,
          area: deliveryMethod === 'delivery' ? selectedAreaObj.name : 'استلام من الفرع',
          address: addressDetails.trim(),
          notes: notes.trim(),
        },
        paymentMethod: paymentOption === 'cod' ? 'cod' : 'online_transfer',
        paymentReceipt: receiptFile
          ? {
              name: receiptFile.name,
              dataBase64: receiptFile.base64,
            }
          : undefined,
        printJobs,
        cartItems,
        subtotal: itemsSubtotal,
        deliveryFee,
        totalAmount: grandTotal,
      });

      if (res.success && res.order) {
        const primaryJob = printJobs[0];
        const layoutText = primaryJob
          ? primaryJob.layout === '1_per_page'
            ? 'صورة واحدة في الصفحة'
            : primaryJob.layout === '2_per_page'
            ? 'صورتين في الصفحة'
            : primaryJob.layout === '4_per_page'
            ? 'أربع صور في الصفحة'
            : `مخصص (${primaryJob.customLayoutPages || 1} صور)`
          : 'صورة واحدة في الصفحة';

        const bindingText = primaryJob
          ? primaryJob.binding === 'none'
            ? 'بدون تجليد'
            : primaryJob.binding === 'spiral'
            ? 'حلزوني سلك (+3₪)'
            : primaryJob.binding === 'thermal'
            ? 'حراري (+4₪)'
            : 'غلاف كرتون (+5₪)'
          : 'بدون تجليد';

        const whatsAppMsg = generateWhatsAppOrderMessage({
          orderId: res.order.orderNumber || res.order.id,
          customerName: fullName.trim(),
          phone: phone.trim(),
          addressOrPickup,
          deliveryMethod: deliveryMethodLabel,
          paymentMethod: paymentMethodLabel,
          totalAmount: grandTotal,
          receiptStatus: receiptStatusLabel,
          notes: notes.trim(),
          cartItems: cartItems.map((ci) => ({
            name: ci.product.name,
            quantity: ci.quantity,
          })),
          printJobs: printJobs.map((pj) => ({
            filesCount: pj.files.length,
            layoutOption: layoutText,
            totalPages: pj.pageCount * pj.copyCount,
            printType: pj.printType === 'bw' ? 'أبيض وأسود' : 'ملون',
            paperSize: pj.paperSize,
            binding: bindingText,
          })),
        });

        openWhatsAppChat('+972592480383', whatsAppMsg);
        onOrderSuccess(res.order);
      } else {
        setErrorMsg(res.error || 'حدث خطأ أثناء تسجيل الطلب، يرجى المحاولة ثانية');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('تعذر تسجيل الطلب، يرجى التحقق من اتصالك والمحاولة مجدداً');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="checkout-section" className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="text-center mb-10 space-y-1">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
          إتمام الطلب
        </h2>
        <p className="text-slate-500 text-sm">
          أدخل بياناتك وسيتم إرسال الطلب عبر واتساب
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Summary Card (4 cols) */}
        <div className="lg:col-span-4 order-2 lg:order-1">
          <div className="bg-[#0c1524] text-white rounded-2xl p-6 sm:p-7 shadow-xl space-y-6">
            
            <div>
              <h3 className="font-heading font-extrabold text-lg text-[#caa242]">
                الإجمالي النهائي
              </h3>
            </div>

            <div className="text-center py-4 bg-[#142033] rounded-xl border border-slate-800 space-y-1">
              <span className="text-3xl sm:text-4xl font-black text-[#caa242] font-heading block">
                {grandTotal.toFixed(2)} ₪
              </span>
              {deliveryFee > 0 && (
                <span className="text-[11px] text-slate-400">
                  (يشمل رسوم التوصيل {deliveryFee} ₪)
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 text-center leading-relaxed">
              سيتم إرسال تفاصيل الطلب عبر واتساب لتأكيدها مع فريق المكتبة
            </p>

            {errorMsg && (
              <div className="p-3 bg-rose-950/80 border border-rose-700/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              id="confirm-order-btn"
              className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl bg-[#caa242] hover:bg-[#b88f34] text-slate-950 font-extrabold text-base shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span>جاري تسجيل الطلب...</span>
              ) : (
                <>
                  <span>تأكيد الطلب</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>

          </div>
        </div>

        {/* Right Side: Inputs Form (8 cols) */}
        <div className="lg:col-span-8 order-1 lg:order-2">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6 text-right">
            
            {/* 1. Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">
                  الاسم الكامل <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="الاسم الثلاثي..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#caa242] text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">
                  رقم الجوال / واتساب <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05XXXXXXXX"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#caa242] text-slate-900"
                  dir="ltr"
                />
              </div>
            </div>

            {/* 2. Delivery Method */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                طريقة الاستلام
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('pickup')}
                  className={`py-3 px-4 rounded-xl border-2 text-xs sm:text-sm font-bold transition-all text-center flex items-center justify-center gap-2 cursor-pointer ${
                    deliveryMethod === 'pickup'
                      ? 'border-[#caa242] bg-[#fcf8ed] text-slate-950'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Store className="w-4 h-4 text-[#caa242]" />
                  <span>استلام من الفرع</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryMethod('delivery')}
                  className={`py-3 px-4 rounded-xl border-2 text-xs sm:text-sm font-bold transition-all text-center flex items-center justify-center gap-2 cursor-pointer ${
                    deliveryMethod === 'delivery'
                      ? 'border-[#caa242] bg-[#fcf8ed] text-slate-950'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Truck className="w-4 h-4 text-[#caa242]" />
                  <span>توصيل للعنوان</span>
                </button>
              </div>

              {deliveryMethod === 'delivery' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">المنطقة / الجامعة:</label>
                    <select
                      value={selectedAreaId}
                      onChange={(e) => setSelectedAreaId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                    >
                      {activeAreas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} (+{a.fee} ₪)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">العنوان التفصيلي:</label>
                    <input
                      type="text"
                      value={addressDetails}
                      onChange={(e) => setAddressDetails(e.target.value)}
                      placeholder="الشارع، المعلم القريب، رقم المبنى..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. Payment Method */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                وسيلة الدفع
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'cod' as const, label: 'الدفع عند الاستلام' },
                  { id: 'bop' as const, label: 'تحويل بنكي - بنك فلسطين' },
                  { id: 'palpay' as const, label: 'PalPay' },
                  { id: 'jawwalpay' as const, label: 'Jawwal Pay' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPaymentOption(item.id)}
                    className={`p-3 rounded-xl border-2 text-xs font-bold transition-all text-center flex items-center justify-center cursor-pointer ${
                      paymentOption === item.id
                        ? 'border-[#caa242] bg-[#fcf8ed] text-slate-950'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Online Payment Details Card */}
              {paymentOption !== 'cod' && (
                <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  {paymentOption === 'bop' && (
                    <div className="space-y-1.5">
                      <div className="font-bold text-slate-800">بيانات الحساب - بنك فلسطين:</div>
                      <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                        <span>رقم الحساب: <strong>{PAYMENT_ACCOUNTS.bankOfPalestine.accountNumber}</strong></span>
                        <button
                          type="button"
                          onClick={() => handleCopy(PAYMENT_ACCOUNTS.bankOfPalestine.accountNumber, 'bop')}
                          className="text-[#caa242] font-bold text-[11px] cursor-pointer"
                        >
                          {copiedField === 'bop' ? 'تم النسخ' : 'نسخ'}
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-500">اسم المستفيد: {PAYMENT_ACCOUNTS.bankOfPalestine.beneficiary}</div>
                    </div>
                  )}

                  {paymentOption === 'palpay' && (
                    <div className="space-y-1.5">
                      <div className="font-bold text-slate-800">بيانات محفظة PalPay:</div>
                      <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                        <span>رقم المحفظة: <strong>{PAYMENT_ACCOUNTS.palPay.walletNumber}</strong></span>
                        <button
                          type="button"
                          onClick={() => handleCopy(PAYMENT_ACCOUNTS.palPay.walletNumber, 'palpay')}
                          className="text-[#caa242] font-bold text-[11px] cursor-pointer"
                        >
                          {copiedField === 'palpay' ? 'تم النسخ' : 'نسخ'}
                        </button>
                      </div>
                    </div>
                  )}

                  {paymentOption === 'jawwalpay' && (
                    <div className="space-y-1.5">
                      <div className="font-bold text-slate-800">بيانات حساب Jawwal Pay:</div>
                      <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                        <span>رقم الحساب / المحفظة: <strong>{PAYMENT_ACCOUNTS.jawwalPay.walletNumber}</strong></span>
                        <button
                          type="button"
                          onClick={() => handleCopy(PAYMENT_ACCOUNTS.jawwalPay.walletNumber, 'jawwal')}
                          className="text-[#caa242] font-bold text-[11px] cursor-pointer"
                        >
                          {copiedField === 'jawwal' ? 'تم النسخ' : 'نسخ'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Upload Receipt */}
                  <div className="pt-2 border-t border-slate-200 space-y-1.5">
                    <label className="font-bold text-slate-800 block">
                      إرفاق صورة إشعار التحويل <span className="text-rose-500">*</span>
                    </label>
                    <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 rounded-xl bg-white hover:border-[#caa242] cursor-pointer text-slate-600">
                      <Upload className="w-4 h-4 text-[#caa242]" />
                      <span className="text-xs">{receiptFile ? receiptFile.name : 'اضغط لاختيار صورة الإشعار أو لقطة الشاشة'}</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={handleReceiptUpload}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 block">
                ملاحظات
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي ملاحظات خاصة بالتسليم أو الطلب..."
                rows={2}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#caa242] text-slate-900"
              ></textarea>
            </div>

          </div>
        </div>

      </form>

    </section>
  );
};
