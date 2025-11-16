import { CO2eFactorFuel, Refrigerant, EmissionCategory, WasteType, TreatmentMethod } from './types';
import { TranslationKey } from './translations';

// Global Warming Potential (GWP) values from IPCC Fifth Assessment Report (AR5)
export const GWP_VALUES = {
  co2: 1,
  ch4: 28,
  n2o: 265,
};

// Emission factors are now a single CO2e value (in kg per unit)
// Source: US EPA GHG Emission Factors Hub (updated March 2023), IPCC Guidelines, UK DEFRA.

export const STATIONARY_FUELS: CO2eFactorFuel[] = [
  // Gaseous Fuels
  {
    name: 'Natural Gas',
    translationKey: 'naturalGas',
    units: ['cubic meters', 'therms'],
    factors: { 'cubic meters': 1.9019, 'therms': 5.3055 },
  },
  {
    name: 'LPG',
    translationKey: 'lpg',
    units: ['kg', 'liters'],
    factors: { 'kg': 2.95, 'liters': 1.56 },
  },
  {
    name: 'LNG',
    translationKey: 'lng',
    units: ['kg', 'cubic meters'],
    factors: { 'kg': 2.75, 'cubic meters': 1.90 }, // cubic meters factor is for regasified LNG
  },
  {
    name: 'Biogas',
    translationKey: 'biogas',
    units: ['cubic meters'],
    factors: { 'cubic meters': 0.021 }, // Primarily non-biogenic CH4 slip
  },
  {
    name: 'Refinery Gas',
    translationKey: 'refineryGas',
    units: ['cubic meters'],
    factors: { 'cubic meters': 2.55 },
  },
  {
    name: 'Coke Oven Gas',
    translationKey: 'cokeOvenGas',
    units: ['cubic meters'],
    factors: { 'cubic meters': 0.46 },
  },
  {
    name: 'Digester Gas',
    translationKey: 'digesterGas',
    units: ['cubic meters'],
    factors: { 'cubic meters': 0.021 }, // Same as biogas
  },
  // Liquid Fuels
  {
    name: 'Propane',
    translationKey: 'propane',
    units: ['liters', 'gallons'],
    factors: { 'liters': 1.5164, 'gallons': 5.7454 },
  },
  {
    name: 'Butane',
    translationKey: 'butane',
    units: ['liters'],
    factors: { 'liters': 1.73 },
  },
  {
    name: 'Heating Oil / Diesel',
    translationKey: 'heatingOilDiesel',
    units: ['liters', 'gallons'],
    factors: { 'liters': 2.6845, 'gallons': 10.1667 },
  },
  {
    name: 'Heavy Fuel Oil (HFO)',
    translationKey: 'heavyFuelOil',
    units: ['liters', 'gallons'],
    factors: { 'liters': 3.11, 'gallons': 11.77 },
  },
  {
    name: 'Light Fuel Oil',
    translationKey: 'lightFuelOil',
    units: ['liters'],
    factors: { 'liters': 2.92 },
  },
  {
    name: 'Naphtha',
    translationKey: 'naphtha',
    units: ['liters'],
    factors: { 'liters': 2.23 },
  },
  {
    name: 'Jet Kerosene (Stationary)',
    translationKey: 'jetKeroseneStationary',
    units: ['liters'],
    factors: { 'liters': 2.53 },
  },
  {
    name: 'Marine Gas Oil (MGO)',
    translationKey: 'marineGasOil',
    units: ['liters'],
    factors: { 'liters': 2.77 },
  },
  {
    name: 'Waste Oil',
    translationKey: 'wasteOil',
    units: ['liters'],
    factors: { 'liters': 2.89 },
  },
  {
    name: 'Biodiesel',
    translationKey: 'biodiesel',
    units: ['liters'],
    factors: { 'liters': 0.03 }, // Non-biogenic portion (CH4, N2O)
  },
  {
    name: 'Bio-heavy Oil',
    translationKey: 'bioHeavyOil',
    units: ['liters'],
    factors: { 'liters': 0.05 }, // Non-biogenic portion (CH4, N2O)
  },
  // Solid Fuels
  {
    name: 'Bituminous Coal',
    translationKey: 'coalBituminous',
    units: ['kg', 'tonnes'],
    factors: { 'kg': 2.32, 'tonnes': 2320 },
  },
  {
    name: 'Anthracite',
    translationKey: 'anthracite',
    units: ['kg', 'tonnes'],
    factors: { 'kg': 2.68, 'tonnes': 2680 },
  },
  {
    name: 'Lignite',
    translationKey: 'lignite',
    units: ['kg', 'tonnes'],
    factors: { 'kg': 1.46, 'tonnes': 1460 },
  },
  {
    name: 'Coke',
    translationKey: 'coke',
    units: ['kg', 'tonnes'],
    factors: { 'kg': 2.91, 'tonnes': 2910 },
  },
  {
    name: 'Wood Pellets',
    translationKey: 'woodPellets',
    units: ['kg', 'tonnes'],
    factors: { 'kg': 0.07, 'tonnes': 70 }, // Non-biogenic portion (CH4, N2O)
  },
  {
    name: 'Wood Chips',
    translationKey: 'woodChips',
    units: ['kg', 'tonnes'],
    factors: { 'kg': 0.05, 'tonnes': 50 }, // Non-biogenic portion (CH4, N2O)
  },
  {
    name: 'General Biomass (Solid)',
    translationKey: 'biomassSolid',
    units: ['kg', 'tonnes'],
    factors: { 'kg': 0.06, 'tonnes': 60 }, // Non-biogenic portion (CH4, N2O)
  },
  // Mixed / Industrial Fuels
  {
    name: 'Refuse Derived Fuel (RDF)',
    translationKey: 'rdf',
    units: ['tonnes'],
    factors: { 'tonnes': 1150 },
  },
  {
    name: 'Solid Refuse Fuel (SRF)',
    translationKey: 'srf',
    units: ['tonnes'],
    factors: { 'tonnes': 1450 },
  },
  {
    name: 'Municipal Solid Waste (MSW) Fuel',
    translationKey: 'mswFuel',
    units: ['tonnes'],
    factors: { 'tonnes': 950 },
  },
  {
    name: 'Sludge Fuel',
    translationKey: 'sludgeFuel',
    units: ['tonnes'],
    factors: { 'tonnes': 550 }, // Dry basis
  },
  {
    name: 'Tire-Derived Fuel (TDF)',
    translationKey: 'tdf',
    units: ['tonnes'],
    factors: { 'tonnes': 2550 },
  },
];

export const MOBILE_FUELS: CO2eFactorFuel[] = [
  // 1) Road Transportation Fuels
  {
    name: 'Gasoline (Petrol)',
    translationKey: 'gasoline',
    units: ['liters', 'gallons'],
    factors: { 'liters': 2.30, 'gallons': 8.71 },
  },
  {
    name: 'Diesel',
    translationKey: 'diesel',
    units: ['liters', 'gallons'],
    factors: { 'liters': 2.67, 'gallons': 10.11 },
  },
  {
    name: 'Biogasoline',
    translationKey: 'biogasoline',
    units: ['liters'],
    factors: { 'liters': 0.04 }, // Non-biogenic portion (CH4, N2O)
  },
  {
    name: 'Biodiesel',
    translationKey: 'biodieselMobile',
    units: ['liters'],
    factors: { 'liters': 0.03 }, // Non-biogenic portion (CH4, N2O)
  },
  {
    name: 'LPG (for vehicles)',
    translationKey: 'lpgVehicle',
    units: ['liters', 'kg'],
    factors: { 'liters': 1.56, 'kg': 2.95 },
  },
  {
    name: 'CNG (for vehicles)',
    translationKey: 'cngVehicle',
    units: ['kg'],
    factors: { 'kg': 2.66 },
  },
  {
    name: 'LNG (for vehicles)',
    translationKey: 'lngVehicle',
    units: ['kg', 'cubic meters'],
    factors: { 'kg': 2.75, 'cubic meters': 1.90 },
  },
  {
    name: 'Electric Vehicle (EV)',
    translationKey: 'ev',
    units: ['kWh'],
    factors: { 'kWh': 0 }, // Direct emissions (Scope 1) are zero.
  },

  // 2) Non-road equipment / Off-road machines
  {
    name: 'Off-road Diesel (Construction, Agri, etc.)',
    translationKey: 'offroadDiesel',
    units: ['liters'],
    factors: { 'liters': 2.70 },
  },
  {
    name: 'Rail Diesel',
    translationKey: 'railDiesel',
    units: ['liters'],
    factors: { 'liters': 2.71 },
  },

  // 3) Aviation
  {
    name: 'Jet A / Jet A-1',
    translationKey: 'jetFuel',
    units: ['liters', 'gallons'],
    factors: { 'liters': 2.53, 'gallons': 9.58 },
  },
  {
    name: 'Aviation Gasoline (Avgas)',
    translationKey: 'avgas',
    units: ['liters'],
    factors: { 'liters': 2.21 },
  },
  {
    name: 'Sustainable Aviation Fuel (SAF)',
    translationKey: 'saf',
    units: ['liters'],
    factors: { 'liters': 0.08 }, // Non-biogenic portion (CH4, N2O)
  },

  // 4) Marine Fuels
  {
    name: 'Marine Diesel Oil (MDO)',
    translationKey: 'mdo',
    units: ['liters'],
    factors: { 'liters': 2.77 },
  },
  {
    name: 'Marine Gas Oil (MGO)',
    translationKey: 'mgoMarine',
    units: ['liters'],
    factors: { 'liters': 2.77 },
  },
  {
    name: 'Heavy Fuel Oil (HFO, Marine)',
    translationKey: 'hfoMarine',
    units: ['liters'],
    factors: { 'liters': 3.11 },
  },
  {
    name: 'LNG (Marine)',
    translationKey: 'lngMarine',
    units: ['kg'],
    factors: { 'kg': 2.75 },
  },
  {
    name: 'LPG (Marine)',
    translationKey: 'lpgMarine',
    units: ['kg'],
    factors: { 'kg': 2.95 },
  },
];


// Process emissions are often single-gas or pre-calculated CO2e. Using CO2eFactorFuel for simplicity.
export const PROCESS_MATERIALS: CO2eFactorFuel[] = [
  {
    name: 'Cement Production (Clinker)',
    translationKey: 'cementProduction',
    units: ['tonnes'],
    factors: { 'tonnes': 510 }, // ~0.51 t CO2 / t clinker
  },
  {
    name: 'Lime Production',
    translationKey: 'limeProduction',
    units: ['tonnes'],
    factors: { 'tonnes': 785 }, // From calcination of CaCO3
  },
  {
    name: 'Ammonia Production (Steam Reforming)',
    translationKey: 'ammoniaProduction',
    units: ['tonnes'],
    factors: { 'tonnes': 1600 }, // ~1.6 t CO2 / t ammonia
  },
  {
    name: 'Nitric Acid Production (N2O)',
    translationKey: 'nitricAcidProduction',
    units: ['tonnes'],
    factors: { 'tonnes': 489.5 }, // Factor includes GWP for N2O
  },
  {
    name: 'Steel Production (BOF)',
    translationKey: 'steelProduction',
    units: ['tonnes'],
    factors: { 'tonnes': 1800 }, // ~1.8 t CO2 / t steel, typical for Basic Oxygen Furnace
  },
  {
    name: 'Aluminum Production (Smelting)',
    translationKey: 'aluminumProduction',
    units: ['tonnes'],
    factors: { 'tonnes': 1500 }, // ~1.5 t CO2e / t Al, from electrolysis
  },
  {
    name: 'Semiconductor Manufacturing (CF4 usage)',
    translationKey: 'semiconductorCF4',
    units: ['kg'],
    factors: { 'kg': 7390 }, // GWP for CF4 from IPCC AR5
  },
  {
    name: 'Semiconductor Manufacturing (NF3 usage)',
    translationKey: 'semiconductorNF3',
    units: ['kg'],
    factors: { 'kg': 17200 }, // GWP for NF3 from IPCC AR5
  },
];


// GWP values sourced from IPCC AR5
export const FUGITIVE_GASES: Refrigerant[] = [
    { name: 'HFC-134a (Refrigerant)', translationKey: 'hfc134a', gwp: 1430 },
    { name: 'R-404A (Refrigerant)', translationKey: 'r404a', gwp: 3922 },
    { name: 'R-410A (Refrigerant)', translationKey: 'r410a', gwp: 2088 },
    { name: 'R-22 (HCFC-22, Refrigerant)', translationKey: 'r22', gwp: 1810 },
    { name: 'SF6 (from electrical equipment)', translationKey: 'sf6', gwp: 23500 },
];

// Emission factors for on-site waste treatment (Scope 1) - using CO2e for simplicity
export const WASTE_SOURCES: CO2eFactorFuel[] = [
  {
    name: 'Municipal Solid Waste (MSW) Incineration',
    translationKey: 'mswIncineration',
    units: ['tonnes'],
    factors: { 'tonnes': 917 }, // IPCC 2006 Guidelines, Vol 5, Ch 2. Includes GWP for CH4 & N2O.
  },
  {
    name: 'Industrial Waste Incineration',
    translationKey: 'industrialWasteIncineration',
    units: ['tonnes'],
    factors: { 'tonnes': 1500 }, // Highly variable, using an example value.
  },
  {
    name: 'Sewage Sludge Incineration',
    translationKey: 'sewageSludgeIncineration',
    units: ['tonnes'],
    factors: { 'tonnes': 550 }, // Based on dry weight, from IPCC guidelines.
  },
  {
    name: 'Wastewater Treatment (Anaerobic)',
    translationKey: 'wastewaterAnaerobic',
    units: ['cubic meters'],
    factors: { 'cubic meters': 7 }, // CH4 emissions, GWP applied. Based on industrial wastewater.
  },
  {
    name: 'Wastewater Treatment (Aerobic)',
    translationKey: 'wastewaterAerobic',
    units: ['cubic meters'],
    factors: { 'cubic meters': 1.325 }, // N2O emissions, GWP applied. Based on domestic wastewater.
  }
];

// Regional electricity grid emission factors (kg CO2e) - These are LOCATION-BASED factors
export const SCOPE2_FACTORS_BY_REGION: { [key: string]: { factors: { [key: string]: number }; source: string; sourceUrl: string; translationKey: string; } } = {
  'South Korea': { 
    factors: { 'kWh': 0.4541, 'MWh': 454.1 }, 
    source: '온실가스 종합정보센터 (2024)',
    sourceUrl: 'https://www.gir.go.kr/home/board/read.do;jsessionid=jkFWdTQjZXDp3PANidbqSmgacV2XrC1VTMBN6KkUisFjTI24vCVn8FPNOLCeWAGM.og_was2_servlet_engine1?pagerOffset=0&maxPageItems=10&maxIndexPages=10&searchKey=&searchValue=&menuId=36&boardId=82&boardMasterId=2&boardCategoryId=',
    translationKey: 'countrySouthKorea' 
  },
  'USA': { 
    factors: { 'kWh': 0.38, 'MWh': 380 }, 
    source: 'IEA (2023 Data)',
    sourceUrl: 'https://www.iea.org/countries/united-states/data-and-statistics',
    translationKey: 'countryUSA' 
  },
  'Japan': { 
    factors: { 'kWh': 0.46, 'MWh': 460 }, 
    source: 'IEA (2023 Data)',
    sourceUrl: 'https://www.iea.org/countries/japan/data-and-statistics',
    translationKey: 'countryJapan' 
  },
  'EU': { 
    factors: { 'kWh': 0.25, 'MWh': 250 }, 
    source: 'IEA (2023 Data)',
    sourceUrl: 'https://www.iea.org/countries/european-union/data-and-statistics',
    translationKey: 'countryEU' 
  },
};

// Default factors for Scope 2 Purchased Energy sources
export const SCOPE2_ENERGY_SOURCES: CO2eFactorFuel[] = [
    {
        name: 'Grid Electricity',
        translationKey: 'gridElectricity',
        units: ['kWh', 'MWh'],
        factors: SCOPE2_FACTORS_BY_REGION['South Korea'].factors, // Default to South Korea for location-based
    },
    {
        name: 'Purchased Steam',
        translationKey: 'purchasedSteam',
        units: ['tonnes', 'MMBtu'],
        factors: { 'tonnes': 65, 'MMBtu': 54.3 }, // Source: EPA GHG Emission Factors Hub
    },
    {
        name: 'Purchased Heating',
        translationKey: 'purchasedHeating',
        units: ['MWh', 'MMBtu'],
        factors: { 'MWh': 200, 'MMBtu': 58.6 }, // Example factors, based on district heating
    },
    {
        name: 'Purchased Cooling',
        translationKey: 'purchasedCooling',
        units: ['MWh', 'ton-hour'],
        factors: { 'MWh': 70, 'ton-hour': 0.06 }, // Example factors, based on district cooling
    },
];

// --- SCOPE 3 FACTORS ---
// Source: EPA GHG Emission Factors Hub (updated 2023/2024), UK DEFRA GHG Conversion Factors.
// Simplified for this tool.

// Category 1
export const PURCHASED_GOODS_SERVICES_FACTORS: CO2eFactorFuel[] = [
  { name: 'Professional Services (spend)', translationKey: 'profServicesSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.05, 'KRW': 0.00004 } },
  { name: 'IT Services (spend)', translationKey: 'itServicesSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.1, 'KRW': 0.00008 } },
];

// Category 2
export const CAPITAL_GOODS_FACTORS: CO2eFactorFuel[] = [
  { name: 'Computer Hardware (spend)', translationKey: 'computerHardwareSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.3, 'KRW': 0.00025 } },
  { name: 'Heavy Machinery (spend)', translationKey: 'heavyMachinerySpend', units: ['USD', 'KRW'], factors: { 'USD': 0.8, 'KRW': 0.00065 } },
];

// Category 3: Upstream emissions from fuel and energy. These are "Well-to-Tank" (WTT) factors.
export const FUEL_ENERGY_ACTIVITIES_FACTORS: CO2eFactorFuel[] = [
  { name: 'Natural Gas (WTT)', translationKey: 'naturalGasWTT', units: ['cubic meters', 'therms'], factors: { 'cubic meters': 0.5, 'therms': 1.4 } },
  { name: 'Gasoline (WTT)', translationKey: 'gasolineWTT', units: ['liters', 'gallons'], factors: { 'liters': 0.6, 'gallons': 2.2 } },
  { name: 'Diesel (WTT)', translationKey: 'dieselWTT', units: ['liters', 'gallons'], factors: { 'liters': 0.7, 'gallons': 2.7 } },
  { name: 'Heating Oil (WTT)', translationKey: 'heatingOilWTT', units: ['liters', 'gallons'], factors: { 'liters': 0.75, 'gallons': 2.8 } },
];

// Simplified upstream factors for purchased energy (steam, heat, etc.), representing WTT of fuel used for generation.
export const PURCHASED_ENERGY_UPSTREAM_FACTORS: { [key: string]: { factor: number; units: string[] } } = {
  'Purchased Steam': { factor: 10, units: ['tonnes', 'MMBtu'] },
  'Purchased Heating': { factor: 30, units: ['MWh', 'MMBtu'] },
  'Purchased Cooling': { factor: 15, units: ['MWh', 'ton-hour'] },
};


// Category 4 & 9: Detailed factors by mode and vehicle type (kg CO2e / tonne-km)
// Source: GLEC Framework, DEFRA
export const TRANSPORTATION_FACTORS_BY_MODE = {
  Road: {
    'Light-duty Truck': { factor: 0.18, translationKey: 'roadLightTruck' },
    'Medium-duty Truck': { factor: 0.12, translationKey: 'roadMediumTruck' },
    'Heavy-duty Truck': { factor: 0.08, translationKey: 'roadHeavyTruck' },
    'Delivery Van': { factor: 0.28, translationKey: 'roadDeliveryVan' },
    'Motorcycle (for delivery)': { factor: 0.65, translationKey: 'roadMotorcycleDelivery' },
  },
  Sea: {
    'Container Ship': { factor: 0.008, translationKey: 'seaContainerShip' },
    'Bulk Carrier': { factor: 0.005, translationKey: 'seaBulkCarrier' },
    'Oil Tanker': { factor: 0.006, translationKey: 'seaOilTanker' },
  },
  Air: {
    'Short-haul Cargo Flight (<1500 km)': { factor: 0.9, translationKey: 'airShortHaulCargo' },
    'Long-haul Cargo Flight (>1500 km)': { factor: 0.6, translationKey: 'airLongHaulCargo' },
  },
  Rail: {
    'Diesel Freight Train': { factor: 0.02, translationKey: 'railDieselTrain' },
    'Electric Freight Train': { factor: 0.01, translationKey: 'railElectricTrain' },
  }
};

export const TRANSPORTATION_SPEND_FACTORS: CO2eFactorFuel[] = [
    { name: 'Freight Forwarding Services (spend)', translationKey: 'freightSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.4, 'KRW': 0.00032 } },
    { name: 'Warehousing and Storage (spend)', translationKey: 'warehousingSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.2, 'KRW': 0.00016 } },
];


// Category 5: Factors for waste generated in operations (kg CO2e / tonne of waste)
// Source: DEFRA 2023, EPA WARM v15.
// These factors are for TREATMENT ONLY. Transport is calculated separately.
export const WASTE_TREATMENT_FACTORS: Record<WasteType, Partial<Record<TreatmentMethod, { factor: number; translationKey: TranslationKey }>>> = {
  MSW: {
    Landfill: { factor: 650, translationKey: 'landfill' },
    Incineration: { factor: 300, translationKey: 'incineration' },
    Recycling: { factor: -200, translationKey: 'recycling' },
    Composting: { factor: 20, translationKey: 'composting' },
    AnaerobicDigestion: { factor: 10, translationKey: 'anaerobicDigestion' },
  },
  Paper: {
    Landfill: { factor: 1200, translationKey: 'landfill' },
    Incineration: { factor: 20, translationKey: 'incineration' },
    Recycling: { factor: -800, translationKey: 'recycling' },
    Composting: { factor: 40, translationKey: 'composting' },
  },
  Plastics: {
    Landfill: { factor: 45, translationKey: 'landfill' },
    Incineration: { factor: 2700, translationKey: 'incineration' },
    Recycling: { factor: -1500, translationKey: 'recycling' },
  },
  Food: {
    Landfill: { factor: 550, translationKey: 'landfill' },
    Incineration: { factor: 15, translationKey: 'incineration' },
    Composting: { factor: 20, translationKey: 'composting' },
    AnaerobicDigestion: { factor: 10, translationKey: 'anaerobicDigestion' },
  },
  Metal: {
    Landfill: { factor: 20, translationKey: 'landfill' },
    Recycling: { factor: -5000, translationKey: 'recycling' },
  },
  Hazardous: {
    Landfill: { factor: 200, translationKey: 'landfill' },
    Incineration: { factor: 3000, translationKey: 'incineration' },
  },
};

export const WASTE_SPEND_FACTORS: CO2eFactorFuel[] = [
    { name: 'Waste Management Services (spend)', translationKey: 'wasteSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.5, 'KRW': 0.0004 } },
];

export const WASTE_FACTORS_DETAILED = {
  activity: WASTE_TREATMENT_FACTORS,
  spend: WASTE_SPEND_FACTORS
};


// Category 6: Detailed factors
// Factors include radiative forcing multipliers where applicable (e.g., air travel)
// Source: DEFRA, ICAO, EPA. Units are kg CO2e.
export const BUSINESS_TRAVEL_FACTORS_DETAILED = {
  activity: {
    Air: {
      'Short-haul (<463 km)': {
        Economy: { factor: 0.255, unit: 'passenger-km', translationKey: 'Economy' },
        Business: { factor: 0.383, unit: 'passenger-km', translationKey: 'Business' },
        First: { factor: 0.510, unit: 'passenger-km', translationKey: 'First' },
      },
      'Medium-haul (463-1108 km)': {
        Economy: { factor: 0.156, unit: 'passenger-km', translationKey: 'Economy' },
        Business: { factor: 0.296, unit: 'passenger-km', translationKey: 'Business' },
        First: { factor: 0.468, unit: 'passenger-km', translationKey: 'First' },
      },
      'Long-haul (>1108 km)': {
        Economy: { factor: 0.150, unit: 'passenger-km', translationKey: 'Economy' },
        Business: { factor: 0.435, unit: 'passenger-km', translationKey: 'Business' },
        First: { factor: 0.600, unit: 'passenger-km', translationKey: 'First' },
      },
    },
    Rail: {
      'National Rail': { factor: 0.035, unit: 'passenger-km', translationKey: 'railNational' },
      'High-speed Rail': { factor: 0.015, unit: 'passenger-km', translationKey: 'railHighSpeed' },
    },
    Bus: {
      'Average Bus': { factor: 0.103, unit: 'passenger-km', translationKey: 'bus' },
    },
    RentalCar: {
      'Average Gasoline': { factor: 0.21, unit: 'km', translationKey: 'carGasoline' },
      'Average Diesel': { factor: 0.20, unit: 'km', translationKey: 'carDiesel' },
      'Electric': { factor: 0.05, unit: 'km', translationKey: 'carElectric' }, // Using an average grid factor
    },
    PersonalCar: { 
      'Average Gasoline': { factor: 0.19, unit: 'km', translationKey: 'personalCarGasoline' },
      'Average Diesel': { factor: 0.18, unit: 'km', translationKey: 'personalCarDiesel' },
      'Electric': { factor: 0.05, unit: 'km', translationKey: 'carElectric' },
    },
    Hotel: {
      'National': { factor: 25.0, unit: 'night', translationKey: 'hotelNational' },
      'International': { factor: 35.0, unit: 'night', translationKey: 'hotelInternational' },
    }
  },
  spend: [
    { name: 'Air Travel (spend)', translationKey: 'airTravelSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.6, 'KRW': 0.0005 } },
    { name: 'Rail Travel (spend)', translationKey: 'railTravelSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.2, 'KRW': 0.00016 } },
    { name: 'Ground Transport (spend)', translationKey: 'groundTransportSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.35, 'KRW': 0.00028 } },
    { name: 'Hotel Accommodation (spend)', translationKey: 'hotelSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.15, 'KRW': 0.00012 } },
  ]
};

// Category 7: Employee Commuting - Detailed factors based on DEFRA, EPA.
export const EMPLOYEE_COMMUTING_FACTORS_DETAILED = {
  activity: {
    PersonalCar: {
      'Gasoline': { factor: 0.17, unit: 'km', translationKey: 'personalCarGasoline' },
      'Diesel': { factor: 0.165, unit: 'km', translationKey: 'personalCarDiesel' },
      'Hybrid': { factor: 0.12, unit: 'km', translationKey: 'personalCarHybrid' },
      'Electric': { factor: 0.05, unit: 'km', translationKey: 'personalCarElectric' }, // Represents upstream emissions from grid electricity
      'LPG': { factor: 0.15, unit: 'km', translationKey: 'personalCarLPG' },
    },
    PublicTransport: {
      'Bus': { factor: 0.103, unit: 'passenger-km', translationKey: 'bus' },
      'Subway': { factor: 0.028, unit: 'passenger-km', translationKey: 'subway' },
    },
    Motorbike: {
      'Average Motorbike': { factor: 0.08, unit: 'km', translationKey: 'motorbike' },
    },
    BicycleWalking: {
      'Active Commute': { factor: 0, unit: 'km', translationKey: 'bicycleWalking' },
    },
  },
  spend: [
    { name: 'Employee Fuel Spend', translationKey: 'employeeFuelSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.4, 'KRW': 0.00032 } },
    { name: 'Public Transport Spend', translationKey: 'publicTransportSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.2, 'KRW': 0.00016 } },
  ]
};

// Category 8 & 13: Detailed factors for Leased Assets
// Source for energy intensity: CIBSE Guide F, US EIA CBECS. Simplified and averaged.
export const LEASED_ASSETS_FACTORS_DETAILED = {
  area_based: { // Factors are in kWh / m2 / year
    Office: { factor: 250, translationKey: 'buildingTypeOffice' },
    Warehouse: { factor: 100, translationKey: 'buildingTypeWarehouse' },
    Factory: { factor: 450, translationKey: 'buildingTypeFactory' },
    Retail: { factor: 350, translationKey: 'buildingTypeRetail' },
    DataCenter: { factor: 1500, translationKey: 'buildingTypeDataCenter' },
  },
  spend_based: [
    { name: 'Building/Office Lease (spend)', translationKey: 'buildingLeaseSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.1, 'KRW': 0.00008 } },
    { name: 'Vehicle/Equipment Lease (spend)', translationKey: 'vehicleLeaseSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.3, 'KRW': 0.00024 } },
  ]
};

// Category 10
export const PROCESSING_SOLD_PRODUCTS_FACTORS_DETAILED = {
  activity: [
    { name: 'Chemical Processing', translationKey: 'chemProcessing', units: ['tonnes', 'kg', 'cubic meters'], factors: { 'tonnes': 250, 'kg': 0.25, 'cubic meters': 200 } },
    { name: 'Metal Forging', translationKey: 'metalForging', units: ['tonnes', 'kg'], factors: { 'tonnes': 400, 'kg': 0.4 } },
    { name: 'Rolling', translationKey: 'rolling', units: ['tonnes', 'kg'], factors: { 'tonnes': 150, 'kg': 0.15 } },
    { name: 'Heat Treatment', translationKey: 'heatTreatment', units: ['tonnes', 'kg'], factors: { 'tonnes': 300, 'kg': 0.3 } },
    { name: 'Assembly', translationKey: 'assembly', units: ['tonnes', 'kg', 'unit'], factors: { 'tonnes': 50, 'kg': 0.05, 'unit': 5 } },
    { name: 'Molding/Forming', translationKey: 'moldingForming', units: ['tonnes', 'kg'], factors: { 'tonnes': 200, 'kg': 0.2 } },
    { name: 'Welding', translationKey: 'welding', units: ['tonnes', 'kg'], factors: { 'tonnes': 100, 'kg': 0.1 } },
  ],
  spend: [
    { name: 'Downstream Processing Services (spend)', translationKey: 'downstreamProcessingSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.3, 'KRW': 0.00024 } },
  ]
};

// Category 11
export const USE_SOLD_PRODUCTS_FACTORS: CO2eFactorFuel[] = [
  { name: 'Electronics Lifetime Energy', translationKey: 'electronicsLifetime', units: ['unit'], factors: { 'unit': 150 } }, // kg CO2e per unit sold, assuming lifetime kWh * grid factor
  { name: 'Vehicle Lifetime Fuel', translationKey: 'vehicleLifetime', units: ['unit'], factors: { 'unit': 35000 } }, // kg CO2e per vehicle, assuming lifetime mileage * fuel factor
];

// Category 12
export const END_OF_LIFE_TREATMENT_FACTORS: CO2eFactorFuel[] = [
  { name: 'Sold Product to Landfill', translationKey: 'soldProductLandfill', units: ['tonnes'], factors: { 'tonnes': 690 } },
  { name: 'Sold Product Incinerated', translationKey: 'soldProductIncinerated', units: ['tonnes'], factors: { 'tonnes': 320 } },
];

// Category 14
export const FRANCHISES_FACTORS: CO2eFactorFuel[] = [
  { name: 'Retail Franchise', translationKey: 'retailFranchise', units: ['location-year'], factors: { 'location-year': 50000 } }, // 50 tCO2e
  { name: 'Restaurant Franchise', translationKey: 'restaurantFranchise', units: ['location-year'], factors: { 'location-year': 150000 } }, // 150 tCO2e
];

// Category 15
export const INVESTMENTS_FACTORS: CO2eFactorFuel[] = [
  { name: 'Investment in Tech Sector', translationKey: 'investTech', units: ['USD invested', 'KRW invested'], factors: { 'USD invested': 0.02, 'KRW invested': 0.000015 } },
  { name: 'Investment in Manufacturing', translationKey: 'investManufacturing', units: ['USD invested', 'KRW invested'], factors: { 'USD invested': 0.25, 'KRW invested': 0.0002 } },
];


export const ALL_SCOPE3_CATEGORIES: EmissionCategory[] = [
  EmissionCategory.PurchasedGoodsAndServices,
  EmissionCategory.CapitalGoods,
  EmissionCategory.FuelAndEnergyRelatedActivities,
  EmissionCategory.UpstreamTransportationAndDistribution,
  EmissionCategory.WasteGeneratedInOperations,
  EmissionCategory.BusinessTravel,
  EmissionCategory.EmployeeCommuting,
  EmissionCategory.UpstreamLeasedAssets,
  EmissionCategory.DownstreamTransportationAndDistribution,
  EmissionCategory.ProcessingOfSoldProducts,
  EmissionCategory.UseOfSoldProducts,
  EmissionCategory.EndOfLifeTreatmentOfSoldProducts,
  EmissionCategory.DownstreamLeasedAssets,
  EmissionCategory.Franchises,
  EmissionCategory.Investments,
];

// Predefined common facility types based on GHG Protocol guidance, grouped by scope
export const FACILITY_TYPES_BY_SCOPE: { [key: string]: { name: string, translationKey: string }[] } = {
    'Scope 1': [
        { name: 'Stationary Combustion Facility', translationKey: 'facilityTypeStationary' },
        { name: 'Mobile Combustion Facility', translationKey: 'facilityTypeMobile' },
        { name: 'Fugitive Emission Facility', translationKey: 'facilityTypeFugitive' },
        { name: 'Process Emission Facility', translationKey: 'facilityTypeProcess' },
    ],
    'Scope 2': [
        { name: 'Electricity Usage Facility', translationKey: 'facilityTypeElectricity' },
        { name: 'Steam Usage Facility', translationKey: 'facilityTypeSteam' },
    ],
};