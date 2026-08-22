import React, { useState } from 'react';
import { Logo } from './Logo';
import { ShoppingCart, Search, ShieldCheck, Menu, X, Printer } from 'lucide-react';
import { CartItem, PrintJob } from '../types';

interface NavbarProps {
  cartItems: CartItem[];
  printJobs: PrintJob[];
  onOpenCart: () => void;
  onOpenTracker: () => void;
  onOpenAdmin: () => void;
  onNavigate: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartItems,
  printJobs,
  onOpenCart,
  onOpenTracker,
  onOpenAdmin,
  onNavigate,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0) + printJobs.length;

  const handleNavClick = (sectionId: string) => {
    onNavigate(sectionId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0c1524] text-white border-b border-slate-800/80 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Right: Brand Logo and Title */}
          <div 
            id="nav-logo-btn" 
            onClick={() => handleNavClick('hero')}
            className="cursor-pointer flex items-center gap-3 select-none transition-transform active:scale-95"
          >
            <Logo size={52} showSubtext={false} plain imageClassName="h-16 w-auto object-contain" />
            <div className="flex flex-col text-right">
              <span className="font-heading font-extrabold text-lg sm:text-xl text-white tracking-wide">
                مكتبة الرفاق
              </span>
              <span className="text-[11px] text-[#caa242] font-semibold -mt-1">
                للطباعة والخدمات الطلابية
              </span>
            </div>
          </div>

          {/* Center: Clean Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-bold text-slate-200">
            <button
              id="nav-link-calculator"
              onClick={() => handleNavClick('calculator')}
              className="hover:text-[#caa242] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#caa242]" />
              <span>حاسبة الطباعة</span>
            </button>

            <button
              id="nav-link-printing"
              onClick={() => handleNavClick('printing')}
              className="hover:text-[#caa242] transition-colors cursor-pointer"
            >
              قسم الطباعة
            </button>

            <button
              id="nav-link-stationery"
              onClick={() => handleNavClick('stationery')}
              className="hover:text-[#caa242] transition-colors cursor-pointer"
            >
              قسم القرطاسية
            </button>

            <button
              id="nav-link-gifts"
              onClick={() => handleNavClick('gifts')}
              className="hover:text-[#caa242] transition-colors cursor-pointer"
            >
              قسم الهدايا
            </button>

            <button
              id="nav-link-tracker-text"
              onClick={onOpenTracker}
              className="text-[#caa242] hover:text-[#e0b84c] transition-colors cursor-pointer flex items-center gap-1 font-extrabold"
            >
              <Search className="w-3.5 h-3.5" />
              <span>تتبع الطلب</span>
            </button>
          </nav>

          {/* Left: Cart Button and Utilities */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cart Button (Gold Pill) */}
            <button
              id="nav-cart-btn"
              onClick={onOpenCart}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-[#caa242] hover:bg-[#b88f34] text-slate-950 font-bold text-xs sm:text-sm shadow-sm transition-all transform active:scale-95 cursor-pointer"
              aria-label="سلة التسوق"
            >
              <ShoppingCart className="w-4 h-4 text-slate-950" />
              <span>السلة</span>
              {totalCartCount > 0 && (
                <span className="bg-slate-950 text-[#caa242] font-black text-xs px-1.5 py-0.5 rounded-full mr-0.5">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Tracker Button (Icon) */}
            <button
              id="nav-link-tracker"
              onClick={onOpenTracker}
              className="p-2 text-slate-300 hover:text-[#caa242] hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer"
              title="تتبع الطلب"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Admin Portal Button */}
            <button
              id="nav-admin-btn"
              onClick={onOpenAdmin}
              className="p-2 text-slate-300 hover:text-[#caa242] hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer"
              title="لوحة الإدارة"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white lg:hidden rounded-xl hover:bg-slate-800 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0c1524] border-b border-slate-800 px-5 py-6 space-y-4 animate-fadeIn" dir="rtl">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <Logo size={46} plain imageClassName="h-16 w-auto object-contain" />
            <div>
              <span className="font-heading font-extrabold text-base text-white block">مكتبة الرفاق</span>
              <span className="text-xs text-slate-400">الزوايدة - آخر شارع الرواد</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 text-sm font-bold text-slate-200">
            <button
              onClick={() => handleNavClick('calculator')}
              className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-right flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-[#caa242]" />
                <span>حاسبة الطباعة الفورية</span>
              </span>
            </button>

            <button
              onClick={() => handleNavClick('printing')}
              className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-right flex items-center justify-between"
            >
              <span>1. قسم الطباعة والرزم</span>
            </button>

            <button
              onClick={() => handleNavClick('stationery')}
              className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-right flex items-center justify-between"
            >
              <span>2. قسم القرطاسية والأوراق</span>
            </button>

            <button
              onClick={() => handleNavClick('gifts')}
              className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-right flex items-center justify-between"
            >
              <span>3. قسم الهدايا وبوكسات التخرج</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenTracker();
              }}
              className="p-3 rounded-xl bg-[#caa242]/10 border border-[#caa242]/30 text-[#caa242] text-right flex items-center justify-between font-extrabold"
            >
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#caa242]" />
                <span>تتبع حالة الطلب (#RIFAQ)</span>
              </span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
