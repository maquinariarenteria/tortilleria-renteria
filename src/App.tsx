import React, { useState, useEffect } from 'react';
import { MachineProduct, CartItem } from './types';
import { getStoredMachines, recordSiteVisit } from './utils/adminStore';
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

export function App() {
  const [isAdmin, setIsAdmin] = useState(() => 
    typeof window !== 'undefined' && window.location.hash.toLowerCase().includes('#admin')
  );
  const [machines, setMachines] = useState<MachineProduct[]>(() => getStoredMachines());
  const [currency, setCurrency] = useState<'USD' | 'MXN'>('MXN');
  const [selectedMachine, setSelectedMachine] = useState<MachineProduct | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    // Dismiss splash screen smoothly
    if (typeof (window as any).mrDismissSplash === 'function') {
      (window as any).mrDismissSplash();
    }

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

  const handleAddToCart = (machine: MachineProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.machine.id === machine.id);
      if (existing) {
        return prev.map((item) =>
          item.machine.id === machine.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { machine, quantity: 1, selectedEnergy: machine.energyType }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (machineId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.machine.id === machineId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveItem = (machineId: string) => {
    setCart((prev) => prev.filter((item) => item.machine.id !== machineId));
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

  const cartMachineIds = cart.map((i) => i.machine.id);
  const totalCartCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-[#2563eb] selection:text-white overflow-x-hidden w-full relative">
      
      {/* 1. Header with Cart Badge */}
      <Navbar
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        currency={currency}
        onToggleCurrency={() => setCurrency(currency === 'USD' ? 'MXN' : 'USD')}
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

      {/* 5. Production Process (NEW: 5 Steps with scroll animation from sides) */}
      <ProductionProcess />

      {/* 6. Complete Catalog */}
      <Catalog
        machines={machines}
        currency={currency}
        onSelectMachine={(m) => setSelectedMachine(m)}
        onAddToCart={handleAddToCart}
        cartMachineIds={cartMachineIds}
      />

      {/* 7. Sectors Section (NEW: Taquerías, Supermercados, Burritos with scroll animation) */}
      <SectorsSection onSelectSector={scrollToCatalog} />

      {/* 8. Testimonials Section (NEW: Client proof with scroll animation) */}
      <TestimonialsSection />

      {/* 9. FAQ Section (NEW: Accordion with scroll animation) */}
      <FaqSection />

      {/* 10. Contact Section (Enters from sides) */}
      <ContactSection />

      {/* 11. Footer */}
      <Footer />

      {/* 12. Floating Action Buttons (Official WhatsApp + Official Email) */}
      <FloatingActions
        onOpenEmail={handleOpenEmail}
      />

      {/* 13. Floating Product Detail Modal (Summarized Big Font Text) */}
      {selectedMachine && (
        <ProductDetailModal
          machine={selectedMachine}
          currency={currency}
          onClose={() => setSelectedMachine(null)}
          onAddToCart={handleAddToCart}
          isInCart={cartMachineIds.includes(selectedMachine.id)}
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

    </div>
  );
}

export default App;
