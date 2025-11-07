import { CO2eFactorFuel, Refrigerant, EmissionCategory } from './types';

// Global Warming Potential (GWP) values from IPCC Fifth Assessment Report (AR5)
export const GWP_VALUES = {
  co2: 1,
  ch4: 28,
  n2o: 265,
};

// Emission factors are now a single CO2e value (in kg per unit)
// Source: US EPA GHG Emission Factors Hub (updated March 2023), converted and aggregated.

export const STATIONARY_FUELS: CO2eFactorFuel[] = [
  {
    name: 'Natural Gas',
    translationKey: 'naturalGas',
    units: ['cubic meters', 'therms'],
    factors: { 
      'cubic meters': 1.9019075,
      'therms': 5.30545,
    },
  },
  {
    name: 'Propane',
    translationKey: 'propane',
    units: ['liters', 'gallons'],
    factors: { 
      'liters': 1.51642,
      'gallons': 5.7454,
     },
  },
  {
    name: 'Heating Oil (No. 2)',
    translationKey: 'heatingOil',
    units: ['liters', 'gallons'],
    factors: { 
      'liters': 2.684464,
      'gallons': 10.16674,
    },
  },
  {
    name: 'Coal (Bituminous)',
    translationKey: 'coalBituminous',
    units: ['kg', 'tonnes'],
    factors: { 
      'kg': 2.3162,
      'tonnes': 2316.2,
    },
  },
  {
    name: 'Wood Chips',
    translationKey: 'woodChips',
    units: ['kg', 'tonnes'],
    factors: {
      'kg': 1.6461,
      'tonnes': 1646.1,
    },
  },
];

export const MOBILE_FUELS: CO2eFactorFuel[] = [
  {
    name: 'Gasoline',
    translationKey: 'gasoline',
    units: ['liters', 'gallons'],
    factors: { 
      'liters': 2.29935,
      'gallons': 8.8121,
    },
  },
  {
    name: 'Diesel',
    translationKey: 'diesel',
    units: ['liters', 'gallons'],
    factors: { 
      'liters': 2.66558,
      'gallons': 10.20232,
    },
  },
  {
    name: 'Jet Fuel (Kerosene)',
    translationKey: 'jetFuel',
    units: ['liters', 'gallons'],
    factors: { 
      'liters': 2.53279,
      'gallons': 9.58116,
    },
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

export const BUSINESS_TRAVEL_FACTORS: CO2eFactorFuel[] = [
  {
    name: 'Air Travel - Short-haul (<463 km)',
    translationKey: 'airTravelShort',
    units: ['passenger-km'],
    factors: { 'passenger-km': 0.255 },
  },
  {
    name: 'Air Travel - Medium-haul (463-1108 km)',
    translationKey: 'airTravelMedium',
    units: ['passenger-km'],
    factors: { 'passenger-km': 0.156 },
  },
  {
    name: 'Air Travel - Long-haul (>1108 km)',
    translationKey: 'airTravelLong',
    units: ['passenger-km'],
    factors: { 'passenger-km': 0.150 },
  },
  {
    name: 'Rail (National)',
    translationKey: 'railNational',
    units: ['passenger-km'],
    factors: { 'passenger-km': 0.035 },
  },
  {
    name: 'Car (Average Gasoline)',
    translationKey: 'carGasoline',
    units: ['km'],
    factors: { 'km': 0.21 }, // Assumes average occupancy
  },
  {
    name: 'Hotel Stay (per night)',
    translationKey: 'hotelStay',
    units: ['night'],
    factors: { 'night': 25.0 }, // Highly variable global average
  },
];

export const EMPLOYEE_COMMUTING_FACTORS: CO2eFactorFuel[] = [
  {
    name: 'Personal Car (Gasoline)',
    translationKey: 'personalCarGasoline',
    units: ['km'],
    factors: { 'km': 0.17 },
  },
  {
    name: 'Personal Car (Diesel)',
    translationKey: 'personalCarDiesel',
    units: ['km'],
    factors: { 'km': 0.165 },
  },
  {
    name: 'Bus',
    translationKey: 'bus',
    units: ['passenger-km'],
    factors: { 'passenger-km': 0.103 },
  },
  {
    name: 'Subway / Metro',
    translationKey: 'subway',
    units: ['passenger-km'],
    factors: { 'passenger-km': 0.028 },
  },
];

// Factors for waste generated in operations but treated OFF-SITE by third parties (Scope 3)
export const SCOPE3_WASTE_FACTORS: CO2eFactorFuel[] = [
  {
    name: 'MSW sent to Landfill',
    translationKey: 'mswLandfill',
    units: ['tonnes'],
    factors: { 'tonnes': 690 }, // Includes collection, transport, and landfill CH4 emissions.
  },
  {
    name: 'MSW Incinerated (off-site)',
    translationKey: 'mswIncinerationOffsite',
    units: ['tonnes'],
    factors: { 'tonnes': 320 }, // Lower than Scope 1 as it often involves energy recovery.
  },
  {
    name: 'Mixed Recyclables',
    translationKey: 'mixedRecyclables',
    units: ['tonnes'],
    factors: { 'tonnes': 25 }, // Emissions from collection and processing.
  },
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

// Predefined common facility types based on GHG Protocol guidance
export const PREDEFINED_FACILITIES: { name: string, translationKey: string }[] = [
    { name: 'office', translationKey: 'facilityTypeOffice' },
    { name: 'plant', translationKey: 'facilityTypePlant' },
    { name: 'warehouse', translationKey: 'facilityTypeWarehouse' },
    { name: 'data_center', translationKey: 'facilityTypeDataCenter' },
    { name: 'retail', translationKey: 'facilityTypeRetail' },
    { name: 'lab', translationKey: 'facilityTypeLab' },
];