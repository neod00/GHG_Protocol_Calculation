import { CO2eFactorFuel } from '../../types';

// Category 15
export const INVESTMENTS_FACTORS: CO2eFactorFuel[] = [
  { name: 'Investment in Tech Sector', translationKey: 'investTech', units: ['USD invested', 'KRW invested'], factors: { 'USD invested': 0.02, 'KRW invested': 0.000015 } },
  { name: 'Investment in Manufacturing', translationKey: 'investManufacturing', units: ['USD invested', 'KRW invested'], factors: { 'USD invested': 0.25, 'KRW invested': 0.0002 } },
];
