// Fix: Define and export interfaces and enums for use throughout the application.
// This resolves circular dependency and missing type export errors.

// Represents disaggregated emission factors for combustion sources
export interface GasFactors {
  co2: number; // kg CO2 / unit
  ch4: number; // kg CH4 / unit
  n2o: number; // kg N2O / unit
}

export interface Fuel {
  name: string;
  translationKey?: string;
  units: string[];
  // Factors are now disaggregated by gas type for accurate biogenic CO2 calculation
  factors: { [key: string]: GasFactors }; 
  isBiomass?: boolean;
  isCustom?: boolean;
}

export interface Refrigerant {
  name: string;
  translationKey?: string;
  gwp: number;
  isCustom?: boolean;
}

// Represents a simple CO2e factor, used for Scope 2 and some process emissions
export interface CO2eFactorFuel {
    name: string;
    translationKey?: string;
    units: string[];
    factors: { [key: string]: number }; // kg CO2e / unit
    isCustom?: boolean;
}


export interface EditableFuel extends Fuel {}
export interface EditableCO2eFactorFuel extends CO2eFactorFuel {}
export interface EditableRefrigerant extends Refrigerant {}

export enum EmissionCategory {
  StationaryCombustion = 'Stationary Combustion',
  MobileCombustion = 'Mobile Combustion',
  ProcessEmissions = 'Process Emissions',
  FugitiveEmissions = 'Fugitive Emissions',
  PurchasedEnergy = 'Purchased Energy',
  Waste = 'Waste',
}

export type BoundaryApproach = 'operational' | 'financial' | 'equity';

export interface Facility {
  id: string;
  name: string;
  equityShare: number; // Stored as a percentage, e.g., 80 for 80%
}

export interface EmissionSource {
  id: string;
  facilityId: string;
  category: EmissionCategory;
  fuelType: string;
  monthlyQuantities: number[];
  unit: string;
  // New field to support market-based Scope 2 dual reporting
  marketBasedFactor?: number; // User-provided kg CO2e / unit
}
