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

type QuestionId = 'q1' | 'q1_sub' | 'q2' | 'q2_sub' | 'q3' | 'q3_sub' | 'q_cat3_1' | 'q_cat3_2' | 'q_cat4_1' | 'q_cat4_2' | 'q_cat4_3' | 'q_cat4_4';
type ResultId = 'supplier_specific' | 'hybrid' | 'average' | 'spend' | 'fuel' | 'site_based' | 'average_data';

interface Question {
  id: QuestionId;
  textKo: string;
  textEn: string;
  yesNext: QuestionId | ResultId;
  noNext: QuestionId | ResultId;
}

interface Result {
  id: ResultId;
  method: CalculationMethod | null;  // null for hybrid (manual calculation)
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
  // Category 1 & 2 Questions
  {
    id: 'q1',
    textKo: '본 항목에 의한 배출량이 전체 Scope 3 배출량에 주요하게 영향을 미치거나, 공급망 데이터 활용이 목표와 관련됩니까?',
    textEn: 'Does the emissions from this category significantly impact your total Scope 3 emissions, or is supply chain data utilization related to your goals?',
    yesNext: 'q2',
    noNext: 'q1_sub',
  },
  {
    id: 'q1_sub',
    textKo: '대상 품목의 물리량 정보(중량, 개수 등)가 있습니까?',
    textEn: 'Do you have physical quantity information (weight, units, etc.) for the items?',
    yesNext: 'average',
    noNext: 'spend',
  },
  {
    id: 'q2',
    textKo: '대상 품목의 물리량 정보가 있습니까?',
    textEn: 'Do you have physical quantity information for the items?',
    yesNext: 'q3',
    noNext: 'q2_sub',
  },
  {
    id: 'q2_sub',
    textKo: '공급자로부터 할당된 Scope 1, 2 배출량 확보가 가능합니까?',
    textEn: 'Can you obtain allocated Scope 1 & 2 emissions data from suppliers?',
    yesNext: 'hybrid',
    noNext: 'spend',
  },
  {
    id: 'q3',
    textKo: 'Tier 1 공급망으로부터 품목별 Cradle-to-Gate 배출량(EPD, PCF 등) 확보가 가능합니까?',
    textEn: 'Can you obtain Cradle-to-Gate emissions data (EPD, PCF, etc.) from Tier 1 suppliers?',
    yesNext: 'supplier_specific',
    noNext: 'q3_sub',
  },
  {
    id: 'q3_sub',
    textKo: '공급자로부터 할당된 Scope 1, 2 배출량 확보가 가능합니까?',
    textEn: 'Can you obtain allocated Scope 1 & 2 emissions data from suppliers?',
    yesNext: 'hybrid',
    noNext: 'average',
  },
  // Category 3 Questions
  {
    id: 'q_cat3_1',
    textKo: '연료 및 에너지 관련 활동에 의한 배출량이 전체 Scope 3 배출량에 주요하게 영향을 미치거나, 공급망 데이터 활용이 Scope 3 산정 목표와 관련됩니까?',
    textEn: 'Does the emissions from fuel/energy-related activities significantly impact your total Scope 3 emissions, or is supply chain data utilization related to your goals?',
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
  // Category 4 Questions (Based on User Diagram)
  {
    id: 'q_cat4_1',
    textKo: '업스트림 운송 및 유통에 의한 배출량이 전체 Scope 3 배출량에 주요하게 영향을 미치거나, 공급망 데이터 활용이 Scope 3 산정 목표와 관련됩니까?',
    textEn: 'Does the emissions from upstream transport significantly impact your total Scope 3 emissions, or is supply chain data utilization related to your Scope 3 goals?',
    yesNext: 'q_cat4_2',
    noNext: 'q_cat4_4',
  },
  {
    id: 'q_cat4_2',
    textKo: '운송 과정에서 사용된 연료의 종류와 사용량/비용 정보가 있습니까?',
    textEn: 'Do you have information on the type and amount/cost of fuel used during transportation?',
    yesNext: 'q_cat4_3',
    noNext: 'q_cat4_4',
  },
  {
    id: 'q_cat4_3',
    textKo: '운송 수단 하나에 여러 종류의 물품이 운송될 때, 각 물품별 양에 대한 정보가 있습니까?',
    textEn: 'When multiple types of goods are transported in a single vehicle, do you have information on the quantity of each item?',
    yesNext: 'fuel',
    noNext: 'q_cat4_4',
  },
  {
    id: 'q_cat4_4',
    textKo: '운송하는 물질의 질량 및 운송 거리에 대한 정보가 있습니까?',
    textEn: 'Do you have information on the mass of the material being transported and the transport distance?',
    yesNext: 'average', // Map to Distance-based (Activity)
    noNext: 'spend',
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
    formulaKo: 'Σ (수량 × 공급업체 특화 배출계수)',
    formulaEn: 'Σ (Quantity × Supplier-specific emission factor)',
    dataRequirementsKo: [
      '대상의 수량 (kg, kWh, 개수 등)',
      '공급업체 제공 Cradle-to-Gate 배출계수 (kgCO₂e/unit)',
      '제3자 검증 데이터 (권장)',
    ],
    dataRequirementsEn: [
      'Quantity (kg, kWh, units, etc.)',
      'Supplier-provided Cradle-to-Gate emission factor (kgCO₂e/unit)',
      'Third-party verified data (recommended)',
    ],
    accuracyLevel: 4,
    tipKo: '공급업체에 데이터를 요청할 때, GHG Protocol 기준 준수 여부와 검증 상태를 확인하세요.',
    tipEn: 'When requesting data from suppliers, verify GHG Protocol compliance and verification status.',
  },
  {
    id: 'hybrid',
    method: 'hybrid',
    titleKo: '하이브리드 산정법 (Hybrid Method)',
    titleEn: 'Hybrid Method',
    descriptionKo: '여러 데이터 소스를 조합하여 산정합니다. 공급업체 Scope 1,2 할당, 투입물질, 운송, 폐기물 처리를 각각 입력할 수 있습니다.',
    descriptionEn: 'Combines multiple data sources for calculation. Enter supplier Scope 1,2 allocation, input materials, transport, and waste treatment separately.',
    formulaKo: '공급업체 Scope 1,2 할당량 + 투입물질 Cradle-to-Gate + 운송 + 폐기물 처리',
    formulaEn: 'Supplier Scope 1,2 allocation + Input material Cradle-to-Gate + Transport + Waste treatment',
    dataRequirementsKo: [
      '대상 품목의 물리량',
      '공급업체의 Scope 1, 2 배출량 (할당 기준 포함)',
      '투입 물질별 Cradle-to-Gate 배출계수',
    ],
    dataRequirementsEn: [
      'Physical quantity of the item',
      'Supplier Scope 1 & 2 emissions (with allocation basis)',
      'Cradle-to-Gate emission factors for input materials',
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
    descriptionKo: '수량에 산업 평균 배출계수를 적용합니다. 물리량 데이터가 있지만 공급업체 특화 데이터가 없을 때 적합합니다.',
    descriptionEn: 'Applies industry average emission factors to quantities. Suitable when you have physical data but no supplier-specific data.',
    formulaKo: 'Σ (수량 × 제품별 평균 배출계수)',
    formulaEn: 'Σ (Quantity × Average emission factor)',
    dataRequirementsKo: [
      '물리적 수량 (kg, tonnes, 개수 등)',
      'LCI 데이터베이스 기반 평균 배출계수 (kgCO₂e/unit)',
    ],
    dataRequirementsEn: [
      'Physical quantity (kg, tonnes, units, etc.)',
      'LCI database-based average emission factor (kgCO₂e/unit)',
    ],
    accuracyLevel: 2,
    tipKo: '배출계수 데이터베이스에서 적합한 항목을 선택하거나 공인 DB에서 확인하세요.',
    tipEn: 'Select appropriate factors from the database or verify from certified DBs.',
  },
  {
    id: 'spend',
    method: 'spend',
    titleKo: '지출 기반 산정법 (Spend-based Method)',
    titleEn: 'Spend-based Method',
    descriptionKo: '금액에 산업별 평균 배출계수를 적용합니다. 물리량 데이터가 없을 때 사용하며, 정확도는 가장 낮습니다.',
    descriptionEn: 'Applies industry-average emission factors to spend amounts. Used when physical data is unavailable; lowest accuracy.',
    formulaKo: 'Σ (지출 비용 × 산업별 원단위 배출계수)',
    formulaEn: 'Σ (Spend cost × Industry emission factor per currency unit)',
    dataRequirementsKo: [
      '대상의 지출 금액 (KRW, USD 등)',
      'EEIO 기반 원단위 배출계수 (kgCO₂e/currency)',
    ],
    dataRequirementsEn: [
      'Expenditure amount (KRW, USD, etc.)',
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
];

export const MethodologyWizard: React.FC<MethodologyWizardProps> = ({
  isOpen,
  onClose,
  onSelectMethod,
  currentMethod,
  category,
}) => {
  const { language } = useTranslation();
  const [currentQuestionId, setCurrentQuestionId] = useState<QuestionId>(
    category === EmissionCategory.UpstreamTransportationAndDistribution ? 'q_cat4_1' :
      category === EmissionCategory.FuelAndEnergyRelatedActivities ? 'q_cat3_1' : 'q1'
  );
  const [history, setHistory] = useState<QuestionId[]>([]);
  const [result, setResult] = useState<Result | null>(null);

  const getLabel = (ko: string, en: string) => {
    let text = language === 'ko' ? ko : en;
    if (category === EmissionCategory.CapitalGoods) {
      text = text
        .replace(/대상 품목/g, '선택한 자본재')
        .replace(/purchased goods\/services/g, 'capital goods')
        .replace(/품목/g, '자본재')
        .replace(/goods\/services/g, 'capital goods')
        .replace(/제품별/g, '자본재별')
        .replace(/product-specific/g, 'capital good-specific');
    }
    return text;
  };

  const getResultContent = (res: Result) => {
    if (category === EmissionCategory.FuelAndEnergyRelatedActivities) {
      if (res.id === 'supplier_specific') {
        return {
          ...res,
          formulaKo: 'Σ (구매량 × 공급업체 특화 업스트림 배출계수)',
          formulaEn: 'Σ (Quantity purchased × Supplier-specific upstream emission factor)',
        };
      }
      if (res.id === 'average') {
        return {
          ...res,
          formulaKo: 'Σ (구매량 × 업스트림 평균 배출계수)',
          formulaEn: 'Σ (Quantity purchased × Average upstream emission factor)',
        };
      }
    }

    if (category === EmissionCategory.UpstreamTransportationAndDistribution) {
      if (res.id === 'supplier_specific') {
        return {
          ...res,
          formulaKo: 'Σ (수량 × 운송업체 제공 배출계수)',
          formulaEn: 'Σ (Quantity × Carrier-specific emission factor)',
          dataRequirementsKo: [
            '운송된 제품의 수량/중량',
            '운송사 제공 운송 서비스 배출계수 (kgCO₂e/unit)',
          ],
          dataRequirementsEn: [
            'Quantity/Weight of transported goods',
            'Carrier-provided transport service emission factor (kgCO₂e/unit)',
          ],
        };
      }
      if (res.id === 'average') {
        return {
          ...res,
          titleKo: '거리 기반 산정법 (Distance-based Method)',
          titleEn: 'Distance-based Method',
          descriptionKo: '운송된 제품의 중량과 이동 거리에 산업 평균 배출계수를 적용합니다.',
          descriptionEn: 'Applies industry average emission factors to the weight and distance of transported products.',
          formulaKo: 'Σ (중량 × 거리 × 수단별 배출계수)',
          formulaEn: 'Σ (Weight × Distance × Mode-specific emission factor)',
          dataRequirementsKo: [
            '운송된 제품의 중량 (tonnes)',
            '운송 거리 (km)',
            '운송 수단 (트럭, 선박, 항공 등)',
          ],
          dataRequirementsEn: [
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
          descriptionKo: '운송 서비스에 지출된 금액에 산업별 평균 배출계수를 적용합니다.',
          descriptionEn: 'Applies industry average emission factors to the amount spent on transport services.',
          formulaKo: 'Σ (운송 비용 × 산업별 원단위 배출계수)',
          formulaEn: 'Σ (Transport cost × Industry emission factor per currency unit)',
          dataRequirementsKo: [
            '운송 서비스 지출 금액 (KRW, USD 등)',
            '운송 서비스 종류 (도로, 해상, 항공 등)',
          ],
          dataRequirementsEn: [
            'Spend on transport services (KRW, USD, etc.)',
            'Type of transport service (Road, Sea, Air, etc.)',
          ],
        };
      }
    }
    return res;
  };

  const currentQuestion = QUESTIONS.find(q => q.id === currentQuestionId);

  const handleAnswer = (answer: 'yes' | 'no') => {
    if (!currentQuestion) return;
    const nextId = answer === 'yes' ? currentQuestion.yesNext : currentQuestion.noNext;
    const resultItem = RESULTS.find(r => r.id === nextId);
    if (resultItem) {
      setResult(resultItem);
    } else {
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
      category === EmissionCategory.UpstreamTransportationAndDistribution ? 'q_cat4_1' :
        category === EmissionCategory.FuelAndEnergyRelatedActivities ? 'q_cat3_1' : 'q1'
    );
    setHistory([]);
    setResult(null);
  };

  const handleSelectMethod = () => {
    if (result && result.method) {
      onSelectMethod(result.method);
      onClose();
      handleReset();
    }
  };

  const getAccuracyLabel = (level: number) => {
    const labels = language === 'ko' ? ['낮음', '중간', '높음', '매우 높음'] : ['Low', 'Medium', 'High', 'Very High'];
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
  const maxSteps = 4;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
      handleReset();
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={handleBackdropClick}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {language === 'ko' ? '📊 산정 방법론 선택 가이드' : '📊 Methodology Selection Guide'}
                </h2>
                <p className="text-emerald-100 text-sm mt-1">
                  {language === 'ko' ? 'GHG Protocol Technical Guidance 기반' : 'Based on GHG Protocol Technical Guidance'}
                </p>
              </div>
              <button onClick={() => { onClose(); handleReset(); }} className="text-white/80 hover:text-white text-2xl font-light">×</button>
            </div>
            {!result && (
              <div className="mt-4">
                <div className="flex gap-1">
                  {Array.from({ length: maxSteps }).map((_, i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < progressSteps ? 'bg-white' : 'bg-white/30'}`} />
                  ))}
                </div>
                <p className="text-xs text-emerald-100 mt-2">
                  {language === 'ko' ? `질문 ${progressSteps}` : `Question ${progressSteps}`}
                </p>
              </div>
            )}
          </div>

          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {!result ? (
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <p className="text-lg font-medium text-gray-900 dark:text-white leading-relaxed">
                    {getLabel(currentQuestion?.textKo || '', currentQuestion?.textEn || '')}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => handleAnswer('yes')} className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-700 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors group">
                    <span className="text-2xl mb-2 block">✓</span>
                    <span className="text-emerald-700 dark:text-emerald-300 font-semibold text-lg">{language === 'ko' ? '예' : 'Yes'}</span>
                    <IconChevronRight className="w-5 h-5 text-emerald-500 mx-auto mt-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button onClick={() => handleAnswer('no')} className="p-4 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                    <span className="text-2xl mb-2 block">✗</span>
                    <span className="text-gray-700 dark:text-gray-300 font-semibold text-lg">{language === 'ko' ? '아니오' : 'No'}</span>
                    <IconChevronRight className="w-5 h-5 text-gray-500 mx-auto mt-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
                {history.length > 0 && (
                  <button onClick={handleBack} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm">
                    <IconChevronLeft className="w-4 h-4" />
                    {language === 'ko' ? '이전 질문으로' : 'Previous question'}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-4">
                    <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                    <span className="text-emerald-700 dark:text-emerald-300 font-medium">{language === 'ko' ? '권장 산정 방법론' : 'Recommended Methodology'}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {getLabel(getResultContent(result).titleKo, getResultContent(result).titleEn)}
                  </h3>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{language === 'ko' ? '정확도:' : 'Accuracy:'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getAccuracyColor(result.accuracyLevel)}`}>{getAccuracyLabel(result.accuracyLevel)}</span>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <p className="text-gray-700 dark:text-gray-300">{getLabel(getResultContent(result).descriptionKo, getResultContent(result).descriptionEn)}</p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
                  <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">{language === 'ko' ? '📐 산정 공식' : '📐 Formula'}</h4>
                  <p className="font-mono text-blue-800 dark:text-blue-200 text-sm">{getLabel(getResultContent(result).formulaKo, getResultContent(result).formulaEn)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{language === 'ko' ? '📋 필요 데이터' : '📋 Required Data'}</h4>
                  <ul className="space-y-2">
                    {(language === 'ko' ? getResultContent(result).dataRequirementsKo : getResultContent(result).dataRequirementsEn).map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"><span className="text-emerald-500 mt-0.5">•</span>{getLabel(req, req)}</li>
                    ))}
                  </ul>
                </div>
                {(result.tipKo || result.tipEn) && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl">
                    <div className="flex items-start gap-2">
                      <IconInfo className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-1">{language === 'ko' ? '💡 팁' : '💡 Tip'}</h4>
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">{getLabel(result.tipKo || '', result.tipEn || '')}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            {result ? (
              <div className="flex gap-3">
                <button onClick={handleReset} className="flex-1 px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium">{language === 'ko' ? '다시 선택하기' : 'Choose Again'}</button>
                <button onClick={handleSelectMethod} className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-colors font-medium ${result.id === 'hybrid' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>{language === 'ko' ? '이 방법론 선택하기' : 'Select This Method'}</button>
              </div>
            ) : (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">{language === 'ko' ? '질문에 답하여 적합한 산정 방법론을 찾으세요' : 'Answer the questions to find the appropriate methodology'}</p>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
};

