import React, { useState } from 'react';
import { CalculationMethod, EmissionCategory } from '../types';
import { useTranslation } from '../context/LanguageContext';
import { IconInfo, IconChevronRight, IconChevronLeft } from './IconComponents';
import { Portal } from './Portal';

interface MethodologyWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (method: CalculationMethod) => void;
  currentMethod?: CalculationMethod;
  category?: EmissionCategory;
}

type QuestionId = 'q1' | 'q1_sub' | 'q2' | 'q2_sub' | 'q3' | 'q3_sub' | 'q_cat3_1' | 'q_cat3_2' | 'q_cat4_1' | 'q_cat4_2' | 'q_cat4_3' | 'q_cat4_4' | 'q_cat4_branch' | 'q_dist_1' | 'q_dist_2' | 'q_cat5_1' | 'q_cat5_2' | 'q_cat5_3' | 'q_cat6_1' | 'q_cat6_2' | 'q_cat6_3' | 'q_cat7_1' | 'q_cat7_2' | 'q_cat7_3';
type ResultId = 'supplier_specific' | 'hybrid' | 'average' | 'spend' | 'fuel' | 'site_specific' | 'waste_type' | 'distance_based' | 'commuting_average';

interface Question {
  id: QuestionId;
  textKo: string;
  textEn: string;
  yesNext: QuestionId | ResultId;
  noNext: QuestionId | ResultId;
}

interface Result {
  id: ResultId;
  method: any;  // Use any to accommodate specific category methods
  titleKo: string;
  titleEn: string;
  descriptionKo: string;
  descriptionEn: string;
  formulaKo: string;
  formulaEn: string;
  dataRequirementsKo: string[];
  dataRequirementsEn: string[];
  accuracyLevel: number; // 1-4 (4 = highest)
  tipKo?: string;
  tipEn?: string;
}

const QUESTIONS: Question[] = [
  {
    id: 'q1',
    textKo: '구매한 상품/서비스에 의한 배출량이 전체 Scope 3 배출량에 주요하게 영향을 미치거나, 공급망 데이터 활용이 Scope 3 산정 목표와 관련됩니까?',
    textEn: 'Does the emissions from purchased goods/services significantly impact your total Scope 3 emissions, or is supply chain data utilization related to your Scope 3 calculation goals?',
    yesNext: 'q2',
    noNext: 'q1_sub',
  },
  {
    id: 'q1_sub',
    textKo: '구매한 상품/서비스의 물리량 정보가 있습니까?',
    textEn: 'Do you have physical quantity information for purchased goods/services?',
    yesNext: 'average',
    noNext: 'spend',
  },
  {
    id: 'q2',
    textKo: '구매한 상품/서비스의 물리량 정보가 있습니까?',
    textEn: 'Do you have physical quantity information for purchased goods/services?',
    yesNext: 'q3',
    noNext: 'q2_sub',
  },
  {
    id: 'q2_sub',
    textKo: '공급자로부터 구매한 상품/서비스에 대하여 할당된 Scope 1, 2 배출량 확보가 가능합니까?',
    textEn: 'Can you obtain allocated Scope 1 & 2 emissions data from suppliers for purchased goods/services?',
    yesNext: 'hybrid',
    noNext: 'spend',
  },
  {
    id: 'q3',
    textKo: 'Tier 1 공급망으로부터 상품/서비스의 Cradle-to-Gate 배출량 확보가 가능합니까?',
    textEn: 'Can you obtain Cradle-to-Gate emissions data from Tier 1 suppliers?',
    yesNext: 'supplier_specific',
    noNext: 'q3_sub',
  },
  {
    id: 'q3_sub',
    textKo: '공급자로부터 구매한 상품/서비스에 대하여 할당된 Scope 1, 2 배출량 확보가 가능합니까?',
    textEn: 'Can you obtain allocated Scope 1 & 2 emissions data from suppliers for purchased goods/services?',
    yesNext: 'hybrid',
    noNext: 'average',
  },
  // Category 3 Questions
  {
    id: 'q_cat3_1',
    textKo: '연료 및 에너지 관련 활동에 의한 배출량이 전체 Scope 3 배출량에 주요하게 영향을 미치거나, 공급망 데이터 활용이 Scope 3 산정 목표와 관련됩니까?',
    textEn: 'Does the emissions from fuel/energy-related activities significantly impact your total Scope 3 emissions, or is supply chain data utilization related to your Scope 3 calculation goals?',
    yesNext: 'q_cat3_2',
    noNext: 'average',
  },
  {
    id: 'q_cat3_2',
    textKo: 'Tier 1 공급망으로부터 사용 연료/전기/스팀의 Cradle-to-Gate 배출량 확보가 가능합니까?',
    textEn: 'Can you obtain Cradle-to-Gate emissions data from Tier 1 suppliers for purchased fuel/electricity/steam?',
    yesNext: 'supplier_specific',
    noNext: 'average',
  },
  // Category 4 & 9 Questions
  {
    id: 'q_cat4_1' as QuestionId,
    textKo: '업스트림 운송 및 유통에 의한 배출량이 전체 Scope 3 배출량에 주요하게 영향을 미치거나, 공급망 데이터 활용이 Scope 3 산정 목표와 관련됩니까?',
    textEn: 'Does the emissions from upstream transport significantly impact your total Scope 3 emissions, or is supply chain data utilization related to your Scope 3 goals?',
    yesNext: 'q_cat4_2' as QuestionId,
    noNext: 'q_cat4_4' as QuestionId,
  },
  {
    id: 'q_cat4_2' as QuestionId,
    textKo: '운송 과정에서 사용된 연료의 종류와 사용량/비용 정보가 있습니까?',
    textEn: 'Do you have information on the type and amount/cost of fuel used during transportation?',
    yesNext: 'q_cat4_3' as QuestionId,
    noNext: 'q_cat4_4' as QuestionId,
  },
  {
    id: 'q_cat4_3' as QuestionId,
    textKo: '운송 수단 하나에 여러 종류의 물품이 운송될 때, 각 물품별 양에 대한 정보가 있습니까?',
    textEn: 'When multiple types of goods are transported in a single vehicle, do you have information on the quantity of each item?',
    yesNext: 'fuel' as ResultId,
    noNext: 'q_cat4_4' as QuestionId,
  },
  {
    id: 'q_cat4_4' as QuestionId,
    textKo: '운송하는 물질의 질량 및 운송 거리에 대한 정보가 있습니까?',
    textEn: 'Do you have information on the mass of the material being transported and the transport distance?',
    yesNext: 'average' as ResultId,
    noNext: 'spend' as ResultId,
  },
  {
    id: 'q_cat4_branch' as QuestionId,
    textKo: '활동의 종류가 무엇입니까?',
    textEn: 'What is the type of activity?',
    yesNext: 'q_cat4_1' as QuestionId, // Yes = Transportation
    noNext: 'q_dist_1' as QuestionId,   // No = Distribution
  },
  {
    id: 'q_dist_1' as QuestionId,
    textKo: '거점(창고/센터)의 에너지 소비량(전기, 가스 등) 데이터를 확보할 수 있습니까?',
    textEn: 'Can you obtain energy consumption data (electricity, gas, etc.) for the site (warehouse/center)?',
    yesNext: 'site_specific' as ResultId,
    noNext: 'q_dist_2' as QuestionId,
  },
  {
    id: 'q_dist_2' as QuestionId,
    textKo: '면적, 보관 물리량(kg, pallet 등) 및 보관 기간 데이터를 확보할 수 있습니까?',
    textEn: 'Can you obtain data on area, stored quantity (kg, pallet, etc.), and storage duration?',
    yesNext: 'average' as ResultId,
    noNext: 'spend' as ResultId,
  },
  // Category 5 Questions (Waste Generated in Operations)
  {
    id: 'q_cat5_1' as QuestionId,
    textKo: '사업장 발생 폐기물이 전체 Scope 3 배출량에 주요하게 영향을 미치거나, 폐기물 처리업체 인게이지먼트가 기업의 목표와 관련되어 있습니까?',
    textEn: 'Does waste generated in operations significantly impact your total Scope 3 emissions, or is engaging with waste treatment providers related to your corporate goals?',
    yesNext: 'q_cat5_2' as QuestionId,
    noNext: 'q_cat5_3' as QuestionId,
  },
  {
    id: 'q_cat5_2' as QuestionId,
    textKo: '폐기물 처리업체로부터 Scope 1, 2 배출량을 제공받을 수 있습니까?',
    textEn: 'Can you obtain Scope 1 & 2 emissions data from waste treatment providers?',
    yesNext: 'supplier_specific' as ResultId,
    noNext: 'q_cat5_3' as QuestionId,
  },
  {
    id: 'q_cat5_3' as QuestionId,
    textKo: '보고 기업에서 폐기물 종류(성상) 및 처리 방법(매립, 소각, 재활용 등)을 구분할 수 있습니까?',
    textEn: 'Can you distinguish waste types and treatment methods (landfill, incineration, recycling, etc.) at your company?',
    yesNext: 'waste_type' as ResultId,
    noNext: 'average' as ResultId,
  },
  // Category 6 Questions (Business Travel)
  {
    id: 'q_cat6_1' as QuestionId,
    textKo: '구성원 출장에 의한 배출량이 전체 Scope 3 배출량에 주요하게 영향을 미치거나, 공급망 데이터 활용이 Scope 3 산정 목표와 관련됩니까?',
    textEn: 'Does the emissions from business travel significantly impact your total Scope 3 emissions, or is supply chain data utilization related to your Scope 3 goals?',
    yesNext: 'q_cat6_2' as QuestionId,
    noNext: 'q_cat6_3' as QuestionId,
  },
  {
    id: 'q_cat6_2' as QuestionId,
    textKo: '출장 시 사용된 연료의 종류와 사용량/비용 정보가 있습니까?',
    textEn: 'Do you have information on the type and amount/cost of fuel used during business travel?',
    yesNext: 'fuel' as ResultId,
    noNext: 'q_cat6_3' as QuestionId,
  },
  {
    id: 'q_cat6_3' as QuestionId,
    textKo: '출장 거리 및 운송 수단에 대한 정보가 있습니까?',
    textEn: 'Do you have information on the travel distance and transport mode for business trips?',
    yesNext: 'distance_based' as ResultId,
    noNext: 'spend' as ResultId,
  },
  // Category 7 Questions (Employee Commuting)
  {
    id: 'q_cat7_1' as QuestionId,
    textKo: '구성원 통근에 의한 배출량이 전체 Scope 3 배출량에 주요하게 영향을 미치거나, 공급망 데이터 활용이 Scope 3 산정 목표와 관련됩니까?',
    textEn: 'Does the emissions from employee commuting significantly impact your total Scope 3 emissions, or is supply chain data utilization related to your Scope 3 goals?',
    yesNext: 'q_cat7_2' as QuestionId,
    noNext: 'commuting_average' as ResultId,
  },
  {
    id: 'q_cat7_2' as QuestionId,
    textKo: '통근 시 사용된 연료의 종류와 사용량/비용 정보가 있습니까?',
    textEn: 'Do you have information on the type and amount/cost of fuel used during commuting?',
    yesNext: 'fuel' as ResultId,
    noNext: 'q_cat7_3' as QuestionId,
  },
  {
    id: 'q_cat7_3' as QuestionId,
    textKo: '통근 거리 및 통근 방식에 대한 정보가 있습니까?',
    textEn: 'Do you have information on commuting distance and commuting mode?',
    yesNext: 'distance_based' as ResultId,
    noNext: 'commuting_average' as ResultId,
  },
];

const RESULTS: Result[] = [
  {
    id: 'supplier_specific',
    method: 'supplier_co2e',
    titleKo: '공급원별 산정법 (Supplier-specific Method)',
    titleEn: 'Supplier-specific Method',
    descriptionKo: '가장 정확한 방법론입니다. 공급업체로부터 직접 제공받은 제품별 탄소발자국(PCF) 또는 환경성적표지(EPD) 데이터를 사용합니다.',
    descriptionEn: 'The most accurate methodology. Uses product carbon footprint (PCF) or Environmental Product Declaration (EPD) data directly from suppliers.',
    formulaKo: 'Σ (구매량 × 공급업체 특화 배출계수)',
    formulaEn: 'Σ (Quantity purchased × Supplier-specific emission factor)',
    dataRequirementsKo: [
      '구매한 상품/서비스의 수량 (kg, 개수 등)',
      '공급업체 제공 Cradle-to-Gate 배출계수 (kgCO₂e/unit)',
      '제3자 검증 EPD 또는 PCF 데이터 (권장)',
    ],
    dataRequirementsEn: [
      'Quantity of purchased goods/services (kg, units, etc.)',
      'Supplier-provided Cradle-to-Gate emission factor (kgCO₂e/unit)',
      'Third-party verified EPD or PCF data (recommended)',
    ],
    accuracyLevel: 4,
    tipKo: '공급업체에 탄소발자국 데이터를 요청할 때, GHG Protocol 기준 준수 여부와 검증 상태를 확인하세요.',
    tipEn: 'When requesting carbon footprint data from suppliers, verify GHG Protocol compliance and verification status.',
  },
  {
    id: 'hybrid',
    method: 'hybrid', // 이제 전용 UI 지원
    titleKo: '하이브리드 산정법 (Hybrid Method)',
    titleEn: 'Hybrid Method',
    descriptionKo: '여러 데이터 소스를 조합하여 산정합니다. 공급업체 Scope 1,2 할당, 투입물질, 운송, 폐기물 처리를 각각 입력할 수 있습니다.',
    descriptionEn: 'Combines multiple data sources for calculation. Enter supplier Scope 1,2 allocation, input materials, transport, and waste treatment separately.',
    formulaKo: '공급업체 Scope 1,2 할당량 + 투입물질 Cradle-to-Gate + 운송 + 폐기물 처리',
    formulaEn: 'Supplier Scope 1,2 allocation + Input material Cradle-to-Gate + Transport + Waste treatment',
    dataRequirementsKo: [
      '구매한 상품/서비스의 물리량',
      '공급업체의 Scope 1, 2 배출량 (할당 기준 포함)',
      '투입 물질별 Cradle-to-Gate 배출계수',
      '운송 배출량 (해당 시)',
      '폐기물 처리 배출량 (해당 시)',
    ],
    dataRequirementsEn: [
      'Physical quantity of purchased goods/services',
      'Supplier Scope 1 & 2 emissions (with allocation basis)',
      'Cradle-to-Gate emission factors for input materials',
      'Transport emissions (if applicable)',
      'Waste treatment emissions (if applicable)',
    ],
    accuracyLevel: 3,
    tipKo: '각 구성요소를 개별적으로 입력하면 자동으로 합산됩니다. 가정 및 산정 근거는 메모에 기록하세요.',
    tipEn: 'Enter each component individually and they will be automatically summed. Document assumptions in the notes field.',
  },
  {
    id: 'average',
    method: 'activity',
    titleKo: '평균 산정법 (Average-data Method)',
    titleEn: 'Average-data Method',
    descriptionKo: '구매한 물품의 수량에 산업 평균 배출계수를 적용합니다. 물리량 데이터가 있지만 공급업체 특화 데이터가 없을 때 적합합니다.',
    descriptionEn: 'Applies industry average emission factors to purchased quantities. Suitable when you have physical data but no supplier-specific data.',
    formulaKo: 'Σ (구매량 × 제품별 평균 배출계수)',
    formulaEn: 'Σ (Quantity purchased × Average emission factor)',
    dataRequirementsKo: [
      '구매한 상품/서비스의 물리적 수량 (kg, tonnes, 개수 등)',
      'LCI 데이터베이스 기반 평균 배출계수 (kgCO₂e/unit)',
    ],
    dataRequirementsEn: [
      'Physical quantity of purchased goods/services (kg, tonnes, units, etc.)',
      'LCI database-based average emission factor (kgCO₂e/unit)',
    ],
    accuracyLevel: 2,
    tipKo: '배출계수 데이터베이스에서 적합한 항목을 선택하거나, Ecoinvent, DEFRA 등 공인 DB에서 배출계수를 확인하세요.',
    tipEn: 'Select appropriate factors from the emission factor database, or verify factors from certified DBs like Ecoinvent or DEFRA.',
  },
  {
    id: 'spend',
    method: 'spend',
    titleKo: '지출 기반 산정법 (Spend-based Method)',
    titleEn: 'Spend-based Method',
    descriptionKo: '구매 금액에 산업별 평균 배출계수를 적용합니다. 물리량 데이터가 없을 때 사용하며, 정확도는 가장 낮습니다.',
    descriptionEn: 'Applies industry-average emission factors to purchase amounts. Used when physical data is unavailable; lowest accuracy.',
    formulaKo: 'Σ (구매 비용 × 산업별 원단위 배출계수)',
    formulaEn: 'Σ (Purchase cost × Industry emission factor per currency unit)',
    dataRequirementsKo: [
      '구매한 상품/서비스별 지출 금액 (KRW, USD 등)',
      'EEIO 기반 원단위 배출계수 (kgCO₂e/currency)',
    ],
    dataRequirementsEn: [
      'Expenditure by purchased goods/services (KRW, USD, etc.)',
      'EEIO-based emission factor per currency (kgCO₂e/currency)',
    ],
    accuracyLevel: 1,
    tipKo: '가격 변동이 심한 품목은 배출량이 왜곡될 수 있습니다. 가능하면 물리량 기반 방법론으로 업그레이드하세요.',
    tipEn: 'Price-volatile items may cause distorted emissions. Upgrade to physical quantity-based methods when possible.',
  },
  {
    id: 'fuel',
    method: 'fuel',
    titleKo: '연료 기반 산정법 (Fuel-based Method)',
    titleEn: 'Fuel-based Method',
    descriptionKo: '운송 수단에서 사용된 연료의 종류와 양을 기반으로 산출합니다. 거리 기반 방법보다 정확도가 높을 수 있습니다.',
    descriptionEn: 'Calculates emissions based on the type and amount of fuel used. Can be more accurate than distance-based methods.',
    formulaKo: 'Σ (연료 소비량 × 연료별 배출계수)',
    formulaEn: 'Σ (Fuel consumed × Fuel-specific emission factor)',
    dataRequirementsKo: [
      '운송 과정에서의 총 연료 소비량 (L, m³ 등)',
      '연료 종류 (휘발유, 경유 등)',
    ],
    dataRequirementsEn: [
      'Total fuel consumed (L, m³, etc.)',
      'Fuel type (Gasoline, Diesel, etc.)',
    ],
    accuracyLevel: 3,
    tipKo: '운송 업체로부터 직접 연료 소비 데이터를 받을 수 있는 경우 이 방법을 사용하세요.',
    tipEn: 'Use this method if you can obtain direct fuel consumption data from the provider.',
  },
  {
    id: 'site_specific',
    method: 'site_specific',
    titleKo: '장소 기반 산정법 (Site-specific Method)',
    titleEn: 'Site-specific Method',
    descriptionKo: '특정 시설(창고, 물류센터 등)의 에너지 소비 데이터를 기반으로 배출량을 산정합니다.',
    descriptionEn: 'Calculates emissions based on energy consumption data of a specific facility (warehouse, distribution center, etc.).',
    formulaKo: 'Σ (에너지 소비량 × 에너지별 배출계수)',
    formulaEn: 'Σ (Energy consumed × Energy-specific emission factor)',
    dataRequirementsKo: [
      '시설의 전기 사용량 (kWh)',
      '시설의 연료 사용량 (LNG, 경유 등)',
      '시설의 냉매 보충량 (필요 시)',
    ],
    dataRequirementsEn: [
      'Electricity consumption of the facility (kWh)',
      'Fuel consumption of the facility (LNG, Diesel, etc.)',
      'Refrigerant recharge (if applicable)',
    ],
    accuracyLevel: 4,
    tipKo: '공급업체로부터 고지서나 계량기 데이터를 확보할 수 있는 경우 가장 정확한 방법입니다.',
    tipEn: 'Most accurate method if you can get utility bills or meter data from the provider.',
  },
  // Category 5: Waste Type-based Method
  {
    id: 'waste_type',
    method: 'activity',
    titleKo: '폐기물 종류 기반 산정법 (Waste-type Method)',
    titleEn: 'Waste-type Based Method',
    descriptionKo: '폐기물 종류(성상)와 처리 방법(매립, 소각, 재활용 등)에 따른 배출계수를 적용합니다. 올바로 시스템의 폐기물 인계 데이터를 활용할 수 있습니다.',
    descriptionEn: 'Applies emission factors based on waste type and treatment method (landfill, incineration, recycling). Can utilize waste manifest data from regulatory systems.',
    formulaKo: 'Σ (폐기물 처리량 × 폐기물 성상 및 처리방법별 배출계수)',
    formulaEn: 'Σ (Waste treated × Emission factor by waste type and treatment method)',
    dataRequirementsKo: [
      '폐기물 종류별 처리량 (tonnes)',
      '처리 방법 (매립, 소각, 재활용 등)',
      '올바로 시스템 인계서 또는 내부 폐기물 관리 데이터',
    ],
    dataRequirementsEn: [
      'Waste quantity by type (tonnes)',
      'Treatment method (landfill, incineration, recycling, etc.)',
      'Waste manifest data or internal waste management records',
    ],
    accuracyLevel: 3,
    tipKo: '올바로 시스템에서 폐기물 인계서를 조회하면 폐기물 종류와 처리 방법을 확인할 수 있습니다.',
    tipEn: 'Waste manifests from regulatory systems provide waste type and treatment method information.',
  },
  // Category 6: Distance-based Method
  {
    id: 'distance_based',
    method: 'activity',
    titleKo: '거리 기반 산정법 (Distance-based Method)',
    titleEn: 'Distance-based Method',
    descriptionKo: '출장 시 운송수단별 이동 거리에 배출계수를 곱하여 산정합니다. 항공, 철도, 버스, 자동차 등 수단별로 구분하여 입력합니다.',
    descriptionEn: 'Calculates emissions by multiplying the travel distance per transport mode by its emission factor. Enter separately for air, rail, bus, car, etc.',
    formulaKo: 'Σ (운송수단별 이동 거리 × 운송수단별 배출계수)',
    formulaEn: 'Σ (Distance traveled by mode × Mode-specific emission factor)',
    dataRequirementsKo: [
      '운송수단별 이동 거리 (km)',
      '운송수단 종류 (항공, 철도, 버스, 자동차 등)',
      '항공의 경우 좌석 등급 (이코노미, 비즈니스, 퍼스트)',
      '(선택) 호텔 숙박 일수',
    ],
    dataRequirementsEn: [
      'Travel distance by transport mode (km)',
      'Transport mode (Air, Rail, Bus, Car, etc.)',
      'For air travel, seat class (Economy, Business, First)',
      '(Optional) Hotel stay nights',
    ],
    accuracyLevel: 3,
    tipKo: '항공 출장의 경우 ICAO 탄소 배출 계산기에서 거리 및 배출계수를 참고할 수 있습니다. 호텔 숙박 배출량도 선택적으로 포함 가능합니다.',
    tipEn: 'For air travel, you can reference ICAO Carbon Emissions Calculator for distances and factors. Hotel stay emissions can optionally be included.',
  },
  // Category 7: Commuting Average Method
  {
    id: 'commuting_average',
    method: 'average',
    titleKo: '평균 산정법 (Average Method)',
    titleEn: 'Average Method',
    descriptionKo: '직원 수, 운송수단별 비율, 편도 거리, 근무일수를 이용하여 통근 배출량을 산정합니다. 구체적인 연료 또는 거리 데이터가 없을 때 사용합니다.',
    descriptionEn: 'Calculates commuting emissions using number of employees, transport mode ratios, one-way distance, and working days. Used when specific fuel or distance data is unavailable.',
    formulaKo: 'Σ {(직원 수) × (운송수단별 비율) × (편도거리) × 2 × (근무일수) × (배출계수)}',
    formulaEn: 'Σ {(Employees) × (Mode ratio) × (One-way distance) × 2 × (Working days) × (Emission factor)}',
    dataRequirementsKo: [
      '직원 수 [명]',
      '직원이 하루에 출퇴근하는 평균 이동거리 [km]',
      '직원이 사용하는 운송수단별 비율 [%]',
      '연간 근무일수 [일]',
    ],
    dataRequirementsEn: [
      'Number of employees',
      'Average one-way commuting distance [km]',
      'Transport mode distribution ratios [%]',
      'Annual working days',
    ],
    accuracyLevel: 1,
    tipKo: '대기업의 경우 임의로 선택된 대표 집단에 대해 조사 후, 전 직원의 출퇴근 비율을 대변하는 방식으로 산정할 수 있습니다. 재택근무 시 추가 에너지 사용량도 선택적으로 포함 가능합니다.',
    tipEn: 'For large companies, survey a representative sample and extrapolate to all employees. Remote work energy usage can optionally be included.',
  },
];

export const MethodologyWizard: React.FC<MethodologyWizardProps> = ({
  isOpen,
  onClose,
  onSelectMethod,
  currentMethod,
  category,
}) => {
  const { language } = useTranslation();

  const getLabel = (ko: string, en: string) => {
    let text = language === 'ko' ? ko : en;
    if (category === EmissionCategory.CapitalGoods) {
      text = text
        .replace(/구매한 상품\/서비스/g, '선택한 자본재')
        .replace(/purchased goods\/services/g, 'capital goods')
        .replace(/상품\/서비스/g, '자본재')
        .replace(/goods\/services/g, 'capital goods')
        .replace(/구매한 물품/g, '해당 자본재')
        .replace(/제품별/g, '자본재별')
        .replace(/product-specific/g, 'capital good-specific');
    } else if (category === EmissionCategory.UpstreamTransportationAndDistribution || category === EmissionCategory.DownstreamTransportationAndDistribution) {
      text = text
        .replace(/구매한 상품\/서비스/g, '해당 운송 서비스')
        .replace(/purchased goods\/services/g, 'transport services')
        .replace(/상품\/서비스/g, '운송 서비스')
        .replace(/goods\/services/g, 'transport services')
        .replace(/구매한 물품/g, '운송 물품')
        .replace(/제품별/g, '수단별')
        .replace(/product-specific/g, 'mode-specific');
    }
    return text;
  };

  const [currentQuestionId, setCurrentQuestionId] = useState<QuestionId>(
    category === EmissionCategory.UpstreamTransportationAndDistribution || category === EmissionCategory.DownstreamTransportationAndDistribution ? 'q_cat4_branch' as QuestionId :
      category === EmissionCategory.FuelAndEnergyRelatedActivities ? 'q_cat3_1' :
        category === EmissionCategory.WasteGeneratedInOperations ? 'q_cat5_1' :
          category === EmissionCategory.BusinessTravel ? 'q_cat6_1' as QuestionId :
            category === EmissionCategory.EmployeeCommuting ? 'q_cat7_1' as QuestionId : 'q1'
  );
  const [history, setHistory] = useState<QuestionId[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [isDistributionPath, setIsDistributionPath] = useState(false);

  const getResultContent = (res: Result) => {
    if (category === EmissionCategory.FuelAndEnergyRelatedActivities) {
      if (res.id === 'supplier_specific') {
        return {
          ...res,
          formulaKo: 'Σ (구매량 × 공급업체 특화 업스트림 배출계수)',
          formulaEn: 'Σ (Quantity purchased × Supplier-specific upstream emission factor)',
          dataRequirementsKo: [
            '구매한 연료/전기/스팀의 수량 (kWh, L 등)',
            '공급업체 제공 Cradle-to-Gate 배출계수 (kgCO₂e/unit)',
          ],
          dataRequirementsEn: [
            'Quantity of purchased fuel/electricity/steam (kWh, L, etc.)',
            'Supplier-provided Cradle-to-Gate emission factor (kgCO₂e/unit)',
          ],
        };
      }
      if (res.id === 'average') {
        return {
          ...res,
          formulaKo: 'Σ (구매량 × 업스트림 평균 배출계수)',
          formulaEn: 'Σ (Quantity purchased × Average upstream emission factor)',
          dataRequirementsKo: [
            '구매한 연료/전기/스팀의 수량 (kWh, L 등)',
            'LCI 데이터베이스 기반 업스트림 평균 배출계수 (kgCO₂e/unit)',
          ],
          dataRequirementsEn: [
            'Quantity of purchased fuel/electricity/steam (kWh, L, etc.)',
            'LCI database-based average upstream emission factor (kgCO₂e/unit)',
          ],
        };
      }
    }

    if (category === EmissionCategory.UpstreamTransportationAndDistribution || category === EmissionCategory.DownstreamTransportationAndDistribution) {
      if (res.id === 'supplier_specific' || res.id === 'site_specific') {
        const isSite = isDistributionPath || res.id === 'site_specific';
        return {
          ...res,
          titleKo: isSite ? '장소 기반 산정법 (Site-specific Method)' : '공급원별 산정법 (Supplier-specific Method)',
          titleEn: isSite ? 'Site-specific Method' : 'Supplier-specific Method',
          formulaKo: isSite ? 'Σ (에너지 소비량 × 에너지별 배출계수)' : 'Σ (수량 × 공급업체 배출계수)',
          formulaEn: isSite ? 'Σ (Energy consumed × Emission factor)' : 'Σ (Quantity × Supplier EF)',
          dataRequirementsKo: isSite ? [
            '시설의 전기 사용량 (kWh)',
            '시설의 연료 사용량 (LNG, 경유 등)',
            '시설의 냉매 보충 및 기타 직접 데이터',
          ] : [
            '운송된 제품의 수량/중량',
            '운송사 제공 운송 서비스 배출계수 (kgCO₂e/unit)',
          ],
          dataRequirementsEn: isSite ? [
            'Electricity consumption (kWh)',
            'Fuel consumption (LNG, Diesel, etc.)',
            'Refrigerant recharge and other direct data',
          ] : [
            'Quantity/Weight of transported goods',
            'Carrier-provided transport service emission factor (kgCO₂e/unit)',
          ],
        };
      }
      if (res.id === 'average') {
        return {
          ...res,
          titleKo: isDistributionPath ? '평균 산정법 (Average-data Method)' : '거리 기반 산정법 (Distance-based Method)',
          titleEn: isDistributionPath ? 'Average-data Method' : 'Distance-based Method',
          descriptionKo: isDistributionPath ? '물류 시설에서 취급한 수량과 보관 기간에 따른 평균 배출계수를 적용합니다.' : '운송된 제품의 중량과 이동 거리에 산업 평균 배출계수를 적용합니다.',
          descriptionEn: isDistributionPath ? 'Applies average emission factors based on quantity handled and storage duration.' : 'Applies industry average emission factors to the weight and distance of transported products.',
          formulaKo: isDistributionPath ? 'Σ (보관량 × 보관 기간 × 단위별 배출계수)' : 'Σ (중량 × 거리 × 수단별 배출계수)',
          formulaEn: isDistributionPath ? 'Σ (Stored qty × Duration × Unit EF)' : 'Σ (Weight × Distance × Mode EF)',
          dataRequirementsKo: isDistributionPath ? [
            '보관 물품의 양 (tonnes, pallets 등)',
            '보관 기간 (days, weeks 등)',
            '물류 시설 종류 (냉장, 일반 창고 등)',
          ] : [
            '운송된 제품의 중량 (tonnes)',
            '운송 거리 (km)',
            '운송 수단 (트럭, 선박, 항공 등)',
          ],
          dataRequirementsEn: isDistributionPath ? [
            'Quantity of stored goods (tonnes, pallets, etc.)',
            'Storage duration (days, weeks, etc.)',
          ] : [
            'Weight of transported goods (tonnes)',
            'Transport distance (km)',
            'Transport mode (Truck, Ship, Air, etc.)',
          ],
        };
      }
      if (res.id === 'spend') {
        return {
          ...res,
          titleKo: '지출 기반 산정법 (Spend-based Method)',
          titleEn: 'Spend-based Method',
          descriptionKo: '운송/유통 서비스에 지출된 금액에 산업별 평균 배출계수를 적용합니다.',
          descriptionEn: 'Applies industry average emission factors to the amount spent on transport/distribution services.',
          formulaKo: 'Σ (지출 비용 × 산업별 원단위 배출계수)',
          formulaEn: 'Σ (Spend × Industry emission factor)',
          dataRequirementsKo: [
            '운송/유통 서비스 지출 금액 (KRW, USD 등)',
            '서비스 종류 (도로, 해상, 항공, 창고 등)',
          ],
          dataRequirementsEn: [
            'Spend on transport/distribution services (KRW, USD, etc.)',
          ],
        };
      }
    }

    // Category 5: Waste Generated in Operations
    if (category === EmissionCategory.WasteGeneratedInOperations) {
      if (res.id === 'supplier_specific') {
        return {
          ...res,
          titleKo: '공급원별 산정법 (Supplier-specific Method)',
          titleEn: 'Supplier-specific Method',
          descriptionKo: '폐기물 처리업체로부터 직접 Scope 1, 2 배출량을 제공받아 할당합니다. 가장 정확한 방법입니다.',
          descriptionEn: 'Obtains Scope 1 & 2 emissions directly from waste treatment providers. Most accurate method.',
          formulaKo: 'Σ (처리업체 Scope 1,2 배출량 × 보고기업 할당 비율)',
          formulaEn: 'Σ (Provider Scope 1,2 emissions × Allocation ratio)',
          dataRequirementsKo: [
            '폐기물 처리업체의 Scope 1, 2 배출량 (tCO₂e)',
            '보고 기업의 폐기물 할당 비율 (%)',
            '할당 기준 (무게, 부피, 비용 등)',
          ],
          dataRequirementsEn: [
            'Waste provider Scope 1 & 2 emissions (tCO₂e)',
            'Allocation ratio for reporting company (%)',
            'Allocation basis (weight, volume, cost, etc.)',
          ],
          tipKo: '처리업체가 배출권거래제 대상 업체인 경우 검증된 배출량 데이터를 확보할 수 있습니다.',
          tipEn: 'If the provider is subject to emissions trading, verified emissions data may be available.',
        };
      }
      if (res.id === 'average') {
        return {
          ...res,
          titleKo: '평균 산정법 (Average-data Method)',
          titleEn: 'Average-data Method',
          descriptionKo: '총 폐기물 배출량에 국가 통계 기반 처리방식별 비율과 평균 배출계수를 적용합니다. 폐기물 종류/처리방법 구분이 어려울 때 사용합니다.',
          descriptionEn: 'Applies national statistics-based treatment ratios and average emission factors to total waste. Used when waste type/treatment distinction is difficult.',
          formulaKo: 'Σ (총 폐기물량 × 처리방식별 비율 × 처리방식별 평균 배출계수)',
          formulaEn: 'Σ (Total waste × Treatment ratio × Average emission factor)',
          dataRequirementsKo: [
            '총 폐기물 배출량 (tonnes)',
            '처리방식별 비율 (매립 %, 소각 %, 재활용 %)',
          ],
          dataRequirementsEn: [
            'Total waste quantity (tonnes)',
            'Treatment ratios (landfill %, incineration %, recycling %)',
          ],
          tipKo: '"전국 폐기물 발생 및 처리 현황" 통계를 참고하여 처리방식별 비율을 추정할 수 있습니다.',
          tipEn: 'National waste statistics can be used to estimate treatment ratios.',
        };
      }
      if (res.id === 'spend') {
        return {
          ...res,
          titleKo: '지출 기반 산정법 (Spend-based Method)',
          titleEn: 'Spend-based Method',
          descriptionKo: '폐기물 관리 서비스에 지출된 금액에 산업별 평균 배출계수를 적용합니다. 정확도가 가장 낮습니다.',
          descriptionEn: 'Applies industry average emission factors to waste management service expenditure. Lowest accuracy.',
          formulaKo: 'Σ (폐기물 처리 비용 × 원단위 배출계수)',
          formulaEn: 'Σ (Waste disposal cost × Emission factor per currency)',
          dataRequirementsKo: [
            '폐기물 처리 서비스 지출 금액 (KRW, USD 등)',
            '서비스 종류 (일반 폐기물, 지정 폐기물, 하폐수 등)',
          ],
          dataRequirementsEn: [
            'Waste disposal service expenditure (KRW, USD, etc.)',
            'Service type (general waste, hazardous waste, wastewater, etc.)',
          ],
        };
      }
    }

    return res;
  };

  const currentQuestion = QUESTIONS.find(q => q.id === currentQuestionId);

  const handleAnswer = (answer: 'yes' | 'no') => {
    if (!currentQuestion) return;

    if (currentQuestionId === 'q_cat4_branch') {
      setIsDistributionPath(answer === 'no');
    }

    const nextId = answer === 'yes' ? currentQuestion.yesNext : currentQuestion.noNext;

    // Check if nextId is a result
    const resultItem = RESULTS.find(r => r.id === nextId);
    if (resultItem) {
      setResult(resultItem);
    } else {
      // It's another question
      setHistory([...history, currentQuestionId]);
      setCurrentQuestionId(nextId as QuestionId);
    }
  };

  const handleBack = () => {
    if (history.length > 0) {
      const prevQuestion = history[history.length - 1];
      setHistory(history.slice(0, -1));
      setCurrentQuestionId(prevQuestion);
      setResult(null);
    }
  };

  const handleReset = () => {
    setCurrentQuestionId(
      category === EmissionCategory.UpstreamTransportationAndDistribution || category === EmissionCategory.DownstreamTransportationAndDistribution ? 'q_cat4_branch' as QuestionId :
        category === EmissionCategory.FuelAndEnergyRelatedActivities ? 'q_cat3_1' :
          category === EmissionCategory.WasteGeneratedInOperations ? 'q_cat5_1' :
            category === EmissionCategory.BusinessTravel ? 'q_cat6_1' as QuestionId :
              category === EmissionCategory.EmployeeCommuting ? 'q_cat7_1' as QuestionId : 'q1'
    );
    setHistory([]);
    setResult(null);
    setIsDistributionPath(false);
  };

  const handleSelectMethod = () => {
    if (result && result.method) {
      onSelectMethod(result.method);
      onClose();
      handleReset();
    }
  };

  const getAccuracyLabel = (level: number) => {
    const labels = language === 'ko'
      ? ['낮음', '중간', '높음', '매우 높음']
      : ['Low', 'Medium', 'High', 'Very High'];
    return labels[level - 1] || labels[0];
  };

  const getAccuracyColor = (level: number) => {
    const colors = [
      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    ];
    return colors[level - 1] || colors[0];
  };

  const progressSteps = history.length + 1;
  const maxSteps = 4; // Maximum possible questions

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
      handleReset();
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        style={{
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          position: 'fixed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}
        onClick={handleBackdropClick}
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {language === 'ko' ? '📊 산정 방법론 선택 가이드' : '📊 Methodology Selection Guide'}
                </h2>
                <p className="text-emerald-100 text-sm mt-1">
                  {language === 'ko'
                    ? 'GHG Protocol Technical Guidance 기반'
                    : 'Based on GHG Protocol Technical Guidance'
                  }
                </p>
              </div>
              <button
                onClick={() => { onClose(); handleReset(); }}
                className="text-white/80 hover:text-white text-2xl font-light"
              >
                ×
              </button>
            </div>

            {/* Progress Bar */}
            {!result && (
              <div className="mt-4">
                <div className="flex gap-1">
                  {Array.from({ length: maxSteps }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${i < progressSteps ? 'bg-white' : 'bg-white/30'
                        }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-emerald-100 mt-2">
                  {language === 'ko' ? `질문 ${progressSteps}` : `Question ${progressSteps}`}
                </p>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {!result ? (
              // Question View
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <p className="text-lg font-medium text-gray-900 dark:text-white leading-relaxed">
                    {getLabel(currentQuestion?.textKo || '', currentQuestion?.textEn || '')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleAnswer('yes')}
                    className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-700 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors group"
                  >
                    <span className="text-2xl mb-2 block">✓</span>
                    <span className="text-emerald-700 dark:text-emerald-300 font-semibold text-lg">
                      {language === 'ko' ? '예' : 'Yes'}
                    </span>
                    <IconChevronRight className="w-5 h-5 text-emerald-500 mx-auto mt-2 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => handleAnswer('no')}
                    className="p-4 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                  >
                    <span className="text-2xl mb-2 block">✗</span>
                    <span className="text-gray-700 dark:text-gray-300 font-semibold text-lg">
                      {language === 'ko' ? '아니오' : 'No'}
                    </span>
                    <IconChevronRight className="w-5 h-5 text-gray-500 mx-auto mt-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {history.length > 0 && (
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm"
                  >
                    <IconChevronLeft className="w-4 h-4" />
                    {language === 'ko' ? '이전 질문으로' : 'Previous question'}
                  </button>
                )}
              </div>
            ) : (
              // Result View
              <div className="space-y-6">
                {/* Result Header */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-4">
                    <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                    <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                      {language === 'ko' ? '권장 산정 방법론' : 'Recommended Methodology'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {getLabel(getResultContent(result).titleKo, getResultContent(result).titleEn)}
                  </h3>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {language === 'ko' ? '정확도:' : 'Accuracy:'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getAccuracyColor(result.accuracyLevel)}`}>
                      {getAccuracyLabel(result.accuracyLevel)}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <p className="text-gray-700 dark:text-gray-300">
                    {getLabel(getResultContent(result).descriptionKo, getResultContent(result).descriptionEn)}
                  </p>
                </div>

                {/* Formula */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
                  <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                    {language === 'ko' ? '📐 산정 공식' : '📐 Formula'}
                  </h4>
                  <p className="font-mono text-blue-800 dark:text-blue-200 text-sm">
                    {getLabel(getResultContent(result).formulaKo, getResultContent(result).formulaEn)}
                  </p>
                </div>

                {/* Data Requirements */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'ko' ? '📋 필요 데이터' : '📋 Required Data'}
                  </h4>
                  <ul className="space-y-2">
                    {(language === 'ko' ? getResultContent(result).dataRequirementsKo : getResultContent(result).dataRequirementsEn).map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        {getLabel(req, req)}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tip */}
                {(result.tipKo || result.tipEn) && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl">
                    <div className="flex items-start gap-2">
                      <IconInfo className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-1">
                          {language === 'ko' ? '💡 팁' : '💡 Tip'}
                        </h4>
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          {getLabel(result.tipKo || '', result.tipEn || '')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hybrid Special Note */}
                {result.id === 'hybrid' && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-xl">
                    <div className="flex items-start gap-2">
                      <span className="text-purple-600 dark:text-purple-400 text-lg">🔀</span>
                      <div>
                        <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-1">
                          {language === 'ko' ? '하이브리드 산정법 전용 UI' : 'Hybrid Method Dedicated UI'}
                        </h4>
                        <p className="text-sm text-purple-800 dark:text-purple-200 mb-2">
                          {language === 'ko'
                            ? '이 플랫폼은 하이브리드 산정법을 위한 전용 입력 화면을 제공합니다. 각 구성요소를 개별적으로 입력하면 자동으로 합산됩니다:'
                            : 'This platform provides a dedicated input screen for the hybrid method. Enter each component individually and they will be summed automatically:'
                          }
                        </p>
                        <ol className="text-sm text-purple-700 dark:text-purple-300 space-y-1 list-decimal list-inside">
                          <li>{language === 'ko' ? '공급업체 Scope 1, 2 할당 배출량' : 'Supplier Scope 1 & 2 allocated emissions'}</li>
                          <li>{language === 'ko' ? '투입 물질별 Cradle-to-Gate 배출량' : 'Cradle-to-Gate emissions for input materials'}</li>
                          <li>{language === 'ko' ? '운송 배출량 (업스트림)' : 'Transport emissions (upstream)'}</li>
                          <li>{language === 'ko' ? '폐기물 처리 배출량' : 'Waste treatment emissions'}</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            {result ? (
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  {language === 'ko' ? '다시 선택하기' : 'Choose Again'}
                </button>
                <button
                  onClick={handleSelectMethod}
                  className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-colors font-medium ${result.id === 'hybrid'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                >
                  {language === 'ko' ? '이 방법론 선택하기' : 'Select This Method'}
                </button>
              </div>
            ) : (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                {language === 'ko'
                  ? '질문에 답하여 적합한 산정 방법론을 찾으세요'
                  : 'Answer the questions to find the appropriate methodology'
                }
              </p>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
};

