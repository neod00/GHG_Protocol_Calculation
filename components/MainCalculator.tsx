// Fix: Corrected typo in React import
import React, { useState, useMemo, useEffect, useCallback } from 'react';
// Fix: Import 'EditableCO2eFactorFuel' to resolve type error.
import { EmissionCategory, EmissionSource, Refrigerant, Facility, BoundaryApproach, EditableRefrigerant, EditableCO2eFactorFuel, CO2eFactorFuel, TransportMode, Cat5CalculationMethod, WasteType, TreatmentMethod, Cat6CalculationMethod, BusinessTravelMode, EmployeeCommutingMode, PersonalCarType, PublicTransportType, Cat7CalculationMethod, Cat8CalculationMethod, BuildingType, LeasedAssetType, Cat4CalculationMethod, Cat10CalculationMethod } from '../types';
import { 
    STATIONARY_FUELS, MOBILE_FUELS, PROCESS_MATERIALS, FUGITIVE_GASES, SCOPE2_ENERGY_SOURCES, WASTE_SOURCES, 
    EMPLOYEE_COMMUTING_FACTORS_DETAILED,
    PURCHASED_GOODS_SERVICES_FACTORS, CAPITAL_GOODS_FACTORS, FUEL_ENERGY_ACTIVITIES_FACTORS,
    TRANSPORTATION_FACTORS_BY_MODE, TRANSPORTATION_SPEND_FACTORS, LEASED_ASSETS_FACTORS_DETAILED, PROCESSING_SOLD_PRODUCTS_FACTORS_DETAILED,
    USE_SOLD_PRODUCTS_FACTORS, END_OF_LIFE_TREATMENT_FACTORS, FRANCHISES_FACTORS, INVESTMENTS_FACTORS,
    SCOPE2_FACTORS_BY_REGION,
    PURCHASED_ENERGY_UPSTREAM_FACTORS,
    WASTE_TREATMENT_FACTORS, WASTE_SPEND_FACTORS,
    BUSINESS_TRAVEL_FACTORS_DETAILED,
    WASTE_FACTORS_DETAILED
} from '../constants';
import { ResultsDisplay } from './ResultsDisplay';
import { useTranslation } from '../LanguageContext';
import { FactorManager } from './FactorManager';
import { BoundarySetupWizard } from './BoundarySetupWizard';
import { ReportGenerator } from './ReportGenerator';
import { Scope1Calculator } from './Scope1Calculator';
import { Scope2Calculator } from './Scope2Calculator';
import { Scope3Calculator } from './Scope3Calculator';

const allCategories = Object.values(EmissionCategory);

const CORPORATE_FACILITY_ID = 'corporate-level-facility';

const initialSources: { [key in EmissionCategory]: EmissionSource[] } = allCategories.reduce((acc, cat) => {
    acc[cat] = [];
    return acc;
}, {} as { [key in EmissionCategory]: EmissionSource[] });

interface Scope3Settings {
    isEnabled: boolean;
    enabledCategories: EmissionCategory[];
}

type ActiveTab = 'scope1' | 'scope2' | 'scope3';

type FactorCategoryKey = 'stationary' | 'mobile' | 'process' | 'fugitive' | 'waste' | 'scope2' | 'purchasedGoods' | 'capitalGoods' | 'fuelEnergy' | 'upstreamTransport' | 'downstreamTransport' | 'scope3Waste' | 'businessTravel' | 'employeeCommuting' | 'upstreamLeased' | 'downstreamLeased' | 'processingSold' | 'useSold' | 'endOfLife' | 'franchises' | 'investments';

// Fix: Add a data migration function to ensure all custom factors loaded from localStorage have a unique ID.
// This retroactively fixes old data that was saved without an ID, resolving the bug where they couldn't be deleted.
const ensureIdsForCustomFactors = <T extends { id?: string; isCustom?: boolean; name: string }>(factors: T[]): T[] => {
  if (!Array.isArray(factors)) {
      // Handle cases where localStorage might contain invalid data
      console.error("Invalid factor data detected. Expected an array.", factors);
      return [];
  }
  return factors.map(factor => {
    // Check if it's a custom factor that lacks an ID
    if (factor.isCustom && !factor.id) {
      // Generate a reasonably unique ID
      const newId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return { ...factor, id: newId };
    }
    return factor;
  });
};

const factorConfig = {
    stationary: { key: 'ghg-calc-stationaryFuels', default: STATIONARY_FUELS },
    mobile: { key: 'ghg-calc-mobileFuels', default: MOBILE_FUELS },
    process: { key: 'ghg-calc-processMaterials', default: PROCESS_MATERIALS },
    fugitive: { key: 'ghg-calc-fugitiveGases', default: FUGITIVE_GASES },
    waste: { key: 'ghg-calc-wasteSources', default: WASTE_SOURCES },
    scope2: { key: 'ghg-calc-scope2EnergySources', default: SCOPE2_ENERGY_SOURCES },
    purchasedGoods: { key: 'ghg-calc-purchasedGoodsFactors', default: PURCHASED_GOODS_SERVICES_FACTORS },
    capitalGoods: { key: 'ghg-calc-capitalGoodsFactors', default: CAPITAL_GOODS_FACTORS },
    fuelEnergy: { key: 'ghg-calc-fuelEnergyActivitiesFactors', default: FUEL_ENERGY_ACTIVITIES_FACTORS },
    upstreamTransport: { key: 'ghg-calc-upstreamTransportationDistributionFactors', default: TRANSPORTATION_FACTORS_BY_MODE },
    downstreamTransport: { key: 'ghg-calc-downstreamTransportationDistributionFactors', default: TRANSPORTATION_FACTORS_BY_MODE },
    scope3Waste: { key: 'ghg-calc-scope3WasteFactors', default: WASTE_FACTORS_DETAILED },
    businessTravel: { key: 'ghg-calc-businessTravelFactors', default: BUSINESS_TRAVEL_FACTORS_DETAILED },
    employeeCommuting: { key: 'ghg-calc-employeeCommutingFactors', default: EMPLOYEE_COMMUTING_FACTORS_DETAILED },
    upstreamLeased: { key: 'ghg-calc-upstreamLeasedAssetsFactors', default: LEASED_ASSETS_FACTORS_DETAILED },
    downstreamLeased: { key: 'ghg-calc-downstreamLeasedAssetsFactors', default: LEASED_ASSETS_FACTORS_DETAILED },
    processingSold: { key: 'ghg-calc-processingSoldProductsFactors', default: PROCESSING_SOLD_PRODUCTS_FACTORS_DETAILED },
    useSold: { key: 'ghg-calc-useSoldProductsFactors', default: USE_SOLD_PRODUCTS_FACTORS },
    endOfLife: { key: 'ghg-calc-endOfLifeTreatmentFactors', default: END_OF_LIFE_TREATMENT_FACTORS },
    franchises: { key: 'ghg-calc-franchisesFactors', default: FRANCHISES_FACTORS },
    investments: { key: 'ghg-calc-investmentsFactors', default: INVESTMENTS_FACTORS },
};

const getInitialFactors = () => {
    const loadedFactors: { [key in FactorCategoryKey]?: any } = {};
    for (const [categoryKey, config] of Object.entries(factorConfig)) {
        try {
            const saved = localStorage.getItem(config.key);
            // Use structuredClone for a deep copy of defaults to prevent mutation
            const loaded = saved ? JSON.parse(saved) : structuredClone(config.default);
            loadedFactors[categoryKey as FactorCategoryKey] = loaded;
        } catch (error) {
            console.error(`Failed to load/parse factors for ${config.key} from localStorage. Falling back to default.`, error);
            localStorage.removeItem(config.key);
            loadedFactors[categoryKey as FactorCategoryKey] = structuredClone(config.default);
        }
    }
    return loadedFactors as { [key in FactorCategoryKey]: any };
};

export const MainCalculator: React.FC = () => {
  const { t } = useTranslation();
  
  // State for data, initialized from localStorage or defaults
  const [sources, setSources] = useState<{ [key in EmissionCategory]: EmissionSource[] }>(() => {
    try {
      const saved = localStorage.getItem('ghg-calc-sources');
      const loadedSources = saved ? JSON.parse(saved) : {};
      
      // Sanitize loaded data to prevent crashes from malformed legacy data
      for (const category in loadedSources) {
          if (Object.prototype.hasOwnProperty.call(loadedSources, category) && Array.isArray(loadedSources[category])) {
              loadedSources[category] = loadedSources[category].map((source: any) => ({
                  ...source,
                  // Ensure monthlyQuantities is always an array to prevent crashes.
                  monthlyQuantities: Array.isArray(source.monthlyQuantities) ? source.monthlyQuantities : [],
              }));
          }
      }

      // Ensure all categories exist in the loaded data
      const fullSources = { ...initialSources, ...loadedSources };
      return fullSources;
    } catch (error) {
        console.error("Failed to parse 'sources' from localStorage. Resetting to initial state.", error);
        localStorage.removeItem('ghg-calc-sources');
        return initialSources;
    }
  });

  const [companyName, setCompanyName] = useState<string>(() => {
    try {
        return localStorage.getItem('ghg-calc-companyName') || 'My Company';
    } catch (error) {
        return 'My Company';
    }
  });

  const [reportingYear, setReportingYear] = useState<string>(() => {
    try {
        return localStorage.getItem('ghg-calc-reportingYear') || new Date().getFullYear().toString();
    } catch (error) {
        return new Date().getFullYear().toString();
    }
  });
  
  const [facilities, setFacilities] = useState<Facility[]>(() => {
    try {
        const saved = localStorage.getItem('ghg-calc-facilities');
        let loadedFacilities: Facility[] = saved ? JSON.parse(saved) : [];

        if (!Array.isArray(loadedFacilities)) loadedFacilities = [];

        if (!loadedFacilities.find(f => f.id === CORPORATE_FACILITY_ID)) {
          loadedFacilities.unshift({ 
            id: CORPORATE_FACILITY_ID, 
            name: 'Corporate Level',
            equityShare: 100,
            isCorporate: true 
          });
        }

        if (loadedFacilities.filter(f => !f.isCorporate).length === 0) {
          if (!saved) { // Only add default facility for brand new users
            loadedFacilities.push({ id: 'default', name: 'Default Facility', equityShare: 100 });
          }
        }
        
        return loadedFacilities;
    } catch(error) {
        console.error("Failed to parse 'facilities' from localStorage. Resetting to initial state.", error);
        localStorage.removeItem('ghg-calc-facilities');
        return [
            { id: CORPORATE_FACILITY_ID, name: 'Corporate Level', equityShare: 100, isCorporate: true },
            { id: 'default', name: 'Default Facility', equityShare: 100 }
        ];
    }
  });

  const [boundaryApproach, setBoundaryApproach] = useState<BoundaryApproach>(() => {
    try {
        return (localStorage.getItem('ghg-calc-boundaryApproach') as BoundaryApproach) || 'operational';
    } catch(error) {
        return 'operational';
    }
  });
  const [scope3Settings, setScope3Settings] = useState<Scope3Settings>(() => {
    try {
      const saved = localStorage.getItem('ghg-calc-scope3Settings');
      return saved ? JSON.parse(saved) : { isEnabled: true, enabledCategories: [EmissionCategory.BusinessTravel, EmissionCategory.EmployeeCommuting, EmissionCategory.WasteGeneratedInOperations] };
    } catch(error) {
        console.error("Failed to parse 'scope3Settings' from localStorage. Resetting to initial state.", error);
        localStorage.removeItem('ghg-calc-scope3Settings');
        return { isEnabled: true, enabledCategories: [EmissionCategory.BusinessTravel, EmissionCategory.EmployeeCommuting, EmissionCategory.WasteGeneratedInOperations] };
    }
  });
  
  // Centralized state for all emission factors, loaded without migration
  const [allFactors, setAllFactors] = useState(getInitialFactors);

  // UI State
  const [openCategory, setOpenCategory] = useState<EmissionCategory | null>(EmissionCategory.StationaryCombustion);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStartStep, setWizardStartStep] = useState(0);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(() => {
    try {
        return JSON.parse(localStorage.getItem('ghg-calc-isSetupComplete') || 'false');
    } catch(error) {
        return false;
    }
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('scope1');

  // This effect runs once on mount to ensure legacy custom factors from localStorage have IDs.
  useEffect(() => {
    let needsMigration = false;
    for (const key of Object.keys(factorConfig)) {
        if (['upstreamTransport', 'downstreamTransport', 'businessTravel', 'scope3Waste', 'employeeCommuting', 'upstreamLeased', 'downstreamLeased', 'processingSold'].includes(key)) continue; // Skip nested objects
        const factors = allFactors[key as FactorCategoryKey];
        if (factors && Array.isArray(factors) && factors.some((f: any) => f.isCustom && !f.id)) {
            needsMigration = true;
            break;
        }
    }

    if (needsMigration) {
        setAllFactors(currentFactors => {
            const migratedFactors = { ...currentFactors };
            for (const key of Object.keys(factorConfig)) {
                 if (['upstreamTransport', 'downstreamTransport', 'businessTravel', 'scope3Waste', 'employeeCommuting', 'upstreamLeased', 'downstreamLeased', 'processingSold'].includes(key)) continue;
                const categoryKey = key as FactorCategoryKey;
                migratedFactors[categoryKey] = ensureIdsForCustomFactors(currentFactors[categoryKey] as any[]);
            }
            return migratedFactors;
        });
    }
  }, []); // Empty dependency array ensures this runs only once on mount.

  // Persist all data to localStorage when it changes
  useEffect(() => {
    if (isSetupComplete) {
      localStorage.setItem('ghg-calc-sources', JSON.stringify(sources));
      localStorage.setItem('ghg-calc-companyName', companyName);
      localStorage.setItem('ghg-calc-reportingYear', reportingYear);
      localStorage.setItem('ghg-calc-facilities', JSON.stringify(facilities));
      localStorage.setItem('ghg-calc-boundaryApproach', boundaryApproach);
      localStorage.setItem('ghg-calc-scope3Settings', JSON.stringify(scope3Settings));
      localStorage.setItem('ghg-calc-isSetupComplete', 'true');

      // Persist all factors from the centralized state
      for (const [categoryKey, config] of Object.entries(factorConfig)) {
          localStorage.setItem(config.key, JSON.stringify(allFactors[categoryKey as FactorCategoryKey]));
      }
    }
  }, [
      companyName, reportingYear, facilities, boundaryApproach, scope3Settings, isSetupComplete, sources, 
      allFactors
  ]);

  // Auto-calculate Scope 3, Category 3 from Scope 2 data
  useEffect(() => {
    const scope2Sources = sources[EmissionCategory.PurchasedEnergy];
    if (!scope2Sources || !scope3Settings.isEnabled || !scope3Settings.enabledCategories.includes(EmissionCategory.FuelAndEnergyRelatedActivities)) {
        return;
    };

    let totalUpstreamEmissions = 0;
    
    const gridElectricityFactorItem = allFactors.scope2.find((f: any) => f.name === 'Grid Electricity') as CO2eFactorFuel | undefined;
    const locationBasedGridFactorKwh = gridElectricityFactorItem?.factors['kWh'] || 0;

    scope2Sources.forEach(source => {
        const totalActivity = source.monthlyQuantities.reduce((a, b) => a + b, 0);
        let upstreamFactor = 0;

        if (source.fuelType === 'Grid Electricity') {
            // Assume upstream emissions (WTT + T&D) are ~15% of the location-based consumption factor.
            upstreamFactor = locationBasedGridFactorKwh * 0.15;
        } else {
            const factorItem = PURCHASED_ENERGY_UPSTREAM_FACTORS[source.fuelType];
            if (factorItem && factorItem.units.includes(source.unit)) {
                upstreamFactor = factorItem.factor;
            }
        }
        totalUpstreamEmissions += totalActivity * upstreamFactor;
    });

    const autoGeneratedSource: EmissionSource = {
        id: 'auto-generated-s3c3-energy',
        facilityId: CORPORATE_FACILITY_ID,
        category: EmissionCategory.FuelAndEnergyRelatedActivities,
        description: t('s3c3autoGeneratedDescription'),
        fuelType: t('s3c3autoGeneratedFuelType'),
        monthlyQuantities: [],
        unit: 'kg CO₂e',
        isAutoGenerated: true,
        activityType: 'energy_upstream',
        supplierProvidedCO2e: totalUpstreamEmissions,
    };
    
    setSources(prev => {
        const existingCat3Sources = prev[EmissionCategory.FuelAndEnergyRelatedActivities] || [];
        const userSources = existingCat3Sources.filter(s => !s.isAutoGenerated);
        const newCat3Sources = totalUpstreamEmissions > 0 ? [...userSources, autoGeneratedSource] : userSources;
        return {
            ...prev,
            [EmissionCategory.FuelAndEnergyRelatedActivities]: newCat3Sources,
        };
    });
  }, [sources[EmissionCategory.PurchasedEnergy], allFactors.scope2, t, scope3Settings.isEnabled, scope3Settings.enabledCategories]);


  const FUELS_MAP: { [key in EmissionCategory]?: any } = useMemo(() => ({
    [EmissionCategory.StationaryCombustion]: allFactors.stationary,
    [EmissionCategory.MobileCombustion]: allFactors.mobile,
    [EmissionCategory.ProcessEmissions]: allFactors.process,
    [EmissionCategory.FugitiveEmissions]: allFactors.fugitive,
    [EmissionCategory.PurchasedEnergy]: allFactors.scope2,
    [EmissionCategory.Waste]: allFactors.waste,
    // Scope 3
    [EmissionCategory.PurchasedGoodsAndServices]: allFactors.purchasedGoods,
    [EmissionCategory.CapitalGoods]: allFactors.capitalGoods,
    [EmissionCategory.FuelAndEnergyRelatedActivities]: allFactors.fuelEnergy,
    [EmissionCategory.UpstreamTransportationAndDistribution]: allFactors.upstreamTransport,
    [EmissionCategory.DownstreamTransportationAndDistribution]: {
      ...allFactors.downstreamTransport,
      ...LEASED_ASSETS_FACTORS_DETAILED // For warehousing part
    },
    [EmissionCategory.WasteGeneratedInOperations]: allFactors.scope3Waste,
    [EmissionCategory.BusinessTravel]: allFactors.businessTravel,
    [EmissionCategory.EmployeeCommuting]: allFactors.employeeCommuting,
    [EmissionCategory.UpstreamLeasedAssets]: allFactors.upstreamLeased,
    [EmissionCategory.DownstreamLeasedAssets]: allFactors.downstreamLeased,
    [EmissionCategory.ProcessingOfSoldProducts]: allFactors.processingSold,
    [EmissionCategory.UseOfSoldProducts]: allFactors.useSold,
    [EmissionCategory.EndOfLifeTreatmentOfSoldProducts]: allFactors.endOfLife,
    [EmissionCategory.Franchises]: allFactors.franchises,
    [EmissionCategory.Investments]: allFactors.investments,
  }), [allFactors]);
  
  const categoryDescriptions: Record<EmissionCategory, string> = useMemo(() => ({
      [EmissionCategory.StationaryCombustion]: t('stationaryDescription'),
      [EmissionCategory.MobileCombustion]: t('mobileDescription'),
      [EmissionCategory.ProcessEmissions]: t('processDescription'),
      [EmissionCategory.FugitiveEmissions]: t('fugitiveDescription'),
      [EmissionCategory.PurchasedEnergy]: t('energyDescription'),
      [EmissionCategory.Waste]: t('wasteDescription'),
      [EmissionCategory.PurchasedGoodsAndServices]: t('purchasedGoodsAndServicesDescription'),
      [EmissionCategory.CapitalGoods]: t('capitalGoodsDescription'),
      [EmissionCategory.FuelAndEnergyRelatedActivities]: t('fuelAndEnergyRelatedActivitiesDescription'),
      [EmissionCategory.UpstreamTransportationAndDistribution]: t('upstreamTransportationAndDistributionDescription'),
      [EmissionCategory.WasteGeneratedInOperations]: t('wasteGeneratedInOperationsDescription'),
      [EmissionCategory.BusinessTravel]: t('businessTravelDescription'),
      [EmissionCategory.EmployeeCommuting]: t('employeeCommutingDescription'),
      [EmissionCategory.UpstreamLeasedAssets]: t('upstreamLeasedAssetsDescription'),
      [EmissionCategory.DownstreamTransportationAndDistribution]: t('downstreamTransportationAndDistributionDescription'),
      [EmissionCategory.ProcessingOfSoldProducts]: t('processingOfSoldProductsDescription'),
      [EmissionCategory.UseOfSoldProducts]: t('useOfSoldProductsDescription'),
      [EmissionCategory.EndOfLifeTreatmentOfSoldProducts]: t('endOfLifeTreatmentOfSoldProductsDescription'),
      [EmissionCategory.DownstreamLeasedAssets]: t('downstreamLeasedAssetsDescription'),
      [EmissionCategory.Franchises]: t('franchisesDescription'),
      [EmissionCategory.Investments]: t('investmentsDescription'),
  }), [t]);

  const getScopeForCategory = useCallback((category: EmissionCategory): 'scope1' | 'scope2' | 'scope3' => {
      const scope1Categories = [
        EmissionCategory.StationaryCombustion,
        EmissionCategory.MobileCombustion,
        EmissionCategory.ProcessEmissions,
        EmissionCategory.FugitiveEmissions,
        EmissionCategory.Waste,
      ];
      if (scope1Categories.includes(category)) return 'scope1';
      if (category === EmissionCategory.PurchasedEnergy) return 'scope2';
      return 'scope3';
  }, []);

  const handleToggleCategory = useCallback((category: EmissionCategory) => {
    setOpenCategory(openCategory === category ? null : category);
  }, [openCategory]);

  const handleAddSource = useCallback((category: EmissionCategory) => {
    const fuelsForCategory = FUELS_MAP[category];
    const scope = getScopeForCategory(category);
    
    let defaultFacilityId = facilities.find(f => !f.isCorporate)?.id || facilities[0]?.id || 'default';
    if (scope === 'scope3') {
        defaultFacilityId = CORPORATE_FACILITY_ID;
    }
    
    if (category === EmissionCategory.PurchasedGoodsAndServices || category === EmissionCategory.CapitalGoods) {
      const newSource: EmissionSource = {
        id: `source-${Date.now()}`,
        facilityId: defaultFacilityId,
        category,
        description: '',
        fuelType: '', 
        monthlyQuantities: Array(12).fill(0),
        unit: 'KRW',
        calculationMethod: 'spend',
        factor: 0,
        factorUnit: 'kg CO₂e / KRW',
        factorSource: '',
        activityDataSource: '',
      };
      setSources(prev => ({ ...prev, [category]: [...prev[category], newSource] }));
      return;
    }

    if (category === EmissionCategory.FuelAndEnergyRelatedActivities) {
        const defaultFuel = (fuelsForCategory as CO2eFactorFuel[])?.[0];
        const newSource: EmissionSource = {
            id: `source-${Date.now()}`,
            facilityId: CORPORATE_FACILITY_ID,
            category,
            description: '',
            fuelType: defaultFuel?.name || '',
            monthlyQuantities: Array(12).fill(0),
            unit: defaultFuel?.units[0] || '',
            activityType: 'fuel_wtt',
            activityDataSource: '',
        };
        setSources(prev => ({...prev, [category]: [...prev[category], newSource]}));
        return;
    }

    if (category === EmissionCategory.UpstreamTransportationAndDistribution || category === EmissionCategory.DownstreamTransportationAndDistribution) {
        const defaultMode: TransportMode = 'Road';
        const defaultVehicle = Object.keys(TRANSPORTATION_FACTORS_BY_MODE[defaultMode])[0];
        const newSource: EmissionSource = {
            id: `source-${Date.now()}`,
            facilityId: CORPORATE_FACILITY_ID,
            category,
            description: '',
            fuelType: '', // Not used for activity method
            monthlyQuantities: [], // Not used for activity method
            unit: 'tonne-km',
            calculationMethod: 'activity',
            transportMode: defaultMode,
            vehicleType: defaultVehicle,
            distanceKm: 0,
            weightTonnes: 0,
            refrigerated: false,
            loadFactor: 100,
            emptyBackhaul: false,
            activityDataSource: '',
            downstreamActivityType: category === EmissionCategory.DownstreamTransportationAndDistribution ? 'transportation' : undefined,
        };
        setSources(prev => ({...prev, [category]: [...prev[category], newSource]}));
        return;
    }

    if (category === EmissionCategory.WasteGeneratedInOperations) {
        const newSource: EmissionSource = {
            id: `source-${Date.now()}`,
            facilityId: CORPORATE_FACILITY_ID,
            category,
            description: '',
            fuelType: '', // Not used in activity-based
            monthlyQuantities: Array(12).fill(0),
            unit: 'tonnes',
            calculationMethod: 'activity',
            wasteType: 'MSW',
            treatmentMethod: 'Landfill',
            includeTransport: false,
        };
        setSources(prev => ({...prev, [category]: [...prev[category], newSource]}));
        return;
    }
    
    if (category === EmissionCategory.BusinessTravel) {
        const newSource: EmissionSource = {
            id: `source-${Date.now()}`,
            facilityId: CORPORATE_FACILITY_ID,
            category,
            description: '',
            fuelType: '',
            monthlyQuantities: [],
            unit: 'passenger-km',
            calculationMethod: 'activity',
            businessTravelMode: 'Air',
            flightClass: 'Economy',
            tripType: 'round-trip',
            distanceKm: 0,
            passengers: 1,
            activityDataSource: '',
        };
        setSources(prev => ({...prev, [category]: [...prev[category], newSource]}));
        return;
    }
    
    if (category === EmissionCategory.EmployeeCommuting) {
        const newSource: EmissionSource = {
            id: `source-${Date.now()}`,
            facilityId: CORPORATE_FACILITY_ID,
            category,
            description: '',
            fuelType: '', // Not used directly, determined by sub-types
            monthlyQuantities: [], 
            unit: 'km',
            calculationMethod: 'activity',
            commutingMode: 'PersonalCar',
            personalCarType: 'Gasoline',
            distanceKm: 0,
            daysPerYear: 240,
            carpoolOccupancy: 1,
        };
        setSources(prev => ({...prev, [category]: [...prev[category], newSource]}));
        return;
    }

    if (category === EmissionCategory.UpstreamLeasedAssets || category === EmissionCategory.DownstreamLeasedAssets) {
        const newSource: EmissionSource = {
            id: `source-${Date.now()}`,
            facilityId: CORPORATE_FACILITY_ID,
            category,
            description: '',
            fuelType: '',
            monthlyQuantities: [],
            unit: '',
            calculationMethod: 'asset_specific',
            leasedAssetType: 'Building',
            buildingType: 'Office',
            areaSqm: 0,
            leaseDurationMonths: 12,
            energyInputs: [],
        };
         setSources(prev => ({...prev, [category]: [...prev[category], newSource]}));
        return;
    }
    
    if (category === EmissionCategory.ProcessingOfSoldProducts) {
        const defaultProcess = allFactors.processingSold.activity[0];
        const newSource: EmissionSource = {
            id: `source-${Date.now()}`,
            facilityId: CORPORATE_FACILITY_ID,
            category,
            description: '',
            fuelType: '', // This will be used for spend-based name
            monthlyQuantities: Array(12).fill(0),
            unit: defaultProcess.units[0],
            calculationMethod: 'process_specific',
            processingMethod: defaultProcess.name,
            supplierDataType: 'total_co2e',
            energyInputs: [],
        };
        setSources(prev => ({ ...prev, [category]: [...prev[category], newSource] }));
        return;
    }


    if (!fuelsForCategory || fuelsForCategory.length === 0) return;

    const defaultFuel = fuelsForCategory[0];
    const defaultUnit = 'units' in defaultFuel ? defaultFuel.units[0] : 'kg';

    const newSource: EmissionSource = {
      id: `source-${Date.now()}`,
      facilityId: defaultFacilityId,
      category,
      description: '',
      fuelType: defaultFuel.name,
      monthlyQuantities: Array(12).fill(0),
      unit: defaultUnit,
      activityDataSource: '',
    };
    setSources(prev => ({ ...prev, [category]: [...prev[category], newSource] }));
  }, [facilities, FUELS_MAP, getScopeForCategory, allFactors]);

  const handleUpdateSource = useCallback((id: string, category: EmissionCategory, update: Partial<EmissionSource>) => {
    setSources(prev => ({
      ...prev,
      [category]: prev[category].map(s => s.id === id ? { ...s, ...update } : s),
    }));
  }, []);
  
  const handleRemoveSource = useCallback((id: string, category: EmissionCategory) => {
    setSources(prev => ({
      ...prev,
      [category]: prev[category].filter(s => s.id !== id),
    }));
  }, []);

  const handleFuelTypeChange = useCallback((id: string, newFuelType: string, category: EmissionCategory) => {
    // This function handles selection changes in dropdowns, resetting the unit accordingly.
    const fuelsForCategory = FUELS_MAP[category];

    // Find the new fuel/service item from the constants
    let newFuel: any;
    if (category === EmissionCategory.BusinessTravel || category === EmissionCategory.EmployeeCommuting || category === EmissionCategory.UpstreamLeasedAssets || category === EmissionCategory.DownstreamLeasedAssets) {
        newFuel = (fuelsForCategory as any)?.spend_based?.find((f: any) => f.name === newFuelType);
    } else if (category === EmissionCategory.UpstreamTransportationAndDistribution || category === EmissionCategory.DownstreamTransportationAndDistribution) {
        newFuel = [...MOBILE_FUELS, ...TRANSPORTATION_SPEND_FACTORS].find(f => f.name === newFuelType);
    } else if (category === EmissionCategory.ProcessingOfSoldProducts) {
        newFuel = fuelsForCategory.spend.find((f:any) => f.name === newFuelType);
    } else if (Array.isArray(fuelsForCategory)) {
        newFuel = fuelsForCategory.find((f: any) => f.name === newFuelType);
    }

    if (!newFuel) return;
    
    // Determine the default unit for the newly selected item
    const newUnit = 'units' in newFuel ? newFuel.units[0] : 'kg';
    
    handleUpdateSource(id, category, { fuelType: newFuelType, unit: newUnit });
  }, [FUELS_MAP, handleUpdateSource]);

  
  const calculateSourceEmissions = useCallback((source: EmissionSource): { scope1: number, scope2Location: number, scope2Market: number, scope3: number } => {
    if (source.isAutoGenerated && source.category === EmissionCategory.FuelAndEnergyRelatedActivities) {
        return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: source.supplierProvidedCO2e || 0 };
    }
    
    if (source.category === EmissionCategory.PurchasedGoodsAndServices || source.category === EmissionCategory.CapitalGoods) {
        if (source.calculationMethod === 'supplier_co2e') {
            return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: source.supplierProvidedCO2e || 0 };
        }
        const totalActivity = source.monthlyQuantities.reduce((sum, q) => sum + q, 0);
        const emissions = totalActivity * (source.factor || 0);
        return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: emissions };
    }

    if (
        source.category === EmissionCategory.UpstreamLeasedAssets || 
        source.category === EmissionCategory.DownstreamLeasedAssets || 
        (source.category === EmissionCategory.DownstreamTransportationAndDistribution && source.downstreamActivityType === 'warehousing')
    ) {
        let scope3 = 0;
        const calcMethod = (source.calculationMethod as Cat8CalculationMethod) || 'asset_specific';
        
        switch(calcMethod) {
            case 'supplier_specific':
                scope3 = source.supplierProvidedCO2e || 0; // Assumed annual
                break;
            case 'spend_based':
                const totalSpend = source.monthlyQuantities.reduce((s, q) => s + q, 0);
                const spendFactorData = allFactors.upstreamLeased.spend_based.find((f:any) => f.name === source.fuelType);
                const spendFactor = spendFactorData?.factors[source.unit] || 0;
                scope3 = totalSpend * spendFactor;
                break;
            case 'area_based':
                const buildingType = source.buildingType || 'Office';
                const energyIntensityFactor = allFactors.upstreamLeased.area_based[buildingType]?.factor || 0; // kWh/m2/year
                const area = source.areaSqm || 0;
                const totalKwh = area * energyIntensityFactor; // Already annual
                const gridFactor = (allFactors.scope2.find((f: any) => f.name === 'Grid Electricity') as CO2eFactorFuel)?.factors['kWh'] || 0;
                scope3 = totalKwh * gridFactor;
                break;
            case 'asset_specific':
                let totalEmissions = 0;
                const allEnergyAndFuelFactors = [...allFactors.stationary, ...allFactors.mobile, ...allFactors.scope2];
                for (const input of source.energyInputs || []) {
                    const factorData = allEnergyAndFuelFactors.find((f: any) => f.name === input.type) as CO2eFactorFuel | undefined;
                    if (factorData) {
                        const factor = factorData.factors[input.unit] || 0;
                        totalEmissions += (input.value || 0) * factor; // Input value is annual
                    }
                }
                scope3 = totalEmissions;
                break;
        }

        // Adjust for lease duration for annual calculation methods
        if (calcMethod !== 'spend_based') {
            const leaseDurationFactor = (source.leaseDurationMonths || 12) / 12;
            scope3 *= leaseDurationFactor;
        }

        return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3 };
    }


    if (source.category === EmissionCategory.UpstreamTransportationAndDistribution || (source.category === EmissionCategory.DownstreamTransportationAndDistribution && source.downstreamActivityType !== 'warehousing')) {
        switch (source.calculationMethod as Cat4CalculationMethod) {
            case 'activity':
                const mode = source.transportMode;
                const vehicle = source.vehicleType;
                const factors = source.category === EmissionCategory.UpstreamTransportationAndDistribution ? allFactors.upstreamTransport : allFactors.downstreamTransport;
                if (!mode || !vehicle || !factors[mode] || !factors[mode][vehicle]) {
                    return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: 0 };
                }
                const factor = factors[mode][vehicle].factor;
                const tonneKm = (source.distanceKm || 0) * (source.weightTonnes || 0);
                
                let adjustmentMultiplier = 1.0;
                if (source.refrigerated) adjustmentMultiplier *= 1.2;
                if (source.emptyBackhaul) adjustmentMultiplier *= 2.0;
                if (source.loadFactor && source.loadFactor > 0 && source.loadFactor < 100) {
                    adjustmentMultiplier *= (100 / source.loadFactor);
                }

                return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: tonneKm * factor * adjustmentMultiplier };

            case 'fuel':
                    const totalFuel = source.monthlyQuantities.reduce((sum, q) => sum + q, 0);
                    const fuelData = allFactors.mobile.find((f: any) => f.name === source.fuelType) as CO2eFactorFuel | undefined;
                    if (!fuelData) return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: 0 };
                    const fuelFactor = fuelData.factors[source.unit] || 0;
                    return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: totalFuel * fuelFactor };
            
            case 'spend':
                const totalSpend = source.monthlyQuantities.reduce((sum, q) => sum + q, 0);
                const spendData = TRANSPORTATION_SPEND_FACTORS.find(f => f.name === source.fuelType);
                if (!spendData) return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: 0 };
                const spendFactor = spendData.factors[source.unit] || 0;
                return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: totalSpend * spendFactor };

            case 'supplier_specific':
                return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: source.supplierProvidedCO2e || 0 };
        }
    }


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
            case 'activity':
            default:
                const totalWeightTonnes = source.monthlyQuantities.reduce((s, q) => s + q, 0) * (source.unit === 'kg' ? 0.001 : 1);
                
                // Treatment emissions
                const wasteType = source.wasteType;
                const treatmentMethod = source.treatmentMethod;
                if (wasteType && treatmentMethod && allFactors.scope3Waste.activity[wasteType] && allFactors.scope3Waste.activity[wasteType]?.[treatmentMethod]) {
                    const treatmentFactor = allFactors.scope3Waste.activity[wasteType][treatmentMethod]!.factor;
                    scope3 += totalWeightTonnes * treatmentFactor;
                }

                // Transport emissions
                if (source.includeTransport && source.transportMode && source.vehicleType && source.distanceKm) {
                    const transportFactorData = allFactors.upstreamTransport[source.transportMode]?.[source.vehicleType];
                    if (transportFactorData) {
                        const transportFactor = transportFactorData.factor;
                        const tonneKm = totalWeightTonnes * source.distanceKm;
                        scope3 += tonneKm * transportFactor;
                    }
                }
                break;
        }
        return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3 };
    }

    if (source.category === EmissionCategory.BusinessTravel) {
        let scope3 = 0;
        const calcMethod = source.calculationMethod as Cat6CalculationMethod || 'activity';

        switch(calcMethod) {
            case 'supplier_specific':
                scope3 = source.supplierProvidedCO2e || 0;
                break;
            case 'spend':
                const totalSpend = source.monthlyQuantities.reduce((s, q) => s + q, 0);
                const spendFactorData = allFactors.businessTravel.spend.find((f:any) => f.name === source.fuelType);
                const spendFactor = spendFactorData?.factors[source.unit] || 0;
                scope3 = totalSpend * spendFactor;
                break;
            case 'activity':
            default:
                const mode = source.businessTravelMode || 'Air';
                const distance = (source.distanceKm || 0) * (source.tripType === 'round-trip' ? 2 : 1);
                const passengers = source.passengers || 1;

                if (mode === 'Air') {
                    const flightTypeKey = distance < 463 ? 'Short-haul (<463 km)' : distance <= 1108 ? 'Medium-haul (463-1108 km)' : 'Long-haul (>1108 km)';
                    const flightClass = source.flightClass || 'Economy';
                    const factorData = allFactors.businessTravel.activity.Air[flightTypeKey]?.[flightClass];
                    if (factorData) {
                        scope3 = distance * passengers * factorData.factor;
                    }
                } else if (mode === 'Hotel') {
                    const nights = source.nights || 0;
                    const hotelType = source.fuelType || 'National'; // fuelType stores hotel type
                    const factorData = allFactors.businessTravel.activity.Hotel[hotelType];
                    if(factorData) {
                        scope3 = nights * passengers * factorData.factor; // Assuming per person per night
                    }
                } else { // Rail, Bus, Cars
                    const vehicleType = source.fuelType;
                    let factorData;
                    if (mode === 'Rail' || mode === 'Bus' || mode === 'RentalCar' || mode === 'PersonalCar') {
                       factorData = allFactors.businessTravel.activity[mode][vehicleType];
                    }
                    if (factorData) {
                        const activity = factorData.unit === 'passenger-km' ? distance * passengers : distance;
                        scope3 = activity * factorData.factor;
                    }
                }
                break;
        }
        return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3 };
    }
    
    if (source.category === EmissionCategory.EmployeeCommuting) {
        let scope3 = 0;
        const calcMethod = (source.calculationMethod as Cat7CalculationMethod) || 'activity';
        const activityFactors = allFactors.employeeCommuting.activity;
        const spendFactors = allFactors.employeeCommuting.spend;

        switch(calcMethod) {
            case 'spend':
                const totalSpend = source.monthlyQuantities.reduce((s, q) => s + q, 0);
                const spendFactorData = spendFactors.find((f:any) => f.name === source.fuelType);
                const spendFactor = spendFactorData?.factors[source.unit] || 0;
                scope3 = totalSpend * spendFactor;
                break;
            case 'average':
                const effectiveEmployees = (source.totalEmployees || 0) * (1 - (source.percentTeleworking || 0) / 100);
                const avgDistance = source.distanceKm || 0;
                const avgDays = source.daysPerYear || 0;
                let totalEmissions = 0;

                for (const [modeKey, percentage] of Object.entries(source.modeDistribution || {})) {
                    if (percentage > 0) {
                        const [mode, type] = modeKey.split('_');
                        const factorData = activityFactors[mode]?.[type];
                        if (factorData) {
                            const employeesInMode = effectiveEmployees * (percentage / 100);
                            const totalKm = employeesInMode * avgDistance * 2 * avgDays;
                            totalEmissions += totalKm * factorData.factor;
                        }
                    }
                }
                scope3 = totalEmissions;
                break;
            case 'activity':
            default:
                const commutingMode = source.commutingMode;
                let factor = 0;
                if (commutingMode === 'PersonalCar' || commutingMode === 'Carpool') {
                    factor = activityFactors.PersonalCar[source.personalCarType as PersonalCarType]?.factor || 0;
                } else if (commutingMode === 'PublicTransport') {
                    factor = activityFactors.PublicTransport[source.publicTransportType as PublicTransportType]?.factor || 0;
                } else if (commutingMode === 'Motorbike') {
                    factor = activityFactors.Motorbike['Average Motorbike']?.factor || 0;
                } else if (commutingMode === 'BicycleWalking') {
                    factor = 0;
                }
                const totalAnnualKm = (source.distanceKm || 0) * 2 * (source.daysPerYear || 0);
                const occupancy = (commutingMode === 'Carpool' && (source.carpoolOccupancy || 1) > 1) ? (source.carpoolOccupancy || 1) : 1;
                scope3 = (totalAnnualKm * factor) / occupancy;
                break;
        }
        return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3 };
    }

    if (source.category === EmissionCategory.ProcessingOfSoldProducts) {
        let scope3 = 0;
        const calcMethod = (source.calculationMethod as Cat10CalculationMethod) || 'process_specific';

        switch(calcMethod) {
            // FIX: The calculation method 'supplier_specific' is not valid for Cat10.
            // It should be 'customer_specific' to match the type definition and UI logic.
            case 'customer_specific':
                if (source.supplierDataType === 'total_co2e') {
                    scope3 = source.supplierProvidedCO2e || 0;
                } else { // energy_data
                    let totalEmissions = 0;
                    for (const input of source.energyInputs || []) {
                        const allEnergyAndFuelFactors = [...allFactors.stationary, ...allFactors.mobile, ...allFactors.scope2];
                        const factorData = allEnergyAndFuelFactors.find((f: any) => f.name === input.type) as CO2eFactorFuel | undefined;
                        if (factorData) {
                            const factor = factorData.factors[input.unit] || 0;
                            totalEmissions += input.value * factor;
                        }
                    }
                    scope3 = totalEmissions;
                }
                break;
            case 'spend':
                const totalSpend = source.monthlyQuantities.reduce((s, q) => s + q, 0);
                const spendFactorData = allFactors.processingSold.spend.find((f:any) => f.name === source.fuelType);
                const spendFactor = spendFactorData?.factors[source.unit] || 0;
                scope3 = totalSpend * spendFactor;
                break;
            case 'process_specific':
            default:
                const totalActivity = source.monthlyQuantities.reduce((s, q) => s + q, 0);
                const processFactorData = allFactors.processingSold.activity.find((f: any) => f.name === source.processingMethod);
                const processFactor = processFactorData ? processFactorData.factors[source.unit] : 0;
                scope3 = totalActivity * processFactor;
                break;
        }
        return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3 };
    }

    const totalQuantity = source.monthlyQuantities.reduce((sum, q) => sum + q, 0);
    const categoryFuels = FUELS_MAP[source.category];
    if (!categoryFuels || (Array.isArray(categoryFuels) && categoryFuels.length === 0)) return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: 0 };
    
    // Check if categoryFuels is an array before calling .find()
    if (!Array.isArray(categoryFuels)) return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: 0 };

    const fuel = categoryFuels.find((f: any) => f.name === source.fuelType);
    if (!fuel) return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: 0 };
    
    const scope = getScopeForCategory(source.category);
    
    if ('gwp' in fuel) {
        return { scope1: totalQuantity * fuel.gwp, scope2Location: 0, scope2Market: 0, scope3: 0 };
    }

    if ('factors' in fuel) {
        const co2eFuel = fuel as CO2eFactorFuel;
        const factor = co2eFuel.factors[source.unit] || 0;
        const emissions = totalQuantity * factor;
        
        if (scope === 'scope2') {
            const marketFactor = source.marketBasedFactor ?? factor;
            const marketEmissions = totalQuantity * marketFactor;
            return { scope1: 0, scope2Location: emissions, scope2Market: marketEmissions, scope3: 0 };
        } else if (scope === 'scope1') {
            return { scope1: emissions, scope2Location: 0, scope2Market: 0, scope3: 0 };
        } else {
            return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: emissions };
        }
    }
    
    return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: 0 };
  }, [FUELS_MAP, getScopeForCategory, allFactors]);
  
  const results = useMemo(() => {
    let scope1Total = 0;
    let scope2LocationTotal = 0;
    let scope2MarketTotal = 0;
    let scope3Total = 0;
    const scope3CategoryBreakdown: { [category: string]: number } = {};

    const facilityBreakdown: { [facilityId: string]: { scope1: number, scope2Location: number, scope2Market: number, scope3: number } } = {};
    facilities.forEach(f => {
        facilityBreakdown[f.id] = { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: 0 };
    });
    
    for (const category of Object.values(EmissionCategory)) {
        const scope = getScopeForCategory(category);
        if (scope === 'scope3') {
            if (!scope3Settings.isEnabled || !scope3Settings.enabledCategories.includes(category)) {
                continue;
            }
            if (!scope3CategoryBreakdown[category]) {
                scope3CategoryBreakdown[category] = 0;
            }
        }

        for (const source of sources[category]) {
            const facility = facilities.find(f => f.id === source.facilityId);
            if (!facility) continue;

            const ownershipFactor = boundaryApproach === 'equity' ? (facility.equityShare / 100) : 1;
            const emissions = calculateSourceEmissions(source);
            
            const adjScope1 = emissions.scope1 * ownershipFactor;
            const adjScope2L = emissions.scope2Location * ownershipFactor;
            const adjScope2M = emissions.scope2Market * ownershipFactor;
            const adjScope3 = emissions.scope3 * ownershipFactor;

            scope1Total += adjScope1;
            scope2LocationTotal += adjScope2L;
            scope2MarketTotal += adjScope2M;
            scope3Total += adjScope3;

            if (scope === 'scope3') {
                scope3CategoryBreakdown[source.category] += adjScope3;
            }

            if(facilityBreakdown[facility.id]) {
                facilityBreakdown[facility.id].scope1 += adjScope1;
                facilityBreakdown[facility.id].scope2Location += adjScope2L;
                facilityBreakdown[facility.id].scope2Market += adjScope2M;
                facilityBreakdown[facility.id].scope3 += adjScope3;
            }
        }
    }
    
    const totalEmissionsMarket = scope1Total + scope2MarketTotal + scope3Total;
    const totalEmissionsLocation = scope1Total + scope2LocationTotal + scope3Total;
    
    return { totalEmissionsMarket, totalEmissionsLocation, scope1Total, scope2LocationTotal, scope2MarketTotal, scope3Total, facilityBreakdown, scope3CategoryBreakdown };
  }, [sources, facilities, boundaryApproach, scope3Settings, calculateSourceEmissions, getScopeForCategory]);
  
  const boundaryApproachText = useMemo(() => {
    return {
        operational: t('operationalControl'),
        financial: t('financialControl'),
        equity: t('equityShare')
    }[boundaryApproach];
  }, [t, boundaryApproach]);

  const handleSaveSetup = useCallback((details: {
    companyName: string;
    reportingYear: string;
    facilities: Facility[];
    boundaryApproach: BoundaryApproach;
    scope3Settings: Scope3Settings;
  }) => {
    setCompanyName(details.companyName);
    setReportingYear(details.reportingYear);
    setFacilities(details.facilities);
    setBoundaryApproach(details.boundaryApproach);
    setScope3Settings(details.scope3Settings);
    setIsSetupComplete(true);
    setIsWizardOpen(false);
  }, []);

  const reconfigureBoundary = () => {
    setWizardStartStep(1);
    setIsWizardOpen(true);
  };
  
  const openScope3Settings = () => {
    setWizardStartStep(4);
    setIsWizardOpen(true);
  };

  const handleProportionalFactorChange = (categoryKey: FactorCategoryKey, itemIndex: number, unit: string, value: string) => {
    setAllFactors(prev => {
        const categoryFactors = [...(prev[categoryKey] as any[])];
        const item = { ...categoryFactors[itemIndex] };
        item.factors = { ...item.factors, [unit]: parseFloat(value) || 0 };
        categoryFactors[itemIndex] = item;
        return { ...prev, [categoryKey]: categoryFactors };
    });
  };

  const handleFactorValueChange = (categoryKey: FactorCategoryKey, path: (string|number)[], value: string) => {
    setAllFactors(prev => {
        const newFactors = JSON.parse(JSON.stringify(prev));
        let current = newFactors[categoryKey];
        for (let i = 0; i < path.length - 1; i++) {
            current = current[path[i]];
        }
        current[path[path.length - 1]] = parseFloat(value) || 0;
        return newFactors;
    });
  };

  const handleGWPChange = (itemIndex: number, value: string) => {
      setAllFactors(prev => {
          const fugitiveGases = [...(prev.fugitive as any[])];
          fugitiveGases[itemIndex] = { ...fugitiveGases[itemIndex], gwp: parseFloat(value) || 0 };
          return { ...prev, fugitive: fugitiveGases };
      });
  };

  const handleRegionChange = (region: string) => {
    const newFactors = region === 'Custom' ? allFactors.scope2[0].factors : SCOPE2_FACTORS_BY_REGION[region].factors;
    setAllFactors(prev => {
        const scope2Sources = [...(prev.scope2 as any[])];
        const gridIndex = scope2Sources.findIndex(s => s.name === 'Grid Electricity');
        if (gridIndex !== -1) {
            scope2Sources[gridIndex] = { ...scope2Sources[gridIndex], factors: newFactors };
        }
        return { ...prev, scope2: scope2Sources };
    });
  };
  
  const handleAddFactor = (categoryKey: FactorCategoryKey, itemData: any) => {
      const newItem = {
          ...itemData,
          id: `custom-${Date.now()}`,
          isCustom: true,
      };
      setAllFactors(prev => ({
          ...prev,
          [categoryKey]: [...(prev[categoryKey] as any[]), newItem]
      }));
  };

  const handleEditFactor = (categoryKey: FactorCategoryKey, itemData: any) => {
      setAllFactors(prev => ({
          ...prev,
          [categoryKey]: (prev[categoryKey] as any[]).map(item => item.id === itemData.id ? itemData : item)
      }));
  };

  const handleDeleteFactor = (categoryKey: FactorCategoryKey, idToDelete: string) => {
      setAllFactors(prev => ({
          ...prev,
          [categoryKey]: (prev[categoryKey] as any[]).filter(item => item.id !== idToDelete)
      }));
  };

  const scopeCalculatorProps = {
    sources,
    onAddSource: handleAddSource,
    onUpdateSource: handleUpdateSource,
    onRemoveSource: handleRemoveSource,
    onFuelTypeChange: handleFuelTypeChange,
    fuelsMap: FUELS_MAP,
    calculateEmissions: calculateSourceEmissions,
    categoryDescriptions,
    facilities,
    openCategory,
    onToggleCategory: handleToggleCategory,
    boundaryApproach,
  };
  
  if (!isSetupComplete) {
      return (
          <BoundarySetupWizard 
              isOpen={true}
              onClose={() => {}}
              onSave={handleSaveSetup}
              initialData={{ companyName, reportingYear, facilities, boundaryApproach, scope3Settings }}
              isCancellable={false}
          />
      )
  }

  return (
    <div className="space-y-8">
        <BoundarySetupWizard
            isOpen={isWizardOpen}
            onClose={() => setIsWizardOpen(false)}
            onSave={handleSaveSetup}
            initialData={{ companyName, reportingYear, facilities, boundaryApproach, scope3Settings }}
            initialStep={wizardStartStep}
        />

        <ReportGenerator 
            isOpen={isReportOpen}
            onClose={() => setIsReportOpen(false)}
            companyName={companyName}
            reportingYear={reportingYear}
            boundaryApproachText={boundaryApproachText}
            results={results}
            facilities={facilities}
            boundaryApproach={boundaryApproach}
            sources={sources}
            allFactors={allFactors}
            scope3Settings={scope3Settings}
        />

        <ResultsDisplay 
            {...results}
            facilities={facilities}
            boundaryApproach={boundaryApproach}
            companyName={companyName}
            reportingYear={reportingYear}
            boundaryApproachText={boundaryApproachText}
            onGenerateReport={() => setIsReportOpen(true)}
        />

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-ghg-dark dark:text-gray-100">{t('operationalBoundaryTitle')}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('operationalBoundarySubtitle')}</p>
                </div>
                <button onClick={reconfigureBoundary} className="mt-2 sm:mt-0 text-sm bg-white border border-ghg-green text-ghg-green font-semibold py-1 px-3 rounded-lg hover:bg-ghg-green hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ghg-green dark:bg-gray-700 dark:border-ghg-light-green dark:text-ghg-light-green dark:hover:bg-ghg-light-green dark:hover:text-ghg-dark">
                    {t('reconfigureBoundary')}
                </button>
            </div>
            
            <div className="border-b border-gray-200 dark:border-gray-600 mb-6">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('scope1')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'scope1' ? 'border-ghg-accent text-ghg-dark dark:text-ghg-light-green' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-500'}`}>{t('scope1Direct')}</button>
                    <button onClick={() => setActiveTab('scope2')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'scope2' ? 'border-ghg-accent text-ghg-dark dark:text-ghg-light-green' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-500'}`}>{t('scope2Indirect')}</button>
                    <button onClick={() => setActiveTab('scope3')} disabled={!scope3Settings.isEnabled} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'scope3' ? 'border-ghg-accent text-ghg-dark dark:text-ghg-light-green' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-500'} disabled:opacity-50 disabled:cursor-not-allowed`}>{t('scope3OtherIndirect')}</button>
                </nav>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeTab === 'scope1' && <Scope1Calculator {...scopeCalculatorProps} />}
                {activeTab === 'scope2' && <Scope2Calculator {...scopeCalculatorProps} />}
                {activeTab === 'scope3' && <Scope3Calculator {...scopeCalculatorProps} enabledScope3Categories={scope3Settings.enabledCategories} onManageScope3={openScope3Settings} />}
            </div>
        </div>
        
        <FactorManager
            allFactors={allFactors}
            onProportionalFactorChange={handleProportionalFactorChange}
            onFactorValueChange={handleFactorValueChange}
            onGWPChange={handleGWPChange}
            onRegionChange={handleRegionChange}
            onAddFactor={handleAddFactor}
            onEditFactor={handleEditFactor}
            onDeleteFactor={handleDeleteFactor}
            enabledScope3Categories={scope3Settings.enabledCategories}
        />
    </div>
  );
};