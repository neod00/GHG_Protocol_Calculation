
// Fix: Define and export interfaces and enums for use throughout the application.
// This resolves circular dependency and missing type export errors.

export interface Refrigerant {
  id?: string;
  name: string;
  translationKey?: string;
  gwp: number;
  isCustom?: boolean;
}

// Represents a simple CO2e factor, used for all combustion, process, waste, and Scope 2 sources.
export interface CO2eFactorFuel {
    id?: string;
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
  WasteGeneratedInOperations = 'Waste Generated in Operations',
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
  group?: string; // New optional field for grouping, e.g., "Headquarters", "Gumi Plant"
  isCorporate?: boolean; // New field to identify the special corporate-level facility
}

export type CalculationMethod = 'supplier_co2e' | 'activity' | 'spend';
export type Cat4CalculationMethod = 'activity' | 'fuel' | 'spend' | 'supplier_specific';
export type Cat5CalculationMethod = 'activity' | 'supplier_specific' | 'spend';
export type Cat6CalculationMethod = 'activity' | 'spend' | 'supplier_specific';
export type Cat7CalculationMethod = 'activity' | 'average' | 'spend';
export type Cat8CalculationMethod = 'asset_specific' | 'area_based' | 'spend_based' | 'supplier_specific';
export type Cat10CalculationMethod = 'process_specific' | 'customer_specific' | 'spend';
export type Cat11CalculationMethod = 'energy_consumption' | 'fuel_consumption' | 'ghg_data';
export type Cat12CalculationMethod = 'waste_stream' | 'units_sold' | 'spend';
export type Cat14CalculationMethod = 'franchise_specific' | 'area_based' | 'average_data';
export type Cat15CalculationMethod = 'investment_specific' | 'average_data';

export type LeasedAssetType = 'Building' | 'Vehicle' | 'Equipment';
export type BuildingType = 'Office' | 'Warehouse' | 'Factory' | 'Retail' | 'DataCenter';
export type BusinessTravelMode = 'Air' | 'Rail' | 'Bus' | 'RentalCar' | 'PersonalCar' | 'Hotel';
export type FlightClass = 'Economy' | 'Business' | 'First';
export type TripType = 'one-way' | 'round-trip';
export type TransportMode = 'Road' | 'Sea' | 'Air' | 'Rail';
export type WasteType = 'MSW' | 'Paper' | 'Plastics' | 'Food' | 'Metal' | 'Hazardous';
export type TreatmentMethod = 'Landfill' | 'Incineration' | 'Recycling' | 'Composting' | 'AnaerobicDigestion';
export type EmployeeCommutingMode = 'PersonalCar' | 'PublicTransport' | 'Motorbike' | 'Carpool' | 'BicycleWalking';
export type PersonalCarType = 'Gasoline' | 'Diesel' | 'Hybrid' | 'Electric' | 'LPG';
export type PublicTransportType = 'Bus' | 'Subway';
export type FranchiseType = 'Restaurant' | 'Retail' | 'Service' | 'ConvenienceStore' | 'CoffeeShop';
export type InvestmentType = 'Equity' | 'Debt' | 'ProjectFinance' | 'RealEstate' | 'Other';


export interface EmissionSource {
  id: string;
  facilityId: string;
  description: string; // User-provided name/description for the specific emission source (e.g., "Main Boiler #1", "Delivery Truck A"). Not used for Category 1.
  category: EmissionCategory;
  fuelType: string; // For most categories, this is the fuel/gas/material from a predefined list. For Cat 1, this is used for the item description. For Cat 5, it's used for spend-based service type.
  monthlyQuantities: number[];
  unit: string;
  marketBasedFactor?: number;
  
  // New fields for advanced Scope 3 calculation
  calculationMethod?: CalculationMethod | Cat4CalculationMethod | Cat5CalculationMethod | Cat6CalculationMethod | Cat7CalculationMethod | Cat8CalculationMethod | Cat10CalculationMethod | Cat11CalculationMethod | Cat12CalculationMethod | Cat14CalculationMethod | Cat15CalculationMethod;
  supplierProvidedCO2e?: number; // Total annual kg CO2e from supplier
  factor?: number; // kg CO2e per unit
  factorUnit?: string; // e.g., kg CO2e / KRW, kg CO2e / tonne
  factorSource?: string; // e.g., "DEFRA 2023", "Supplier EPD"
  aiAnalysis?: { // To store results from Gemini analysis
    suggestedCategory?: string;
    justification?: string;
  }
  dataQualityRating?: 'high' | 'medium' | 'low' | 'estimated';
  assumptions?: string;
  activityDataSource?: string; // e.g., "Monthly electricity bills", "Fuel purchase records"
  
  // New fields for advanced Scope 3 Category 3 calculation
  activityType?: 'fuel_wtt' | 'energy_upstream' | 'spend_based';
  isAutoGenerated?: boolean;

  // New fields for advanced Scope 3 Category 4 & 9 calculation
  transportMode?: TransportMode;
  vehicleType?: string;
  distanceKm?: number;
  weightTonnes?: number;
  refrigerated?: boolean;
  loadFactor?: number; // Percentage 0-100
  emptyBackhaul?: boolean;
  origin?: string;
  destination?: string;

  // New fields for advanced Scope 3 Category 5 calculation
  wasteType?: WasteType;
  treatmentMethod?: TreatmentMethod;
  includeTransport?: boolean;

  // New fields for advanced Scope 3 Category 6 calculation
  businessTravelMode?: BusinessTravelMode;
  flightClass?: FlightClass;
  tripType?: TripType;
  passengers?: number;
  nights?: number; // for hotels

  // New fields for advanced Scope 3 Category 7 calculation
  commutingMode?: EmployeeCommutingMode;
  personalCarType?: PersonalCarType;
  publicTransportType?: PublicTransportType;
  daysPerYear?: number;
  carpoolOccupancy?: number;
  // For 'average' method in Cat 7
  totalEmployees?: number;
  percentTeleworking?: number;
  modeDistribution?: { [key: string]: number };

  // New fields for advanced Scope 3 Category 8 calculation
  leasedAssetType?: LeasedAssetType;
  buildingType?: BuildingType;
  areaSqm?: number;
  leaseDurationMonths?: number;
  // For asset_specific method, array of { type: string (fuel/energy name), value: number, unit: string }
  energyInputs?: { id: string; type: string; value: number; unit: string }[];

  // New fields for advanced Scope 3 Category 9 calculation
  downstreamActivityType?: 'transportation' | 'warehousing';

  // New fields for advanced Scope 3 Category 10 calculation
  processingMethod?: string;
  supplierDataType?: 'total_co2e' | 'energy_data';

  // New fields for advanced Scope 3 Category 11 calculation
  productLifetime?: number; // Years
  annualEnergyConsumption?: number; // value per unit per year
  energyRegion?: string; // For grid electricity

  // New fields for advanced Scope 3 Category 12 calculation
  disposalRatios?: { landfill: number; incineration: number; recycling: number }; // Percentages (0-100)
  soldProductWeight?: number; // kg per unit

  // New fields for advanced Scope 3 Category 14 calculation
  franchiseType?: FranchiseType;

  // New fields for advanced Scope 3 Category 15 calculation
  investmentType?: InvestmentType;
  investeeSector?: string;
  investmentValue?: number; // Amount invested
  companyValue?: number; // EVIC or Total Project Cost
}