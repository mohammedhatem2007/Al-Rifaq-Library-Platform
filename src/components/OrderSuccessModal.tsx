import React, { useEffect, useState } from 'react';
import { CheckCircle2, MessageCircle, Copy, Check, Printer } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Order } from '../types';
import { openWhatsAppChat } from '../services/api';

interface OrderSuccessModalProps {
  order: Order | null;
  onClose: () => void;
  onTrackOrder: (orderId: string) => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  onClose,
  onTrackOrder,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (order) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#c8a520', '#0f172a', '#10b981', '#f59e0b'],
        });
      } catch {}
    }
  }, [order]);

  if (!order) return null;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(order.whatsappMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleReopenWhatsApp = () => {
    openWhatsAppChat('+972592480383', order.whatsappMessage);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-200 text-right animate-scaleUp">
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 text-white p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 shadow-inner border border-white/30">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h3 className="font-heading font-black text-2xl sm:text-3xl text-white">
            تم تسجيل طلبك بنجاح!
          </h3>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1">
            شكراً لثقتكم بمكتبة الرفاق للطباعة والخدمات الطلابية
          </p>

          <div className="mt-4 inline-block bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/30">
            <span className="text-xs text-emerald-200">رقم الطلب الخاص بك: </span>
            <strong className="font-mono text-base text-amber-300 font-extrabold tracking-wider">
              {order.orderNumber || `#${order.id}`}
            </strong>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-7 space-y-6">
          
          {/* Quick Summary Grid */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>الاسم:</span>
              <strong className="text-slate-900">{order.customer.fullName}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>رقم الجوال:</span>
              <strong className="text-slate-900 font-mono">{order.customer.phone}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>الاستلام / العنوان:</span>
              <strong className="text-slate-900">
                {order.customer.deliveryMethod === 'pickup' ? 'استلام من المكتبة' : `${order.customer.area} - ${order.customer.address}`}
              </strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>وسيلة الدفع:</span>
              <strong className="text-slate-900">
                {order.paymentMethod === 'cod' ? 'الدفع عند الاستلام' : 'تحويل إلكتروني / بنكي'}
              </strong>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-sm">
              <span className="font-bold text-slate-800">المبلغ الإجمالي:</span>
              <strong className="font-heading font-black text-amber-800 text-lg">
                {order.totalAmount} ₪
              </strong>
            </div>
          </div>

          {/* WhatsApp Direct Action Banner */}
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs sm:text-sm">
              <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>هل تم إرسال رسالة الطلب عبر واتساب؟</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              إذا لم يفتح تطبيق واتساب تلقائياً، يمكنك الضغط على الزر الأخضر أدناه لإرسال تفاصيل الطلب مباشرة إلى رقم المكتبة (+972592480383).
            </p>

            <button
              onClick={handleReopenWhatsApp}
              id="order-success-reopen-wa"
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>إرسال الطلب إلى واتساب المكتبة الآن</span>
            </button>
          </div>

          {/* Formatted Text Preview with Copy Option */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>نص الرسالة المجهزة للواتساب:</span>
              <button
                onClick={handleCopyMessage}
                className="flex items-center gap-1 text-amber-800 hover:text-amber-900 font-bold bg-amber-50 px-2 py-1 rounded border border-amber-200"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ الرسالة كاملة'}</span>
              </button>
            </div>

            <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed border border-slate-800" dir="ltr">
              {order.whatsappMessage}
            </pre>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => onTrackOrder(order.id)}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs sm:text-sm text-center transition-colors"
            >
              تتبع حالة هذا الطلب
            </button>

            <button
              onClick={handlePrintReceipt}
              className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة إيصال الطلب</span>
            </button>

            <button
              onClick={onClose}
              className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm text-center transition-colors"
            >
              العودة للرئيسية
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
