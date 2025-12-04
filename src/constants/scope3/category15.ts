
import { CO2eFactorFuel } from '../../types';

// Category 15: Investments
// Factors represent average emission intensity per unit of investment (kg CO2e / USD).
// Source: Highly generalized estimates based on EEIO models (e.g., EXIOBASE).
export const INVESTMENTS_FACTORS: CO2eFactorFuel[] = [
  { name: 'Tech Sector', translationKey: 'sectorTech', units: ['USD invested', 'KRW invested'], factors: { 'USD invested': 0.03, 'KRW invested': 0.00002 } },
  { name: 'Manufacturing', translationKey: 'sectorManufacturing', units: ['USD invested', 'KRW invested'], factors: { 'USD invested': 0.3, 'KRW invested': 0.00025 } },
  { name: 'Energy/Utilities', translationKey: 'sectorEnergy', units: ['USD invested', 'KRW invested'], factors: { 'USD invested': 1.5, 'KRW invested': 0.0012 } },
  { name: 'Financial Services', translationKey: 'sectorFinance', units: ['USD invested', 'KRW invested'], factors: { 'USD invested': 0.01, 'KRW invested': 0.000008 } },
  { name: 'Real Estate', translationKey: 'sectorRealEstate', units: ['USD invested', 'KRW invested'], factors: { 'USD invested': 0.15, 'KRW invested': 0.00012 } },
  { name: 'Transport', translationKey: 'sectorTransport', units: ['USD invested', 'KRW invested'], factors: { 'USD invested': 0.6, 'KRW invested': 0.0005 } },
  { name: 'Agriculture', translationKey: 'sectorAgriculture', units: ['USD invested', 'KRW invested'], factors: { 'USD invested': 0.8, 'KRW invested': 0.00065 } },
  { name: 'Construction', translationKey: 'sectorConstruction', units: ['USD invested', 'KRW invested'], factors: { 'USD invested': 0.4, 'KRW invested': 0.00032 } },
];