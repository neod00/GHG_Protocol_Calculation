// Fix: Corrected typo in React import
import React, { useState, useMemo, useEffect } from 'react';
import { EmissionCategory, EmissionSource, Fuel, Refrigerant, Facility, BoundaryApproach, EditableFuel, EditableRefrigerant, CO2eFactorFuel } from '../types';
import { STATIONARY_FUELS, MOBILE_FUELS, PROCESS_MATERIALS, FUGITIVE_GASES, SCOPE2_ENERGY_SOURCES, WASTE_SOURCES, GWP_VALUES } from '../constants';
import { EmissionSourceCard } from './EmissionSourceCard';
import { ResultsDisplay } from './ResultsDisplay';
import { useTranslation } from '../LanguageContext';
import { FactorManager } from './FactorManager';
import { BoundarySetupWizard } from './BoundarySetupWizard';
import { ReportGenerator } from './ReportGenerator';

const initialSources: { [key in EmissionCategory]: EmissionSource[] } = {
  [EmissionCategory.StationaryCombustion]: [],
  // Fix: Corrected typo from EmissionaryCombustion to EmissionCategory.MobileCombustion
  [EmissionCategory.MobileCombustion]: [],
  [EmissionCategory.ProcessEmissions]: [],
  [EmissionCategory.FugitiveEmissions]: [],
  [EmissionCategory.PurchasedEnergy]: [],
  [EmissionCategory.Waste]: [],
};

type ActiveTab = 'scope1' | 'scope2';

export const MainCalculator: React.FC = () => {
  const { t } = useTranslation();
  
  // State for data, initialized from localStorage or defaults
  const [sources, setSources] = useState<{ [key in EmissionCategory]: EmissionSource[] }>(initialSources);
  const [companyName, setCompanyName] = useState<string>(() => localStorage.getItem('ghg-calc-companyName') || 'My Company');
  const [reportingYear, setReportingYear] = useState<string>(() => localStorage.getItem('ghg-calc-reportingYear') || new Date().getFullYear().toString());
  const [facilities, setFacilities] = useState<Facility[]>(() => {
    const saved = localStorage.getItem('ghg-calc-facilities');
    return saved ? JSON.parse(saved) : [{ id: 'default', name: 'Default Facility', equityShare: 100 }];
  });
  const [boundaryApproach, setBoundaryApproach] = useState<BoundaryApproach>(() => (localStorage.getItem('ghg-calc-boundaryApproach') as BoundaryApproach) || 'operational');
  
  // State for custom factors, loaded from localStorage or constants
  const [stationaryFuels, setStationaryFuels] = useState<EditableFuel[]>(() => {
      const saved = localStorage.getItem('ghg-calc-stationaryFuels');
      return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(STATIONARY_FUELS));
  });
  const [mobileFuels, setMobileFuels] = useState<EditableFuel[]>(() => {
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

  
  // UI State
  const [openCategory, setOpenCategory] = useState<EmissionCategory | null>(EmissionCategory.StationaryCombustion);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(() => JSON.parse(localStorage.getItem('ghg-calc-isSetupComplete') || 'false'));
  const [activeTab, setActiveTab] = useState<ActiveTab>('scope1');


  // Persist all data to localStorage when it changes
  useEffect(() => {
    if (isSetupComplete) {
      localStorage.setItem('ghg-calc-companyName', companyName);
      localStorage.setItem('ghg-calc-reportingYear', reportingYear);
      localStorage.setItem('ghg-calc-facilities', JSON.stringify(facilities));
      localStorage.setItem('ghg-calc-boundaryApproach', boundaryApproach);
      localStorage.setItem('ghg-calc-isSetupComplete', 'true');

      // Persist custom factors
      localStorage.setItem('ghg-calc-stationaryFuels', JSON.stringify(stationaryFuels));
      localStorage.setItem('ghg-calc-mobileFuels', JSON.stringify(mobileFuels));
      localStorage.setItem('ghg-calc-processMaterials', JSON.stringify(processMaterials));
      localStorage.setItem('ghg-calc-fugitiveGases', JSON.stringify(fugitiveGases));
      localStorage.setItem('ghg-calc-scope2EnergySources', JSON.stringify(scope2EnergySources));
      localStorage.setItem('ghg-calc-wasteSources', JSON.stringify(wasteSources));
    }
  }, [companyName, reportingYear, facilities, boundaryApproach, isSetupComplete, stationaryFuels, mobileFuels, processMaterials, fugitiveGases, scope2EnergySources, wasteSources]);


  const FUELS_MAP: { [key in EmissionCategory]?: (Fuel | Refrigerant | CO2eFactorFuel)[] } = {
    [EmissionCategory.StationaryCombustion]: stationaryFuels,
    [EmissionCategory.MobileCombustion]: mobileFuels,
    [EmissionCategory.ProcessEmissions]: processMaterials,
    [EmissionCategory.FugitiveEmissions]: fugitiveGases,
    [EmissionCategory.PurchasedEnergy]: scope2EnergySources,
    [EmissionCategory.Waste]: wasteSources,
  };
  
  const categoryDescriptions: Record<EmissionCategory, string> = {
      [EmissionCategory.StationaryCombustion]: t('stationaryDescription'),
      [EmissionCategory.MobileCombustion]: t('mobileDescription'),
      [EmissionCategory.ProcessEmissions]: t('processDescription'),
      [EmissionCategory.FugitiveEmissions]: t('fugitiveDescription'),
      [EmissionCategory.PurchasedEnergy]: t('energyDescription'),
      [EmissionCategory.Waste]: t('wasteDescription'),
  };

  const handleToggleCategory = (category: EmissionCategory) => {
    setOpenCategory(openCategory === category ? null : category);
  };

  const handleAddSource = (category: EmissionCategory) => {
    const fuelsForCategory = FUELS_MAP[category];
    if (!fuelsForCategory || fuelsForCategory.length === 0) return;

    const defaultFuel = fuelsForCategory[0];
    const defaultUnit = 'units' in defaultFuel ? defaultFuel.units[0] : 'kg';

    const newSource: EmissionSource = {
      id: `source-${Date.now()}`,
      facilityId: facilities[0]?.id || 'default',
      category,
      fuelType: defaultFuel.name,
      monthlyQuantities: Array(12).fill(0),
      unit: defaultUnit,
    };
    setSources(prev => ({ ...prev, [category]: [...prev[category], newSource] }));
  };

  const handleUpdateSource = (id: string, category: EmissionCategory, update: Partial<EmissionSource>) => {
    setSources(prev => ({
      ...prev,
      [category]: prev[category].map(s => s.id === id ? { ...s, ...update } : s),
    }));
  };
  
  const handleFuelTypeChange = (id: string, newFuelType: string, category: EmissionCategory) => {
    const fuelsForCategory = FUELS_MAP[category];
    if (!fuelsForCategory) return;
    
    const newFuel = fuelsForCategory.find(f => f.name === newFuelType);
    if (!newFuel) return;
    
    const newUnit = 'units' in newFuel ? newFuel.units[0] : 'kg';
    
    handleUpdateSource(id, category, { fuelType: newFuelType, unit: newUnit });
  };

  const handleRemoveSource = (id: string, category: EmissionCategory) => {
    setSources(prev => ({
      ...prev,
      [category]: prev[category].filter(s => s.id !== id),
    }));
  };
  
  const calculateSourceEmissions = (source: EmissionSource): { scope1: number, scope2Location: number, scope2Market: number, biogenic: number } => {
    const totalQuantity = source.monthlyQuantities.reduce((sum, q) => sum + q, 0);
    const categoryFuels = FUELS_MAP[source.category];
    if (!categoryFuels) return { scope1: 0, scope2Location: 0, scope2Market: 0, biogenic: 0 };
    
    const fuel = categoryFuels.find(f => f.name === source.fuelType);
    if (!fuel) return { scope1: 0, scope2Location: 0, scope2Market: 0, biogenic: 0 };
    
    // Fugitive Emissions
    if ('gwp' in fuel) {
        return { scope1: totalQuantity * fuel.gwp, scope2Location: 0, scope2Market: 0, biogenic: 0 };
    }

    // Combustion Fuentes (Stationary, Mobile) with disaggregated factors
    if ('isBiomass' in fuel || (fuel.factors[source.unit] && typeof fuel.factors[source.unit] === 'object')) {
        const combFuel = fuel as Fuel;
        const factors = combFuel.factors[source.unit];
        if (!factors) return { scope1: 0, scope2Location: 0, scope2Market: 0, biogenic: 0 };
        
        const co2_emissions = totalQuantity * factors.co2;
        const ch4_co2e = totalQuantity * factors.ch4 * GWP_VALUES.ch4;
        const n2o_co2e = totalQuantity * factors.n2o * GWP_VALUES.n2o;

        if (combFuel.isBiomass) {
            return { scope1: ch4_co2e + n2o_co2e, scope2Location: 0, scope2Market: 0, biogenic: co2_emissions };
        } else {
            return { scope1: co2_emissions + ch4_co2e + n2o_co2e, scope2Location: 0, scope2Market: 0, biogenic: 0 };
        }
    }
    
    // Scope 2 and simple CO2e factor fuels (Process, Waste)
    if ('factors' in fuel) {
        const co2eFuel = fuel as CO2eFactorFuel;
        const factor = co2eFuel.factors[source.unit] || 0;
        const emissions = totalQuantity * factor;
        
        if (source.category === EmissionCategory.PurchasedEnergy) {
            const marketFactor = source.marketBasedFactor ?? factor; // Use location factor if market not provided
            const marketEmissions = totalQuantity * marketFactor;
            return { scope1: 0, scope2Location: emissions, scope2Market: marketEmissions, biogenic: 0 };
        } else { // Process or Waste
            return { scope1: emissions, scope2Location: 0, scope2Market: 0, biogenic: 0 };
        }
    }
    
    return { scope1: 0, scope2Location: 0, scope2Market: 0, biogenic: 0 };
  };
  
  const results = useMemo(() => {
    let scope1Total = 0;
    let scope2LocationTotal = 0;
    let scope2MarketTotal = 0;
    let biogenicTotal = 0;

    const facilityBreakdown: { [facilityName: string]: { scope1: number, scope2Location: number, scope2Market: number } } = {};
    facilities.forEach(f => {
        facilityBreakdown[f.name] = { scope1: 0, scope2Location: 0, scope2Market: 0 };
    });
    
    for (const category of Object.values(EmissionCategory)) {
        for (const source of sources[category]) {
            const facility = facilities.find(f => f.id === source.facilityId);
            if (!facility) continue;

            const ownershipFactor = boundaryApproach === 'equity' ? (facility.equityShare / 100) : 1;
            const emissions = calculateSourceEmissions(source);
            
            const adjScope1 = emissions.scope1 * ownershipFactor;
            const adjScope2L = emissions.scope2Location * ownershipFactor;
            const adjScope2M = emissions.scope2Market * ownershipFactor;
            const adjBiogenic = emissions.biogenic * ownershipFactor;

            scope1Total += adjScope1;
            scope2LocationTotal += adjScope2L;
            scope2MarketTotal += adjScope2M;
            biogenicTotal += adjBiogenic;

            if(facilityBreakdown[facility.name]) {
                facilityBreakdown[facility.name].scope1 += adjScope1;
                facilityBreakdown[facility.name].scope2Location += adjScope2L;
                facilityBreakdown[facility.name].scope2Market += adjScope2M;
            }
        }
    }
    
    const totalEmissionsMarket = scope1Total + scope2MarketTotal;
    const totalEmissionsLocation = scope1Total + scope2LocationTotal;
    
    return { totalEmissionsMarket, totalEmissionsLocation, scope1Total, scope2LocationTotal, scope2MarketTotal, biogenicTotal, facilityBreakdown };
  }, [sources, facilities, boundaryApproach, stationaryFuels, mobileFuels, processMaterials, fugitiveGases, scope2EnergySources, wasteSources]);
  
  const boundaryApproachText = {
      operational: t('operationalControl'),
      financial: t('financialControl'),
      equity: t('equityShare'),
  }[boundaryApproach];
  
  const handleWizardSave = (details: {
    companyName: string;
    reportingYear: string;
    facilities: Facility[];
    boundaryApproach: BoundaryApproach;
  }) => {
    setCompanyName(details.companyName);
    setReportingYear(details.reportingYear);
    setFacilities(details.facilities.length > 0 ? details.facilities : [{ id: 'default', name: 'Default Facility', equityShare: 100 }]);
    setBoundaryApproach(details.boundaryApproach);
    setIsSetupComplete(true);
    setIsWizardOpen(false);
  }
  
  const tabClasses = (tabName: ActiveTab) =>
    `px-4 py-2 text-lg font-semibold rounded-t-lg transition-colors focus:outline-none ${
      activeTab === tabName
        ? 'border-b-4 border-ghg-accent text-ghg-dark dark:text-white'
        : 'text-gray-500 hover:text-ghg-dark dark:hover:text-gray-300'
    }`;
    
  const scope1Categories = Object.values(EmissionCategory).filter(c => c !== EmissionCategory.PurchasedEnergy);
  const scope2Categories = [EmissionCategory.PurchasedEnergy];

  return (
    <>
      <BoundarySetupWizard 
        isOpen={!isSetupComplete || isWizardOpen}
        isCancellable={isSetupComplete}
        onClose={() => setIsWizardOpen(false)}
        onSave={handleWizardSave}
        initialData={{companyName, reportingYear, facilities, boundaryApproach}}
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
          <button onClick={() => setIsWizardOpen(true)} className="mb-6 bg-ghg-accent text-white font-semibold py-2 px-4 rounded-lg hover:bg-ghg-green transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ghg-green">
              {t('reconfigureBoundary')}
          </button>
          
          <ResultsDisplay 
            totalEmissionsMarket={results.totalEmissionsMarket}
            totalEmissionsLocation={results.totalEmissionsLocation}
            scope1Total={results.scope1Total}
            scope2LocationTotal={results.scope2LocationTotal}
            scope2MarketTotal={results.scope2MarketTotal}
            biogenicTotal={results.biogenicTotal}
            facilityBreakdown={results.facilityBreakdown}
            facilities={facilities}
            boundaryApproach={boundaryApproach}
            companyName={companyName}
            reportingYear={reportingYear}
            boundaryApproachText={boundaryApproachText}
            onGenerateReport={() => setIsReportOpen(true)}
          />
        </div>
        
        <div>
            <div className="border-b border-gray-200 dark:border-gray-600 mb-8">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button className={tabClasses('scope1')} onClick={() => setActiveTab('scope1')}>
                        {t('scope1')}
                    </button>
                    <button className={tabClasses('scope2')} onClick={() => setActiveTab('scope2')}>
                        {t('scope2')}
                    </button>
                </nav>
            </div>

            {activeTab === 'scope1' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {scope1Categories.map((category) => (
                        <EmissionSourceCard
                        key={category}
                        category={category}
                        sources={sources[category]}
                        onAddSource={() => handleAddSource(category)}
                        onUpdateSource={(id, update) => handleUpdateSource(id, category, update)}
                        onRemoveSource={(id) => handleRemoveSource(id, category)}
                        onFuelTypeChange={handleFuelTypeChange}
                        fuels={FUELS_MAP[category] || []}
                        calculateEmissions={calculateSourceEmissions}
                        description={categoryDescriptions[category]}
                        facilities={facilities}
                        isOpen={openCategory === category}
                        onToggle={() => handleToggleCategory(category)}
                        boundaryApproach={boundaryApproach}
                        />
                    ))}
                </div>
            )}
            {activeTab === 'scope2' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {scope2Categories.map((category) => (
                        <EmissionSourceCard
                        key={category}
                        category={category}
                        sources={sources[category]}
                        onAddSource={() => handleAddSource(category)}
                        onUpdateSource={(id, update) => handleUpdateSource(id, category, update)}
                        onRemoveSource={(id) => handleRemoveSource(id, category)}
                        onFuelTypeChange={handleFuelTypeChange}
                        fuels={FUELS_MAP[category] || []}
                        calculateEmissions={calculateSourceEmissions}
                        description={categoryDescriptions[category]}
                        facilities={facilities}
                        isOpen={openCategory === category}
                        onToggle={() => handleToggleCategory(category)}
                        boundaryApproach={boundaryApproach}
                        />
                    ))}
                </div>
            )}
        </div>

        <FactorManager
            stationaryFuels={stationaryFuels}
            mobileFuels={mobileFuels}
            processMaterials={processMaterials}
            fugitiveGases={fugitiveGases}
            scope2EnergySources={scope2EnergySources}
            wasteSources={wasteSources}
            onStationaryChange={setStationaryFuels}
            onMobileChange={setMobileFuels}
            onProcessChange={setProcessMaterials}
            onFugitiveChange={setFugitiveGases}
            onScope2Change={setScope2EnergySources}
            onWasteChange={setWasteSources}
        />
      </div>
    </>
  );
};
