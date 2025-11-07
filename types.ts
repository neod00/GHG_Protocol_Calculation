// Fix: Define and export interfaces and enums for use throughout the application.
// This resolves circular dependency and missing type export errors.

export interface Refrigerant {
  name: string;
  translationKey?: string;
  gwp: number;
  isCustom?: boolean;
}

// Represents a simple CO2e factor, used for all combustion, process, waste, and Scope 2 sources.
export interface CO2eFactorFuel {
    name: string;
    translationKey?: string;
    units: string[];
    factors: { [key: string]: number }; // kg CO2e / unit
    isCustom?: boolean;
}

export interface EditableCO2eFactorFuel extends CO2eFactorFuel {}
export interface EditableRefrigerant extends Refrigerant {}

export enum EmissionCategory {
  // Scope 1
  StationaryCombustion = 'Stationary Combustion',
  MobileCombustion = 'Mobile Combustion',
  ProcessEmissions = 'Process Emissions',
  FugitiveEmissions = 'Fugitive Emissions',
  Waste = 'Waste', // This is Scope 1 on-site treatment

  // Scope 2
  PurchasedEnergy = 'Purchased Energy',
  
  // Scope 3
  PurchasedGoodsAndServices = 'Purchased Goods and Services',
  CapitalGoods = 'Capital Goods',
  FuelAndEnergyRelatedActivities = 'Fuel- and Energy-Related Activities',
  UpstreamTransportationAndDistribution = 'Upstream Transportation and Distribution',
  WasteGeneratedInOperations = 'Waste Generated in Operations', // This is Scope 3 off-site treatment
  BusinessTravel = 'Business Travel',
  EmployeeCommuting = 'Employee Commuting',
  UpstreamLeasedAssets = 'Upstream Leased Assets',
  DownstreamTransportationAndDistribution = 'Downstream Transportation and Distribution',
  ProcessingOfSoldProducts = 'Processing of Sold Products',
  UseOfSoldProducts = 'Use of Sold Products',
  EndOfLifeTreatmentOfSoldProducts = 'End-of-Life Treatment of Sold Products',
  DownstreamLeasedAssets = 'Downstream Leased Assets',
  Franchises = 'Franchises',
  Investments = 'Investments',
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