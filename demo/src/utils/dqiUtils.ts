import { DataQualityIndicator } from '../types';

export const DQI_DESCRIPTIONS: Record<keyof DataQualityIndicator, Record<number, { ko: string; en: string }>> = {
    reliability: {
        1: { ko: '측정에 기반하여 검증된 데이터', en: 'Verified data based on measurement' },
        2: { ko: '부분적 가정 기반 검증 또는 측정 기반 비검증', en: 'Verified data with assumptions / Unverified measurement' },
        3: { ko: '적격한 추정에 부분적 기반한 비검증 데이터', en: 'Unverified data from qualified estimates' },
        4: { ko: '산업 전문가 등에 의한 적격한 추정', en: 'Qualified estimate by industry experts' },
        5: { ko: '부적격한 추정', en: 'Unqualified estimate' },
    },
    completeness: {
        1: { ko: '전 공정/시장 대표 (적절한 기간)', en: 'Representative of all sites (long period)' },
        2: { ko: '시장/공정의 50% 이상 대표', en: 'Representative of >50% of sites' },
        3: { ko: '일부 대표 혹은 50% 이상(짧은 기간)', en: 'Representative of some sites / >50% (short period)' },
        4: { ko: '한 곳 혹은 일부 대표(짧은 기간)', en: 'Representative of one site (short period)' },
        5: { ko: '대표성 확인 불가 혹은 짧은 수집 기간', en: 'Unknown representativeness / Very short period' },
    },
    temporalRep: {
        1: { ko: '데이터 차이 3년 이내', en: 'Time difference < 3 years' },
        2: { ko: '데이터 차이 6년 이내', en: 'Time difference < 6 years' },
        3: { ko: '데이터 차이 10년 이내', en: 'Time difference < 10 years' },
        4: { ko: '데이터 차이 15년 이내', en: 'Time difference < 15 years' },
        5: { ko: '데이터 차이 15년 초과 또는 미상', en: 'Time difference > 15 years / Unknown' },
    },
    geographicalRep: {
        1: { ko: '연구 대상 지역에서 수집된 데이터', en: 'Data from same region' },
        2: { ko: '대상 지역을 포함한 더 넓은 지역 평균', en: 'Average from larger area including region' },
        3: { ko: '생산 조건이 유사한 지역의 데이터', en: 'Data from region with similar conditions' },
        4: { ko: '생산 조건이 약간 유사한 지역의 데이터', en: 'Data from region with slightly similar conditions' },
        5: { ko: '지리 불분명 또는 다른 지역', en: 'Unknown or different geography' },
    },
    technologicalRep: {
        1: { ko: '동일 기업/공정/물질 데이터', en: 'Same company/process/technology' },
        2: { ko: '동일 공정/물질이나 다른 회사의 데이터', en: 'Same process/material but different company' },
        3: { ko: '동일 공정/물질이나 다른 기술의 데이터', en: 'Same process/material but different technology' },
        4: { ko: '관련된 공정이나 물질에 대한 데이터', en: 'Data on related processes or materials' },
        5: { ko: '실험실 규모 또는 다른 기술 데이터', en: 'Lab scale or different technology' },
    },
};

// Ecoinvent Pedigree Matrix Uncertainty Factors from user images
export const UNCERTAINTY_FACTORS: Record<keyof DataQualityIndicator, Record<number, number>> = {
    reliability: { 1: 1.0, 2: 1.05, 3: 1.1, 4: 1.2, 5: 1.5 },
    completeness: { 1: 1.0, 2: 1.02, 3: 1.05, 4: 1.1, 5: 1.2 },
    temporalRep: { 1: 1.0, 2: 1.03, 3: 1.1, 4: 1.2, 5: 1.5 },
    geographicalRep: { 1: 1.0, 2: 1.01, 3: 1.02, 4: 1.05, 5: 1.1 }, // 4 interpolated as half-way between 3 and 5
    technologicalRep: { 1: 1.0, 2: 1.1, 3: 1.2, 4: 1.5, 5: 2.0 }, // 2 interpolated as half-way between 1 and 3
};

export const getDQIColor = (score: number) => {
    if (score <= 1.5) return 'text-emerald-600 dark:text-emerald-400';
    if (score <= 2.5) return 'text-blue-600 dark:text-blue-400';
    if (score <= 3.5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
};

export const getDQIBgColor = (score: number) => {
    if (score <= 1.5) return 'bg-emerald-100 dark:bg-emerald-900/30';
    if (score <= 2.5) return 'bg-blue-100 dark:bg-blue-900/30';
    if (score <= 3.5) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
};

export const getDQIRatingLabel = (rating: string, language: 'ko' | 'en') => {
    if (language === 'ko') {
        switch (rating) {
            case 'high': return '높음';
            case 'medium': return '중간';
            case 'low': return '낮음';
            case 'estimated': return '추정';
            default: return rating;
        }
    }
    return rating.charAt(0).toUpperCase() + rating.slice(1);
};

/**
 * Calculates a summary uncertainty factor based on DQI grades.
 * This is a simplified geometric mean or product of factors depending on the use case.
 */
export const calculateTotalUncertainty = (dqi: DataQualityIndicator): number => {
    const r = UNCERTAINTY_FACTORS.reliability[dqi.reliability] || 1;
    const c = UNCERTAINTY_FACTORS.completeness[dqi.completeness] || 1;
    const t = UNCERTAINTY_FACTORS.temporalRep[dqi.temporalRep] || 1;
    const g = UNCERTAINTY_FACTORS.geographicalRep[dqi.geographicalRep] || 1;
    const te = UNCERTAINTY_FACTORS.technologicalRep[dqi.technologicalRep] || 1;

    // Geometric approach or simple product
    return Math.sqrt(r * r + c * c + t * t + g * g + te * te - 4); // Root Sum Square of errors
};

export const suggestDQIFromMetadata = (
    reportingYear: number,
    factorYear?: number,
    localRegion?: string,
    factorRegion?: string,
    isOfficialDB?: boolean,
    isVerified?: boolean
): Partial<DataQualityIndicator> => {
    const suggested: Partial<DataQualityIndicator> = {};

    // 1. Reliability
    if (isVerified) {
        suggested.reliability = 1;
    } else if (isOfficialDB) {
        suggested.reliability = 2; // Verified LCI but maybe with some assumptions
    } else {
        suggested.reliability = 4; // Estimate
    }

    // 2. Temporal
    if (factorYear) {
        const diff = Math.abs(reportingYear - factorYear);
        if (diff <= 3) suggested.temporalRep = 1;
        else if (diff <= 6) suggested.temporalRep = 2;
        else if (diff <= 10) suggested.temporalRep = 3;
        else if (diff <= 15) suggested.temporalRep = 4;
        else suggested.temporalRep = 5;
    } else {
        suggested.temporalRep = 5;
    }

    // 3. Geographical
    if (localRegion && factorRegion) {
        const l = localRegion.toUpperCase();
        const f = factorRegion.toUpperCase();
        if (l === f) suggested.geographicalRep = 1;
        else if (f === 'GLO' || f === 'WORLD' || f === 'ASIA') suggested.geographicalRep = 2; // Larger area average
        else suggested.geographicalRep = 5; // Different
    } else {
        suggested.geographicalRep = 4; // Global average default
    }

    // 4. Completeness
    suggested.completeness = isOfficialDB ? 2 : 4; // Ecoinvent usually covers >50%, manual estimates usually don't.

    // 5. Technological
    suggested.technologicalRep = 3; // Default to related technology unless AI says otherwise.

    return suggested;
};
