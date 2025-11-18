import { EmissionCategory } from '../types';

// Global Warming Potential (GWP) values from IPCC Fifth Assessment Report (AR5)
export const GWP_VALUES = {
  co2: 1,
  ch4: 28,
  n2o: 265,
};

export const ALL_SCOPE3_CATEGORIES: EmissionCategory[] = [
  EmissionCategory.PurchasedGoodsAndServices,
  EmissionCategory.CapitalGoods,
  EmissionCategory.FuelAndEnergyRelatedActivities,
  EmissionCategory.UpstreamTransportationAndDistribution,
  EmissionCategory.WasteGeneratedInOperations,
  EmissionCategory.BusinessTravel,
  EmissionCategory.EmployeeCommuting,
  EmissionCategory.UpstreamLeasedAssets,
  EmissionCategory.DownstreamTransportationAndDistribution,
  EmissionCategory.ProcessingOfSoldProducts,
  EmissionCategory.UseOfSoldProducts,
  EmissionCategory.EndOfLifeTreatmentOfSoldProducts,
  EmissionCategory.DownstreamLeasedAssets,
  EmissionCategory.Franchises,
  EmissionCategory.Investments,
];

// Predefined common facility types based on GHG Protocol guidance, grouped by scope
export const FACILITY_TYPES_BY_SCOPE: { [key: string]: { name: string, translationKey: string }[] } = {
    'Scope 1': [
        { name: 'Stationary Combustion Facility', translationKey: 'facilityTypeStationary' },
        { name: 'Mobile Combustion Facility', translationKey: 'facilityTypeMobile' },
        { name: 'Fugitive Emission Facility', translationKey: 'facilityTypeFugitive' },
        { name: 'Process Emission Facility', translationKey: 'facilityTypeProcess' },
    ],
    'Scope 2': [
        { name: 'Electricity Usage Facility', translationKey: 'facilityTypeElectricity' },
        { name: 'Steam Usage Facility', translationKey: 'facilityTypeSteam' },
    ],
};
