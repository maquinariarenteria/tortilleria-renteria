import { StripePaymentResult } from './components/StripePaymentResult';
import React, { useState, useEffect } from 'react';
import { MachineProduct, CartItem, ProductVariant } from './types';
import { getStoredMachines, recordSiteVisit, recordHotspotClick } from './utils/adminStore';
import { getProductPrice } from './utils/formatters';
import { AdminPanel } from './components/admin/AdminPanel';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ValueProps } from './components/ValueProps';
import { FeaturedMachines } from './components/FeaturedMachines';
import { ProductionProcess } from './components/ProductionProcess';
import { Catalog } from './components/Catalog';
import { SectorsSection } from './components/SectorsSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { FaqSection } from './components/FaqSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { QuoteCartDrawer } from './components/QuoteCartDrawer';
import { FloatingActions } from './components/FloatingActions';
import { AppointmentModal } from './components/AppointmentModal';

export function App() {
  const [isAdmin, setIsAdmin] = useState(() => 
    typeof window !== 'undefined' && window.location.hash.toLowerCase().includes('#admin')
  );
  const [machines, setMachines] = useState<MachineProduct[]>(() => getStoredMachines());
  const [currency, setCurrency] = useState<'USD' | 'MXN'>('MXN');
  const [selectedMachine, setSelectedMachine] = useState<MachineProduct | null>(null);
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (new URLSearchParams(window.location.search).get('payment') !== 'cancel') return [];
    try { const saved = JSON.parse(sessionStorage.getItem('mr_stripe_cart') || '[]'); return Array.isArray(saved) ? saved : []; }
    catch { return []; }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Appointment modal state
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [appointmentMachine, setAppointmentMachine] = useState<string>('');

  useEffect(() => {
    // Record site visit for admin metrics
    recordSiteVisit();

    const handleHash = () => {
      setIsAdmin(window.location.hash.toLowerCase().includes('#admin'));
    };

    const handleMachinesUpdate = () => {
      setMachines(getStoredMachines());
    };

    window.addEventListener('hashchange', handleHash);
    window.addEventListener('mr_machines_updated', handleMachinesUpdate);

    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('mr_machines_updated', handleMachinesUpdate);
    };
  }, []);

  if (isAdmin) {
    return (
      <AdminPanel
        onExit={() => {
          window.location.hash = '';
          setIsAdmin(false);
        }}
      />
    );
  }

  const handleAddToCart = (machine: MachineProduct, variant?: ProductVariant) => {
    recordHotspotClick('Agregar al Carrito');
    const unitPriceMXN = getProductPrice(machine, variant, 'MXN');
    const unitPriceUSD = getProductPrice(machine, variant, 'USD');
    const itemId = variant ? `${machine.id}__${variant.id}` : machine.id;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === itemId);
      if (existing) {
        return prev.map((item) =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: itemId,
          machine,
          quantity: 1,
          selectedEnergy: machine.energyType,
          selectedVariant: variant,
          unitPriceMXN,
          unitPriceUSD,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const scrollToCatalog = () => {
    const el = document.getElementById('catalog-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToContact = () => {
    const el = document.getElementById('contact-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenEmail = () => {
    window.location.href = "mailto:maquinariarenteria17@gmail.com?subject=Consulta%20Maquinaria%20Renteria";
  };

  const handleOpenAppointmentModal = (machineName = '') => {
    setAppointmentMachine(machineName);
    setIsAppointmentOpen(true);
  };

  const cartMachineIds = cart.map((i) => i.machine.id);
  const totalCartCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-[#2563eb] selection:text-white overflow-x-hidden w-full relative">
      
      <StripePaymentResult />
      {/* 1. Header with Cart Badge & Appointment Button */}
      <Navbar
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        currency={currency}
        onToggleCurrency={() => setCurrency(currency === 'USD' ? 'MXN' : 'USD')}
        onOpenAppointment={() => handleOpenAppointmentModal()}
      />

      {/* 2. Minimalist Hero */}
      <Hero
        onExploreCatalog={scrollToCatalog}
        onContact={scrollToContact}
      />

      {/* 3. Deep Slate 3 Pillars */}
      <ValueProps />

      {/* 4. Featured Machines (Enters with scroll animations) */}
      <FeaturedMachines
        machines={machines}
        currency={currency}
        onSelectMachine={(m) => setSelectedMachine(m)}
        onAddToCart={handleAddToCart}
        cartMachineIds={cartMachineIds}
      />

      {/* 5. Production Process (5 Steps with scroll animation from sides) */}
      <ProductionProcess />

      {/* 6. Complete Catalog */}
      <Catalog
        machines={machines}
        currency={currency}
        onSelectMachine={(m) => setSelectedMachine(m)}
        onAddToCart={handleAddToCart}
        cartMachineIds={cartMachineIds}
      />

      {/* 7. Sectors Section */}
      <SectorsSection onSelectSector={scrollToCatalog} />

      {/* 8. Testimonials Section */}
      <TestimonialsSection />

      {/* 9. FAQ Section */}
      <FaqSection />

      {/* 10. Contact Section */}
      <ContactSection />

      {/* 11. Footer */}
      <Footer />

      {/* 12. Floating Action Buttons (Official WhatsApp + Email + Cita Demo) */}
      <FloatingActions
        onOpenEmail={handleOpenEmail}
        onOpenAppointment={() => handleOpenAppointmentModal()}
      />

      {/* 13. Floating Product Detail Modal */}
      {selectedMachine && (
        <ProductDetailModal
          machine={selectedMachine}
          currency={currency}
          onClose={() => setSelectedMachine(null)}
          onAddToCart={handleAddToCart}
          isInCart={cartMachineIds.includes(selectedMachine.id)}
          onScheduleDemo={(machineName) => handleOpenAppointmentModal(machineName)}
        />
      )}

      {/* 14. Shopping Cart Drawer */}
      <QuoteCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        currency={currency}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />

      {/* 15. Appointment Booking Modal */}
      <AppointmentModal
        isOpen={isAppointmentOpen}
        onClose={() => setIsAppointmentOpen(false)}
        preselectedMachine={appointmentMachine}
      />

    </div>
  );
}

export default App;
