import { CO2eFactorFuel, WasteType, TreatmentMethod } from '../../types';
// FIX: Changed import path to be more explicit.
import { TranslationKey } from '../../translations/index';

// Category 5: Factors for waste generated in operations (kg CO2e / tonne of waste)
// Source: DEFRA 2023, EPA WARM v15.
// These factors are for TREATMENT ONLY. Transport is calculated separately.
export const WASTE_TREATMENT_FACTORS: Record<WasteType, Partial<Record<TreatmentMethod, { factor: number; translationKey: TranslationKey }>>> = {
  MSW: {
    Landfill: { factor: 650, translationKey: 'landfill' },
    Incineration: { factor: 300, translationKey: 'incineration' },
    Recycling: { factor: -200, translationKey: 'recycling' },
    Composting: { factor: 20, translationKey: 'composting' },
    AnaerobicDigestion: { factor: 10, translationKey: 'anaerobicDigestion' },
  },
  Paper: {
    Landfill: { factor: 1200, translationKey: 'landfill' },
    Incineration: { factor: 20, translationKey: 'incineration' },
    Recycling: { factor: -800, translationKey: 'recycling' },
    Composting: { factor: 40, translationKey: 'composting' },
  },
  Plastics: {
    Landfill: { factor: 45, translationKey: 'landfill' },
    Incineration: { factor: 2700, translationKey: 'incineration' },
    Recycling: { factor: -1500, translationKey: 'recycling' },
  },
  Food: {
    Landfill: { factor: 550, translationKey: 'landfill' },
    Incineration: { factor: 15, translationKey: 'incineration' },
    Composting: { factor: 20, translationKey: 'composting' },
    AnaerobicDigestion: { factor: 10, translationKey: 'anaerobicDigestion' },
  },
  Metal: {
    Landfill: { factor: 20, translationKey: 'landfill' },
    Recycling: { factor: -5000, translationKey: 'recycling' },
  },
  Hazardous: {
    Landfill: { factor: 200, translationKey: 'landfill' },
    Incineration: { factor: 3000, translationKey: 'incineration' },
  },
};

export const WASTE_SPEND_FACTORS: CO2eFactorFuel[] = [
    { name: 'Waste Management Services (spend)', translationKey: 'wasteSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.5, 'KRW': 0.0004 } },
];

export const WASTE_FACTORS_DETAILED = {
  activity: WASTE_TREATMENT_FACTORS,
  spend: WASTE_SPEND_FACTORS
};