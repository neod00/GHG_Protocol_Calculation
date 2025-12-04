// Category 8 & 13: Detailed factors for Leased Assets
// Source for energy intensity: CIBSE Guide F, US EIA CBECS. Simplified and averaged.
export const LEASED_ASSETS_FACTORS_DETAILED = {
  area_based: { // Factors are in kWh / m2 / year
    Office: { factor: 250, translationKey: 'buildingTypeOffice' },
    Warehouse: { factor: 100, translationKey: 'buildingTypeWarehouse' },
    Factory: { factor: 450, translationKey: 'buildingTypeFactory' },
    Retail: { factor: 350, translationKey: 'buildingTypeRetail' },
    DataCenter: { factor: 1500, translationKey: 'buildingTypeDataCenter' },
  },
  spend_based: [
    { name: 'Building/Office Lease (spend)', translationKey: 'buildingLeaseSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.1, 'KRW': 0.00008 } },
    { name: 'Vehicle/Equipment Lease (spend)', translationKey: 'vehicleLeaseSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.3, 'KRW': 0.00024 } },
  ]
};
