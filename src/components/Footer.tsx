import React from 'react';
import { Logo } from './Logo';
import { Phone, MapPin, MessageCircle, Clock, Printer } from 'lucide-react';

interface FooterProps {
  onNavigate: (sectionId: string) => void;
  onOpenTracker: () => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenTracker, onOpenAdmin }) => {
  return (
    <footer className="bg-[#0c1524] text-white border-t border-slate-800 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800/80 text-right">
          
          {/* Col 1: Brand & Logo */}
          <div className="space-y-4">
            <div className="cursor-pointer inline-block" onClick={() => onNavigate('hero')}>
              <Logo size={70} showSubtext={true} />
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              الوجهة الطلابية والجامعية الأولى لخدمات الطباعة الرقمية والتجليد، وتوفير مستلزمات القرطاسية والأوراق والرزم بأسعار مناسبة.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="text-xs bg-[#caa242]/10 text-[#caa242] font-bold px-3 py-1.5 rounded-full border border-[#caa242]/30 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#caa242]" />
                <span>نستقبل طلباتكم 24/7 عبر المنصة</span>
              </span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-base text-[#caa242]">أقسام المنصة</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
              <li>
                <button
                  onClick={() => onNavigate('calculator')}
                  className="hover:text-[#caa242] transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-[#caa242]" />
                  <span>حاسبة الطباعة الفورية</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('printing')}
                  className="hover:text-[#caa242] transition-colors"
                >
                  قسم الطباعة والرزم
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('stationery')}
                  className="hover:text-[#caa242] transition-colors"
                >
                  قسم القرطاسية والأوراق
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('gifts')}
                  className="hover:text-[#caa242] transition-colors"
                >
                  قسم الهدايا وبوكسات التخرج
                </button>
              </li>
              <li>
                <button onClick={onOpenTracker} className="hover:text-[#caa242] transition-colors">
                  تتبع حالة الطلب (#RIFAQ)
                </button>
              </li>
              <li>
                <button onClick={onOpenAdmin} className="text-slate-500 hover:text-[#caa242] transition-colors">
                  دخول لوحة تحكم المشرفين
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact & Direct Channels */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-base text-[#caa242]">تواصل معنا</h4>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">واتساب:</span>
                  <a
                    href="https://wa.me/972592480383"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-bold text-emerald-400 hover:underline text-sm"
                    dir="ltr"
                  >
                    +972592480383
                  </a>
                </div>
              </li>

              <li className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#caa242]/20 text-[#caa242] shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">الجوال:</span>
                  <a
                    href="tel:0592480383"
                    className="font-mono font-bold text-[#caa242] hover:underline text-sm"
                    dir="ltr"
                  >
                    0592480383
                  </a>
                </div>
              </li>

              <li className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">العنوان:</span>
                  <span className="text-slate-100 font-bold text-xs">الزوايدة - آخر شارع الرواد</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Col 4: Payment Partners */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-base text-[#caa242]">وسائل الدفع المعتمدة</h4>
            <p className="text-xs text-slate-400">
              خيارات دفع سهلة ومريحة لجميع الطلاب:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] font-bold text-slate-200">
                الدفع عند الاستلام
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] font-bold text-[#caa242]">
                بنك فلسطين
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] font-bold text-sky-400">
                PalPay
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] font-bold text-emerald-400">
                جوال باي (Jawwal Pay)
              </span>
            </div>
          </div>

        </div>

        {/* Footer Bottom Bar with EXACT prompt copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 text-center sm:text-right">
          <p className="font-medium">
            جميع الحقوق محفوظة لدى الرفاق للحلول التكنولوجية © 2026
          </p>

          <div className="flex items-center gap-4 text-slate-500">
            <span>منصة مكتبة الرفاق الذكية</span>
            <span>•</span>
            <span>الزوايدة - قطاع غزة</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

