import React from 'react';
import { Printer, ShoppingCart, Truck, Package, ShieldCheck } from 'lucide-react';
import { Logo } from './Logo';

interface HeroSectionProps {
  onStartPrinting: () => void;
  onBrowseBundles: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onStartPrinting, onBrowseBundles }) => {
  return (
    <section id="hero" className="relative bg-[#0c1524] text-white py-16 lg:py-24 overflow-hidden border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Right Column: Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-right">
            
            {/* Top Gold Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#caa242]/40 bg-[#caa242]/10 text-[#caa242] text-xs font-bold">
              <span>خدمات طلابية متكاملة</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-white leading-tight">
              مكتبة الرفاق للطباعة
              <br />
              والخدمات الطلابية
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
              ارفع ملفاتك، اختر نوع الطباعة والتجليد، واعرف السعر مباشرة. رزم تعليمية وقرطاسية جاهزة مع توصيل سريع للطلاب.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                id="hero-btn-calc"
                onClick={onStartPrinting}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#caa242] hover:bg-[#b88f34] text-slate-950 font-bold text-sm shadow-md transition-all active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>احسب تكلفة الطباعة</span>
              </button>

              <button
                id="hero-btn-bundles"
                onClick={onBrowseBundles}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-transparent hover:bg-slate-800/80 text-[#caa242] font-bold text-sm border border-[#caa242] transition-all active:scale-95"
              >
                <ShoppingCart className="w-4 h-4 text-[#caa242]" />
                <span>تصفح المتجر</span>
              </button>
            </div>

            {/* Bottom 3 Feature Pills */}
            <div className="grid grid-cols-3 gap-3 pt-6 max-w-lg">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#142033] border border-slate-800 text-xs text-slate-200">
                <Truck className="w-4 h-4 text-[#caa242] shrink-0" />
                <span className="font-medium">توصيل سريع</span>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#142033] border border-slate-800 text-xs text-slate-200">
                <Package className="w-4 h-4 text-[#caa242] shrink-0" />
                <span className="font-medium">رزم جاهزة</span>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#142033] border border-slate-800 text-xs text-slate-200">
                <ShieldCheck className="w-4 h-4 text-[#caa242] shrink-0" />
                <span className="font-medium">جودة مضمونة</span>
              </div>
            </div>

          </div>

          {/* Left Column: Big Circular Logo Illustration */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-white shadow-2xl flex items-center justify-center p-4 border-4 border-slate-700/50">
              <img
                src="/WEB_SITE_LOGO_.png"
                alt="شعار مكتبة الرفاق"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

