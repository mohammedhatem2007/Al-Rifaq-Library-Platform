import React, { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Order } from '../types';

interface OrderSuccessModalProps {
  order: Order | null;
  onClose: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  onClose,
}) => {
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

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-200 text-right animate-scaleUp"
        onClick={(event) => event.stopPropagation()}
      >
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 text-white p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 shadow-inner border border-white/30">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h3 className="font-heading font-black text-2xl sm:text-3xl text-white">
            تم تسجيل طلبك بنجاح!
          </h3>
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

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm text-center transition-colors"
            >
              تم
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
