import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  User, 
  CreditCard, 
  Banknote, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Truck, 
  Store,
  Info,
  ShieldCheck,
  Send
} from 'lucide-react';
import { CartItem, PrintJob, PaymentMethod, DeliveryMethod, Order, DeliveryArea } from '../types';
import { submitOrder, generateWhatsAppOrderMessage, openWhatsAppChat } from '../services/api';
import { usePaymentAccounts } from '../utils/paymentAccounts';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  printJobs: PrintJob[];
  deliveryAreas?: DeliveryArea[];
  onOrderSuccess: (order: Order) => void;
}

const roundTotal = (value: number) => {
  const fractionalPart = value - Math.floor(value);
  return fractionalPart < 0.5 ? Math.floor(value) : Math.ceil(value);
};

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  printJobs,
  deliveryAreas,
  onOrderSuccess,
}) => {
  const activeAreas = deliveryAreas || [];
  const paymentAccounts = usePaymentAccounts();

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('pickup');
  const [selectedAreaId, setSelectedAreaId] = useState(activeAreas[0]?.id || 'gaza_center');
  const [addressDetails, setAddressDetails] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [onlineProvider, setOnlineProvider] = useState<'bop' | 'palpay' | 'jawwalpay'>('bop');
  const [receiptFile, setReceiptFile] = useState<{ name: string; preview: string; base64: string } | null>(null);
  const [notes, setNotes] = useState('');

  // Update selectedAreaId if activeAreas changes and current is not in active list
  React.useEffect(() => {
    if (activeAreas.length > 0 && !activeAreas.some((a) => a.id === selectedAreaId)) {
      setSelectedAreaId(activeAreas[0].id);
    }
  }, [activeAreas, selectedAreaId]);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  // Subtotals
  const printingSubtotal = printJobs.reduce((acc, j) => acc + j.totalPrice, 0);
  const stationerySubtotal = cartItems.reduce((acc, i) => acc + i.product.price * i.quantity, 0);
  const itemsSubtotal = roundTotal(printingSubtotal + stationerySubtotal);

  // Delivery Fee Calculation
  const selectedAreaObj = activeAreas.find((a) => a.id === selectedAreaId) || activeAreas[0];
  const deliveryFee = deliveryMethod === 'delivery' ? selectedAreaObj?.fee || 0 : 0;
  const grandTotal = roundTotal(itemsSubtotal + deliveryFee);

  // Copy helper
  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Receipt image upload handler
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('image') && !file.type.includes('pdf')) {
      setErrorMsg('يرجى رفع صورة إشعار بصيغة JPG أو PNG أو PDF');
      return;
    }

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

  // Form Validation & Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate fields
    if (!fullName.trim()) {
      setErrorMsg('يرجى إدخال الاسم الكامل للطالب/العميل');
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setErrorMsg('يرجى إدخال رقم جوال أو واتساب صحيح للتواصل وتأكيد التسليم');
      return;
    }
    if (deliveryMethod === 'delivery' && !addressDetails.trim()) {
      setErrorMsg('يرجى إدخال تفاصيل العنوان أو اسم الكلية والقاعة للتوصيل');
      return;
    }
    if (paymentMethod === 'online_transfer' && !receiptFile) {
      setErrorMsg('إرفاق صورة إشعار التحويل البنكي أو الإلكتروني إلزامي لإتمام الطلب');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build location text
      const addressOrPickup =
        deliveryMethod === 'pickup'
          ? 'استلام مباشر من فرع مكتبة الرفاق'
          : `${selectedAreaObj.name} - ${addressDetails.trim()}`;

      const deliveryMethodLabel =
        deliveryMethod === 'pickup' ? 'استلام من الفرع' : `توصيل سريع (${selectedAreaObj.name})`;

      const paymentMethodLabel =
        paymentMethod === 'cod'
          ? 'الدفع عند الاستلام'
          : `تحويل إلكتروني (${onlineProvider === 'bop' ? 'بنك فلسطين' : onlineProvider === 'palpay' ? 'PalPay' : 'Jawwal Pay'})`;

      const receiptStatusLabel =
        paymentMethod === 'online_transfer'
          ? `تم إرفاق صورة الإشعار (${receiptFile?.name || 'مرفق'})`
          : 'غير مطلوب (دفع عند الاستلام)';

      // Prepare Print jobs data for formatting
      const formattedPrintJobs = printJobs.map((j) => {
        const layoutText =
          j.layout === '1_per_page'
            ? 'صورة واحدة في الصفحة'
            : j.layout === '2_per_page'
            ? 'صورتين في الصفحة'
            : j.layout === '4_per_page'
            ? 'أربعة صور في الصفحة'
            : `مخصص (${j.customLayoutPages} صور)`;

        const bindingText =
          j.binding === 'none'
            ? 'بدون'
            : j.binding === 'spiral'
            ? 'حلزوني سلك (+3₪)'
            : j.binding === 'thermal'
            ? 'حراري (+4₪)'
            : 'كرتون محمي (+5₪)';

        return {
          filesCount: j.files.length > 0 ? j.files.length : 1,
          layoutOption: layoutText,
          totalPages: j.pageCount * j.copyCount,
          printType: j.printType === 'bw' ? 'أبيض وأسود' : 'ملون',
          paperSize: j.paperSize,
          binding: bindingText,
        };
      });

      // Prepare Cart stationery items
      const formattedCartItems = cartItems.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
      }));

      // Generate Order ID placeholder (Server will finalize #RIFAQ-XXXX)
      const clientRandomId = `RIFAQ-${Math.floor(1000 + Math.random() * 9000)}`;

      // Generate Exact WhatsApp Message
      const whatsappMsg = generateWhatsAppOrderMessage({
        orderId: clientRandomId,
        customerName: fullName.trim(),
        phone: phone.trim(),
        addressOrPickup,
        deliveryMethod: deliveryMethodLabel,
        paymentMethod: paymentMethodLabel,
        totalAmount: grandTotal,
        cartItems: formattedCartItems,
        printJobs: formattedPrintJobs,
        receiptStatus: receiptStatusLabel,
        notes: notes.trim(),
      });

      // Submit to backend
      const result = await submitOrder({
        customer: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          deliveryMethod,
          address: addressDetails.trim(),
          area: selectedAreaObj.name,
          notes: notes.trim(),
        },
        printJobs,
        cartItems,
        paymentMethod,
        paymentReceipt: receiptFile
          ? {
              name: receiptFile.name,
              url: receiptFile.preview,
              dataBase64: receiptFile.base64,
            }
          : undefined,
        subtotal: itemsSubtotal,
        deliveryFee,
        totalAmount: grandTotal,
        whatsappMessage: whatsappMsg,
      });

      if (result.success && result.order) {
        // Regenerate message with confirmed server orderId
        const finalWhatsappMsg = generateWhatsAppOrderMessage({
          orderId: result.order.id,
          customerName: fullName.trim(),
          phone: phone.trim(),
          addressOrPickup,
          deliveryMethod: deliveryMethodLabel,
          paymentMethod: paymentMethodLabel,
          totalAmount: grandTotal,
          cartItems: formattedCartItems,
          printJobs: formattedPrintJobs,
          receiptStatus: receiptStatusLabel,
          notes: notes.trim(),
        });

        result.order.whatsappMessage = finalWhatsappMsg;

        // Open WhatsApp directly as requested
        openWhatsAppChat('+972592480383', finalWhatsappMsg);

        // Notify parent of success
        onOrderSuccess(result.order);
        onClose();
      } else {
        setErrorMsg(result.error || 'حدث خطأ أثناء حفظ الطلب. يُرجى المحاولة ثانية.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'تعذر إرسال الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] animate-scaleUp">
        
        {/* Modal Header */}
        <div className="bg-[#0f172a] text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800">
          <div className="space-y-1 text-right">
            <h3 className="font-heading font-extrabold text-xl text-slate-100 flex items-center gap-2">
              <span>إتمام الطلب وتأكيد البيانات</span>
              <span className="text-xs bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded">
                الدفع والتوصيل
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              سيتم إنشاء رقم طلب خاص بك وتجهيز رسالة الواتساب تلقائياً
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-right">
          
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Customer Info */}
          <div className="space-y-4">
            <h4 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
              <User className="w-4 h-4 text-amber-600" />
              <span>1. بيانات الطالب / العميل</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  الاسم الكامل (ثلاثي) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: محمد أحمد ناصر"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  رقم الجوال / الواتساب <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0592XXXXXX أو 056XXXXXXX"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:ring-2 focus:ring-amber-500 text-left font-mono"
                    dir="ltr"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Delivery or Pickup Method */}
          <div className="space-y-4">
            <h4 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
              <Truck className="w-4 h-4 text-amber-600" />
              <span>2. طريقة استلام الطلب</span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeliveryMethod('pickup')}
                className={`p-3.5 rounded-xl border-2 text-right transition-all flex items-center gap-3 ${
                  deliveryMethod === 'pickup'
                    ? 'border-amber-600 bg-amber-50/70 font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 block">استلام من المكتبة</span>
                  <span className="text-[11px] text-slate-500 block">الفرع الرئيسي (مجاناً)</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryMethod('delivery')}
                className={`p-3.5 rounded-xl border-2 text-right transition-all flex items-center gap-3 ${
                  deliveryMethod === 'delivery'
                    ? 'border-amber-600 bg-amber-50/70 font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 block">توصيل سريع</span>
                  <span className="text-[11px] text-slate-500 block">للجامعات والمنازل</span>
                </div>
              </button>
            </div>

            {/* Delivery address details conditional */}
            {deliveryMethod === 'delivery' && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-fadeIn">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    المنطقة / الجامعة المستهدفة:
                  </label>
                  <select
                    value={selectedAreaId}
                    onChange={(e) => setSelectedAreaId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {activeAreas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name} — رسوم التوصيل: {area.fee} ₪
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    تفاصيل العنوان الدقيق (الشارع، المبنى، الكلية أو القاعة):
                  </label>
                  <input
                    type="text"
                    required
                    value={addressDetails}
                    onChange={(e) => setAddressDetails(e.target.value)}
                    placeholder="مثلاً: الكلية الجامعية UCAS - مبنى القدس، قاعة K102"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Conditional Payment Method */}
          <div className="space-y-4">
            <h4 className="font-heading font-bold text-base text-slate-900 flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span>3. وسيلة الدفع (Payment Method)</span>
              </span>
              <span className="text-xs text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded">
                خيارات مرنة
              </span>
            </h4>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                id="btn-payment-cod"
                onClick={() => setPaymentMethod('cod')}
                className={`p-4 rounded-xl border-2 text-right transition-all flex items-start gap-3 ${
                  paymentMethod === 'cod'
                    ? 'border-amber-600 bg-amber-50/70 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                    الدفع نقداً عند الاستلام (COD)
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    ادفع للمندوب أو في فرع المكتبة عند استلام أوراقك
                  </span>
                </div>
              </button>

              <button
                type="button"
                id="btn-payment-online"
                onClick={() => setPaymentMethod('online_transfer')}
                className={`p-4 rounded-xl border-2 text-right transition-all flex items-start gap-3 ${
                  paymentMethod === 'online_transfer'
                    ? 'border-amber-600 bg-amber-50/70 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                    تحويل إلكتروني / بنكي
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    بنك فلسطين، PalPay، أو جوال باي (يتطلب إشعار)
                  </span>
                </div>
              </button>
            </div>

            {/* CONDITIONAL PAYMENT LOGIC: If Online Transfer is chosen */}
            {paymentMethod === 'online_transfer' && (
              <div className="p-4 sm:p-5 bg-gradient-to-br from-amber-50/80 to-slate-50 rounded-2xl border-2 border-amber-300 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-amber-700" />
                    <span>بيانات الحسابات للتحويل المالي المباشر:</span>
                  </span>
                  <span className="text-[11px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded">
                    إرفاق الإشعار إلزامي
                  </span>
                </div>

                {/* Account Tabs */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOnlineProvider('bop')}
                    className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all ${
                      onlineProvider === 'bop'
                        ? 'bg-[#0f172a] text-amber-400 shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-300'
                    }`}
                  >
                    بنك فلسطين
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnlineProvider('palpay')}
                    className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all ${
                      onlineProvider === 'palpay'
                        ? 'bg-[#0f172a] text-amber-400 shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-300'
                    }`}
                  >
                    محفظة PalPay
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnlineProvider('jawwalpay')}
                    className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all ${
                      onlineProvider === 'jawwalpay'
                        ? 'bg-[#0f172a] text-amber-400 shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-300'
                    }`}
                  >
                    جوال باي (Jawwal Pay)
                  </button>
                </div>

                {/* Account Info Box */}
                <div className="bg-white p-3.5 rounded-xl border border-amber-200 text-xs space-y-2">
                  {onlineProvider === 'bop' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">اسم المستفيد:</span>
                        <strong className="text-slate-900">{paymentAccounts.bankOfPalestine.beneficiary}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">رقم الحساب:</span>
                        <div className="flex items-center gap-1.5">
                          <code className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                            {paymentAccounts.bankOfPalestine.accountNumber}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopy(paymentAccounts.bankOfPalestine.accountNumber, 'bop-acc')}
                            className="p-1 text-slate-500 hover:text-slate-800"
                            title="نسخ"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">رقم الآيبان (IBAN):</span>
                        <div className="flex items-center gap-1.5">
                          <code className="font-mono text-[11px] text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                            {paymentAccounts.bankOfPalestine.iban}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopy(paymentAccounts.bankOfPalestine.iban, 'bop-iban')}
                            className="p-1 text-slate-500 hover:text-slate-800"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {onlineProvider === 'palpay' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">المستفيد:</span>
                        <strong className="text-slate-900">{paymentAccounts.palPay.beneficiary}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">رقم محفظة PalPay:</span>
                        <div className="flex items-center gap-1.5">
                          <code className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                            {paymentAccounts.palPay.walletNumber}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopy(paymentAccounts.palPay.walletNumber, 'palpay-wallet')}
                            className="p-1 text-slate-500 hover:text-slate-800"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {onlineProvider === 'jawwalpay' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">المستفيد:</span>
                        <strong className="text-slate-900">{paymentAccounts.jawwalPay.beneficiary}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">رقم المحفظة (جوال باي):</span>
                        <div className="flex items-center gap-1.5">
                          <code className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                            {paymentAccounts.jawwalPay.walletNumber}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopy(paymentAccounts.jawwalPay.walletNumber, 'jawwal-wallet')}
                            className="p-1 text-slate-500 hover:text-slate-800"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {copiedField && (
                    <p className="text-[11px] text-emerald-600 font-bold text-center pt-1">
                      تم نسخ البيانات للحافظة بنجاح!
                    </p>
                  )}
                </div>

                {/* Obligatory Receipt Upload Field */}
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-bold text-slate-900 block flex items-center justify-between">
                    <span>
                      صورة إشعار التحويل المالي (سكرين شوت) <span className="text-rose-600 font-black">* إلزامي</span>
                    </span>
                    <span className="text-[11px] text-slate-500">JPG, PNG, PDF</span>
                  </label>

                  <div className="relative border-2 border-dashed border-amber-400 bg-white hover:bg-amber-50/40 p-4 rounded-xl text-center transition-colors">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      required={paymentMethod === 'online_transfer'}
                      onChange={handleReceiptUpload}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                    
                    {receiptFile ? (
                      <div className="flex items-center justify-center gap-3">
                        {receiptFile.preview.startsWith('blob:') && (
                          <img
                            src={receiptFile.preview}
                            alt="Receipt Preview"
                            className="w-12 h-12 rounded object-cover border border-slate-300 shadow-xs"
                          />
                        )}
                        <div className="text-right">
                          <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>تم إرفاق الإشعار: {receiptFile.name}</span>
                          </p>
                          <span className="text-[10px] text-slate-500">اضغط لتغيير الصورة إذا رغبت</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <Upload className="w-6 h-6 text-amber-600" />
                        <span className="text-xs font-bold text-slate-800">
                          اضغط هنا لرفع لقطة الشاشة أو ملف الإشعار
                        </span>
                        <span className="text-[10px] text-slate-400">
                          يُرجى التأكد من وضوح رقم العملية والمبلغ
                        </span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* 4. Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              ملاحظات أو توصيات إضافية (اختياري):
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: يرجى الاتصال قبل الوصول بربع ساعة، أو طباعة أول ورقة غلاف ملون..."
              rows={2}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
            ></textarea>
          </div>

          {/* Order Financial Summary Card */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>مجموع المنتجات والطباعة:</span>
              <span className="font-bold text-slate-100">{itemsSubtotal.toFixed(2)} ₪</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>رسوم التوصيل:</span>
              <span className="font-bold text-slate-100">
                {deliveryFee > 0 ? `${deliveryFee.toFixed(2)} ₪` : 'مجاناً (استلام من الفرع)'}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-baseline justify-between text-sm">
              <span className="font-bold text-slate-100">المبلغ النهائي المطلوب:</span>
              <span className="font-heading font-black text-2xl text-amber-400">
                {grandTotal} ₪
              </span>
            </div>
          </div>

          {/* Submit Action */}
          <div className="space-y-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              id="checkout-confirm-btn"
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#c8a520] via-[#d97706] to-[#c8a520] hover:from-[#d97706] hover:to-[#b45309] text-slate-950 font-black text-base shadow-xl shadow-amber-950/30 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>جاري تسجيل الطلب وإعداد الواتساب...</span>
              ) : (
                <>
                  <span>تأكيد الطلب والإرسال عبر واتساب (WhatsApp)</span>
                  <Send className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>سيتم فتح محادثة واتساب الرسمية لمكتبة الرفاق تلقائياً لتأكيد طلبك</span>
            </p>
          </div>

        </form>

      </div>
    </div>
  );
};
