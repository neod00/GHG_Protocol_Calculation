---
description: Scope 3 카테고리별 데모 앱 생성 워크플로우
---

# Scope 3 Demo App 생성 워크플로우

## 사전 요구사항
- Category 1 데모 앱이 `ghg-saas/demo/` 에 이미 구축되어 있어야 함
- 해당 카테고리의 Row 컴포넌트가 원본 프로젝트에 존재해야 함

## 실행 방법
```
/create-scope3-demo [카테고리 번호]
예: /create-scope3-demo 4
```

---

## 1단계: 카테고리 정보 확인

해당 카테고리의 Row 컴포넌트 분석:
```
ghg-saas/src/components/source_rows/Category{N}Row.tsx
ghg-saas/src/constants/scope3/category{N}.ts
```

확인 사항:
- 계산 방법 (CalculationMethod) 종류
- 필요한 입력 필드
- 배출계수 데이터 구조
- 특수 UI 컴포넌트 (지도, 차트 등)

---

## 2단계: types.ts 업데이트

`ghg-saas/demo/src/types.ts` 파일에 해당 카테고리의 타입 추가:
- CalculationMethod 타입에 새로운 방법 추가
- 필요한 인터페이스 추가

---

## 3단계: constants 파일 복사/수정

// turbo
```powershell
Copy-Item "ghg-saas/src/constants/scope3/category{N}.ts" "ghg-saas/demo/src/constants/"
```

복사 후 수정:
- import 경로를 `../types` 로 변경
- 불필요한 의존성 제거

---

## 4단계: page.tsx 수정

`ghg-saas/demo/src/app/page.tsx` 에서:

1. 새 카테고리 import 추가
2. METHOD_OPTIONS 에 해당 카테고리 계산 방법 추가
3. CATEGORY_OPTIONS 에 해당 카테고리 옵션 추가 (필요시)
4. 해당 카테고리 전용 UI 컴포넌트 추가
5. 계산 로직 수정

---

## 5단계: 메타데이터 수정

`ghg-saas/demo/src/app/layout.tsx` 에서:
- title, description 수정
- 헤더 텍스트 수정

---

## 6단계: 빌드 테스트

// turbo
```powershell
cd ghg-saas/demo; npm run build
```

---

## 7단계: 로컬 테스트

// turbo
```powershell
cd ghg-saas/demo; npm run dev
```

브라우저에서 http://localhost:3000 확인

---

## 카테고리별 특이사항

| 카테고리 | 설명 | 특수 요구사항 |
|----------|------|---------------|
| Cat 1 | 구매한 제품 및 서비스 | 물질투입, 하이브리드 계산, 지출기반 |
| Cat 2 | 자본재 | Cat 1과 유사, 감가상각 고려 |
| Cat 3 | 연료/에너지 관련 | Scope 1,2 외 연료 상류 배출 |
| Cat 4 | 업스트림 운송 | 운송 모드, 거리, 중량 계산 |
| Cat 5 | 폐기물 처리 | 폐기물 유형, 처리 방법 |
| Cat 6 | 출장 | 교통수단, 거리, 숙박 |
| Cat 7 | 통근 | 교통수단, 거리, 근무일수 |
| Cat 8 | 임대자산 (업스트림) | 면적, 에너지 사용량 |
| Cat 9 | 다운스트림 운송 | 운송 모드, 거리 |
| Cat 10 | 제품 가공 | 에너지 사용량 |
| Cat 11 | 제품 사용 | 제품 수명, 에너지 소비 |
| Cat 12 | 제품 폐기 처리 | 폐기물 유형, 처리 방법 |
| Cat 13 | 임대자산 (다운스트림) | 면적, 에너지 사용량 |
| Cat 14 | 프랜차이즈 | 매출, 면적 |
| Cat 15 | 투자 | 투자금액, 기업 배출량 |

---

## 디자인 원칙

1. **다크모드 고정** - 테마 토글 없음
2. **한국어만** - 영어 버전 없음
3. **데이터 미저장 강조** - 상단 배너 + 하단 안내
4. **CTA 이메일** - openbrain.main@gmail.com
5. **원본 UI 스타일** - gray-950 배경, teal 액센트

---

## 참고 파일

- Category 1 데모 참조: `ghg-saas/demo/src/app/page.tsx`
- 원본 Row 컴포넌트: `ghg-saas/src/components/source_rows/`
- 배출계수 DB: `ghg-saas/src/constants/scope3/`
