import { CO2eFactorFuel } from '../../types';

// ============================================================================
// Category 4: Upstream Transportation and Distribution - Emission Factors
// ============================================================================
// Data Sources:
// - GLEC Framework (Global Logistics Emissions Council)
// - DEFRA UK GHG Conversion Factors 2023
// - US EPA GHG Emission Factors Hub
// - KR-LCI (Korea Environmental Industry & Technology Institute)
// ============================================================================

// ----------------------------------------------------------------------------
// 1. TRANSPORTATION - Distance-based (kg CO2e per tonne-km)
// ----------------------------------------------------------------------------

export const TRANSPORT_ROAD: CO2eFactorFuel[] = [
    { name: 'Light-duty Truck (<3.5t)', translationKey: 'roadLightTruck', units: ['tonne-km'], factors: { 'tonne-km': 0.18 }, isCustom: false, source: 'GLEC' },
    { name: 'Medium-duty Truck (3.5-12t)', translationKey: 'roadMediumTruck', units: ['tonne-km'], factors: { 'tonne-km': 0.12 }, isCustom: false, source: 'GLEC' },
    { name: 'Heavy-duty Truck (>12t)', translationKey: 'roadHeavyTruck', units: ['tonne-km'], factors: { 'tonne-km': 0.08 }, isCustom: false, source: 'GLEC' },
    { name: 'Delivery Van', translationKey: 'roadDeliveryVan', units: ['tonne-km'], factors: { 'tonne-km': 0.28 }, isCustom: false, source: 'DEFRA' },
    { name: 'Motorcycle (Delivery)', translationKey: 'roadMotorcycleDelivery', units: ['tonne-km'], factors: { 'tonne-km': 0.65 }, isCustom: false, source: 'DEFRA' },
];

export const TRANSPORT_SEA: CO2eFactorFuel[] = [
    { name: 'Container Ship - Average', translationKey: 'seaContainerShip', units: ['tonne-km'], factors: { 'tonne-km': 0.008 }, isCustom: false, source: 'GLEC' },
    { name: 'Bulk Carrier', translationKey: 'seaBulkCarrier', units: ['tonne-km'], factors: { 'tonne-km': 0.005 }, isCustom: false, source: 'GLEC' },
    { name: 'Oil Tanker', translationKey: 'seaOilTanker', units: ['tonne-km'], factors: { 'tonne-km': 0.006 }, isCustom: false, source: 'GLEC' },
    { name: 'General Cargo Ship', translationKey: 'seaGeneralCargo', units: ['tonne-km'], factors: { 'tonne-km': 0.012 }, isCustom: false, source: 'GLEC' },
];

export const TRANSPORT_AIR: CO2eFactorFuel[] = [
    { name: 'Short-haul Cargo Flight (<1500 km)', translationKey: 'airShortHaulCargo', units: ['tonne-km'], factors: { 'tonne-km': 0.9 }, isCustom: false, source: 'GLEC' },
    { name: 'Long-haul Cargo Flight (>1500 km)', translationKey: 'airLongHaulCargo', units: ['tonne-km'], factors: { 'tonne-km': 0.6 }, isCustom: false, source: 'GLEC' },
];

export const TRANSPORT_RAIL: CO2eFactorFuel[] = [
    { name: 'Diesel Freight Train', translationKey: 'railDieselTrain', units: ['tonne-km'], factors: { 'tonne-km': 0.02 }, isCustom: false, source: 'GLEC' },
    { name: 'Electric Freight Train', translationKey: 'railElectricTrain', units: ['tonne-km'], factors: { 'tonne-km': 0.01 }, isCustom: false, source: 'GLEC' },
];

// ----------------------------------------------------------------------------
// 2. DISTRIBUTION / WAREHOUSING - Activity-based
// ----------------------------------------------------------------------------

export const CAT4_WAREHOUSE_FACTORS: Record<string, number> = {
    'Ambient Warehouse (Average)': 0.002,
    'Chilled Warehouse': 0.015,
    'Frozen Warehouse': 0.045
};

// Site-based factors (kg CO2e per unit of energy/refrigerant) - reused from S1/S2
// These are used when the user allocates actual site energy to the products.

// Average-data factors (kg CO2e per volume or weight per day)
export const DISTRIBUTION_WAREHOUSING: CO2eFactorFuel[] = [
    { name: 'Ambient Warehouse (Average)', translationKey: 'warehouseAmbient', units: ['m³-day', 'kg-day'], factors: { 'm³-day': 0.002, 'kg-day': 0.0001 }, isCustom: false, source: 'DEFRA' },
    { name: 'Chilled Warehouse', translationKey: 'warehouseChilled', units: ['m³-day', 'kg-day'], factors: { 'm³-day': 0.015, 'kg-day': 0.0008 }, isCustom: false, source: 'DEFRA' },
    { name: 'Frozen Warehouse', translationKey: 'warehouseFrozen', units: ['m³-day', 'kg-day'], factors: { 'm³-day': 0.045, 'kg-day': 0.0025 }, isCustom: false, source: 'DEFRA' },
];

// ----------------------------------------------------------------------------
// 3. SPEND-BASED FACTORS (kg CO2e per currency unit)
// ----------------------------------------------------------------------------

export const TRANSPORT_SPEND_BASED: CO2eFactorFuel[] = [
    { name: 'Freight Forwarding Services', translationKey: 'freightSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.4, 'KRW': 0.00032 }, isCustom: false, source: 'EEIO' },
    { name: 'Postal and Courier Services', translationKey: 'courierSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.35, 'KRW': 0.00028 }, isCustom: false, source: 'EEIO' },
    { name: 'Warehousing and Storage Services', translationKey: 'warehousingSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.2, 'KRW': 0.00016 }, isCustom: false, source: 'EEIO' },
];

// ----------------------------------------------------------------------------
// AGGREGATED EXPORT
// ----------------------------------------------------------------------------

export const CATEGORY4_FACTORS_BY_TYPE = {
    transport: {
        road: TRANSPORT_ROAD,
        sea: TRANSPORT_SEA,
        air: TRANSPORT_AIR,
        rail: TRANSPORT_RAIL,
    },
    distribution: DISTRIBUTION_WAREHOUSING,
    spend: TRANSPORT_SPEND_BASED,
};

export const ALL_CATEGORY4_FACTORS: CO2eFactorFuel[] = [
    ...TRANSPORT_ROAD,
    ...TRANSPORT_SEA,
    ...TRANSPORT_AIR,
    ...TRANSPORT_RAIL,
    ...DISTRIBUTION_WAREHOUSING,
    ...TRANSPORT_SPEND_BASED,
];
