// Demo app translations - Korean & English

export type TranslationKey = keyof typeof translations.ko;

export const translations = {
    ko: {
        // Header
        appTitle: 'GHG Scope 3 계산기',
        appSubtitle: 'Category 1: 구매한 제품 및 서비스',
        demo: '데모',
        language: '언어',
        theme: '테마',

        // Calculator
        calculationMethod: '계산 방법',
        supplierMethod: '공급업체 제공 데이터',
        activityMethod: '활동 기반',
        spendMethod: '지출 기반',
        hybridMethod: '하이브리드',

        itemName: '품목명',
        quantity: '수량',
        unit: '단위',
        emissionFactor: '배출계수',
        totalEmissions: '총 배출량',

        addItem: '항목 추가',
        removeItem: '삭제',
        calculate: '계산하기',
        reset: '초기화',
        copyResult: '결과 복사',

        // Categories
        selectCategory: '카테고리 선택',
        rawMaterials: '원자재',
        metals: '금속',
        plastics: '플라스틱',
        chemicals: '화학제품',
        construction: '건설자재',
        packaging: '포장재',
        electronics: '전자부품',
        officeSupplies: '사무용품',
        ppeSafety: 'PPE/안전장비',
        services: '서비스',
        foodAgricultural: '식품/농산물',
        textiles: '섬유/가죽',
        custom: '직접 입력',

        // DQI
        dataQuality: '데이터 품질',
        dqiScore: 'DQI 점수',
        technologicalRep: '기술 대표성',
        temporalRep: '시간 대표성',
        geographicalRep: '지역 대표성',
        completeness: '완전성',
        reliability: '신뢰성',
        high: '높음',
        medium: '중간',
        low: '낮음',
        estimated: '추정',

        // Results
        resultSummary: '결과 요약',
        kgCO2e: 'kg CO₂e',
        tCO2e: 't CO₂e',

        // CTA
        ctaTitle: '전체 버전이 필요하신가요?',
        ctaDescription: 'Scope 1, 2, 3 전체 + 보고서 생성 + AI 분석',
        ctaButton: '전체 버전 문의하기',

        // Messages
        noData: '데이터가 없습니다',
        enterQuantity: '수량을 입력하세요',
        selectFactor: '배출계수를 선택하세요',

        // Units
        kg: 'kg',
        tonnes: 'tonnes',
        pcs: '개',
        L: 'L',
        m2: 'm²',
        m3: 'm³',
        USD: 'USD',
        KRW: 'KRW',
        kWh: 'kWh',
        ream: '연',
        box: '박스',
        m: 'm',
    },
    en: {
        // Header
        appTitle: 'GHG Scope 3 Calculator',
        appSubtitle: 'Category 1: Purchased Goods & Services',
        demo: 'Demo',
        language: 'Language',
        theme: 'Theme',

        // Calculator
        calculationMethod: 'Calculation Method',
        supplierMethod: 'Supplier-Provided Data',
        activityMethod: 'Activity-Based',
        spendMethod: 'Spend-Based',
        hybridMethod: 'Hybrid',

        itemName: 'Item Name',
        quantity: 'Quantity',
        unit: 'Unit',
        emissionFactor: 'Emission Factor',
        totalEmissions: 'Total Emissions',

        addItem: 'Add Item',
        removeItem: 'Remove',
        calculate: 'Calculate',
        reset: 'Reset',
        copyResult: 'Copy Result',

        // Categories
        selectCategory: 'Select Category',
        rawMaterials: 'Raw Materials',
        metals: 'Metals',
        plastics: 'Plastics',
        chemicals: 'Chemicals',
        construction: 'Construction',
        packaging: 'Packaging',
        electronics: 'Electronics',
        officeSupplies: 'Office Supplies',
        ppeSafety: 'PPE/Safety',
        services: 'Services',
        foodAgricultural: 'Food/Agricultural',
        textiles: 'Textiles/Leather',
        custom: 'Custom',

        // DQI
        dataQuality: 'Data Quality',
        dqiScore: 'DQI Score',
        technologicalRep: 'Technological Rep.',
        temporalRep: 'Temporal Rep.',
        geographicalRep: 'Geographical Rep.',
        completeness: 'Completeness',
        reliability: 'Reliability',
        high: 'High',
        medium: 'Medium',
        low: 'Low',
        estimated: 'Estimated',

        // Results
        resultSummary: 'Result Summary',
        kgCO2e: 'kg CO₂e',
        tCO2e: 't CO₂e',

        // CTA
        ctaTitle: 'Need the full version?',
        ctaDescription: 'Full Scope 1, 2, 3 + Report Generation + AI Analysis',
        ctaButton: 'Contact for Full Version',

        // Messages
        noData: 'No data',
        enterQuantity: 'Enter quantity',
        selectFactor: 'Select emission factor',

        // Units
        kg: 'kg',
        tonnes: 'tonnes',
        pcs: 'pcs',
        L: 'L',
        m2: 'm²',
        m3: 'm³',
        USD: 'USD',
        KRW: 'KRW',
        kWh: 'kWh',
        ream: 'ream',
        box: 'box',
        m: 'm',
    }
};

export type Language = 'ko' | 'en';

export const getTranslation = (lang: Language, key: TranslationKey): string => {
    return translations[lang][key] || key;
};
