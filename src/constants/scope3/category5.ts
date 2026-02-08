import { CO2eFactorFuel, WasteType, TreatmentMethod } from '../../types';
// FIX: Changed import path to be more explicit.
import { TranslationKey } from '../../translations/index';

// ============================================================================
// Category 5: Waste Generated in Operations (사업장 발생 폐기물)
// ============================================================================
// Source: NIER Scope 3 Guideline (2024), 환경성적표지 평가계수, 배출권거래제 지침
// Unit: kg CO2e per kg (or per tonne where specified)
// Treatment boundary: Landfill/Incineration = Cradle-to-Grave, Recycling = Cradle-to-Gate
// ============================================================================

/**
 * 환경성적표지 평가계수 기반 폐기물 처리 배출계수 (kgCO2e/kg)
 * Reference: 표 36, 37 - NIER Scope 3 Guideline
 */
export const WASTE_TREATMENT_FACTORS: Record<WasteType, Partial<Record<TreatmentMethod, { factor: number; translationKey: TranslationKey }>>> = {
  // 일반폐기물 / 생활폐기물 (MSW)
  MSW: {
    Landfill: { factor: 0.4552, translationKey: 'landfill' },        // 혼합쓰레기 매립
    Incineration: { factor: 0.0445, translationKey: 'incineration' }, // 기타 사업장폐기물 소각
    Recycling: { factor: 0.0186, translationKey: 'recycling' },       // 일반폐기물 재활용
    Composting: { factor: 0.0112, translationKey: 'composting' },     // 음식물류 퇴비화
    AnaerobicDigestion: { factor: 0.0100, translationKey: 'anaerobicDigestion' },
  },
  // 폐지류
  Paper: {
    Landfill: { factor: 1.1711, translationKey: 'landfill' },        // 폐지 매립
    Incineration: { factor: 0.5288, translationKey: 'incineration' }, // 폐지류 소각
    Recycling: { factor: 0.0715, translationKey: 'recycling' },       // 폐지 재활용
    Composting: { factor: 0.0400, translationKey: 'composting' },
  },
  // 폐합성수지류 (플라스틱)
  Plastics: {
    Landfill: { factor: 0.0132, translationKey: 'landfill' },        // 혼합폐플라스틱 매립
    Incineration: { factor: 3.4126, translationKey: 'incineration' }, // 폐합성수지 소각
    Recycling: { factor: 0.0186, translationKey: 'recycling' },       // 폐합성수지 재활용
  },
  // 음식물류 폐기물
  Food: {
    Landfill: { factor: 0.4382, translationKey: 'landfill' },        // 유기성 폐기물 매립
    Incineration: { factor: 0.0405, translationKey: 'incineration' }, // 음식물류 소각
    Composting: { factor: 0.0112, translationKey: 'composting' },     // 음식물류 퇴비화
    AnaerobicDigestion: { factor: 0.0080, translationKey: 'anaerobicDigestion' },
  },
  // 폐금속류
  Metal: {
    Landfill: { factor: 0.0122, translationKey: 'landfill' },        // 폐금속 매립
    Incineration: { factor: 0.5121, translationKey: 'incineration' },
    Recycling: { factor: 0.0038, translationKey: 'recycling' },       // 폐금속 재활용
  },
  // 지정폐기물 (폐유, 폐산, 유해폐기물)
  Hazardous: {
    Landfill: { factor: 0.1775, translationKey: 'landfill' },        // 중금속함유 유해폐기물 매립
    Incineration: { factor: 1.7990, translationKey: 'incineration' }, // 폐유성 페인트 소각
  },
  // 폐목재류
  Wood: {
    Landfill: { factor: 2.1195, translationKey: 'landfill' },        // 폐목 매립
    Incineration: { factor: 0.7157, translationKey: 'incineration' }, // 폐목재류 소각 (바이오매스)
    Recycling: { factor: 0.0136, translationKey: 'recycling' },       // 폐목재 재활용
  },
  // 폐유리류
  Glass: {
    Landfill: { factor: 0.0119, translationKey: 'landfill' },        // 폐유리 매립
    Incineration: { factor: 0.3727, translationKey: 'incineration' },
    Recycling: { factor: 0.0098, translationKey: 'recycling' },       // 폐유리 재활용
  },
  // 폐콘크리트류
  Concrete: {
    Landfill: { factor: 0.0122, translationKey: 'landfill' },        // 폐콘크리트 매립
    Incineration: { factor: 0.2164, translationKey: 'incineration' }, // 건설폐재류 소각
    Recycling: { factor: 0.0138, translationKey: 'recycling' },       // 폐콘크리트 재활용
  },
  // 폐섬유류
  Textile: {
    Landfill: { factor: 0.4500, translationKey: 'landfill' },
    Incineration: { factor: 0.2281, translationKey: 'incineration' }, // 폐섬유류 소각
    Recycling: { factor: 0.0200, translationKey: 'recycling' },
  },
  // 사업장 일반폐기물 (Industrial)
  Industrial: {
    Landfill: { factor: 0.0064, translationKey: 'landfill' },        // 일반폐기물 매립
    Incineration: { factor: 0.0445, translationKey: 'incineration' }, // 기타 사업장폐기물 소각
    Recycling: { factor: 0.0186, translationKey: 'recycling' },
  },
  // 건설폐기물
  Construction: {
    Landfill: { factor: 0.0122, translationKey: 'landfill' },
    Incineration: { factor: 0.2164, translationKey: 'incineration' }, // 건설 및 파쇄잔재물
    Recycling: { factor: 0.0138, translationKey: 'recycling' },
  },
  // 폐수 (Wastewater) - m³ 기준으로 별도 계산 필요, 여기선 톤 기준 참고값
  Wastewater: {
    WastewaterTreatment: { factor: 0.0004, translationKey: 'anaerobicDigestion' }, // 폐수처리 (per L) - using existing key
  },
  // 하폐수 슬러지 (Sludge)
  Sludge: {
    Landfill: { factor: 0.1861, translationKey: 'landfill' },        // 하수슬러지 매립
    Incineration: { factor: 0.1861, translationKey: 'incineration' }, // 하수슬러지 소각
    AnaerobicDigestion: { factor: 0.0405, translationKey: 'anaerobicDigestion' },
  },
};

/**
 * 지출 기반 배출계수 (Spend-based emission factors)
 * Unit: kgCO2e per currency unit
 */
export const WASTE_SPEND_FACTORS: CO2eFactorFuel[] = [
  {
    name: 'Waste Management Services (spend)',
    translationKey: 'wasteSpend',
    units: ['USD', 'KRW', 'EUR'],
    factors: { 'USD': 0.50, 'KRW': 0.0004, 'EUR': 0.46 }
  },
  {
    name: 'Hazardous Waste Disposal Services',
    translationKey: 'hazardousWasteSpend',
    units: ['USD', 'KRW', 'EUR'],
    factors: { 'USD': 1.20, 'KRW': 0.0010, 'EUR': 1.10 }
  },
  {
    name: 'Wastewater Treatment Services',
    translationKey: 'wastewaterSpend',
    units: ['USD', 'KRW', 'EUR'],
    factors: { 'USD': 0.35, 'KRW': 0.0003, 'EUR': 0.32 }
  },
];

/**
 * 평균 산정법을 위한 국가 통계 기반 처리방식별 비율 기본값
 * Source: 전국 폐기물 발생 및 처리 현황 (2023)
 */
export const DEFAULT_TREATMENT_RATIOS: Record<string, { landfill: number; incineration: number; recycling: number }> = {
  // 사업장폐기물 (기본값)
  default: {
    landfill: 0.05,      // 5% 매립
    incineration: 0.10,   // 10% 소각
    recycling: 0.85,      // 85% 재활용
  },
  // 생활폐기물
  municipal: {
    landfill: 0.15,
    incineration: 0.25,
    recycling: 0.60,
  },
  // 건설폐기물
  construction: {
    landfill: 0.03,
    incineration: 0.02,
    recycling: 0.95,
  },
  // 지정폐기물
  hazardous: {
    landfill: 0.10,
    incineration: 0.20,
    recycling: 0.70,
  },
};

/**
 * 폐기물 종류별 평균 배출계수 (평균 산정법용)
 * Weighted average based on national treatment ratios
 * Unit: kgCO2e per kg
 */
export const AVERAGE_WASTE_FACTORS: Record<string, number> = {
  default: 0.05,        // 사업장 폐기물 평균
  municipal: 0.25,      // 생활폐기물 평균
  construction: 0.02,   // 건설폐기물 평균
  hazardous: 0.50,      // 지정폐기물 평균
};

/**
 * 하·폐수 배출계수 (m³ 기준)
 * Source: 환경성적표지 평가계수
 */
export const WASTEWATER_FACTORS: Record<string, { factor: number; unit: string; translationKey: TranslationKey }> = {
  industrialWastewater: {
    factor: 0.85,      // kgCO2e per m³
    unit: 'm³',
    translationKey: 'wasteSpend' as const, // 산업폐수 - reusing existing key
  },
  domesticSewage: {
    factor: 0.45,      // kgCO2e per m³
    unit: 'm³',
    translationKey: 'wasteSpend' as const, // 생활하수 - reusing existing key
  },
};

/**
 * 폐기물 운송 배출계수 (선택 사항)
 * Reference: Category 4/9 transport factors
 */
export const WASTE_TRANSPORT_FACTORS: Record<string, { factor: number; unit: string }> = {
  truck: { factor: 0.1924, unit: 'kgCO2e/tonne-km' },  // 트럭
  tanker: { factor: 0.0444, unit: 'kgCO2e/tonne-km' }, // 탱크로리
};

/**
 * 통합 배출계수 내보내기
 */
export const WASTE_FACTORS_DETAILED = {
  activity: WASTE_TREATMENT_FACTORS,
  spend: WASTE_SPEND_FACTORS,
  average: AVERAGE_WASTE_FACTORS,
  wastewater: WASTEWATER_FACTORS,
  transport: WASTE_TRANSPORT_FACTORS,
  treatmentRatios: DEFAULT_TREATMENT_RATIOS,
};