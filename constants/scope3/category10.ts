// Category 10
export const PROCESSING_SOLD_PRODUCTS_FACTORS_DETAILED = {
  activity: [
    { name: 'Chemical Processing', translationKey: 'chemProcessing', units: ['tonnes', 'kg', 'cubic meters'], factors: { 'tonnes': 250, 'kg': 0.25, 'cubic meters': 200 } },
    { name: 'Metal Forging', translationKey: 'metalForging', units: ['tonnes', 'kg'], factors: { 'tonnes': 400, 'kg': 0.4 } },
    { name: 'Rolling', translationKey: 'rolling', units: ['tonnes', 'kg'], factors: { 'tonnes': 150, 'kg': 0.15 } },
    { name: 'Heat Treatment', translationKey: 'heatTreatment', units: ['tonnes', 'kg'], factors: { 'tonnes': 300, 'kg': 0.3 } },
    { name: 'Assembly', translationKey: 'assembly', units: ['tonnes', 'kg', 'unit'], factors: { 'tonnes': 50, 'kg': 0.05, 'unit': 5 } },
    { name: 'Molding/Forming', translationKey: 'moldingForming', units: ['tonnes', 'kg'], factors: { 'tonnes': 200, 'kg': 0.2 } },
    { name: 'Welding', translationKey: 'welding', units: ['tonnes', 'kg'], factors: { 'tonnes': 100, 'kg': 0.1 } },
  ],
  spend: [
    { name: 'Downstream Processing Services (spend)', translationKey: 'downstreamProcessingSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.3, 'KRW': 0.00024 } },
  ]
};
