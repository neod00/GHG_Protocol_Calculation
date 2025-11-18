import { CO2eFactorFuel } from '../../types';

// Category 14
export const FRANCHISES_FACTORS: CO2eFactorFuel[] = [
  { name: 'Retail Franchise', translationKey: 'retailFranchise', units: ['location-year'], factors: { 'location-year': 50000 } }, // 50 tCO2e
  { name: 'Restaurant Franchise', translationKey: 'restaurantFranchise', units: ['location-year'], factors: { 'location-year': 150000 } }, // 150 tCO2e
];
