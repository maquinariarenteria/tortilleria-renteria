import { CartItem } from '../types';

export interface ShippingQuote {
  isValid: boolean;
  state: string;
  city: string;
  zone: string;
  carrier: string;
  deliveryTime: string;
  estimatedCostMXN: number;
  totalWeightKg: number;
  breakdownNote: string;
}

// Mexican Postal Code prefix ranges (first 2 digits)
interface StateRange {
  min: number;
  max: number;
  state: string;
  capital: string;
  zone: 'Local' | 'Norte' | 'Centro' | 'Bajio' | 'Occidente' | 'Sur' | 'Peninsula';
  baseRate: number; // Base rate for ~80kg machine from Delicias, Chih.
  deliveryDays: string;
}

const STATE_MAPPINGS: StateRange[] = [
  { min: 1, max: 16, state: 'Ciudad de México', capital: 'CDMX', zone: 'Centro', baseRate: 2750, deliveryDays: '3 a 5 días hábiles' },
  { min: 20, max: 20, state: 'Aguascalientes', capital: 'Aguascalientes', zone: 'Bajio', baseRate: 2600, deliveryDays: '3 a 4 días hábiles' },
  { min: 21, max: 22, state: 'Baja California', capital: 'Mexicali / Tijuana', zone: 'Peninsula', baseRate: 3950, deliveryDays: '4 a 6 días hábiles' },
  { min: 23, max: 23, state: 'Baja California Sur', capital: 'La Paz', zone: 'Peninsula', baseRate: 4300, deliveryDays: '5 a 8 días hábiles' },
  { min: 24, max: 24, state: 'Campeche', capital: 'Campeche', zone: 'Peninsula', baseRate: 3900, deliveryDays: '4 a 6 días hábiles' },
  { min: 25, max: 27, state: 'Coahuila', capital: 'Saltillo / Torreón', zone: 'Norte', baseRate: 1950, deliveryDays: '2 a 3 días hábiles' },
  { min: 28, max: 28, state: 'Colima', capital: 'Colima', zone: 'Occidente', baseRate: 3100, deliveryDays: '3 a 5 días hábiles' },
  { min: 29, max: 30, state: 'Chiapas', capital: 'Tuxtla Gutiérrez', zone: 'Sur', baseRate: 3850, deliveryDays: '4 a 7 días hábiles' },
  { min: 31, max: 33, state: 'Chihuahua', capital: 'Chihuahua / Delicias / Juárez', zone: 'Local', baseRate: 1450, deliveryDays: '1 a 2 días hábiles' },
  { min: 34, max: 35, state: 'Durango', capital: 'Durango / Gómez Palacio', zone: 'Norte', baseRate: 1850, deliveryDays: '2 a 3 días hábiles' },
  { min: 36, max: 38, state: 'Guanajuato', capital: 'León / Irapuato', zone: 'Bajio', baseRate: 2650, deliveryDays: '3 a 4 días hábiles' },
  { min: 39, max: 41, state: 'Guerrero', capital: 'Chilpancingo / Acapulco', zone: 'Occidente', baseRate: 3350, deliveryDays: '4 a 6 días hábiles' },
  { min: 42, max: 43, state: 'Hidalgo', capital: 'Pachuca', zone: 'Centro', baseRate: 2800, deliveryDays: '3 a 5 días hábiles' },
  { min: 44, max: 49, state: 'Jalisco', capital: 'Guadalajara / Zapopan', zone: 'Bajio', baseRate: 2700, deliveryDays: '3 a 4 días hábiles' },
  { min: 50, max: 57, state: 'Estado de México', capital: 'Toluca / Naucalpan', zone: 'Centro', baseRate: 2750, deliveryDays: '3 a 5 días hábiles' },
  { min: 58, max: 61, state: 'Michoacán', capital: 'Morelia', zone: 'Occidente', baseRate: 2950, deliveryDays: '3 a 5 días hábiles' },
  { min: 62, max: 62, state: 'Morelos', capital: 'Cuernavaca', zone: 'Centro', baseRate: 2850, deliveryDays: '3 a 5 días hábiles' },
  { min: 63, max: 63, state: 'Nayarit', capital: 'Tepic', zone: 'Occidente', baseRate: 2900, deliveryDays: '3 a 5 días hábiles' },
  { min: 64, max: 67, state: 'Nuevo León', capital: 'Monterrey', zone: 'Norte', baseRate: 2200, deliveryDays: '2 a 4 días hábiles' },
  { min: 68, max: 71, state: 'Oaxaca', capital: 'Oaxaca de Juárez', zone: 'Sur', baseRate: 3600, deliveryDays: '4 a 6 días hábiles' },
  { min: 72, max: 75, state: 'Puebla', capital: 'Puebla', zone: 'Centro', baseRate: 2850, deliveryDays: '3 a 5 días hábiles' },
  { min: 76, max: 76, state: 'Querétaro', capital: 'Santiago de Querétaro', zone: 'Bajio', baseRate: 2600, deliveryDays: '3 a 4 días hábiles' },
  { min: 77, max: 77, state: 'Quintana Roo', capital: 'Cancún / Chetumal', zone: 'Peninsula', baseRate: 4200, deliveryDays: '5 a 7 días hábiles' },
  { min: 78, max: 79, state: 'San Luis Potosí', capital: 'San Luis Potosí', zone: 'Bajio', baseRate: 2450, deliveryDays: '2 a 4 días hábiles' },
  { min: 80, max: 82, state: 'Sinaloa', capital: 'Culiacán / Mazatlán', zone: 'Norte', baseRate: 2350, deliveryDays: '2 a 4 días hábiles' },
  { min: 83, max: 85, state: 'Sonora', capital: 'Hermosillo / Cd. Obregón', zone: 'Norte', baseRate: 2250, deliveryDays: '2 a 4 días hábiles' },
  { min: 86, max: 86, state: 'Tabasco', capital: 'Villahermosa', zone: 'Sur', baseRate: 3550, deliveryDays: '4 a 6 días hábiles' },
  { min: 87, max: 89, state: 'Tamaulipas', capital: 'Reynosa / Matamoros / Tampico', zone: 'Norte', baseRate: 2300, deliveryDays: '2 a 4 días hábiles' },
  { min: 90, max: 90, state: 'Tlaxcala', capital: 'Tlaxcala', zone: 'Centro', baseRate: 2800, deliveryDays: '3 a 5 días hábiles' },
  { min: 91, max: 96, state: 'Veracruz', capital: 'Veracruz / Xalapa / Coatzacoalcos', zone: 'Sur', baseRate: 3400, deliveryDays: '3 a 5 días hábiles' },
  { min: 97, max: 97, state: 'Yucatán', capital: 'Mérida', zone: 'Peninsula', baseRate: 4100, deliveryDays: '4 a 6 días hábiles' },
  { min: 98, max: 99, state: 'Zacatecas', capital: 'Zacatecas', zone: 'Bajio', baseRate: 2350, deliveryDays: '2 a 4 días hábiles' },
];

/**
 * Calculates estimated freight shipping cost for tortilla machinery
 * based on Mexican 5-digit Postal Code and items in cart.
 */
export function estimateShippingByCP(cp: string, items: CartItem[]): ShippingQuote | null {
  const cleanCP = cp.trim().replace(/\D/g, '');
  if (cleanCP.length !== 5) {
    return null;
  }

  const prefix = parseInt(cleanCP.substring(0, 2), 10);
  const match = STATE_MAPPINGS.find((m) => prefix >= m.min && prefix <= m.max);

  if (!match) {
    return null;
  }

  // Calculate total weight of machinery in cart
  const totalWeight = items.reduce((acc, item) => {
    const weight = item.machine.weightKg || 85;
    return acc + weight * item.quantity;
  }, 0);

  // Total quantity of units
  const totalUnits = items.reduce((acc, item) => acc + item.quantity, 0);

  // Consolidated machinery rate formula:
  // Base machine freight + 55% for each additional consolidated unit on same shipment
  let cost = match.baseRate;
  if (totalUnits > 1) {
    cost += (totalUnits - 1) * (match.baseRate * 0.55);
  }

  // Additional weight adjustment if very heavy (>120kg per unit average)
  if (totalWeight > totalUnits * 110) {
    cost += (totalWeight - totalUnits * 110) * 8.5; // $8.50 MXN per excess kg
  }

  // Round to nearest 50 MXN
  cost = Math.round(cost / 50) * 50;

  return {
    isValid: true,
    state: match.state,
    city: match.capital,
    zone: match.zone,
    carrier: 'Transportes Castores / Tres Guerras / Paquetexpress',
    deliveryTime: match.deliveryDays,
    estimatedCostMXN: cost,
    totalWeightKg: totalWeight,
    breakdownNote: `Tarifa consolidada de carga pesada (~${totalWeight} kg) desde Delicias, Chihuahua hacia ${match.state}.`,
  };
}
