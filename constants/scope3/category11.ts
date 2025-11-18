import { CO2eFactorFuel } from '../../types';

// Category 11
export const USE_SOLD_PRODUCTS_FACTORS: CO2eFactorFuel[] = [
  { name: 'Electronics Lifetime Energy', translationKey: 'electronicsLifetime', units: ['unit'], factors: { 'unit': 150 } }, // kg CO2e per unit sold, assuming lifetime kWh * grid factor
  { name: 'Vehicle Lifetime Fuel', translationKey: 'vehicleLifetime', units: ['unit'], factors: { 'unit': 35000 } }, // kg CO2e per vehicle, assuming lifetime mileage * fuel factor
];
