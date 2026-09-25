export type MachineCategory = 
  | 'prensas'
  | 'hornos'
  | 'lineas-completas'
  | 'amasadoras-boleadoras'
  | 'comales-rotativos'
  | 'enfriadores';

export type EnergyType = 
  | 'Gas LP' 
  | 'Gas LP (Manual)'
  | 'Gas Natural' 
  | 'Eléctrica 110V'
  | 'Eléctrica 220V' 
  | 'Eléctrica 110V / 220V'
  | 'Trifásica 440V' 
  | 'Dual (Gas LP + Eléctrica 110V)'
  | 'Dual (Gas + Eléctrica)'
  | 'Manual (Sin electricidad)';

export type Model3DType = 'press' | 'line' | 'oven' | 'mixer' | 'rotary' | 'cooler';

export interface MachineProduct {
  id: string;
  name: string;
  sku: string;
  category: MachineCategory;
  modelType: Model3DType;
  priceUSD: number;
  priceMXN: number;
  capacityPerHour: number; // tortillas/hora
  diameterRange: string;   // ej. "12 cm - 28 cm"
  energyType: EnergyType;
  gasConsumptionBTU?: string;
  motorPowerHP: string;
  dimensionsMeters: string; // ej. "2.40m x 0.85m x 1.45m"
  weightKg: number;
  warrantyYears: number;
  badge?: string;
  featured?: boolean;
  shortDescription: string;
  fullDescription: string;
  features: string[];
  specs: {
    label: string;
    value: string;
  }[];
  imageUrl?: string;
}

export interface CartItem {
  machine: MachineProduct;
  quantity: number;
  customNotes?: string;
  selectedEnergy?: EnergyType;
}

export interface FilterState {
  searchQuery: string;
  category: string; // 'all' or MachineCategory
  minCapacity: number;
  maxCapacity: number;
  energyType: string; // 'all' or specific
  sortBy: 'popular' | 'price-asc' | 'price-desc' | 'capacity-desc';
}
