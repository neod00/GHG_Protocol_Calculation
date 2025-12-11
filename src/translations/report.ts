
export const en = {
  // Report Generator
  ghgReportTitle: 'GHG Emissions Inventory Report',
  downloadPDF: 'Print / Save as PDF',
  close: 'Close',
  
  // Cover & TOC
  reportSubtitle: 'Corporate Greenhouse Gas Inventory',
  preparedFor: 'Prepared For',
  reportingPeriod: 'Reporting Period',
  publicationDate: 'Publication Date',
  tocTitle: 'Table of Contents',

  // Executive Summary
  execSummaryTitle: 'Executive Summary',
  execSummaryText: 'This report details the greenhouse gas (GHG) emissions inventory for {company} for the reporting period of {year}. The inventory has been calculated in accordance with the GHG Protocol Corporate Accounting and Reporting Standard.',
  totalEmissions: 'Total Emissions',
  scope1Total: 'Scope 1',
  scope2LocTotal: 'Scope 2 (Location-based)',
  scope2MktTotal: 'Scope 2 (Market-based)',
  scope3Total: 'Scope 3',
  // 녹색프리미엄 관련
  greenPremiumTreatment: 'Green Premium Treatment Method',
  greenPremiumAsRenewableText: 'In this report\'s market-based Scope 2 calculation, Green Premium is treated as a renewable energy contract and {factor} is applied.',
  greenPremiumKETSWarning: 'This treatment relies on the interpretation of GHG Protocol Scope 2 quality criteria, and some stakeholders and regulations (e.g., K-ETS) may not recognize this as emission reduction.',
  greenPremiumNotAsRenewableText: 'Green Premium is not reflected as emission reduction. Residual mix or grid average emission factor is applied in market-based calculation.',
  supplierProvidedFactor: 'Supplier-provided emission factor',
  zeroEmission: 'Zero emission',
  intensityMetric: 'Emission Intensity',
  biogenicEmissions: 'Biogenic CO₂ Emissions (Reported Separately)',
  
  // Chapter 1: Introduction
  ch1Title: '1. Introduction',
  ch1Purpose: '1.1 Purpose of Report',
  ch1PurposeText: 'The purpose of this report is to quantify and report the GHG emissions of {company} to support internal climate strategy, stakeholder communication, and compliance requirements.',
  ch1Standards: '1.2 Reporting Standards',
  ch1StandardsText: 'This inventory follows the methodologies outlined in:',
  std1: 'GHG Protocol Corporate Accounting and Reporting Standard (Revised Edition)',
  std2: 'GHG Protocol Corporate Value Chain (Scope 3) Accounting and Reporting Standard',
  ch1Principles: '1.3 Reporting Principles',
  ch1PrinciplesText: 'This report adheres to the five core principles of the GHG Protocol:',
  principle1: 'Relevance: Ensure the GHG inventory appropriately reflects the GHG emissions of the company and serves the decision-making needs of users.',
  principle2: 'Completeness: Account for and report on all GHG emission sources and activities within the chosen inventory boundary.',
  principle3: 'Consistency: Use consistent methodologies to allow for meaningful comparisons of emissions over time.',
  principle4: 'Transparency: Address all relevant issues in a factual and coherent manner, based on a clear audit trail.',
  principle5: 'Accuracy: Ensure that the quantification of GHG emissions is systematically neither over nor under actual emissions.',

  // Chapter 2: Organizational Boundaries
  ch2Title: '2. Organizational Boundaries',
  ch2Approach: '2.1 Consolidation Approach',
  ch2ApproachText: 'Organizational boundaries determine which business units are included in the inventory. {company} uses the <strong>{approach}</strong> approach.',
  opControlDef: 'Under the Operational Control approach, the company accounts for 100% of emissions from operations over which it has the full authority to introduce and implement its operating policies.',
  finControlDef: 'Under the Financial Control approach, the company accounts for 100% of emissions from operations over which it has the ability to direct financial and operating policies with a view to gaining economic benefits.',
  equityShareDef: 'Under the Equity Share approach, the company accounts for GHG emissions from operations according to its share of equity in the operation.',
  ch2Facilities: '2.2 List of Consolidated Facilities',
  facilityName: 'Facility Name',
  facilityRole: 'Role/Group',
  equityShare: 'Equity Share',
  
  // Chapter 3: Operational Boundaries
  ch3Title: '3. Operational Boundaries',
  ch3Intro: 'Operational boundaries involve identifying emissions associated with the company\'s operations, categorized into three Scopes.',
  scope1Def: 'Direct GHG emissions from sources owned or controlled by the company (e.g., combustion in boilers, vehicles).',
  scope2Def: 'Indirect GHG emissions from the generation of purchased electricity, steam, heating, and cooling consumed by the company.',
  scope3Def: 'All other indirect emissions that occur in the value chain, including both upstream and downstream activities.',
  ch3Inclusions: '3.1 Included Emissions Sources',
  
  // Chapter 4: Methodology
  ch4Title: '4. Quantification Methodologies',
  ch4Method: '4.1 Calculation Method',
  ch4MethodText: 'Emissions are calculated using the formula: <em>Activity Data × Emission Factor × GWP = CO₂e</em>.',
  ch4GWP: '4.2 Global Warming Potentials (GWP)',
  ch4GWPText: 'CO₂ equivalent (CO₂e) emissions are calculated using GWP values from the IPCC Fifth Assessment Report (AR5).',
  ch4Sources: '4.3 Emission Factor Sources',
  ch4SourcesText: 'Emission factors are derived from recognized databases including US EPA GHG Emission Factors Hub, UK DEFRA, IEA, and national statistics.',
  
  // Chapter 5: Results
  ch5Title: '5. Emissions Inventory Results',
  ch5Summary: '5.1 Overall Emissions Summary',
  ch5Scope1: '5.2 Scope 1: Direct Emissions',
  ch5Scope2: '5.3 Scope 2: Indirect Energy Emissions',
  ch5Scope2Note: 'In accordance with the GHG Protocol Scope 2 Guidance, emissions are reported using both the Location-based method (grid average) and the Market-based method (contractual instruments).',
  ch5Scope3: '5.4 Scope 3: Value Chain Emissions',
  category: 'Category',
  emissions: 'Emissions (tCO₂e)',
  share: 'Share (%)',
  
  // Chapter 6: Data Quality
  ch6Title: '6. Data Quality and Uncertainty',
  ch6Assessment: '6.1 Data Quality Assessment',
  ch6Text: 'Data quality is assessed based on the proportion of primary (activity-based) data versus secondary (spend-based/proxy) data.',
  primaryData: 'Primary Data (Activity-based)',
  secondaryData: 'Secondary Data (Spend/Average)',
  dataQualityHigh: 'High Quality: Majority of data is derived from direct measurement or primary usage records (e.g., utility bills, fuel logs).',
  dataQualityMed: 'Medium Quality: Mix of primary data and estimated/spend-based data.',
  dataQualityLow: 'Low Quality: Significant reliance on spend-based estimation or industry averages.',
  
  // Chapter 7: Base Year
  ch7Title: '7. Base Year & Recalculation Policy',
  ch7BaseYear: '7.1 Base Year',
  ch7BaseYearText: 'The base year for this inventory is <strong>{year}</strong>. This year was selected as it represents the first year with reliable, comprehensive data availability.',
  ch7Policy: '7.2 Recalculation Policy',
  ch7PolicyText: 'Base year emissions shall be recalculated if structural changes (mergers, acquisitions, divestitures) or methodology changes result in a significant cumulative impact (e.g., >5%) on the total base year emissions inventory.',
  
  // Footer
  generatedBy: 'Generated by GHG Protocol Calculator',
  page: 'Page',
};

export const ko = {
  // Report Generator
  ghgReportTitle: '온실가스 인벤토리 보고서',
  downloadPDF: '인쇄 / PDF 저장',
  close: '닫기',

  // Cover & TOC
  reportSubtitle: '기업 온실가스 배출량 명세서',
  preparedFor: '작성 대상 기업',
  reportingPeriod: '보고 기간',
  publicationDate: '발행일',
  tocTitle: '목차',

  // Executive Summary
  execSummaryTitle: '총괄 요약 (Executive Summary)',
  execSummaryText: '본 보고서는 {year}년도 {company}의 온실가스(GHG) 배출량 인벤토리를 기술합니다. 본 인벤토리는 GHG Protocol 기업 산정 및 보고 표준에 의거하여 작성되었습니다.',
  totalEmissions: '총 배출량',
  scope1Total: 'Scope 1 (직접 배출)',
  scope2LocTotal: 'Scope 2 (지역 기반)',
  scope2MktTotal: 'Scope 2 (시장 기반)',
  scope3Total: 'Scope 3 (기타 간접 배출)',
  // 녹색프리미엄 관련
  greenPremiumTreatment: '녹색프리미엄 처리 방법',
  greenPremiumAsRenewableText: '본 보고서의 market-based Scope 2 산정에는 녹색프리미엄을 재생에너지 계약수단으로 간주하여 {factor}을 적용하였음.',
  greenPremiumKETSWarning: '이 처리는 GHG Protocol Scope 2 품질 기준 해석에 의존하며, 일부 이해관계자 및 제도 (K-ETS 등)는 이를 감축 실적으로 인정하지 않을 수 있음.',
  greenPremiumNotAsRenewableText: '녹색프리미엄은 배출량 감축으로 반영되지 않음. 시장기반 산정에서 Residual mix 또는 계통 평균 배출계수를 적용하였음.',
  supplierProvidedFactor: '공급사 제공 배출계수',
  zeroEmission: '0 배출',
  intensityMetric: '배출 집약도',
  biogenicEmissions: '생물성 CO₂ 배출 (별도 보고)',

  // Chapter 1: Introduction
  ch1Title: '1. 보고 개요',
  ch1Purpose: '1.1 보고 목적',
  ch1PurposeText: '본 보고서의 목적은 {company}의 온실가스 배출량을 정량화하여 내부 기후 전략 수립, 이해관계자 소통 및 규제 준수를 지원하는 데 있습니다.',
  ch1Standards: '1.2 적용 기준',
  ch1StandardsText: '본 인벤토리는 다음 표준 방법론을 따릅니다:',
  std1: 'GHG Protocol 기업 산정 및 보고 표준 (개정판)',
  std2: 'GHG Protocol 기업 가치사슬(Scope 3) 산정 및 보고 표준',
  ch1Principles: '1.3 보고 원칙',
  ch1PrinciplesText: '본 보고서는 GHG Protocol의 5대 핵심 원칙을 준수합니다:',
  principle1: '관련성(Relevance): 회사의 GHG 배출 현황을 적절히 반영하고 의사결정에 필요한 정보를 제공한다.',
  principle2: '완전성(Completeness): 설정된 경계 내의 모든 GHG 배출원과 활동을 누락 없이 산정 및 보고한다.',
  principle3: '일관성(Consistency): 시간 경과에 따른 배출량 비교가 가능하도록 일관된 방법론을 사용한다.',
  principle4: '투명성(Transparency): 명확한 감사 추적(Audit Trail)을 바탕으로 모든 관련 이슈를 사실에 입각하여 기술한다.',
  principle5: '정확성(Accuracy): 실제 배출량이 과대 또는 과소 평가되지 않도록 체계적으로 산정한다.',

  // Chapter 2: Organizational Boundaries
  ch2Title: '2. 조직 경계',
  ch2Approach: '2.1 연결 기준 (Consolidation Approach)',
  ch2ApproachText: '조직 경계는 인벤토리에 포함될 사업 단위를 결정합니다. {company}는 <strong>{approach}</strong> 기준을 적용합니다.',
  opControlDef: '운영 통제(Operational Control) 접근법에 따라, 회사가 운영 정책을 도입하고 시행할 수 있는 완전한 권한을 가진 사업장의 배출량을 100% 산정합니다.',
  finControlDef: '재무 통제(Financial Control) 접근법에 따라, 회사가 경제적 효익을 얻기 위해 재무 및 운영 정책을 지시할 수 있는 사업장의 배출량을 100% 산정합니다.',
  equityShareDef: '지분율(Equity Share) 접근법에 따라, 각 사업장에 대한 회사의 지분 비율만큼 배출량을 산정합니다.',
  ch2Facilities: '2.2 포함된 사업장 목록',
  facilityName: '시설명',
  facilityRole: '역할/그룹',
  equityShare: '지분율',

  // Chapter 3: Operational Boundaries
  ch3Title: '3. 운영 경계',
  ch3Intro: '운영 경계는 회사 운영과 관련된 배출원을 식별하고 3가지 Scope로 분류하는 과정을 포함합니다.',
  scope1Def: 'Scope 1 (직접 배출): 회사가 소유하거나 통제하는 배출원에서 발생하는 직접적인 온실가스 배출 (예: 보일러 연소, 차량 운행).',
  scope2Def: 'Scope 2 (간접 에너지 배출): 회사가 구매하여 소비한 전기, 스팀, 냉난방의 생산 과정에서 발생하는 간접 배출.',
  scope3Def: 'Scope 3 (기타 간접 배출): 가치사슬 내에서 발생하는 모든 기타 간접 배출 (업스트림 및 다운스트림 활동 포함).',
  ch3Inclusions: '3.1 포함된 배출원',

  // Chapter 4: Methodology
  ch4Title: '4. 산정 방법론',
  ch4Method: '4.1 산정 방식',
  ch4MethodText: '배출량은 다음 공식을 사용하여 산정됩니다: <em>활동자료 × 배출계수 × GWP = CO₂e</em>.',
  ch4GWP: '4.2 지구온난화지수 (GWP)',
  ch4GWPText: '이산화탄소 환산량(CO₂e)은 IPCC 제5차 평가보고서(AR5)의 GWP 값을 적용하여 산출됩니다.',
  ch4Sources: '4.3 배출계수 출처',
  ch4SourcesText: '배출계수는 미국 EPA, 영국 DEFRA, IEA 및 국가 통계 등 국제적으로 인정받는 데이터베이스를 참조하였습니다.',

  // Chapter 5: Results
  ch5Title: '5. 배출량 산정 결과',
  ch5Summary: '5.1 배출량 총괄 요약',
  ch5Scope1: '5.2 Scope 1: 직접 배출 상세',
  ch5Scope2: '5.3 Scope 2: 간접 에너지 배출 상세',
  ch5Scope2Note: 'GHG Protocol Scope 2 지침에 따라, 위치 기반(Location-based, 전력망 평균)과 시장 기반(Market-based, 계약 상품) 방식을 모두 보고합니다.',
  ch5Scope3: '5.4 Scope 3: 가치사슬 배출 상세',
  category: '카테고리',
  emissions: '배출량 (tCO₂e)',
  share: '비중 (%)',

  // Chapter 6: Data Quality
  ch6Title: '6. 데이터 품질 및 불확실성',
  ch6Assessment: '6.1 데이터 품질 평가',
  ch6Text: '데이터 품질은 전체 데이터 중 1차 데이터(활동량 기반)와 2차 데이터(비용 기반/추정치)의 비율을 기준으로 평가되었습니다.',
  primaryData: '1차 데이터 (활동량 기반)',
  secondaryData: '2차 데이터 (비용/평균값)',
  dataQualityHigh: '높음: 대부분의 데이터가 고지서, 계측기 등 직접 측정된 활동자료에 기반함.',
  dataQualityMed: '보통: 활동자료와 비용 기반 추정치가 혼합되어 사용됨.',
  dataQualityLow: '낮음: 산업 평균이나 비용 기반 추정치에 대한 의존도가 높음.',

  // Chapter 7: Base Year
  ch7Title: '7. 기준연도 및 재산정 정책',
  ch7BaseYear: '7.1 기준연도',
  ch7BaseYearText: '본 인벤토리의 기준연도는 <strong>{year}</strong>년입니다. 해당 연도는 신뢰할 수 있고 포괄적인 데이터 확보가 가능한 첫 해로 선정되었습니다.',
  ch7Policy: '7.2 재산정 정책',
  ch7PolicyText: '구조적 변화(합병, 인수, 매각) 또는 방법론의 변경으로 인해 기준연도 총 배출량에 유의미한 영향(예: 5% 이상)이 발생할 경우, 기준연도 배출량을 재산정합니다.',

  // Footer
  generatedBy: 'GHG Protocol Calculator에 의해 생성됨',
  page: 'Page',
};
