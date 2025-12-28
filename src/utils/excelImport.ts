import * as XLSX from 'xlsx';
import { EmissionSource, EmissionCategory, Facility } from '../types';

// Template column headers
const TEMPLATE_HEADERS = {
    en: {
        facility: 'Facility Name',
        category: 'Category',
        description: 'Description',
        fuelType: 'Fuel/Material Type',
        unit: 'Unit',
        jan: 'January',
        feb: 'February',
        mar: 'March',
        apr: 'April',
        may: 'May',
        jun: 'June',
        jul: 'July',
        aug: 'August',
        sep: 'September',
        oct: 'October',
        nov: 'November',
        dec: 'December',
    },
    ko: {
        facility: '시설명',
        category: '카테고리',
        description: '설명',
        fuelType: '연료/물질 유형',
        unit: '단위',
        jan: '1월',
        feb: '2월',
        mar: '3월',
        apr: '4월',
        may: '5월',
        jun: '6월',
        jul: '7월',
        aug: '8월',
        sep: '9월',
        oct: '10월',
        nov: '11월',
        dec: '12월',
    }
};

// Category options for template
const CATEGORY_OPTIONS = {
    en: {
        'Scope 1 - Stationary Combustion': EmissionCategory.StationaryCombustion,
        'Scope 1 - Mobile Combustion': EmissionCategory.MobileCombustion,
        'Scope 1 - Process Emissions': EmissionCategory.ProcessEmissions,
        'Scope 1 - Fugitive Emissions': EmissionCategory.FugitiveEmissions,
        'Scope 1 - Waste (On-site)': EmissionCategory.Waste,
        'Scope 2 - Purchased Energy': EmissionCategory.PurchasedEnergy,
        'Scope 3 - Cat 1: Purchased Goods and Services': EmissionCategory.PurchasedGoodsAndServices,
        'Scope 3 - Cat 2: Capital Goods': EmissionCategory.CapitalGoods,
        'Scope 3 - Cat 4: Upstream Transportation': EmissionCategory.UpstreamTransportationAndDistribution,
        'Scope 3 - Cat 5: Waste in Operations': EmissionCategory.WasteGeneratedInOperations,
        'Scope 3 - Cat 6: Business Travel': EmissionCategory.BusinessTravel,
        'Scope 3 - Cat 7: Employee Commuting': EmissionCategory.EmployeeCommuting,
    },
    ko: {
        'Scope 1 - 고정 연소': EmissionCategory.StationaryCombustion,
        'Scope 1 - 이동 연소': EmissionCategory.MobileCombustion,
        'Scope 1 - 공정 배출': EmissionCategory.ProcessEmissions,
        'Scope 1 - 탈루 배출': EmissionCategory.FugitiveEmissions,
        'Scope 1 - 폐기물 (사업장 내)': EmissionCategory.Waste,
        'Scope 2 - 구매 에너지': EmissionCategory.PurchasedEnergy,
        'Scope 3 - Cat 1: 구매한 상품 및 서비스': EmissionCategory.PurchasedGoodsAndServices,
        'Scope 3 - Cat 2: 자본재': EmissionCategory.CapitalGoods,
        'Scope 3 - Cat 4: 업스트림 운송': EmissionCategory.UpstreamTransportationAndDistribution,
        'Scope 3 - Cat 5: 운영 중 폐기물': EmissionCategory.WasteGeneratedInOperations,
        'Scope 3 - Cat 6: 출장': EmissionCategory.BusinessTravel,
        'Scope 3 - Cat 7: 직원 통근': EmissionCategory.EmployeeCommuting,
    }
};

// Reverse mapping from EmissionCategory to display name
const CATEGORY_DISPLAY_NAMES: { [key: string]: { en: string; ko: string } } = {
    [EmissionCategory.StationaryCombustion]: { en: 'Scope 1 - Stationary Combustion', ko: 'Scope 1 - 고정 연소' },
    [EmissionCategory.MobileCombustion]: { en: 'Scope 1 - Mobile Combustion', ko: 'Scope 1 - 이동 연소' },
    [EmissionCategory.ProcessEmissions]: { en: 'Scope 1 - Process Emissions', ko: 'Scope 1 - 공정 배출' },
    [EmissionCategory.FugitiveEmissions]: { en: 'Scope 1 - Fugitive Emissions', ko: 'Scope 1 - 탈루 배출' },
    [EmissionCategory.Waste]: { en: 'Scope 1 - Waste (On-site)', ko: 'Scope 1 - 폐기물 (사업장 내)' },
    [EmissionCategory.PurchasedEnergy]: { en: 'Scope 2 - Purchased Energy', ko: 'Scope 2 - 구매 에너지' },
    [EmissionCategory.PurchasedGoodsAndServices]: { en: 'Scope 3 - Cat 1: Purchased Goods and Services', ko: 'Scope 3 - Cat 1: 구매한 상품 및 서비스' },
    [EmissionCategory.CapitalGoods]: { en: 'Scope 3 - Cat 2: Capital Goods', ko: 'Scope 3 - Cat 2: 자본재' },
    [EmissionCategory.UpstreamTransportationAndDistribution]: { en: 'Scope 3 - Cat 4: Upstream Transportation', ko: 'Scope 3 - Cat 4: 업스트림 운송' },
    [EmissionCategory.WasteGeneratedInOperations]: { en: 'Scope 3 - Cat 5: Waste in Operations', ko: 'Scope 3 - Cat 5: 운영 중 폐기물' },
    [EmissionCategory.BusinessTravel]: { en: 'Scope 3 - Cat 6: Business Travel', ko: 'Scope 3 - Cat 6: 출장' },
    [EmissionCategory.EmployeeCommuting]: { en: 'Scope 3 - Cat 7: Employee Commuting', ko: 'Scope 3 - Cat 7: 직원 통근' },
};

export interface ImportValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    data: {
        sources: EmissionSource[];
        unmatchedFacilities: string[];
    } | null;
}

/**
 * Generate and download an Excel template for data input
 */
export function downloadExcelTemplate(facilities: Facility[], language: 'en' | 'ko' = 'ko'): void {
    const workbook = XLSX.utils.book_new();
    const headers = TEMPLATE_HEADERS[language];
    const categoryOptions = language === 'ko' ? CATEGORY_OPTIONS.ko : CATEGORY_OPTIONS.en;

    // ========================================
    // Sheet 1: Data Entry Template
    // ========================================
    const templateHeaders = [
        headers.facility,
        headers.category,
        headers.description,
        headers.fuelType,
        headers.unit,
        headers.jan,
        headers.feb,
        headers.mar,
        headers.apr,
        headers.may,
        headers.jun,
        headers.jul,
        headers.aug,
        headers.sep,
        headers.oct,
        headers.nov,
        headers.dec,
    ];

    // Create sample data rows
    const sampleData = [
        templateHeaders,
        [
            facilities[0]?.name || 'Main Office',
            language === 'ko' ? 'Scope 2 - 구매 에너지' : 'Scope 2 - Purchased Energy',
            language === 'ko' ? '사무실 전기 사용량' : 'Office Electricity Usage',
            language === 'ko' ? '전기 (한국 평균)' : 'Electricity (Grid Average)',
            'kWh',
            1000, 1200, 1100, 1300, 1500, 1800, 2000, 1900, 1600, 1400, 1200, 1100,
        ],
        [
            facilities[0]?.name || 'Main Office',
            language === 'ko' ? 'Scope 1 - 고정 연소' : 'Scope 1 - Stationary Combustion',
            language === 'ko' ? '난방용 도시가스' : 'Heating Natural Gas',
            language === 'ko' ? '천연가스' : 'Natural Gas',
            'm³',
            500, 450, 400, 300, 100, 50, 30, 30, 50, 200, 350, 480,
        ],
    ];

    const templateSheet = XLSX.utils.aoa_to_sheet(sampleData);

    // Set column widths
    templateSheet['!cols'] = [
        { wch: 20 }, // Facility
        { wch: 40 }, // Category
        { wch: 30 }, // Description
        { wch: 25 }, // Fuel Type
        { wch: 10 }, // Unit
        ...Array(12).fill({ wch: 10 }), // Monthly columns
    ];

    XLSX.utils.book_append_sheet(workbook, templateSheet, language === 'ko' ? '데이터 입력' : 'Data Entry');

    // ========================================
    // Sheet 2: Instructions
    // ========================================
    const instructionsData = language === 'ko' ? [
        ['📋 GHG 데이터 입력 템플릿 사용 안내'],
        [],
        ['1. 시설명', '등록된 시설 중 하나를 정확히 입력하세요. 아래 "시설 목록" 시트를 참조하세요.'],
        ['2. 카테고리', '아래 "카테고리 목록" 시트에서 정확한 카테고리명을 복사하여 사용하세요.'],
        ['3. 설명', '해당 배출원에 대한 간단한 설명을 입력하세요 (예: 본사 전기 사용량).'],
        ['4. 연료/물질 유형', '사용하는 연료 또는 물질의 종류를 입력하세요.'],
        ['5. 단위', '수량의 단위를 입력하세요 (예: kWh, L, m³, kg).'],
        ['6. 월별 수량', '각 월의 소비량을 숫자로 입력하세요. 해당 없는 달은 0으로 입력하세요.'],
        [],
        ['⚠️ 주의사항'],
        ['- 첫 번째 행(헤더)은 수정하지 마세요.'],
        ['- 시설명과 카테고리는 정확히 일치해야 합니다.'],
        ['- 월별 수량은 반드시 숫자로 입력하세요.'],
        ['- 샘플 데이터(2-3행)를 삭제하고 실제 데이터를 입력하세요.'],
    ] : [
        ['📋 GHG Data Entry Template Instructions'],
        [],
        ['1. Facility Name', 'Enter the exact name of a registered facility. See the "Facilities" sheet.'],
        ['2. Category', 'Copy the exact category name from the "Categories" sheet.'],
        ['3. Description', 'Enter a brief description of the emission source (e.g., Office Electricity).'],
        ['4. Fuel/Material Type', 'Enter the type of fuel or material used.'],
        ['5. Unit', 'Enter the unit of measurement (e.g., kWh, L, m³, kg).'],
        ['6. Monthly Quantities', 'Enter the consumption for each month as a number. Enter 0 if not applicable.'],
        [],
        ['⚠️ Important Notes'],
        ['- Do not modify the first row (header).'],
        ['- Facility names and categories must match exactly.'],
        ['- Monthly quantities must be numeric values.'],
        ['- Delete sample data (rows 2-3) and enter your actual data.'],
    ];

    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
    instructionsSheet['!cols'] = [{ wch: 25 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, language === 'ko' ? '사용 안내' : 'Instructions');

    // ========================================
    // Sheet 3: Facilities List
    // ========================================
    const facilitiesData = [
        [language === 'ko' ? '시설명' : 'Facility Name', language === 'ko' ? '지분율 (%)' : 'Equity Share (%)'],
        ...facilities.map(f => [f.name, f.equityShare])
    ];

    const facilitiesSheet = XLSX.utils.aoa_to_sheet(facilitiesData);
    facilitiesSheet['!cols'] = [{ wch: 30 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, facilitiesSheet, language === 'ko' ? '시설 목록' : 'Facilities');

    // ========================================
    // Sheet 4: Categories List
    // ========================================
    const categoriesData = [
        [language === 'ko' ? '카테고리 (정확히 복사하세요)' : 'Category (Copy exactly)'],
        ...Object.keys(categoryOptions).map(cat => [cat])
    ];

    const categoriesSheet = XLSX.utils.aoa_to_sheet(categoriesData);
    categoriesSheet['!cols'] = [{ wch: 50 }];
    XLSX.utils.book_append_sheet(workbook, categoriesSheet, language === 'ko' ? '카테고리 목록' : 'Categories');

    // Download
    XLSX.writeFile(workbook, language === 'ko' ? 'GHG_데이터_입력_템플릿.xlsx' : 'GHG_Data_Entry_Template.xlsx');
}

/**
 * Parse and validate an uploaded Excel file
 */
export function parseExcelFile(
    file: File,
    facilities: Facility[],
    language: 'en' | 'ko' = 'ko'
): Promise<ImportValidationResult> {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                // Get the first sheet (Data Entry)
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });

                if (jsonData.length < 2) {
                    resolve({
                        isValid: false,
                        errors: [language === 'ko' ? '데이터가 없습니다. 헤더 이후에 데이터 행이 필요합니다.' : 'No data found. Data rows are required after the header.'],
                        warnings: [],
                        data: null,
                    });
                    return;
                }

                const headers = jsonData[0] as string[];
                const dataRows = jsonData.slice(1);

                const errors: string[] = [];
                const warnings: string[] = [];
                const sources: EmissionSource[] = [];
                const unmatchedFacilities: string[] = [];
                const categoryOptions = language === 'ko' ? CATEGORY_OPTIONS.ko : CATEGORY_OPTIONS.en;

                // Create facility name to ID map
                const facilityMap = new Map<string, string>();
                facilities.forEach(f => {
                    facilityMap.set(f.name.toLowerCase().trim(), f.id);
                });

                // Process each data row
                dataRows.forEach((row: any[], rowIndex) => {
                    // Skip empty rows
                    if (!row || row.length === 0 || !row[0]) {
                        return;
                    }

                    const rowNum = rowIndex + 2; // Excel row number (1-indexed, after header)

                    const facilityName = String(row[0] || '').trim();
                    const categoryName = String(row[1] || '').trim();
                    const description = String(row[2] || '').trim();
                    const fuelType = String(row[3] || '').trim();
                    const unit = String(row[4] || '').trim();
                    const monthlyQuantities: number[] = [];

                    // Parse monthly quantities (columns 5-16)
                    for (let i = 5; i <= 16; i++) {
                        const value = row[i];
                        if (value === undefined || value === null || value === '') {
                            monthlyQuantities.push(0);
                        } else if (typeof value === 'number') {
                            monthlyQuantities.push(value);
                        } else {
                            const parsed = parseFloat(String(value).replace(/,/g, ''));
                            if (isNaN(parsed)) {
                                errors.push(language === 'ko'
                                    ? `행 ${rowNum}: ${i - 4}월 값이 숫자가 아닙니다 - "${value}"`
                                    : `Row ${rowNum}: Month ${i - 4} value is not a number - "${value}"`
                                );
                                monthlyQuantities.push(0);
                            } else {
                                monthlyQuantities.push(parsed);
                            }
                        }
                    }

                    // Validate facility
                    const facilityId = facilityMap.get(facilityName.toLowerCase());
                    if (!facilityId) {
                        if (!unmatchedFacilities.includes(facilityName)) {
                            unmatchedFacilities.push(facilityName);
                        }
                        warnings.push(language === 'ko'
                            ? `행 ${rowNum}: 시설 "${facilityName}"을(를) 찾을 수 없습니다. 기본 시설로 할당됩니다.`
                            : `Row ${rowNum}: Facility "${facilityName}" not found. Will be assigned to default facility.`
                        );
                    }

                    // Validate category
                    const category = categoryOptions[categoryName as keyof typeof categoryOptions];
                    if (!category) {
                        errors.push(language === 'ko'
                            ? `행 ${rowNum}: 알 수 없는 카테고리 - "${categoryName}". 카테고리 목록 시트를 참조하세요.`
                            : `Row ${rowNum}: Unknown category - "${categoryName}". See the Categories sheet.`
                        );
                        return; // Skip this row
                    }

                    // Validate required fields
                    if (!fuelType) {
                        warnings.push(language === 'ko'
                            ? `행 ${rowNum}: 연료/물질 유형이 비어 있습니다.`
                            : `Row ${rowNum}: Fuel/Material type is empty.`
                        );
                    }

                    if (!unit) {
                        errors.push(language === 'ko'
                            ? `행 ${rowNum}: 단위가 필요합니다.`
                            : `Row ${rowNum}: Unit is required.`
                        );
                        return;
                    }

                    // Create emission source
                    const source: EmissionSource = {
                        id: `import-${Date.now()}-${rowIndex}`,
                        facilityId: facilityId || facilities[0]?.id || 'default',
                        description: description || fuelType,
                        category,
                        fuelType,
                        monthlyQuantities,
                        unit,
                    };

                    sources.push(source);
                });

                resolve({
                    isValid: errors.length === 0,
                    errors,
                    warnings,
                    data: {
                        sources,
                        unmatchedFacilities,
                    },
                });

            } catch (error) {
                resolve({
                    isValid: false,
                    errors: [language === 'ko'
                        ? `파일 파싱 오류: ${(error as Error).message}`
                        : `File parsing error: ${(error as Error).message}`
                    ],
                    warnings: [],
                    data: null,
                });
            }
        };

        reader.onerror = () => {
            resolve({
                isValid: false,
                errors: [language === 'ko' ? '파일을 읽을 수 없습니다.' : 'Unable to read file.'],
                warnings: [],
                data: null,
            });
        };

        reader.readAsArrayBuffer(file);
    });
}
