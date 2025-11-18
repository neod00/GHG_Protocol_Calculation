import { CO2eFactorFuel } from '../../types';

// Category 12
export const END_OF_LIFE_TREATMENT_OF_SOLD_PRODUCTS: CO2eFactorFuel[] = [
  { name: 'Sold Product to Landfill', translationKey: 'soldProductLandfill', units: ['tonnes'], factors: { 'tonnes': 690 } },
  { name: 'Sold Product Incinerated', translationKey: 'soldProductIncinerated', units: ['tonnes'], factors: { 'tonnes': 320 } },
];
