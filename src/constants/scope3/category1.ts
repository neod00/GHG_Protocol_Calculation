import { CO2eFactorFuel } from '../../types';

// Category 1
export const PURCHASED_GOODS_SERVICES_FACTORS: CO2eFactorFuel[] = [
  { name: 'Professional Services (spend)', translationKey: 'profServicesSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.05, 'KRW': 0.00004 } },
  { name: 'IT Services (spend)', translationKey: 'itServicesSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.1, 'KRW': 0.00008 } },
];
