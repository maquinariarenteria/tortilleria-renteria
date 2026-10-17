import { useEffect, useState } from 'react';
import { getStoredMachines } from '../utils/adminStore';

const catalogImageIds: Record<string, string> = {
  '/images/01_prensa_comal.jpg': 'prensa-manual-comal',
  '/images/02_prensa_manual.jpg': 'prensa-manual',
  '/images/02_prensa_manual.png': 'prensa-manual',
  '/images/03_cortadora_manual_36.jpg': 'cortadora-manual-36',
  '/images/04_amasadora_25kg.jpg': 'amasadora-25kg',
  '/images/05_boleadora_automatica.jpg': 'boleadora-automatica',
  '/images/05_boleadora_automatica.png': 'boleadora-automatica',
  '/images/06_prensa_automatica.jpg': 'prensa-automatica',
  '/images/06_prensa_automatica.png': 'prensa-automatica',
  '/images/07_prensa_plana.jpg': 'prensa-plana-manual',
  '/images/08_cortadora_automatica_tolva.jpg': 'cortadora-automatica-tolva',
};

// Reuse the catalog's optimized photos throughout the public site. Keep the
// original static asset as the fallback while catalog data is being loaded.
export function useCatalogImages() {
  const [machines, setMachines] = useState(getStoredMachines);
  useEffect(() => {
    const refresh = () => setMachines(getStoredMachines());
    window.addEventListener('mr_machines_updated', refresh);
    return () => window.removeEventListener('mr_machines_updated', refresh);
  }, []);
  return (fallback: string) => machines.find(m => m.id === catalogImageIds[fallback])?.imageUrl || fallback;
}
