// Script to generate a sample Excel file for import testing
// Run with: node scripts/generateSampleImport.js

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// ⚠️ IMPORTANT: Fuel names and units MUST EXACTLY match the system constants!
// - Scope 1 Stationary: See src/constants/scope1.ts -> STATIONARY_FUELS
// - Scope 1 Mobile: See src/constants/scope1.ts -> MOBILE_FUELS
// - Scope 2: See src/constants/scope2.ts -> SCOPE2_ENERGY_SOURCES

const SAMPLE_DATA = [
    // Header row
    ['시설명', '카테고리', '설명', '연료/물질 유형', '단위', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],

    // Scope 1 - Stationary Combustion
    // Available: Natural Gas, LPG, LNG, Heating Oil / Diesel, etc.
    // Units: cubic meters, kg, liters, etc.
    ['Corporate Level', 'Scope 1 - 고정 연소', '난방용 보일러', 'Natural Gas', 'cubic meters', 500, 480, 420, 300, 150, 50, 30, 30, 80, 200, 380, 520],
    ['서울본사', 'Scope 1 - 고정 연소', '비상발전기', 'Heating Oil / Diesel', 'liters', 0, 0, 50, 0, 0, 0, 100, 0, 0, 0, 0, 0],

    // Scope 1 - Mobile Combustion
    // Available: Gasoline (Petrol), Diesel, LPG (for vehicles), etc.
    // Units: liters, gallons, kg
    ['Corporate Level', 'Scope 1 - 이동 연소', '업무용 차량 1', 'Gasoline (Petrol)', 'liters', 120, 130, 125, 140, 150, 160, 180, 175, 155, 145, 135, 125],
    ['서울본사', 'Scope 1 - 이동 연소', '업무용 차량 2', 'Diesel', 'liters', 200, 210, 190, 220, 230, 250, 280, 270, 240, 220, 200, 195],
    ['구미공장', 'Scope 1 - 이동 연소', '지게차', 'Diesel', 'liters', 100, 110, 105, 115, 120, 130, 140, 135, 125, 115, 105, 100],

    // Scope 2 - Purchased Energy
    // Available: Grid Electricity, Purchased Steam, Purchased Heating, Purchased Cooling
    // Units for Grid Electricity: kWh, MWh
    // Units for Purchased Heating: MWh, MMBtu
    ['Corporate Level', 'Scope 2 - 구매 에너지', '사무실 전기', 'Grid Electricity', 'kWh', 15000, 14500, 15200, 16000, 18000, 22000, 28000, 27000, 21000, 17000, 15500, 15000],
    ['서울본사', 'Scope 2 - 구매 에너지', '사무실 전기', 'Grid Electricity', 'kWh', 8000, 7800, 8100, 8500, 9000, 11000, 14000, 13500, 10500, 8500, 8000, 7800],
    ['구미공장', 'Scope 2 - 구매 에너지', '공장 전기', 'Grid Electricity', 'kWh', 50000, 48000, 52000, 55000, 58000, 65000, 70000, 68000, 62000, 56000, 51000, 49000],
    ['Corporate Level', 'Scope 2 - 구매 에너지', '지역난방', 'Purchased Heating', 'MWh', 80, 75, 60, 30, 0, 0, 0, 0, 0, 20, 50, 70],
];

function generateSampleFile() {
    const workbook = XLSX.utils.book_new();

    // Create the data sheet
    const worksheet = XLSX.utils.aoa_to_sheet(SAMPLE_DATA);

    // Set column widths
    worksheet['!cols'] = [
        { wch: 18 }, // 시설명
        { wch: 40 }, // 카테고리
        { wch: 25 }, // 설명
        { wch: 25 }, // 연료/물질 유형
        { wch: 15 }, // 단위
        ...Array(12).fill({ wch: 8 }), // 월별 데이터
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, '데이터 입력');

    // Add instructions sheet with fuel type reference
    const instructionsData = [
        ['📋 샘플 데이터 설명'],
        [],
        ['이 파일은 GHG Calculator 엑셀 가져오기 테스트용 샘플 파일입니다.'],
        [],
        ['⚠️ 중요: 연료/물질 유형과 단위는 아래 목록에서 정확히 일치해야 합니다!'],
        [],
        ['═══════════════════════════════════════════════════════'],
        ['Scope 1 - 고정 연소 (Stationary Combustion)'],
        ['═══════════════════════════════════════════════════════'],
        ['연료명', '단위'],
        ['Natural Gas', 'cubic meters, therms'],
        ['LPG', 'kg, liters'],
        ['LNG', 'kg, cubic meters'],
        ['Heating Oil / Diesel', 'liters, gallons'],
        ['Propane', 'liters, gallons'],
        ['Bituminous Coal', 'kg, tonnes'],
        [],
        ['═══════════════════════════════════════════════════════'],
        ['Scope 1 - 이동 연소 (Mobile Combustion)'],
        ['═══════════════════════════════════════════════════════'],
        ['연료명', '단위'],
        ['Gasoline (Petrol)', 'liters, gallons'],
        ['Diesel', 'liters, gallons'],
        ['LPG (for vehicles)', 'liters, kg'],
        ['CNG (for vehicles)', 'kg'],
        [],
        ['═══════════════════════════════════════════════════════'],
        ['Scope 2 - 구매 에너지 (Purchased Energy)'],
        ['═══════════════════════════════════════════════════════'],
        ['연료명', '단위'],
        ['Grid Electricity', 'kWh, MWh'],
        ['Purchased Steam', 'tonnes, MMBtu'],
        ['Purchased Heating', 'MWh, MMBtu'],
        ['Purchased Cooling', 'MWh, ton-hour'],
    ];

    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
    instructionsSheet['!cols'] = [{ wch: 30 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, '연료 및 단위 목록');

    // Ensure directory exists
    const samplesDir = path.join(__dirname, '..', 'public', 'samples');
    if (!fs.existsSync(samplesDir)) {
        fs.mkdirSync(samplesDir, { recursive: true });
    }

    // Save the file
    const outputPath = path.join(samplesDir, 'GHG_샘플_데이터.xlsx');
    XLSX.writeFile(workbook, outputPath);

    console.log(`✅ 샘플 파일 생성 완료: ${outputPath}`);
}

generateSampleFile();
