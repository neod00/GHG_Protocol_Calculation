# TRD: AI-Native GHG Consulting Platform (AUI MVP)

## 1. 시스템 아키텍처 개요
기존 Next.js 프론트엔드와 Supabase 백엔드 사이에 **AI Orchestration Layer**를 추가하여 에이전트 기능을 구현합니다.

## 2. 주요 기술 컴포넌트

### A. AI Chat Interface (Frontend)
- **위치:** `src/components/AUI/ChatContainer.tsx` (신규 생성)
- **기능:** 
    - 메시지 스트리밍 (Vercel AI SDK 추천)
    - 파일 업로드 핸들링
    - Contextual Dashboard Interaction (채팅 내용에 따라 대시보드 UI 하이라이트/변경)

### B. LLM & Function Calling (Backend)
- **모델:** GPT-4o (복잡한 추론 및 Tool Use에 최적화)
- **Tools (Functions) 정의:**
    - `get_emissions_data()`: 현재 DB의 배출량 데이터 조회
    - `add_emission_entry(category, source, amount, unit)`: 배출량 데이터 입력 프로토콜
    - `search_guidelines(query)`: RAG를 통한 가이드라인 검색
    - `generate_report_text()`: 보고서 분석 텍스트 생성

### C. RAG (Retrieval-Augmented Generation)
- **데이터 소스:** `ghg-protocol-revised.pdf`, `CSES_Scope3_Guidebook.pdf` 등
- **구현 방식:**
    - PDF 텍스트 추출 및 Chunking
    - Supabase Vector (pgvector) 또는 Pinecone을 이용한 임베딩 저장
    - 사용자의 질문과 유사도가 높은 문서를 검색하여 LLM 프롬프트에 포함

### D. 데이터 동기화 (State Management)
- **Flow:** AI 입력 제안 -> 사용자의 React 상태 반영 (MainCalculator Context) -> 최종 DB 저장.
- AI가 직접 DB를 수정하기보다는, 프론트엔드의 **'입력 폼 채우기'** 기능을 먼저 수행하여 사용자 검토 단계를 거침.

## 3. API 엔드포인트 설계
- `POST /api/chat`: 사용자 메시지 및 세션 정보 전송
- `POST /api/vector-search`: 가이드라인 검색 전용 엔드포인트
- `POST /api/analyze-file`: 업로드된 파일(PDF, Excel) 분석 및 JSON 변환

## 4. 데이터베이스 및 저장소
- **Supabase Storage:** 업로드된 원본 영수증/증빙 서류 저장.
- **Prisma SQL:** AI와의 대화 이력(Chat History) 및 산정 데이터 연동.

## 5. 단계별 개발 로드맵
1. **Phase 1:** 기본 채팅 UI 구축 및 GPT-4o 연결.
2. **Phase 2:** PDF 가이드라인 벡터화 및 RAG 상담 기능 구현.
3. **Phase 3:** Function Calling을 통한 `MainCalculator` 데이터 입력 연동.
4. **Phase 4:** 분석 결과 텍스트 자동 생성 및 보고서 모듈 통합.
