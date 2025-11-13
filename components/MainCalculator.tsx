// Fix: Corrected typo in React import
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { EmissionCategory, EmissionSource, Refrigerant, Facility, BoundaryApproach, EditableRefrigerant, CO2eFactorFuel } from '../types';
import { 
    STATIONARY_FUELS, MOBILE_FUELS, PROCESS_MATERIALS, FUGITIVE_GASES, SCOPE2_ENERGY_SOURCES, WASTE_SOURCES, 
    BUSINESS_TRAVEL_FACTORS, EMPLOYEE_COMMUTING_FACTORS, SCOPE3_WASTE_FACTORS,
    PURCHASED_GOODS_SERVICES_FACTORS, CAPITAL_GOODS_FACTORS, FUEL_ENERGY_ACTIVITIES_FACTORS,
    TRANSPORTATION_DISTRIBUTION_FACTORS, LEASED_ASSETS_FACTORS, PROCESSING_SOLD_PRODUCTS_FACTORS,
    USE_SOLD_PRODUCTS_FACTORS, END_OF_LIFE_TREATMENT_FACTORS, FRANCHISES_FACTORS, INVESTMENTS_FACTORS
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

const initialSources: { [key in EmissionCategory]: EmissionSource[] } = allCategories.reduce((acc, cat) => {
    acc[cat] = [];
    return acc;
}, {} as { [key in EmissionCategory]: EmissionSource[] });

interface Scope3Settings {
    isEnabled: boolean;
    enabledCategories: EmissionCategory[];
}

type ActiveTab = 'scope1' | 'scope2' | 'scope3';

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
    return saved ? JSON.parse(saved) : [{ id: 'default', name: 'Default Facility', equityShare: 100 }];
  });
  const [boundaryApproach, setBoundaryApproach] = useState<BoundaryApproach>(() => (localStorage.getItem('ghg-calc-boundaryApproach') as BoundaryApproach) || 'operational');
  const [scope3Settings, setScope3Settings] = useState<Scope3Settings>(() => {
      const saved = localStorage.getItem('ghg-calc-scope3Settings');
      return saved ? JSON.parse(saved) : { isEnabled: true, enabledCategories: [EmissionCategory.BusinessTravel, EmissionCategory.EmployeeCommuting, EmissionCategory.WasteGeneratedInOperations] };
  });
  
  // State for custom factors, loaded from localStorage or constants
  const [stationaryFuels, setStationaryFuels] = useState<CO2eFactorFuel[]>(() => {
      const saved = localStorage.getItem('ghg-calc-stationaryFuels');
      return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(STATIONARY_FUELS));
  });
  const [mobileFuels, setMobileFuels] = useState<CO2eFactorFuel[]>(() => {
      const saved = localStorage.getItem('ghg-calc-mobileFuels');
      return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(MOBILE_FUELS));
  });
  const [processMaterials, setProcessMaterials] = useState<CO2eFactorFuel[]>(() => {
      const saved = localStorage.getItem('ghg-calc-processMaterials');
      return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(PROCESS_MATERIALS));
  });
  const [fugitiveGases, setFugitiveGases] = useState<EditableRefrigerant[]>(() => {
      const saved = localStorage.getItem('ghg-calc-fugitiveGases');
      return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(FUGITIVE_GASES));
  });
  const [wasteSources, setWasteSources] = useState<CO2eFactorFuel[]>(() => {
      const saved = localStorage.getItem('ghg-calc-wasteSources');
      return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(WASTE_SOURCES));
  });
  const [scope2EnergySources, setScope2EnergySources] = useState<CO2eFactorFuel[]>(() => {
      const saved = localStorage.getItem('ghg-calc-scope2EnergySources');
      return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(SCOPE2_ENERGY_SOURCES));
  });
  // Scope 3 Factors State
    const [purchasedGoodsFactors, setPurchasedGoodsFactors] = useState<CO2eFactorFuel[]>(() => JSON.parse(localStorage.getItem('ghg-calc-purchasedGoodsFactors') || JSON.stringify(PURCHASED_GOODS_SERVICES_FACTORS)));
    const [capitalGoodsFactors, setCapitalGoodsFactors] = useState<CO2eFactorFuel[]>(() => JSON.parse(localStorage.getItem('ghg-calc-capitalGoodsFactors') || JSON.stringify(CAPITAL_GOODS_FACTORS)));
    const [fuelEnergyActivitiesFactors, setFuelEnergyActivitiesFactors] = useState<CO2eFactorFuel[]>(() => JSON.parse(localStorage.getItem('ghg-calc-fuelEnergyActivitiesFactors') || JSON.stringify(FUEL_ENERGY_ACTIVITIES_FACTORS)));
    const [upstreamTransportationDistributionFactors, setUpstreamTransportationDistributionFactors] = useState<CO2eFactorFuel[]>(() => JSON.parse(localStorage.getItem('ghg-calc-upstreamTransportationDistributionFactors') || JSON.stringify(TRANSPORTATION_DISTRIBUTION_FACTORS)));
    const [downstreamTransportationDistributionFactors, setDownstreamTransportationDistributionFactors] = useState<CO2eFactorFuel[]>(() => JSON.parse(localStorage.getItem('ghg-calc-downstreamTransportationDistributionFactors') || JSON.stringify(TRANSPORTATION_DISTRIBUTION_FACTORS)));
    const [scope3WasteFactors, setScope3WasteFactors] = useState<CO2eFactorFuel[]>(() => JSON.parse(localStorage.getItem('ghg-calc-scope3WasteFactors') || JSON.stringify(SCOPE3_WASTE_FACTORS)));
    const [businessTravelFactors, setBusinessTravelFactors] = useState<CO2eFactorFuel[]>(() => JSON.parse(localStorage.getItem('ghg-calc-businessTravelFactors') || JSON.stringify(BUSINESS_TRAVEL_FACTORS)));
    const [employeeCommutingFactors, setEmployeeCommutingFactors] = useState<CO2eFactorFuel[]>(() => JSON.parse(localStorage.getItem('ghg-calc-employeeCommutingFactors') || JSON.stringify(EMPLOYEE_COMMUTING_FACTORS)));
    const [upstreamLeasedAssetsFactors, setUpstreamLeasedAssetsFactors] = useState<CO2eFactorFuel[]>(() => JSON.parse(localStorage.getItem('ghg-calc-upstreamLeasedAssetsFactors') || JSON.stringify(LEASED_ASSETS_FACTORS)));
    const [downstreamLeasedAssetsFactors, setDownstreamLeasedAssetsFactors] = useState<CO2eFactorFuel[]>(() => JSON.parse(localStorage.getItem('ghg-calc-downstreamLeasedAssetsFactors') || JSON.stringify(LEASED_ASSETS_FACTORS)));
    const [processingSoldProductsFactors, setProcessingSoldProductsFactors] = useState<CO2eFactorFuel[]>(() => JSON.parse(localStorage.getItem('ghg-calc-processingSoldProductsFactors') || JSON.stringify(PROCESSING_SOLD_PRODUCTS_FACTORS)));
    const [useSoldProductsFactors, setUseSoldProductsFactors] = useState<CO2eFactorFuel[]>(() => JSON.parse(localStorage.getItem('ghg-calc-useSoldProductsFactors') || JSON.stringify(USE_SOLD_PRODUCTS_FACTORS)));
    const [endOfLifeTreatmentFactors, setEndOfLifeTreatmentFactors] = useState<CO2eFactorFuel[]>(() => JSON.parse(localStorage.getItem('ghg-calc-endOfLifeTreatmentFactors') || JSON.stringify(END_OF_LIFE_TREATMENT_FACTORS)));
    const [franchisesFactors, setFranchisesFactors] = useState<CO2eFactorFuel[]>(() => JSON.parse(localStorage.getItem('ghg-calc-franchisesFactors') || JSON.stringify(FRANCHISES_FACTORS)));
    const [investmentsFactors, setInvestmentsFactors] = useState<CO2eFactorFuel[]>(() => JSON.parse(localStorage.getItem('ghg-calc-investmentsFactors') || JSON.stringify(INVESTMENTS_FACTORS)));

  
  // UI State
  const [openCategory, setOpenCategory] = useState<EmissionCategory | null>(EmissionCategory.StationaryCombustion);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStartStep, setWizardStartStep] = useState(0);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(() => JSON.parse(localStorage.getItem('ghg-calc-isSetupComplete') || 'false'));
  const [activeTab, setActiveTab] = useState<ActiveTab>('scope1');


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

      // Persist custom factors
      localStorage.setItem('ghg-calc-stationaryFuels', JSON.stringify(stationaryFuels));
      localStorage.setItem('ghg-calc-mobileFuels', JSON.stringify(mobileFuels));
      localStorage.setItem('ghg-calc-processMaterials', JSON.stringify(processMaterials));
      localStorage.setItem('ghg-calc-fugitiveGases', JSON.stringify(fugitiveGases));
      localStorage.setItem('ghg-calc-scope2EnergySources', JSON.stringify(scope2EnergySources));
      localStorage.setItem('ghg-calc-wasteSources', JSON.stringify(wasteSources));
      // Persist Scope 3 factors
      localStorage.setItem('ghg-calc-purchasedGoodsFactors', JSON.stringify(purchasedGoodsFactors));
      localStorage.setItem('ghg-calc-capitalGoodsFactors', JSON.stringify(capitalGoodsFactors));
      localStorage.setItem('ghg-calc-fuelEnergyActivitiesFactors', JSON.stringify(fuelEnergyActivitiesFactors));
      localStorage.setItem('ghg-calc-upstreamTransportationDistributionFactors', JSON.stringify(upstreamTransportationDistributionFactors));
      localStorage.setItem('ghg-calc-downstreamTransportationDistributionFactors', JSON.stringify(downstreamTransportationDistributionFactors));
      localStorage.setItem('ghg-calc-scope3WasteFactors', JSON.stringify(scope3WasteFactors));
      localStorage.setItem('ghg-calc-businessTravelFactors', JSON.stringify(businessTravelFactors));
      localStorage.setItem('ghg-calc-employeeCommutingFactors', JSON.stringify(employeeCommutingFactors));
      localStorage.setItem('ghg-calc-upstreamLeasedAssetsFactors', JSON.stringify(upstreamLeasedAssetsFactors));
      localStorage.setItem('ghg-calc-downstreamLeasedAssetsFactors', JSON.stringify(downstreamLeasedAssetsFactors));
      localStorage.setItem('ghg-calc-processingSoldProductsFactors', JSON.stringify(processingSoldProductsFactors));
      localStorage.setItem('ghg-calc-useSoldProductsFactors', JSON.stringify(useSoldProductsFactors));
      localStorage.setItem('ghg-calc-endOfLifeTreatmentFactors', JSON.stringify(endOfLifeTreatmentFactors));
      localStorage.setItem('ghg-calc-franchisesFactors', JSON.stringify(franchisesFactors));
      localStorage.setItem('ghg-calc-investmentsFactors', JSON.stringify(investmentsFactors));
    }
  }, [
      companyName, reportingYear, facilities, boundaryApproach, scope3Settings, isSetupComplete, sources, 
      stationaryFuels, mobileFuels, processMaterials, fugitiveGases, scope2EnergySources, wasteSources,
      purchasedGoodsFactors, capitalGoodsFactors, fuelEnergyActivitiesFactors, upstreamTransportationDistributionFactors, downstreamTransportationDistributionFactors,
      scope3WasteFactors, businessTravelFactors, employeeCommutingFactors, upstreamLeasedAssetsFactors, downstreamLeasedAssetsFactors,
      processingSoldProductsFactors, useSoldProductsFactors, endOfLifeTreatmentFactors,
      franchisesFactors, investmentsFactors
  ]);


  const FUELS_MAP: { [key in EmissionCategory]?: (CO2eFactorFuel | Refrigerant)[] } = useMemo(() => ({
    [EmissionCategory.StationaryCombustion]: stationaryFuels,
    [EmissionCategory.MobileCombustion]: mobileFuels,
    [EmissionCategory.ProcessEmissions]: processMaterials,
    [EmissionCategory.FugitiveEmissions]: fugitiveGases,
    [EmissionCategory.PurchasedEnergy]: scope2EnergySources,
    [EmissionCategory.Waste]: wasteSources,
    // Scope 3
    [EmissionCategory.PurchasedGoodsAndServices]: purchasedGoodsFactors,
    [EmissionCategory.CapitalGoods]: capitalGoodsFactors,
    [EmissionCategory.FuelAndEnergyRelatedActivities]: fuelEnergyActivitiesFactors,
    [EmissionCategory.UpstreamTransportationAndDistribution]: upstreamTransportationDistributionFactors,
    [EmissionCategory.WasteGeneratedInOperations]: scope3WasteFactors,
    [EmissionCategory.BusinessTravel]: businessTravelFactors,
    [EmissionCategory.EmployeeCommuting]: employeeCommutingFactors,
    [EmissionCategory.UpstreamLeasedAssets]: upstreamLeasedAssetsFactors,
    [EmissionCategory.DownstreamTransportationAndDistribution]: downstreamTransportationDistributionFactors,
    [EmissionCategory.ProcessingOfSoldProducts]: processingSoldProductsFactors,
    [EmissionCategory.UseOfSoldProducts]: useSoldProductsFactors,
    [EmissionCategory.EndOfLifeTreatmentOfSoldProducts]: endOfLifeTreatmentFactors,
    [EmissionCategory.DownstreamLeasedAssets]: downstreamLeasedAssetsFactors,
    [EmissionCategory.Franchises]: franchisesFactors,
    [EmissionCategory.Investments]: investmentsFactors,
  }), [
    stationaryFuels, mobileFuels, processMaterials, fugitiveGases, scope2EnergySources, wasteSources,
    purchasedGoodsFactors, capitalGoodsFactors, fuelEnergyActivitiesFactors, upstreamTransportationDistributionFactors,
    scope3WasteFactors, businessTravelFactors, employeeCommutingFactors, upstreamLeasedAssetsFactors,
    downstreamTransportationDistributionFactors, processingSoldProductsFactors, useSoldProductsFactors,
    endOfLifeTreatmentFactors, downstreamLeasedAssetsFactors, franchisesFactors, investmentsFactors
  ]);
  
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

  const handleToggleCategory = useCallback((category: EmissionCategory) => {
    setOpenCategory(openCategory === category ? null : category);
  }, [openCategory]);

  const handleAddSource = useCallback((category: EmissionCategory) => {
    const fuelsForCategory = FUELS_MAP[category];
    // For Category 1, we allow adding a blank, customizable source.
    if (category === EmissionCategory.PurchasedGoodsAndServices) {
      const newSource: EmissionSource = {
        id: `source-${Date.now()}`,
        facilityId: facilities[0]?.id || 'default',
        category,
        description: '',
        fuelType: '', // User will fill this in as the description
        monthlyQuantities: Array(12).fill(0),
        unit: 'KRW', // Default unit
        dataType: 'spend_krw', // Default data type
        customFactor: 0,
      };
      setSources(prev => ({ ...prev, [category]: [...prev[category], newSource] }));
      return;
    }
    
    if (!fuelsForCategory || fuelsForCategory.length === 0) return;

    const defaultFuel = fuelsForCategory[0];
    const defaultUnit = 'units' in defaultFuel ? defaultFuel.units[0] : 'kg';

    const newSource: EmissionSource = {
      id: `source-${Date.now()}`,
      facilityId: facilities[0]?.id || 'default',
      category,
      description: '',
      fuelType: defaultFuel.name,
      monthlyQuantities: Array(12).fill(0),
      unit: defaultUnit,
    };
    setSources(prev => ({ ...prev, [category]: [...prev[category], newSource] }));
  }, [facilities, FUELS_MAP]);

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
    // This function is now only for non-Cat1 sources with predefined fuels.
    if (category === EmissionCategory.PurchasedGoodsAndServices) return;

    const fuelsForCategory = FUELS_MAP[category];
    if (!fuelsForCategory) return;
    
    const newFuel = fuelsForCategory.find(f => f.name === newFuelType);
    if (!newFuel) return;
    
    const newUnit = 'units' in newFuel ? newFuel.units[0] : 'kg';
    
    handleUpdateSource(id, category, { fuelType: newFuelType, unit: newUnit });
  }, [FUELS_MAP, handleUpdateSource]);

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
  
  const calculateSourceEmissions = useCallback((source: EmissionSource): { scope1: number, scope2Location: number, scope2Market: number, scope3: number } => {
    const totalQuantity = source.monthlyQuantities.reduce((sum, q) => sum + q, 0);

    // New logic for Category 1 with custom factors
    if (source.category === EmissionCategory.PurchasedGoodsAndServices && typeof source.customFactor === 'number') {
        const emissions = totalQuantity * source.customFactor;
        return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: emissions };
    }

    const categoryFuels = FUELS_MAP[source.category];
    if (!categoryFuels) return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: 0 };
    
    const fuel = categoryFuels.find(f => f.name === source.fuelType);
    if (!fuel) return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: 0 };
    
    const scope = getScopeForCategory(source.category);
    
    // Fugitive Emissions (Scope 1)
    if ('gwp' in fuel) {
        return { scope1: totalQuantity * fuel.gwp, scope2Location: 0, scope2Market: 0, scope3: 0 };
    }

    // All other sources use a simple CO2e factor
    if ('factors' in fuel) {
        const co2eFuel = fuel as CO2eFactorFuel;
        const factor = co2eFuel.factors[source.unit] || 0;
        const emissions = totalQuantity * factor;
        
        if (scope === 'scope2') {
            const marketFactor = source.marketBasedFactor ?? factor; // Use location factor if market not provided
            const marketEmissions = totalQuantity * marketFactor;
            return { scope1: 0, scope2Location: emissions, scope2Market: marketEmissions, scope3: 0 };
        } else if (scope === 'scope1') {
            return { scope1: emissions, scope2Location: 0, scope2Market: 0, scope3: 0 };
        } else { // Scope 3
            return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: emissions };
        }
    }
    
    return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: 0 };
  }, [FUELS_MAP, getScopeForCategory]);
  
  const results = useMemo(() => {
    let scope1Total = 0;
    let scope2LocationTotal = 0;
    let scope2MarketTotal = 0;
    let scope3Total = 0;
    const scope3CategoryBreakdown: { [category: string]: number } = {};

    const facilityBreakdown: { [facilityName: string]: { scope1: number, scope2Location: number, scope2Market: number, scope3: number } } = {};
    facilities.forEach(f => {
        facilityBreakdown[f.name] = { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: 0 };
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

            if(facilityBreakdown[facility.name]) {
                facilityBreakdown[facility.name].scope1 += adjScope1;
                facilityBreakdown[facility.name].scope2Location += adjScope2L;
                facilityBreakdown[facility.name].scope2Market += adjScope2M;
                facilityBreakdown[facility.name].scope3 += adjScope3;
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
      equity: t('equityControlDescription'),
  }[boundaryApproach]), [boundaryApproach, t]);
  
  const handleWizardSave = useCallback((details: {
    companyName: string;
    reportingYear: string;
    facilities: Facility[];
    boundaryApproach: BoundaryApproach;
    scope3Settings: Scope3Settings;
  }) => {
    setCompanyName(details.companyName);
    setReportingYear(details.reportingYear);
    setFacilities(details.facilities.length > 0 ? details.facilities : [{ id: 'default', name: 'Default Facility', equityShare: 100 }]);
    setBoundaryApproach(details.boundaryApproach);
    setScope3Settings(details.scope3Settings);
    setIsSetupComplete(true);
    setIsWizardOpen(false);
  }, []);

  const openWizard = useCallback((startStep: number) => {
    setWizardStartStep(startStep);
    setIsWizardOpen(true);
  }, []);
  
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
            stationaryFuels={stationaryFuels}
            mobileFuels={mobileFuels}
            processMaterials={processMaterials}
            fugitiveGases={fugitiveGases}
            scope2EnergySources={scope2EnergySources}
            wasteSources={wasteSources}
            // Scope 3 props
            purchasedGoodsFactors={purchasedGoodsFactors}
            capitalGoodsFactors={capitalGoodsFactors}
            fuelEnergyActivitiesFactors={fuelEnergyActivitiesFactors}
            upstreamTransportationDistributionFactors={upstreamTransportationDistributionFactors}
            downstreamTransportationDistributionFactors={downstreamTransportationDistributionFactors}
            scope3WasteFactors={scope3WasteFactors}
            businessTravelFactors={businessTravelFactors}
            employeeCommutingFactors={employeeCommutingFactors}
            upstreamLeasedAssetsFactors={upstreamLeasedAssetsFactors}
            downstreamLeasedAssetsFactors={downstreamLeasedAssetsFactors}
            processingSoldProductsFactors={processingSoldProductsFactors}
            useSoldProductsFactors={useSoldProductsFactors}
            endOfLifeTreatmentFactors={endOfLifeTreatmentFactors}
            franchisesFactors={franchisesFactors}
            investmentsFactors={investmentsFactors}
            // Setters
            onStationaryChange={setStationaryFuels}
            onMobileChange={setMobileFuels}
            onProcessChange={setProcessMaterials}
            onFugitiveChange={setFugitiveGases}
            onScope2Change={setScope2EnergySources}
            onWasteChange={setWasteSources}
            // Scope 3 setters
            onPurchasedGoodsChange={setPurchasedGoodsFactors}
            onCapitalGoodsChange={setCapitalGoodsFactors}
            onFuelEnergyActivitiesChange={setFuelEnergyActivitiesFactors}
            onUpstreamTransportationDistributionChange={setUpstreamTransportationDistributionFactors}
            onDownstreamTransportationDistributionChange={setDownstreamTransportationDistributionFactors}
            onScope3WasteChange={setScope3WasteFactors}
            onBusinessTravelChange={setBusinessTravelFactors}
            onEmployeeCommutingChange={setEmployeeCommutingFactors}
            onUpstreamLeasedAssetsChange={setUpstreamLeasedAssetsFactors}
            onDownstreamLeasedAssetsChange={setDownstreamLeasedAssetsFactors}
            onProcessingSoldProductsChange={setProcessingSoldProductsFactors}
            onUseSoldProductsChange={setUseSoldProductsFactors}
            onEndOfLifeTreatmentChange={setEndOfLifeTreatmentFactors}
            onFranchisesChange={setFranchisesFactors}
            onInvestmentsChange={setInvestmentsFactors}

            enabledScope3Categories={scope3Settings.enabledCategories}
        />
      </div>
    </>
  );
};