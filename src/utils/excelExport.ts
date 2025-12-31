import * as XLSX from 'xlsx';
import { EmissionSource, EmissionCategory, Facility, BoundaryApproach } from '../types';

export interface ExcelExportData {
    companyName: string;
    reportingYear: string;
    boundaryApproach: BoundaryApproach;
    facilities: Facility[];
    sources: { [key in EmissionCategory]: EmissionSource[] };
    results: {
        scope1Total: number;
        scope2LocationTotal: number;
        scope2MarketTotal: number;
        scope3Total: number;
        totalEmissionsLocation: number;
        totalEmissionsMarket: number;
        facilityBreakdown: { [facilityId: string]: { scope1: number, scope2Location: number, scope2Market: number, scope3: number } };
        scope3CategoryBreakdown: { [category: string]: number };
        sourceFormulas?: { [sourceId: string]: string };
    };
}

// Category display names for both languages
const CATEGORY_DISPLAY_NAMES: { [key: string]: { en: string; ko: string } } = {
    [EmissionCategory.StationaryCombustion]: { en: 'Stationary Combustion', ko: '고정 연소' },
    [EmissionCategory.MobileCombustion]: { en: 'Mobile Combustion', ko: '이동 연소' },
    [EmissionCategory.ProcessEmissions]: { en: 'Process Emissions', ko: '공정 배출' },
    [EmissionCategory.FugitiveEmissions]: { en: 'Fugitive Emissions', ko: '탈루 배출' },
    [EmissionCategory.Waste]: { en: 'Waste (On-site)', ko: '폐기물 (사업장 내)' },
    [EmissionCategory.PurchasedEnergy]: { en: 'Purchased Energy', ko: '구매 에너지' },
    [EmissionCategory.PurchasedGoodsAndServices]: { en: 'Cat 1: Purchased Goods and Services', ko: 'Cat 1: 구매한 상품 및 서비스' },
    [EmissionCategory.CapitalGoods]: { en: 'Cat 2: Capital Goods', ko: 'Cat 2: 자본재' },
    [EmissionCategory.FuelAndEnergyRelatedActivities]: { en: 'Cat 3: Fuel- and Energy-Related Activities', ko: 'Cat 3: 연료 및 에너지 관련 활동' },
    [EmissionCategory.UpstreamTransportationAndDistribution]: { en: 'Cat 4: Upstream Transportation', ko: 'Cat 4: 업스트림 운송 및 유통' },
    [EmissionCategory.WasteGeneratedInOperations]: { en: 'Cat 5: Waste Generated in Operations', ko: 'Cat 5: 운영 중 발생한 폐기물' },
    [EmissionCategory.BusinessTravel]: { en: 'Cat 6: Business Travel', ko: 'Cat 6: 출장' },
    [EmissionCategory.EmployeeCommuting]: { en: 'Cat 7: Employee Commuting', ko: 'Cat 7: 직원 통근' },
    [EmissionCategory.UpstreamLeasedAssets]: { en: 'Cat 8: Upstream Leased Assets', ko: 'Cat 8: 업스트림 임대자산' },
    [EmissionCategory.DownstreamTransportationAndDistribution]: { en: 'Cat 9: Downstream Transportation', ko: 'Cat 9: 다운스트림 운송 및 유통' },
    [EmissionCategory.ProcessingOfSoldProducts]: { en: 'Cat 10: Processing of Sold Products', ko: 'Cat 10: 판매된 제품의 가공' },
    [EmissionCategory.UseOfSoldProducts]: { en: 'Cat 11: Use of Sold Products', ko: 'Cat 11: 판매된 제품의 사용' },
    [EmissionCategory.EndOfLifeTreatmentOfSoldProducts]: { en: 'Cat 12: End-of-Life Treatment', ko: 'Cat 12: 판매된 제품의 폐기' },
    [EmissionCategory.DownstreamLeasedAssets]: { en: 'Cat 13: Downstream Leased Assets', ko: 'Cat 13: 다운스트림 임대자산' },
    [EmissionCategory.Franchises]: { en: 'Cat 14: Franchises', ko: 'Cat 14: 프랜차이즈' },
    [EmissionCategory.Investments]: { en: 'Cat 15: Investments', ko: 'Cat 15: 투자' },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_KO = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

function getBoundaryApproachDisplay(approach: BoundaryApproach, isKorean: boolean): string {
    const map = {
        operational: { en: 'Operational Control', ko: '운영 통제권' },
        financial: { en: 'Financial Control', ko: '재무 통제권' },
        equity: { en: 'Equity Share', ko: '지분율' },
    };
    return isKorean ? map[approach].ko : map[approach].en;
}

function formatNumber(num: number, decimals: number = 2): number {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function exportToExcel(data: ExcelExportData, language: 'en' | 'ko' = 'ko'): void {
    const isKorean = language === 'ko';
    const workbook = XLSX.utils.book_new();
    const months = isKorean ? MONTHS_KO : MONTHS;

    // ========================================
    // Sheet 1: Summary (요약)
    // ========================================
    const summaryData = [
        [isKorean ? '📊 GHG 배출량 보고서 요약' : '📊 GHG Emissions Report Summary'],
        [],
        [isKorean ? '항목' : 'Item', isKorean ? '값' : 'Value'],
        [isKorean ? '회사명' : 'Company Name', data.companyName],
        [isKorean ? '보고 연도' : 'Reporting Year', data.reportingYear],
        [isKorean ? '조직 경계 접근 방식' : 'Organizational Boundary', getBoundaryApproachDisplay(data.boundaryApproach, isKorean)],
        [isKorean ? '생성일' : 'Generated Date', new Date().toLocaleDateString(isKorean ? 'ko-KR' : 'en-US')],
        [],
        [isKorean ? '📈 배출량 요약 (tonnes CO₂e)' : '📈 Emissions Summary (tonnes CO₂e)'],
        [],
        [isKorean ? '스코프' : 'Scope', isKorean ? '배출량' : 'Emissions', isKorean ? '비율' : 'Percentage'],
        ['Scope 1', formatNumber(data.results.scope1Total / 1000, 2), formatNumber(data.results.scope1Total / data.results.totalEmissionsMarket * 100, 1) + '%'],
        [isKorean ? 'Scope 2 (지역 기반)' : 'Scope 2 (Location-based)', formatNumber(data.results.scope2LocationTotal / 1000, 2), '-'],
        [isKorean ? 'Scope 2 (시장 기반)' : 'Scope 2 (Market-based)', formatNumber(data.results.scope2MarketTotal / 1000, 2), formatNumber(data.results.scope2MarketTotal / data.results.totalEmissionsMarket * 100, 1) + '%'],
        ['Scope 3', formatNumber(data.results.scope3Total / 1000, 2), formatNumber(data.results.scope3Total / data.results.totalEmissionsMarket * 100, 1) + '%'],
        [],
        [isKorean ? '총계 (지역 기반)' : 'Total (Location-based)', formatNumber(data.results.totalEmissionsLocation / 1000, 2), '100%'],
        [isKorean ? '총계 (시장 기반)' : 'Total (Market-based)', formatNumber(data.results.totalEmissionsMarket / 1000, 2), '100%'],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, isKorean ? '요약' : 'Summary');

    // ========================================
    // Sheet 2: Facilities (시설)
    // ========================================
    const facilitiesData = [
        [isKorean ? '🏭 시설 목록' : '🏭 Facility List'],
        [],
        [isKorean ? '시설명' : 'Facility Name', isKorean ? '지분율 (%)' : 'Equity Share (%)', isKorean ? '유형' : 'Type',
            'Scope 1 (kg CO₂e)', 'Scope 2 Location (kg CO₂e)', 'Scope 2 Market (kg CO₂e)', 'Scope 3 (kg CO₂e)'],
    ];

    data.facilities.forEach(facility => {
        const breakdown = data.results.facilityBreakdown[facility.id] || { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: 0 };
        facilitiesData.push([
            facility.name,
            facility.equityShare,
            facility.isCorporate ? (isKorean ? '전사' : 'Corporate') : (isKorean ? '시설' : 'Facility'),
            formatNumber(breakdown.scope1, 2),
            formatNumber(breakdown.scope2Location, 2),
            formatNumber(breakdown.scope2Market, 2),
            formatNumber(breakdown.scope3, 2),
        ] as any);
    });

    const facilitiesSheet = XLSX.utils.aoa_to_sheet(facilitiesData);
    facilitiesSheet['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 22 }, { wch: 22 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(workbook, facilitiesSheet, isKorean ? '시설' : 'Facilities');

    // ========================================
    // Sheet 3: Scope 1 Details
    // ========================================
    const scope1Categories = [
        EmissionCategory.StationaryCombustion,
        EmissionCategory.MobileCombustion,
        EmissionCategory.ProcessEmissions,
        EmissionCategory.FugitiveEmissions,
        EmissionCategory.Waste,
    ];

    const scope1Data: any[][] = [
        [isKorean ? '🔥 Scope 1 상세 데이터' : '🔥 Scope 1 Detailed Data'],
        [],
        [isKorean ? '시설' : 'Facility', isKorean ? '카테고리' : 'Category', isKorean ? '설명' : 'Description',
        isKorean ? '연료/물질' : 'Fuel/Material', isKorean ? '단위' : 'Unit',
        ...months, isKorean ? '연간 합계' : 'Annual Total', isKorean ? '산정 경로' : 'Calculation Path'],
    ];

    scope1Categories.forEach(category => {
        const sources = data.sources[category] || [];
        sources.forEach(source => {
            const facility = data.facilities.find(f => f.id === source.facilityId);
            const total = source.monthlyQuantities.reduce((sum, q) => sum + q, 0);
            scope1Data.push([
                facility?.name || 'Unknown',
                CATEGORY_DISPLAY_NAMES[category]?.[language] || category,
                source.description || '-',
                source.fuelType || '-',
                source.unit || '-',
                ...source.monthlyQuantities.map(q => formatNumber(q, 2)),
                formatNumber(total, 2),
                data.results.sourceFormulas?.[source.id] || '-',
            ]);
        });
    });

    const scope1Sheet = XLSX.utils.aoa_to_sheet(scope1Data);
    scope1Sheet['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 25 }, { wch: 20 }, { wch: 10 },
    ...Array(12).fill({ wch: 10 }), { wch: 12 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(workbook, scope1Sheet, 'Scope 1');

    // ========================================
    // Sheet 4: Scope 2 Details
    // ========================================
    const scope2Data: any[][] = [
        [isKorean ? '⚡ Scope 2 상세 데이터' : '⚡ Scope 2 Detailed Data'],
        [],
        [isKorean ? '시설' : 'Facility', isKorean ? '설명' : 'Description',
        isKorean ? '에너지 유형' : 'Energy Type', isKorean ? '단위' : 'Unit',
        ...months, isKorean ? '연간 합계' : 'Annual Total', isKorean ? '산정 경로' : 'Calculation Path'],
    ];

    const scope2Sources = data.sources[EmissionCategory.PurchasedEnergy] || [];
    scope2Sources.forEach(source => {
        const facility = data.facilities.find(f => f.id === source.facilityId);
        const total = source.monthlyQuantities.reduce((sum, q) => sum + q, 0);
        scope2Data.push([
            facility?.name || 'Unknown',
            source.description || '-',
            source.fuelType || '-',
            source.unit || '-',
            ...source.monthlyQuantities.map(q => formatNumber(q, 2)),
            formatNumber(total, 2),
            data.results.sourceFormulas?.[source.id] || '-',
        ]);
    });

    const scope2Sheet = XLSX.utils.aoa_to_sheet(scope2Data);
    scope2Sheet['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 10 },
    ...Array(12).fill({ wch: 10 }), { wch: 12 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(workbook, scope2Sheet, 'Scope 2');

    // ========================================
    // Sheet 5: Scope 3 Details
    // ========================================
    const scope3Categories = [
        EmissionCategory.PurchasedGoodsAndServices,
        EmissionCategory.CapitalGoods,
        EmissionCategory.FuelAndEnergyRelatedActivities,
        EmissionCategory.UpstreamTransportationAndDistribution,
        EmissionCategory.WasteGeneratedInOperations,
        EmissionCategory.BusinessTravel,
        EmissionCategory.EmployeeCommuting,
        EmissionCategory.UpstreamLeasedAssets,
        EmissionCategory.DownstreamTransportationAndDistribution,
        EmissionCategory.ProcessingOfSoldProducts,
        EmissionCategory.UseOfSoldProducts,
        EmissionCategory.EndOfLifeTreatmentOfSoldProducts,
        EmissionCategory.DownstreamLeasedAssets,
        EmissionCategory.Franchises,
        EmissionCategory.Investments,
    ];

    const scope3Data: any[][] = [
        [isKorean ? '🌍 Scope 3 상세 데이터' : '🌍 Scope 3 Detailed Data'],
        [],
        [isKorean ? '시설' : 'Facility', isKorean ? '카테고리' : 'Category', isKorean ? '설명' : 'Description',
        isKorean ? '항목' : 'Item', isKorean ? '산정 방법' : 'Calculation Method', isKorean ? '단위' : 'Unit',
        ...months, isKorean ? '연간 합계' : 'Annual Total', isKorean ? '산정 경로' : 'Calculation Path'],
    ];

    scope3Categories.forEach(category => {
        const sources = data.sources[category] || [];
        sources.forEach(source => {
            const facility = data.facilities.find(f => f.id === source.facilityId);
            const total = source.monthlyQuantities.reduce((sum, q) => sum + q, 0);
            scope3Data.push([
                facility?.name || 'Unknown',
                CATEGORY_DISPLAY_NAMES[category]?.[language] || category,
                source.description || '-',
                source.fuelType || '-',
                source.calculationMethod || '-',
                source.unit || '-',
                ...source.monthlyQuantities.map(q => formatNumber(q, 2)),
                formatNumber(total, 2),
                data.results.sourceFormulas?.[source.id] || '-',
            ]);
        });
    });

    const scope3Sheet = XLSX.utils.aoa_to_sheet(scope3Data);
    scope3Sheet['!cols'] = [{ wch: 20 }, { wch: 35 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 10 },
    ...Array(12).fill({ wch: 10 }), { wch: 12 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(workbook, scope3Sheet, 'Scope 3');

    // ========================================
    // Sheet 6: Scope 3 Category Breakdown
    // ========================================
    const scope3BreakdownData: any[][] = [
        [isKorean ? '📊 Scope 3 카테고리별 배출량' : '📊 Scope 3 Emissions by Category'],
        [],
        [isKorean ? '카테고리' : 'Category', isKorean ? '배출량 (kg CO₂e)' : 'Emissions (kg CO₂e)',
        isKorean ? '배출량 (tonnes CO₂e)' : 'Emissions (tonnes CO₂e)', isKorean ? '비율' : 'Percentage'],
    ];

    Object.entries(data.results.scope3CategoryBreakdown).forEach(([category, emissions]) => {
        const percentage = data.results.scope3Total > 0
            ? formatNumber(emissions / data.results.scope3Total * 100, 1) + '%'
            : '0%';
        scope3BreakdownData.push([
            CATEGORY_DISPLAY_NAMES[category]?.[language] || category,
            formatNumber(emissions, 2),
            formatNumber(emissions / 1000, 2),
            percentage,
        ]);
    });

    scope3BreakdownData.push([]);
    scope3BreakdownData.push([
        isKorean ? 'Scope 3 총계' : 'Scope 3 Total',
        formatNumber(data.results.scope3Total, 2),
        formatNumber(data.results.scope3Total / 1000, 2),
        '100%',
    ]);

    const scope3BreakdownSheet = XLSX.utils.aoa_to_sheet(scope3BreakdownData);
    scope3BreakdownSheet['!cols'] = [{ wch: 40 }, { wch: 22 }, { wch: 25 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(workbook, scope3BreakdownSheet, isKorean ? 'Scope 3 분석' : 'Scope 3 Analysis');

    // ========================================
    // Generate filename and download
    // ========================================
    const sanitizedCompanyName = data.companyName.replace(/[^a-zA-Z0-9가-힣]/g, '_');
    const filename = `${sanitizedCompanyName}_${data.reportingYear}_GHG_Report.xlsx`;

    XLSX.writeFile(workbook, filename);
}
