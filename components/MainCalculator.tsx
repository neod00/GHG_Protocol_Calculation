// Fix: Corrected typo in React import
import React, { useState, useMemo, useEffect, useCallback } from 'react';
// Fix: Import 'EditableCO2eFactorFuel' to resolve type error.
import { EmissionCategory, EmissionSource, Refrigerant, Facility, BoundaryApproach, EditableRefrigerant, EditableCO2eFactorFuel, CO2eFactorFuel, TransportMode, Cat5CalculationMethod, WasteType, TreatmentMethod, Cat6CalculationMethod, BusinessTravelMode, EmployeeCommutingMode, PersonalCarType, PublicTransportType, Cat7CalculationMethod } from '../types';
import { 
    STATIONARY_FUELS, MOBILE_FUELS, PROCESS_MATERIALS, FUGITIVE_GASES, SCOPE2_ENERGY_SOURCES, WASTE_SOURCES, 
    EMPLOYEE_COMMUTING_FACTORS_DETAILED,
    PURCHASED_GOODS_SERVICES_FACTORS, CAPITAL_GOODS_FACTORS, FUEL_ENERGY_ACTIVITIES_FACTORS,
    TRANSPORTATION_FACTORS_BY_MODE, TRANSPORTATION_SPEND_FACTORS, LEASED_ASSETS_FACTORS, PROCESSING_SOLD_PRODUCTS_FACTORS,
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
    upstreamLeased: { key: 'ghg-calc-upstreamLeasedAssetsFactors', default: LEASED_ASSETS_FACTORS },
    downstreamLeased: { key: 'ghg-calc-downstreamLeasedAssetsFactors', default: LEASED_ASSETS_FACTORS },
    processingSold: { key: 'ghg-calc-processingSoldProductsFactors', default: PROCESSING_SOLD_PRODUCTS_FACTORS },
    useSold: { key: 'ghg-calc-useSoldProductsFactors', default: USE_SOLD_PRODUCTS_FACTORS },
    endOfLife: { key: 'ghg-calc-endOfLifeTreatmentFactors', default: END_OF_LIFE_TREATMENT_FACTORS },
    franchises: { key: 'ghg-calc-franchisesFactors', default: FRANCHISES_FACTORS },
    investments: { key: 'ghg-calc-investmentsFactors', default: INVESTMENTS_FACTORS },
};

const getInitialFactors = () => {
    const loadedFactors: { [key in FactorCategoryKey]?: any } = {};
    for (const [categoryKey, config] of Object.entries(factorConfig)) {
        const saved = localStorage.getItem(config.key);
        const loaded = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(config.default));
        loadedFactors[categoryKey as FactorCategoryKey] = loaded;
    }
    return loadedFactors as { [key in FactorCategoryKey]: any };
};

export const MainCalculator: React.FC = () => {
  const { t } = useTranslation();
  
  // State for data, initialized from localStorage or defaults
  const [sources, setSources] = useState<{ [key in EmissionCategory]: EmissionSource[] }>(() => {
      const saved = localStorage.getItem('ghg-calc-sources');
      // Ensure all categories exist in the loaded data
      const loadedSources = saved ? JSON.parse(saved) : {};
      const fullSources = { ...initialSources, ...loadedSources };
      return fullSources;
  });
  const [companyName, setCompanyName] = useState<string>(() => localStorage.getItem('ghg-calc-companyName') || 'My Company');
  const [reportingYear, setReportingYear] = useState<string>(() => localStorage.getItem('ghg-calc-reportingYear') || new Date().getFullYear().toString());
  const [facilities, setFacilities] = useState<Facility[]>(() => {
    const saved = localStorage.getItem('ghg-calc-facilities');
    let loadedFacilities: Facility[] = saved ? JSON.parse(saved) : [];

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
  });
  const [boundaryApproach, setBoundaryApproach] = useState<BoundaryApproach>(() => (localStorage.getItem('ghg-calc-boundaryApproach') as BoundaryApproach) || 'operational');
  const [scope3Settings, setScope3Settings] = useState<Scope3Settings>(() => {
      const saved = localStorage.getItem('ghg-calc-scope3Settings');
      return saved ? JSON.parse(saved) : { isEnabled: true, enabledCategories: [EmissionCategory.BusinessTravel, EmissionCategory.EmployeeCommuting, EmissionCategory.WasteGeneratedInOperations] };
  });
  
  // Centralized state for all emission factors, loaded without migration
  const [allFactors, setAllFactors] = useState(getInitialFactors);

  // UI State
  const [openCategory, setOpenCategory] = useState<EmissionCategory | null>(EmissionCategory.StationaryCombustion);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStartStep, setWizardStartStep] = useState(0);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(() => JSON.parse(localStorage.getItem('ghg-calc-isSetupComplete') || 'false'));
  const [activeTab, setActiveTab] = useState<ActiveTab>('scope1');

  // This effect runs once on mount to ensure legacy custom factors from localStorage have IDs.
  useEffect(() => {
    let needsMigration = false;
    for (const key of Object.keys(factorConfig)) {
        if (key === 'upstreamTransport' || key === 'downstreamTransport' || key === 'businessTravel' || key === 'scope3Waste' || key === 'employeeCommuting') continue; // Skip nested objects
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
                 if (key === 'upstreamTransport' || key === 'downstreamTransport' || key === 'businessTravel' || key === 'scope3Waste' || key === 'employeeCommuting') continue;
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
    [EmissionCategory.WasteGeneratedInOperations]: allFactors.scope3Waste,
    [EmissionCategory.BusinessTravel]: allFactors.businessTravel,
    [EmissionCategory.EmployeeCommuting]: allFactors.employeeCommuting,
    [EmissionCategory.UpstreamLeasedAssets]: allFactors.upstreamLeased,
    [EmissionCategory.DownstreamTransportationAndDistribution]: allFactors.downstreamTransport,
    [EmissionCategory.ProcessingOfSoldProducts]: allFactors.processingSold,
    [EmissionCategory.UseOfSoldProducts]: allFactors.useSold,
    [EmissionCategory.EndOfLifeTreatmentOfSoldProducts]: allFactors.endOfLife,
    [EmissionCategory.DownstreamLeasedAssets]: allFactors.downstreamLeased,
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
            monthlyQuantities: [], // Not used for this complex type
            unit: 'km',
            calculationMethod: 'activity',
            commutingMode: 'PersonalCar',
            personalCarType: 'Gasoline',
            distanceKm: 0,
            daysPerYear: 0,
            carpoolOccupancy: 1,
        };
        setSources(prev => ({...prev, [category]: [...prev[category], newSource]}));
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
  }, [facilities, FUELS_MAP, getScopeForCategory]);

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
    if (category === EmissionCategory.BusinessTravel || category === EmissionCategory.EmployeeCommuting) {
        newFuel = (fuelsForCategory as any)?.spend?.find((f: any) => f.name === newFuelType);
    } else if (category === EmissionCategory.UpstreamTransportationAndDistribution || category === EmissionCategory.DownstreamTransportationAndDistribution) {
        newFuel = [...MOBILE_FUELS, ...TRANSPORTATION_SPEND_FACTORS].find(f => f.name === newFuelType);
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

    if (source.category === EmissionCategory.UpstreamTransportationAndDistribution || source.category === EmissionCategory.DownstreamTransportationAndDistribution) {
        switch (source.calculationMethod) {
            case 'activity':
                const mode = source.transportMode;
                const vehicle = source.vehicleType;
                if (!mode || !vehicle || !allFactors.upstreamTransport[mode] || !allFactors.upstreamTransport[mode][vehicle]) {
                    return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: 0 };
                }
                const factor = allFactors.upstreamTransport[mode][vehicle].factor;
                const tonneKm = (source.distanceKm || 0) * (source.weightTonnes || 0);
                
                let adjustmentMultiplier = 1.0;
                if (source.refrigerated) adjustmentMultiplier *= 1.2; // 20% increase for refrigeration
                if (source.emptyBackhaul) adjustmentMultiplier *= 2.0; // Double emissions to account for empty return trip
                if (source.loadFactor && source.loadFactor > 0 && source.loadFactor < 100) {
                    // Simplified model: assumes emissions scale inversely with load factor.
                    // This is a placeholder for a more complex model (e.g., GLEC Framework)
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
  
  const boundaryApproachText = useMemo(() => ({
      operational: t('operationalControl'),
      financial: t('financialControl'),
      equity: t('equityShare'),
  }[boundaryApproach]), [boundaryApproach, t]);
  
  const handleWizardSave = useCallback((details: {
    companyName: string;
    reportingYear: string;
    facilities: Facility[];
    boundaryApproach: BoundaryApproach;
    scope3Settings: Scope3Settings;
  }) => {
    const corporateFacility = facilities.find(f => f.isCorporate);
    let updatedFacilities = details.facilities;

    if (corporateFacility && !updatedFacilities.find(f => f.id === corporateFacility.id)) {
        updatedFacilities.unshift(corporateFacility);
    }
    
    setCompanyName(details.companyName);
    setReportingYear(details.reportingYear);
    setFacilities(updatedFacilities);
    setBoundaryApproach(details.boundaryApproach);
    setScope3Settings(details.scope3Settings);
    setIsSetupComplete(true);
    setIsWizardOpen(false);
  }, [facilities]);

  const openWizard = useCallback((startStep: number) => {
    setWizardStartStep(startStep);
    setIsWizardOpen(true);
  }, []);

  const handleProportionalFactorChange = useCallback((categoryKey: FactorCategoryKey, itemIndex: number, changedUnit: string, value: string) => {
    setAllFactors(prev => {
        const factorsForCategory = prev[categoryKey] as EditableCO2eFactorFuel[];
        if (!factorsForCategory) return prev;

        const newFactorsState = { ...prev };
        
        const updatedFactors = factorsForCategory.map((item, index) => {
            if (index !== itemIndex) return item;

            const newValue = parseFloat(value) || 0;
            const oldValue = item.factors[changedUnit];

            let changeRatio: number | null = null;
            // Establish ratio only if old value is a positive number
            if (oldValue && oldValue > 0) {
                changeRatio = newValue / oldValue;
            }
            
            let newFactors: { [key: string]: number } = {};

            if (changeRatio !== null) {
                // Proportional update for all related units
                for (const unit in item.factors) {
                    if (unit === changedUnit) {
                        newFactors[unit] = newValue;
                    } else {
                        const updatedValue = item.factors[unit] * changeRatio;
                        // Use toPrecision to handle floating point inaccuracies and limit significant digits
                        newFactors[unit] = parseFloat(updatedValue.toPrecision(7)); 
                    }
                }
            } else {
                // If no ratio can be calculated (e.g., old value was 0), just update the single value
                newFactors = { ...item.factors, [changedUnit]: newValue };
            }
            
            return { ...item, factors: newFactors };
        });
        
        newFactorsState[categoryKey] = updatedFactors;
        return newFactorsState;
    });
  }, []);

  const handleFactorValueChange = useCallback((categoryKey: FactorCategoryKey, path: (string | number)[], value: string) => {
    const numericValue = parseFloat(value) || 0;
    setAllFactors(prevFactors => {
        const newCategoryData = JSON.parse(JSON.stringify(prevFactors[categoryKey]));
        
        let current = newCategoryData;
        for (let i = 0; i < path.length - 1; i++) {
            current = current[path[i]];
        }
        current[path[path.length - 1]] = numericValue;

        return {
            ...prevFactors,
            [categoryKey]: newCategoryData,
        };
    });
  }, []);


  const handleGWPChange = useCallback((itemIndex: number, value: string) => {
      handleFactorValueChange('fugitive', [itemIndex, 'gwp'], value);
  }, [handleFactorValueChange]);

  const handleRegionChange = useCallback((region: string) => {
      if (region !== 'Custom' && SCOPE2_FACTORS_BY_REGION[region]) {
          const newFactors = SCOPE2_FACTORS_BY_REGION[region].factors;
          setAllFactors(prev => {
              const updatedScope2 = (prev.scope2 as EditableCO2eFactorFuel[]).map(s => s.name === 'Grid Electricity' ? {...s, factors: newFactors} : s);
              return {...prev, scope2: updatedScope2};
          });
      }
  }, []);

  const handleAddFactor = useCallback((categoryKey: FactorCategoryKey, newItemData: any) => {
      setAllFactors(prev => {
          const currentFactors = prev[categoryKey] || [];
          const newFactor = {
              ...newItemData,
              id: `custom-${Date.now()}-${Math.random()}`,
              isCustom: true,
          };
          const updatedFactors = [...currentFactors, newFactor] as (EditableCO2eFactorFuel | EditableRefrigerant)[];
          return { ...prev, [categoryKey]: updatedFactors };
      });
  }, []);

  const handleEditFactor = useCallback((categoryKey: FactorCategoryKey, editedFactorData: any) => {
      setAllFactors(prev => {
          const currentFactors = prev[categoryKey] || [];
          const updatedFactors = currentFactors.map((f: any) => f.id === editedFactorData.id ? editedFactorData : f);
          return { ...prev, [categoryKey]: updatedFactors };
      });
  }, []);

  const handleDeleteFactor = useCallback((categoryKey: FactorCategoryKey, idToDelete: string) => {
    if (window.confirm(t('confirmRemoveSource'))) {
        setAllFactors(prevFactors => {
            const currentFactors = prevFactors[categoryKey] as any[] || [];
            const newFactors = currentFactors.filter((item: any) => item.id !== idToDelete);
            return {
                ...prevFactors,
                [categoryKey]: newFactors
            };
        });
    }
  }, [t]);

  const tabClasses = (tabName: ActiveTab) =>
    `px-4 py-2 text-lg font-semibold rounded-t-lg transition-colors focus:outline-none ${
      activeTab === tabName
        ? 'border-b-4 border-ghg-accent text-ghg-dark dark:text-white'
        : 'text-gray-500 hover:text-ghg-dark dark:hover:text-gray-300'
    }`;

  const commonCalculatorProps = useMemo(() => ({
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
  }), [
    sources, handleAddSource, handleUpdateSource, handleRemoveSource, handleFuelTypeChange,
    FUELS_MAP, calculateSourceEmissions, categoryDescriptions, facilities, openCategory,
    handleToggleCategory, boundaryApproach
  ]);

  return (
    <>
      <BoundarySetupWizard 
        isOpen={!isSetupComplete || isWizardOpen}
        isCancellable={isSetupComplete}
        onClose={() => setIsWizardOpen(false)}
        onSave={handleWizardSave}
        initialData={{companyName, reportingYear, facilities, boundaryApproach, scope3Settings}}
        initialStep={wizardStartStep}
      />
      
      {isReportOpen && (
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
      )}

      <div className={`space-y-8 ${!isSetupComplete ? 'blur-sm pointer-events-none' : ''}`}>
        <div>
          <button onClick={() => openWizard(0)} className="mb-6 bg-ghg-accent text-white font-semibold py-2 px-4 rounded-lg hover:bg-ghg-dark transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ghg-accent">
              {t('reconfigureBoundary')}
          </button>
          
          <ResultsDisplay 
            totalEmissionsMarket={results.totalEmissionsMarket}
            totalEmissionsLocation={results.totalEmissionsLocation}
            scope1Total={results.scope1Total}
            scope2LocationTotal={results.scope2LocationTotal}
            scope2MarketTotal={results.scope2MarketTotal}
            scope3Total={results.scope3Total}
            facilityBreakdown={results.facilityBreakdown}
            scope3CategoryBreakdown={results.scope3CategoryBreakdown}
            facilities={facilities}
            boundaryApproach={boundaryApproach}
            companyName={companyName}
            reportingYear={reportingYear}
            boundaryApproachText={boundaryApproachText}
            onGenerateReport={() => setIsReportOpen(true)}
          />
        </div>
        
        <div>
            <div className="text-center my-8">
                <h2 className="text-2xl font-bold text-ghg-dark dark:text-white">{t('operationalBoundaryTitle')}</h2>
                <p className="mt-1 text-md text-gray-500 dark:text-gray-400">{t('operationalBoundarySubtitle')}</p>
            </div>
            <div className="border-b border-gray-200 dark:border-gray-600 mb-8">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button className={tabClasses('scope1')} onClick={() => setActiveTab('scope1')}>
                        {t('scope1')}
                    </button>
                    <button className={tabClasses('scope2')} onClick={() => setActiveTab('scope2')}>
                        {t('scope2')}
                    </button>
                    {scope3Settings.isEnabled && (
                        <button className={tabClasses('scope3')} onClick={() => setActiveTab('scope3')}>
                            {t('scope3')}
                        </button>
                    )}
                </nav>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {activeTab === 'scope1' && <Scope1Calculator {...commonCalculatorProps} />}
                {activeTab === 'scope2' && <Scope2Calculator {...commonCalculatorProps} />}
                {activeTab === 'scope3' && scope3Settings.isEnabled && (
                    <Scope3Calculator 
                        {...commonCalculatorProps} 
                        enabledScope3Categories={scope3Settings.enabledCategories}
                        onManageScope3={() => openWizard(4)}
                    />
                )}
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
    </>
  );
};