import { CO2eFactorFuel } from '../../types';

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
