// Script to generate a sample Excel file for import testing
// Run with: npx ts-node scripts/generateSampleImport.ts

import * as XLSX from 'xlsx';
import * as path from 'path';

const SAMPLE_DATA = [
    // Header row
    ['시설명', '카테고리', '설명', '연료/물질 유형', '단위', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],

    // Scope 1 - Stationary Combustion
    ['본사', 'Scope 1 - 고정 연소', '난방용 보일러', '천연가스', 'm³', 500, 480, 420, 300, 150, 50, 30, 30, 80, 200, 380, 520],
    ['본사', 'Scope 1 - 고정 연소', '비상발전기', '경유', 'L', 0, 0, 50, 0, 0, 0, 100, 0, 0, 0, 0, 0],

    // Scope 1 - Mobile Combustion
    ['본사', 'Scope 1 - 이동 연소', '업무용 차량 1', '휘발유', 'L', 120, 130, 125, 140, 150, 160, 180, 175, 155, 145, 135, 125],
    ['본사', 'Scope 1 - 이동 연소', '업무용 차량 2', '경유', 'L', 200, 210, 190, 220, 230, 250, 280, 270, 240, 220, 200, 195],

    // Scope 2 - Purchased Energy
    ['본사', 'Scope 2 - 구매 에너지', '사무실 전기', '전기 (한국 평균)', 'kWh', 15000, 14500, 15200, 16000, 18000, 22000, 28000, 27000, 21000, 17000, 15500, 15000],
    ['본사', 'Scope 2 - 구매 에너지', '지역난방', '지역난방', 'MJ', 8000, 7500, 6000, 3000, 0, 0, 0, 0, 0, 2000, 5000, 7000],

    // Scope 3 - Category 1
    ['본사', 'Scope 3 - Cat 1: 구매한 상품 및 서비스', '사무용품', '사무용품', 'KRW (백만원)', 5, 4, 6, 5, 5, 4, 3, 4, 5, 6, 5, 8],

    // Scope 3 - Category 6
    ['본사', 'Scope 3 - Cat 6: 출장', '국내 출장 (항공)', '국내항공', 'km', 0, 500, 0, 800, 0, 1200, 0, 600, 0, 400, 0, 0],
    ['본사', 'Scope 3 - Cat 6: 출장', '해외 출장 (항공)', '장거리 항공', 'km', 0, 0, 12000, 0, 0, 8000, 0, 0, 15000, 0, 0, 0],

    // Scope 3 - Category 7
    ['본사', 'Scope 3 - Cat 7: 직원 통근', '직원 통근', '승용차 (휘발유)', 'km', 5000, 5000, 5200, 5100, 5000, 4800, 3500, 3500, 5000, 5200, 5100, 5000],
];

function generateSampleFile() {
    const workbook = XLSX.utils.book_new();

    // Create the data sheet
    const worksheet = XLSX.utils.aoa_to_sheet(SAMPLE_DATA);

    // Set column widths
    worksheet['!cols'] = [
        { wch: 15 }, // 시설명
        { wch: 40 }, // 카테고리
        { wch: 25 }, // 설명
        { wch: 20 }, // 연료/물질 유형
        { wch: 15 }, // 단위
        ...Array(12).fill({ wch: 8 }), // 월별 데이터
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, '데이터 입력');

    // Add instructions sheet
    const instructionsData = [
        ['📋 샘플 데이터 설명'],
        [],
        ['이 파일은 GHG Calculator 엑셀 가져오기 테스트용 샘플 파일입니다.'],
        [],
        ['포함된 데이터:'],
        ['- Scope 1 - 고정 연소: 천연가스 보일러, 비상발전기'],
        ['- Scope 1 - 이동 연소: 업무용 차량 (휘발유, 경유)'],
        ['- Scope 2 - 구매 에너지: 전기, 지역난방'],
        ['- Scope 3 - Cat 1: 사무용품 구매'],
        ['- Scope 3 - Cat 6: 국내/해외 출장'],
        ['- Scope 3 - Cat 7: 직원 통근'],
        [],
        ['모든 데이터는 "본사" 시설에 할당되어 있습니다.'],
        ['시스템에 "본사" 시설이 등록되어 있어야 합니다.'],
    ];

    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
    instructionsSheet['!cols'] = [{ wch: 60 }];
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, '설명');

    // Save the file
    const outputPath = path.join(__dirname, '..', 'public', 'samples', 'GHG_샘플_데이터.xlsx');
    XLSX.writeFile(workbook, outputPath);

    console.log(`✅ 샘플 파일 생성 완료: ${outputPath}`);
}

generateSampleFile();
