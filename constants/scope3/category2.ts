import { CO2eFactorFuel } from '../../types';

// Category 2
export const CAPITAL_GOODS_FACTORS: CO2eFactorFuel[] = [
  { name: 'Computer Hardware (spend)', translationKey: 'computerHardwareSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.3, 'KRW': 0.00025 } },
  { name: 'Heavy Machinery (spend)', translationKey: 'heavyMachinerySpend', units: ['USD', 'KRW'], factors: { 'USD': 0.8, 'KRW': 0.00065 } },
];
