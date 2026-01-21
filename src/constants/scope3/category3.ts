import { CO2eFactorFuel } from '../../types';

// Category 3: Upstream emissions from fuel and energy. These are "Well-to-Tank" (WTT) factors.
// Factors are estimated based on typical upstream intensity (approx. 15-30% of combustion emissions).
export const FUEL_ENERGY_ACTIVITIES_FACTORS: CO2eFactorFuel[] = [
  { name: 'Natural Gas (WTT)', translationKey: 'naturalGasWTT', units: ['cubic meters', 'Nm3', 'therms'], factors: { 'cubic meters': 0.5, 'Nm3': 0.5, 'therms': 1.4 } },
  { name: 'LNG (City Gas) (WTT)', translationKey: 'lngWTT', units: ['Nm3', 'MJ', 'kg'], factors: { 'Nm3': 0.55, 'MJ': 0.014, 'kg': 0.7 } },
  { name: 'Gasoline (WTT)', translationKey: 'gasolineWTT', units: ['liters', 'gallons'], factors: { 'liters': 0.6, 'gallons': 2.2 } },
  { name: 'Diesel (WTT)', translationKey: 'dieselWTT', units: ['liters', 'gallons'], factors: { 'liters': 0.7, 'gallons': 2.7 } },
  { name: 'LPG (WTT)', translationKey: 'lpgWTT', units: ['kg', 'liters'], factors: { 'kg': 0.73, 'liters': 0.41 } },
  { name: 'Kerosene / Heating Oil (WTT)', translationKey: 'heatingOilWTT', units: ['liters', 'gallons'], factors: { 'liters': 0.75, 'gallons': 2.8 } },
  { name: 'Heavy Fuel Oil (B-C Oil) (WTT)', translationKey: 'hfoWTT', units: ['liters'], factors: { 'liters': 0.76 } },
  { name: 'Coal (Anthracite/Bituminous) (WTT)', translationKey: 'coalWTT', units: ['kg', 'tonnes'], factors: { 'kg': 0.34, 'tonnes': 340 } },
  { name: 'Jet Fuel (WTT)', translationKey: 'jetFuelWTT', units: ['liters'], factors: { 'liters': 0.58 } },
  { name: 'Biomass (Wood/Pellets) (WTT)', translationKey: 'biomassWTT', units: ['kg', 'tonnes'], factors: { 'kg': 0.08, 'tonnes': 80.0 } },

  // Purchased Energy Upstream (WTT + T&D)
  { name: 'Grid Electricity (WTT + T&D)', translationKey: 'electricityWTT', units: ['kWh', 'MWh'], factors: { 'kWh': 0.068, 'MWh': 68.0 } },
  { name: 'Purchased Steam (WTT)', translationKey: 'steamWTT', units: ['MJ', 'MMBtu', 'tonnes'], factors: { 'MJ': 0.011, 'MMBtu': 11.6, 'tonnes': 29.7 } },
  { name: 'Purchased Heating (WTT)', translationKey: 'heatingWTT', units: ['MWh', 'MMBtu'], factors: { 'MWh': 45.0, 'MMBtu': 13.2 } },
  { name: 'Purchased Cooling (WTT)', translationKey: 'coolingWTT', units: ['MWh', 'ton-hour'], factors: { 'MWh': 10.5, 'ton-hour': 0.04 } },
];

// Simplified upstream factors for purchased energy (steam, heat, etc.), representing WTT of fuel used for generation.
// This map is used for legacy or background calculations if needed.
export const PURCHASED_ENERGY_UPSTREAM_FACTORS: { [key: string]: { factor: number; units: string[] } } = {
  'Purchased Steam': { factor: 10, units: ['tonnes', 'MMBtu'] },
  'Purchased Heating': { factor: 30, units: ['MWh', 'MMBtu'] },
  'Purchased Cooling': { factor: 15, units: ['MWh', 'ton-hour'] },
};
