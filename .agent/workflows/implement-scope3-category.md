---
description: Scope 3 카테고리 구현 자동화 (PDF 지침 + UI 이미지 기반)
---

# 🚀 Scope 3 카테고리 구현 자동화 엔진

## 사용법
```
/implement-scope3-category
"카테고리 [N] 작업 시작. PDF: [경로]. 첨부 이미지 참고."
```

## 입력 (사용자 제공)
| 항목 | 설명 | 필수 |
|------|------|:----:|
| **카테고리 번호** | 6~15 중 하나 | ✅ |
| **PDF 경로** | NIER/환경부 Scope 3 가이드라인 PDF 파일 절대경로 | ✅ |
| **UI 참조 이미지** | 대화에 첨부한 이미지 (기존 카테고리 UI 또는 희망 디자인) | ⬜ (선택) |

---

## Phase 0: 사전 분석 (Pre-Analysis)

### 0-1. PDF 지침서 분석
// turbo
```
view_file 또는 read_url_content로 PDF 읽기
```

PDF에서 다음 정보를 **반드시** 추출:
- [ ] **산정 방법론 종류** (활동 기반, 평균 데이터, 지출 기반, 공급자 특정 등)
- [ ] **배출계수와 단위** (kgCO2e/kg, kgCO2e/km, kgCO2e/원 등)
- [ ] **산정 공식** (활동량 × 배출계수 형태)
- [ ] **데이터 수집 방법** 및 우선순위 (정확도 높은 순서)
- [ ] **경계 설정 기준** (어디까지 포함하는지)
- [ ] **참고 테이블/차트** 속 데이터 값

### 0-2. 기존 코드 패턴 분석 (가장 유사한 카테고리 참조)
// turbo
```
view_file_outline으로 해당 카테고리의 Row 컴포넌트와 constants 파일 확인
```

참조해야 할 파일 목록:
| 파일 | 용도 |
|------|------|
| `src/types.ts` | 기존 타입 정의 (EmissionSource, CalculationMethod 등) |
| `src/constants/scope3/category{N}.ts` | 해당 카테고리 배출계수 (이미 존재하면 업데이트) |
| `src/components/source_rows/Category{N}Row.tsx` | 해당 카테고리 UI 컴포넌트 |
| `src/components/MainCalculator.tsx` | 통합 계산 로직 (calculateEmissions 함수 내) |
| `src/components/MethodologyWizard.tsx` | 방법론 선택 위저드 |
| `src/translations/main.ts` | 한국어/영어 번역 키 |

### 0-3. 카테고리 매핑 테이블
| 카테고리 | Row 컴포넌트 | Constants 파일 | EmissionCategory Enum |
|:-------:|-------------|---------------|----------------------|
| 6 | Category6Row.tsx | category6.ts | BusinessTravel |
| 7 | Category7Row.tsx | category7.ts | EmployeeCommuting |
| 8 | Category8_13Row.tsx | category8_13.ts | UpstreamLeasedAssets |
| 9 | Category4_9Row.tsx | category4_9.ts | DownstreamTransportationAndDistribution |
| 10 | Category10Row.tsx | category10.ts | ProcessingOfSoldProducts |
| 11 | Category11Row.tsx | category11.ts | UseOfSoldProducts |
| 12 | Category12Row.tsx | category12.ts | EndOfLifeTreatmentOfSoldProducts |
| 13 | Category8_13Row.tsx | category8_13.ts | DownstreamLeasedAssets |
| 14 | Category14Row.tsx | category14.ts | Franchises |
| 15 | Category15Row.tsx | category15.ts | Investments |

---

## Phase 1: 구현 계획 작성

`.agent/category{N}_implementation_plan.md` 파일을 생성하여 구현 계획을 기록.

계획에 포함할 내용:
1. **PDF에서 추출한 산정 방법론 요약**
2. **배출계수 데이터 테이블** (그대로 코드화할 값들)
3. **수정/생성할 파일 목록과 각 파일별 변경 내용**
4. **UI 변경사항** (이미지 기반 또는 기존 패턴 기반)
5. **번역 키 추가 목록**

---

## Phase 2: 타입 정의 업데이트

### 수정 파일: `src/types.ts`

확인/추가 사항:
- [ ] `Cat{N}CalculationMethod` 타입 존재 확인 → 없으면 생성
- [ ] 새로운 배출원 속성이 필요하면 `EmissionSource` 인터페이스에 추가
- [ ] 새로운 Enum 값 (WasteType, TransportMode 등) 추가 필요 시 처리

**패턴 예시** (Category 5 참조):
```typescript
export type Cat5CalculationMethod = 'activity' | 'supplier_specific' | 'spend' | 'average';
```

---

## Phase 3: 배출계수 상수 파일 업데이트

### 수정 파일: `src/constants/scope3/category{N}.ts`

PDF에서 추출한 배출계수를 코드화:

**반드시 준수할 규칙:**
1. 모든 배출계수에 `factor` (숫자)와 `translationKey` (번역 키) 포함
2. 배출계수 단위 명시 (주석으로라도)
3. 지출 기반 팩터는 `spend` 키 아래 배열로 구성
4. 활동 기반 팩터는 `activity` 키 아래 중첩 객체로 구성
5. `DETAILED` 통합 객체로 export (예: `WASTE_FACTORS_DETAILED`)

**패턴 예시** (Category 5 참조):
```typescript
export const WASTE_TREATMENT_FACTORS: Record<WasteType, Partial<Record<TreatmentMethod, {
  factor: number;
  translationKey: TranslationKey;
}>>> = {
  MSW: {
    Landfill: { factor: 0.4552, translationKey: 'landfill' },
    // ...
  },
};

export const WASTE_FACTORS_DETAILED = {
  activity: WASTE_TREATMENT_FACTORS,
  spend: WASTE_SPEND_FACTORS,
  average: AVERAGE_WASTE_FACTORS,
};
```

### 수정 파일: `src/constants/scope3/index.ts`
- 새 상수 파일을 index에서 export하는지 확인

---

## Phase 4: UI 컴포넌트 구현/업데이트

### 수정 파일: `src/components/source_rows/Category{N}Row.tsx`

**반드시 적용할 UI 패턴:**

#### 4-1. 방법론 선택 가이드 버튼 (에메랄드 라운드 스타일)
```tsx
<button
  onClick={() => setShowMethodologyWizard(true)}
  className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-800 transition-all hover:shadow-sm"
>
  <span>📊</span>
  {language === 'ko' ? '방법론 선택 가이드' : 'Methodology Guide'}
</button>
```

#### 4-2. 계산 방법 선택 탭 바
```tsx
<div className="flex gap-1 rounded-md bg-gray-200 dark:bg-gray-900 p-1 text-xs overflow-x-auto">
  {methods.map(method => (
    <button
      key={method}
      onClick={() => handleMethodChange(method)}
      className={`flex-1 py-1 px-2 rounded-md transition-colors whitespace-nowrap ${
        activeMethod === method
          ? 'bg-white dark:bg-gray-700 shadow font-semibold text-ghg-green'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
      }`}
    >
      {t(`${method}Method` as TranslationKey)}
    </button>
  ))}
</div>
```

#### 4-3. 방법론 설명 박스
```tsx
<div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
  {activeMethod === 'activity' && <p dangerouslySetInnerHTML={{ __html: t('cat{N}MethodActivity') }}></p>}
  {activeMethod === 'spend' && <p dangerouslySetInnerHTML={{ __html: t('cat{N}MethodSpend') }}></p>}
  {/* ... 기타 방법론별 설명 ... */}
</div>
```

#### 4-4. DQI (데이터 품질 지표) 섹션
```tsx
import { DQISection } from '../DQISection';

// 핸들러
const handleDQIUpdate = (indicator: DataQualityIndicator, rating: 'high' | 'medium' | 'low' | 'estimated') => {
  // DQI 업데이트 로직
};

// JSX
<DQISection
  dataQualityIndicator={source.dataQualityIndicator}
  language={language}
  onUpdate={handleDQIUpdate}
/>
```

#### 4-5. MethodologyWizard 통합
```tsx
import { MethodologyWizard } from '../MethodologyWizard';

<MethodologyWizard
  isOpen={isWizardOpen}
  onClose={() => setIsWizardOpen(false)}
  category={EmissionCategory.XXX}
  language={language}
  onSelectMethod={(method) => handleMethodChange(method as Cat{N}CalculationMethod)}
/>
```

#### 4-6. 필수 import 패턴
```tsx
import { EmissionSource, Cat{N}CalculationMethod, EmissionCategory, DataQualityIndicator } from '../../types';
import { useTranslation } from '../../context/LanguageContext';
import { TranslationKey } from '../../translations/index';
import { IconTrash, IconSparkles, IconCheck, IconInfo, IconCar, IconAlertTriangle } from '../IconComponents';
import { DQISection } from '../DQISection';
import { MethodologyWizard } from '../MethodologyWizard';
import { CATEGORY_FACTORS } from '../../constants/scope3/category{N}';
```

#### 4-7. 공통 CSS 클래스 (Row 컴포넌트 내부에서 정의)
```tsx
const commonSelectClass = "w-full bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
const commonInputClass = "w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
const commonLabelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";
```

---

## Phase 5: MethodologyWizard 확장

### 수정 파일: `src/components/MethodologyWizard.tsx`

추가해야 할 항목:
1. `QuestionId` 타입에 `q_cat{N}_1`, `q_cat{N}_2`, `q_cat{N}_3` 추가
2. `QUESTIONS` 배열에 카테고리별 질문 3개 추가
3. `RESULTS` 배열에 해당 카테고리의 산정법 결과 추가
4. `getResultContent` 함수에 카테고리별 상세 설명 추가
5. `currentQuestionId` 초기값 라우팅에 해당 카테고리 추가
6. `handleReset` 함수에 해당 카테고리 리셋 로직 추가

**질문 설계 기준 (PDF 기반):**
- Q1: "이 카테고리가 전체 Scope 3에서 중요한가?" → 예: 상세 방법 / 아니오: 간편 방법
- Q2: "공급자/업체의 직접 데이터가 있는가?" → 예: supplier_specific / 아니오: Q3
- Q3: "활동량(물량, 거리 등) 데이터가 있는가?" → 예: activity / 아니오: spend

---

## Phase 6: 계산 로직 통합

### 수정 파일: `src/components/MainCalculator.tsx`

`calculateEmissions` 함수 (또는 해당 카테고리의 계산 블록) 내에서:

1. 해당 `EmissionCategory` 분기 찾기
2. `switch (calcMethod)` 내에 모든 산정법의 계산 로직 구현
3. 배출계수는 `allFactors.{factorKey}` 에서 가져오기

**패턴 예시** (Category 5 참조):
```typescript
if (source.category === EmissionCategory.WasteGeneratedInOperations) {
  let scope3 = 0;
  const calcMethod = source.calculationMethod as Cat5CalculationMethod || 'activity';
  switch (calcMethod) {
    case 'supplier_specific':
      scope3 = source.supplierProvidedCO2e || 0;
      break;
    case 'spend':
      const totalSpend = source.monthlyQuantities.reduce((s, q) => s + q, 0);
      const spendFactorData = allFactors.scope3Waste.spend.find((f: any) => f.name === source.fuelType);
      const spendFactor = spendFactorData?.factors[source.unit] || 0;
      scope3 = totalSpend * spendFactor;
      break;
    case 'average':
      // 평균 산정법 로직
      break;
    case 'activity':
    default:
      // 활동 기반 로직
      break;
  }
  return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3 };
}
```

---

## Phase 7: 번역 키 추가

### 수정 파일: `src/translations/main.ts`

**반드시 영어(en)와 한국어(ko) 양쪽 모두에 추가!**

추가해야 할 키 패턴:
```typescript
// 산정법 설명
cat{N}MethodActivity: '활동량 기반 산정법 설명...',
cat{N}MethodSpend: '지출 기반 산정법 설명...',
cat{N}MethodSupplier: '공급자 특정 산정법 설명...',

// 카테고리별 고유 용어
cat{N}SpecificTerm: '한국어 용어',
```

---

## Phase 8: 빌드 및 검증

// turbo
```powershell
cd ghg-saas; npm run build
```

**빌드 실패 시 체크리스트:**
1. TypeScript 타입 에러 → `types.ts` 확인
2. import 에러 → 경로/파일명 확인
3. 번역 키 누락 → TranslationKey 타입 확인
4. 중복 변수명 → 다른 case 블록과 충돌 확인

---

## Phase 9: Git Push

```powershell
cd ghg-saas; git add . && git commit -m "feat(scope3): implement Category {N} - [카테고리명] with NIER guidelines" && git push origin main
```

---

## ⚠️ 주의사항 및 규칙

### 절대 하지 말 것
1. ❌ 기존 카테고리의 배출계수를 임의로 변경하지 말 것
2. ❌ `MainCalculator.tsx`의 다른 카테고리 로직을 건드리지 말 것
3. ❌ 번역 키를 한 언어에만 추가하지 말 것 (항상 en/ko 쌍으로)
4. ❌ `types.ts`의 기존 타입을 breaking change 없이 변경할 것

### 반드시 할 것
1. ✅ PDF에서 추출한 배출계수는 주석으로 출처와 단위를 기록
2. ✅ 에메랄드 색상 "방법론 선택 가이드" 버튼 스타일 통일
3. ✅ DQI 섹션 포함 (데이터 품질 지표)
4. ✅ 계산 결과 단위는 kgCO2e 통일 (UI 표시는 tCO2e)
5. ✅ 빌드 성공 확인 후에만 커밋
6. ✅ 다크모드 호환 스타일 적용

### 참조 우선순위 (디자인 및 코드 패턴)
1. **1순위**: Category 4/9 (Category4_9Row.tsx) - 운송 관련 카테고리의 표준 패턴
2. **2순위**: Category 5 (Category5Row.tsx) - 폐기물 카테고리 (가장 최근 고도화)
3. **3순위**: Category 6 (Category6Row.tsx) - 출장 카테고리

---

## 참고: 파일 위치 요약

```
ghg-saas/
├── src/
│   ├── types.ts                           # Phase 2: 타입 정의
│   ├── constants/
│   │   └── scope3/
│   │       ├── category{N}.ts             # Phase 3: 배출계수
│   │       └── index.ts                   # Phase 3: export 확인
│   ├── components/
│   │   ├── MainCalculator.tsx             # Phase 6: 계산 로직
│   │   ├── MethodologyWizard.tsx          # Phase 5: 위저드 확장
│   │   ├── DQISection.tsx                 # Phase 4: DQI (import만)
│   │   └── source_rows/
│   │       └── Category{N}Row.tsx         # Phase 4: UI 컴포넌트
│   └── translations/
│       └── main.ts                        # Phase 7: 번역 키
└── .agent/
    └── category{N}_implementation_plan.md # Phase 1: 구현 계획
```
