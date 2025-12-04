import { CO2eFactorFuel, Refrigerant } from '../types';

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
