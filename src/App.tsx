/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { PrintingCalculator } from './components/PrintingCalculator';
import { ProductsSection } from './components/ProductsSection';
import { CheckoutSection } from './components/CheckoutSection';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Footer } from './components/Footer';
import { CartItem, PrintJob, Product, Order, AppConfig, PricingConfig, SectionAvailability, DeliveryArea } from './types';
import { DEFAULT_PRICING, DEFAULT_AVAILABILITY } from './data/mockData';
import { fetchAppConfig, fetchDeliveryZones, fetchProducts } from './services/api';
import { isSupabaseConfigured, subscribeToCatalog } from './services/supabaseRest';

export default function App() {
  // Config state
  const [config, setConfig] = useState<AppConfig>({
    pricing: DEFAULT_PRICING,
    availability: DEFAULT_AVAILABILITY,
    deliveryAreas: [],
    adminEmail: 'mnassar37@smail.ucas.edu.ps',
    whatsappNumber: '+972592480383',
  });

  // Dynamic Products List
  const [products, setProducts] = useState<Product[]>([]);

  // Cart State (Persisted in localStorage for convenience)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('rifaq_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [printJobs, setPrintJobs] = useState<PrintJob[]>(() => {
    try {
      const saved = localStorage.getItem('rifaq_print_jobs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal / Drawer visibility states
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [isAdminRoute, setIsAdminRoute] = useState(() => window.location.pathname.replace(/\/$/, '') === '/admin');
  const [trackerInitialId, setTrackerInitialId] = useState<string>('');
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);

  // Load cloud catalog and keep every open client synchronized.
  useEffect(() => {
    void Promise.all([fetchAppConfig(), fetchProducts(), fetchDeliveryZones()]).then(([latestConfig, latestProducts, latestZones]) => {
      setConfig({ ...latestConfig, deliveryAreas: latestZones });
      setProducts(latestProducts);
    }).catch((error) => console.warn('Cloud data load failed:', error));

    if (!isSupabaseConfigured()) return;
    return subscribeToCatalog(
      (latestProducts) => {
        setProducts(latestProducts);
      },
      (latestZones) => setConfig((previous) => ({ ...previous, deliveryAreas: latestZones }))
    ) || undefined;
  }, []);

  // Save cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem('rifaq_cart_items', JSON.stringify(cartItems));
    } catch {}
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem('rifaq_print_jobs', JSON.stringify(printJobs));
    } catch {}
  }, [printJobs]);

  useEffect(() => {
    const handlePopState = () => {
      setIsAdminRoute(window.location.pathname.replace(/\/$/, '') === '/admin');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handlers for Cart
  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateCartQty = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleAddPrintJob = (job: PrintJob) => {
    setPrintJobs((prev) => [job, ...prev]);
  };

  const handleRemovePrintJob = (jobId: string) => {
    setPrintJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  const handleClearAll = () => {
    setCartItems([]);
    setPrintJobs([]);
  };

  const handleDirectCheckout = (job: PrintJob) => {
    // Add job to list and scroll smoothly to the in-page checkout section
    setPrintJobs((prev) => [job, ...prev]);
    handleNavigate('checkout-section');
  };

  const handleOrderSuccess = (order: Order) => {
    setLastCreatedOrder(order);
    handleClearAll();
  };

  const handleNavigate = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openAdminRoute = () => {
    window.history.pushState({}, '', '/admin');
    setIsAdminRoute(true);
  };

  const closeAdminRoute = () => {
    window.history.pushState({}, '', '/');
    setIsAdminRoute(false);
  };

  const handleConfigUpdated = (pricing: PricingConfig, availability: SectionAvailability, deliveryAreas?: DeliveryArea[]) => {
    setConfig((prev) => ({
      ...prev,
      pricing,
      availability,
      deliveryAreas: deliveryAreas ?? prev.deliveryAreas,
    }));
  };

  const handleProductsUpdated = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
  };

  if (isAdminRoute) {
    return (
      <AdminDashboard
        onClose={closeAdminRoute}
        currentPricing={config.pricing}
        currentAvailability={config.availability}
        deliveryAreas={config.deliveryAreas}
        products={products}
        onConfigUpdated={handleConfigUpdated}
        onProductsUpdated={handleProductsUpdated}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-[#0f172a]" dir="rtl">
      
      {/* Sticky Top Navbar with Logo */}
      <Navbar
        cartItems={cartItems}
        printJobs={printJobs}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenTracker={() => setIsTrackerOpen(true)}
        onOpenAdmin={openAdminRoute}
        onNavigate={handleNavigate}
      />

      {/* Main Page Sections */}
      <main className="flex-1">
        {/* 1. Hero Section */}
        <HeroSection
          onStartPrinting={() => handleNavigate('calculator')}
          onBrowseBundles={() => handleNavigate('store')}
        />

        {/* 2. Interactive Printing Calculator */}
        <PrintingCalculator
          pricing={config.pricing}
          isAvailable={config.availability.printingCalculator}
          offlineMessage={config.availability.offlineMessage}
          onAddPrintJobToCart={handleAddPrintJob}
          onDirectCheckout={handleDirectCheckout}
        />

        {/* 3. Products Section (الرزم التعليمية & القرطاسية) */}
        <ProductsSection
          products={products}
          isBundlesAvailable={config.availability.educationalBundles}
          isStationeryAvailable={config.availability.stationery}
          offlineMessage={config.availability.offlineMessage}
          onAddToCart={handleAddToCart}
          cartItems={cartItems}
        />

        {/* 4. Embedded In-Page Checkout Section */}
        <CheckoutSection
          cartItems={cartItems}
          printJobs={printJobs}
          deliveryAreas={config.deliveryAreas}
          onOrderSuccess={handleOrderSuccess}
        />
      </main>

      {/* Footer with Logo and Copyright */}
      <Footer
        onNavigate={handleNavigate}
        onOpenTracker={() => setIsTrackerOpen(true)}
        onOpenAdmin={openAdminRoute}
      />

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        printJobs={printJobs}
        onUpdateCartItemQty={handleUpdateCartQty}
        onRemoveCartItem={handleRemoveCartItem}
        onRemovePrintJob={handleRemovePrintJob}
        onClearAll={handleClearAll}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          handleNavigate('checkout-section');
        }}
      />

      {/* Checkout Modal fallback */}
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        cartItems={cartItems}
        printJobs={printJobs}
        deliveryAreas={config.deliveryAreas}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Order Success Confirmation & WhatsApp Action Modal */}
      <OrderSuccessModal
        order={lastCreatedOrder}
        onClose={() => setLastCreatedOrder(null)}
      />

      {/* Order Tracker Modal */}
      <OrderTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => {
          setIsTrackerOpen(false);
          setTrackerInitialId('');
        }}
        initialOrderId={trackerInitialId}
      />

    </div>
  );
}
