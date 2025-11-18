import { CO2eFactorFuel } from '../../types';

// Category 4 & 9: Detailed factors by mode and vehicle type (kg CO2e / tonne-km)
// Source: GLEC Framework, DEFRA
export const TRANSPORTATION_FACTORS_BY_MODE = {
  Road: {
    'Light-duty Truck': { factor: 0.18, translationKey: 'roadLightTruck' },
    'Medium-duty Truck': { factor: 0.12, translationKey: 'roadMediumTruck' },
    'Heavy-duty Truck': { factor: 0.08, translationKey: 'roadHeavyTruck' },
    'Delivery Van': { factor: 0.28, translationKey: 'roadDeliveryVan' },
    'Motorcycle (for delivery)': { factor: 0.65, translationKey: 'roadMotorcycleDelivery' },
  },
  Sea: {
    'Container Ship': { factor: 0.008, translationKey: 'seaContainerShip' },
    'Bulk Carrier': { factor: 0.005, translationKey: 'seaBulkCarrier' },
    'Oil Tanker': { factor: 0.006, translationKey: 'seaOilTanker' },
  },
  Air: {
    'Short-haul Cargo Flight (<1500 km)': { factor: 0.9, translationKey: 'airShortHaulCargo' },
    'Long-haul Cargo Flight (>1500 km)': { factor: 0.6, translationKey: 'airLongHaulCargo' },
  },
  Rail: {
    'Diesel Freight Train': { factor: 0.02, translationKey: 'railDieselTrain' },
    'Electric Freight Train': { factor: 0.01, translationKey: 'railElectricTrain' },
  }
};

export const TRANSPORTATION_SPEND_FACTORS: CO2eFactorFuel[] = [
    { name: 'Freight Forwarding Services (spend)', translationKey: 'freightSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.4, 'KRW': 0.00032 } },
    { name: 'Warehousing and Storage (spend)', translationKey: 'warehousingSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.2, 'KRW': 0.00016 } },
];
