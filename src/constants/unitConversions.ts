// ============================================================================
// 단위 환산 계수 (Unit Conversion Factors)
// ============================================================================
// 목적: 해외 사업장(특히 미국)에서 사용하는 단위를 국제 표준 단위로 변환
// 출처: 한국석유공사(페트로넷), 2006 IPCC 가이드라인, EPA eGRID
// ============================================================================

export interface UnitConversion {
    fromUnit: string;
    toUnit: string;
    factor: number;
    source: string;
    sourceUrl?: string;
    translationKey?: string;
}

export interface FuelDensity {
    fuelName: string;
    translationKey: string;
    density: number;
    densityUnit: string; // e.g., 'ton/L', 'kg/L'
    source: string;
    sourceUrl?: string;
}

// ============================================================================
// 부피 환산 계수 (Volume Conversions)
// ============================================================================
export const VOLUME_CONVERSIONS: UnitConversion[] = [
    {
        fromUnit: 'gal',
        toUnit: 'L',
        factor: 3.79,
        source: '한국석유공사(페트로넷)',
        sourceUrl: 'http://fs.kemco.or.kr/rfsm/rhMSCHMSCEtc.do',
        translationKey: 'conversionGalToL'
    },
    {
        fromUnit: 'bbl',
        toUnit: 'gal',
        factor: 42,
        source: 'US Standard (1 barrel = 42 gallons)',
        translationKey: 'conversionBblToGal'
    },
    {
        fromUnit: 'bbl',
        toUnit: 'L',
        factor: 158.987,
        source: 'US Standard (42 gal × 3.785 L/gal)',
        translationKey: 'conversionBblToL'
    },
    {
        fromUnit: 'SCF',
        toUnit: 'Nm3',
        factor: 0.0283168,
        source: 'Standard Cubic Feet to Normal Cubic Meters',
        translationKey: 'conversionSCFToNm3'
    }
];

// ============================================================================
// 중량 환산 계수 (Mass Conversions)
// ============================================================================
export const MASS_CONVERSIONS: UnitConversion[] = [
    {
        fromUnit: 'lb',
        toUnit: 'kg',
        factor: 0.454,
        source: '미국 전기 배출계수 환산 기준',
        translationKey: 'conversionLbToKg'
    },
    {
        fromUnit: 'short ton',
        toUnit: 'kg',
        factor: 907.185,
        source: 'US Short Ton (2,000 lb)',
        translationKey: 'conversionShortTonToKg'
    },
    {
        fromUnit: 'long ton',
        toUnit: 'kg',
        factor: 1016.05,
        source: 'UK Long Ton (2,240 lb)',
        translationKey: 'conversionLongTonToKg'
    }
];

// ============================================================================
// 석유제품 밀도 (Fuel Densities) - 용/중량 환산
// ============================================================================
export const FUEL_DENSITIES: FuelDensity[] = [
    {
        fuelName: 'Gasoline',
        translationKey: 'gasoline',
        density: 0.0007,
        densityUnit: 'ton/L',
        source: '한국석유공사(페트로넷)',
        sourceUrl: 'http://fs.kemco.or.kr/rfsm/rhMSCHMSCEtc.do'
    },
    {
        fuelName: 'Diesel',
        translationKey: 'diesel',
        density: 0.0008,
        densityUnit: 'ton/L',
        source: '한국석유공사(페트로넷)',
        sourceUrl: 'http://fs.kemco.or.kr/rfsm/rhMSCHMSCEtc.do'
    },
    {
        fuelName: 'Kerosene',
        translationKey: 'heatingOilDiesel',
        density: 0.0008,
        densityUnit: 'ton/L',
        source: '한국석유공사(페트로넷)'
    },
    {
        fuelName: 'LPG',
        translationKey: 'propane',
        density: 0.51,
        densityUnit: 'kg/L',
        source: '한국석유공사(페트로넷)'
    }
];

// ============================================================================
// 에너지 환산 계수 (Energy Conversions)
// ============================================================================
export const ENERGY_CONVERSIONS: UnitConversion[] = [
    {
        fromUnit: 'MMBtu',
        toUnit: 'MJ',
        factor: 1055.06,
        source: 'Million BTU to Megajoules',
        translationKey: 'conversionMMBtuToMJ'
    },
    {
        fromUnit: 'therm',
        toUnit: 'MJ',
        factor: 105.506,
        source: 'US Therm to Megajoules',
        translationKey: 'conversionThermToMJ'
    },
    {
        fromUnit: 'kWh',
        toUnit: 'MJ',
        factor: 3.6,
        source: 'Kilowatt-hour to Megajoules',
        translationKey: 'conversionKWhToMJ'
    }
];

// ============================================================================
// 이동연소(도로) 기본 배출계수 - IPCC 2006 기준
// ============================================================================
export interface MobileEmissionFactor {
    fuelName: string;
    translationKey: string;
    netHeatingValue: number;
    heatingValueUnit: string; // 'TJ/Gg'
    co2EF: number; // kgCO2/TJ
    ch4EF: number; // kgCH4/TJ
    n2oEF: number; // kgN2O/TJ
    source: string;
}

export const MOBILE_EMISSION_FACTORS_IPCC: MobileEmissionFactor[] = [
    {
        fuelName: 'Gasoline',
        translationKey: 'gasoline',
        netHeatingValue: 44.3,
        heatingValueUnit: 'TJ/Gg',
        co2EF: 69300,
        ch4EF: 25.0,
        n2oEF: 8.0,
        source: '2006 IPCC 가이드라인 - 이동연소(도로)'
    },
    {
        fuelName: 'Diesel',
        translationKey: 'diesel',
        netHeatingValue: 43.0,
        heatingValueUnit: 'TJ/Gg',
        co2EF: 74100,
        ch4EF: 3.9,
        n2oEF: 3.9,
        source: '2006 IPCC 가이드라인 - 이동연소(도로)'
    },
    {
        fuelName: 'LPG',
        translationKey: 'lpgVehicle',
        netHeatingValue: 47.3,
        heatingValueUnit: 'TJ/Gg',
        co2EF: 63100,
        ch4EF: 62.0,
        n2oEF: 0.2,
        source: '2006 IPCC 가이드라인 - 이동연소(도로)'
    },
    {
        fuelName: 'CNG',
        translationKey: 'cngVehicle',
        netHeatingValue: 43.8,
        heatingValueUnit: 'TJ/Gg',
        co2EF: 56100,
        ch4EF: 92.0,
        n2oEF: 3.0,
        source: '2006 IPCC 가이드라인 - 이동연소(도로)'
    }
];

// ============================================================================
// 미국 지역별 전기 배출계수 (정밀 데이터)
// ============================================================================
export interface USElectricityFactor {
    region: string;
    translationKey: string;
    lbCO2_MWh: number;
    lbCH4_MWh: number;
    lbN2O_MWh: number;
    tCO2_MWh: number;  // = lbCO2_MWh × 0.000454
    tCH4_MWh: number;
    tN2O_MWh: number;
    tCO2e_MWh: number; // Total CO2e
    source: string;
}

export const US_ELECTRICITY_FACTORS: USElectricityFactor[] = [
    {
        region: 'Montgomery',
        translationKey: 'countryUSAMontgomery',
        lbCO2_MWh: 893.30,
        lbCH4_MWh: 0.064,
        lbN2O_MWh: 0.009,
        tCO2_MWh: 0.405134,
        tCH4_MWh: 0.00002903,
        tN2O_MWh: 0.00000408,
        tCO2e_MWh: 0.407069,
        source: 'EPA eGRID (2024)'
    },
    {
        region: 'Georgia',
        translationKey: 'countryUSAGeorgia',
        lbCO2_MWh: 893.30,
        lbCH4_MWh: 0.064,
        lbN2O_MWh: 0.009,
        tCO2_MWh: 0.405134,
        tCH4_MWh: 0.00002903,
        tN2O_MWh: 0.00000408,
        tCO2e_MWh: 0.407069,
        source: 'EPA eGRID (2024)'
    },
    {
        region: 'Alabama',
        translationKey: 'countryUSAAlabama',
        lbCO2_MWh: 893.30,
        lbCH4_MWh: 0.064,
        lbN2O_MWh: 0.009,
        tCO2_MWh: 0.405134,
        tCH4_MWh: 0.00002903,
        tN2O_MWh: 0.00000408,
        tCO2e_MWh: 0.407069,
        source: 'EPA eGRID (2024)'
    }
];

// ============================================================================
// 유틸리티 함수: 단위 변환 수행
// ============================================================================
export function convertUnit(value: number, fromUnit: string, toUnit: string): {
    convertedValue: number;
    factor: number;
    source: string;
    found: boolean;
} {
    // 동일 단위면 변환 불필요
    if (fromUnit === toUnit) {
        return { convertedValue: value, factor: 1, source: '', found: true };
    }

    // 모든 환산 테이블 검색
    const allConversions = [...VOLUME_CONVERSIONS, ...MASS_CONVERSIONS, ...ENERGY_CONVERSIONS];

    const conversion = allConversions.find(c => c.fromUnit === fromUnit && c.toUnit === toUnit);
    if (conversion) {
        return {
            convertedValue: value * conversion.factor,
            factor: conversion.factor,
            source: conversion.source,
            found: true
        };
    }

    // 역방향 검색
    const reverseConversion = allConversions.find(c => c.fromUnit === toUnit && c.toUnit === fromUnit);
    if (reverseConversion) {
        return {
            convertedValue: value / reverseConversion.factor,
            factor: 1 / reverseConversion.factor,
            source: reverseConversion.source,
            found: true
        };
    }

    return { convertedValue: value, factor: 1, source: '', found: false };
}

// ============================================================================
// US 단위 목록 (해외 사업장용)
// ============================================================================
export const US_UNITS = {
    volume: ['gal', 'bbl', 'SCF'],
    mass: ['lb', 'short ton', 'long ton'],
    energy: ['MMBtu', 'therm']
};

// 단위가 US 단위인지 확인
export function isUSUnit(unit: string): boolean {
    return [...US_UNITS.volume, ...US_UNITS.mass, ...US_UNITS.energy].includes(unit);
}

// 기본 단위(SI)로 변환하기 위한 매핑
export const US_TO_SI_MAPPING: { [key: string]: string } = {
    'gal': 'L',
    'bbl': 'L',
    'SCF': 'Nm3',
    'lb': 'kg',
    'short ton': 'kg',
    'long ton': 'kg',
    'MMBtu': 'MJ',
    'therm': 'MJ'
};
