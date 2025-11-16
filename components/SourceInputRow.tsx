import React, { useState, useEffect, useMemo } from 'react';
import { EmissionSource, Facility, Refrigerant, CO2eFactorFuel, EmissionCategory, CalculationMethod, Cat4CalculationMethod, TransportMode, Cat5CalculationMethod, WasteType, TreatmentMethod, Cat6CalculationMethod, BusinessTravelMode, Cat7CalculationMethod, EmployeeCommutingMode, PersonalCarType, PublicTransportType, Cat8CalculationMethod, LeasedAssetType, BuildingType, Cat10CalculationMethod } from '../types';
import { useTranslation } from '../LanguageContext';
import { TranslationKey } from '../translations';
import { IconInfo, IconTrash, IconSparkles } from './IconComponents';
import { GoogleGenAI, Type } from '@google/genai';
import { BUSINESS_TRAVEL_FACTORS_DETAILED, MOBILE_FUELS, SCOPE2_ENERGY_SOURCES, STATIONARY_FUELS, TRANSPORTATION_FACTORS_BY_MODE, TRANSPORTATION_SPEND_FACTORS, WASTE_SPEND_FACTORS, WASTE_TREATMENT_FACTORS } from '../constants';

interface SourceInputRowProps {
  source: EmissionSource;
  onUpdate: (updatedSource: Partial<EmissionSource>) => void;
  onRemove: () => void;
  onFuelTypeChange: (newFuelType: string) => void;
  fuels: any;
  facilities: Facility[];
  calculateEmissions: (source: EmissionSource) => { scope1: number, scope2Location: number, scope2Market: number, scope3: number };
}

export const SourceInputRow: React.FC<SourceInputRowProps> = ({ source, onUpdate, onRemove, onFuelTypeChange, fuels, facilities, calculateEmissions }) => {
  const { t, language } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuantities, setEditedQuantities] = useState([...source.monthlyQuantities]);
  const [provideMarketData, setProvideMarketData] = useState(typeof source.marketBasedFactor !== 'undefined');
  
  // State for advanced Category 1 UI
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);


  useEffect(() => {
    if ((source.category === EmissionCategory.PurchasedGoodsAndServices || source.category === EmissionCategory.CapitalGoods) && !source.calculationMethod) {
      onUpdate({
        calculationMethod: 'spend',
        unit: 'KRW',
        factor: source.factor ?? 0,
        factorUnit: 'kg CO₂e / KRW'
      });
    }
  }, [source.category, source.calculationMethod, source.factor, onUpdate]);

  // This effect synchronizes the local editing state with the props from the parent.
  // It runs when the source data changes externally OR when editing is cancelled.
  // It specifically avoids running while the user is actively editing,
  // preventing their input from being overwritten by prop updates.
  useEffect(() => {
    if (!isEditing) {
      setEditedQuantities([...source.monthlyQuantities]);
    }
  }, [source.monthlyQuantities, isEditing]);

  const renderUnit = (unit: string) => {
    if (unit === 'cubic meters') {
      return <span>m<sup>3</sup></span>;
    }
    return t(unit as TranslationKey) || unit;
  };


  const getPlaceholderKey = (category: EmissionCategory): TranslationKey => {
    switch (category) {
        case EmissionCategory.FugitiveEmissions:
            return 'fugitiveDescriptionPlaceholder';
        case EmissionCategory.ProcessEmissions:
            return 'processDescriptionPlaceholder';
        case EmissionCategory.MobileCombustion:
            return 'mobileDescriptionPlaceholder';
        case EmissionCategory.Waste: // Scope 1 Waste
            return 'wasteDescriptionPlaceholder';
        case EmissionCategory.PurchasedEnergy:
            return 'energyDescriptionPlaceholder';
        // Scope 3 Categories with specific placeholders
        case EmissionCategory.PurchasedGoodsAndServices:
        case EmissionCategory.CapitalGoods:
            return 'capitalGoodsPlaceholder';
        case EmissionCategory.FuelAndEnergyRelatedActivities:
            return 'fuelEnergyPlaceholder';
        case EmissionCategory.UpstreamTransportationAndDistribution:
            return 'upstreamTransportPlaceholder';
        case EmissionCategory.WasteGeneratedInOperations: // Scope 3 Waste
            return 'scope3WastePlaceholder';
        case EmissionCategory.BusinessTravel:
            return 'businessTravelPlaceholder';
        case EmissionCategory.EmployeeCommuting:
            return 'employeeCommutingPlaceholder';
        case EmissionCategory.UpstreamLeasedAssets:
            return 'upstreamLeasedAssetsPlaceholder';
        case EmissionCategory.DownstreamTransportationAndDistribution:
            return 'downstreamTransportPlaceholder';
        case EmissionCategory.ProcessingOfSoldProducts:
            return 'processingOfSoldProductsPlaceholder';
        case EmissionCategory.UseOfSoldProducts:
            return 'useOfSoldProductsPlaceholder';
        case EmissionCategory.EndOfLifeTreatmentOfSoldProducts:
            return 'endOfLifePlaceholder';
        case EmissionCategory.DownstreamLeasedAssets:
            return 'downstreamLeasedAssetsPlaceholder';
        case EmissionCategory.Franchises:
            return 'franchisesPlaceholder';
        case EmissionCategory.Investments:
            return 'investmentsPlaceholder';
        case EmissionCategory.StationaryCombustion:
        default:
            return 'emissionSourceDescriptionPlaceholder';
    }
  }

  const handleMonthlyChange = (monthIndex: number, value: string) => {
    const newQuantities = [...editedQuantities];
    newQuantities[monthIndex] = parseFloat(value) || 0;
    setEditedQuantities(newQuantities);
  };
  
  const handleEdit = () => {
    // State is already synced by the useEffect, so we just need to enable the editing UI.
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Just disable editing. The useEffect will handle resetting the state
    // to match the latest props on the subsequent render.
    setIsEditing(false);
  };

  const handleSave = () => {
    onUpdate({ monthlyQuantities: editedQuantities });
    setIsEditing(false);
  };

  const handleMarketFactorChange = (value: string) => {
    onUpdate({ marketBasedFactor: parseFloat(value) || 0 });
  };

  const toggleMarketData = () => {
    const isProviding = !provideMarketData;
    setProvideMarketData(isProviding);
    if (!isProviding) {
        const { marketBasedFactor, ...rest } = source;
        onUpdate({ ...rest, marketBasedFactor: undefined });
    } else {
        onUpdate({ marketBasedFactor: 0 });
    }
  };

  const totalQuantity = source.monthlyQuantities.reduce((sum, q) => sum + q, 0);
  const emissionResults = calculateEmissions(source);
  const totalEmissions = emissionResults.scope1 + emissionResults.scope2Market + emissionResults.scope3;
  const monthKeys: TranslationKey[] = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const commonSelectClass = "w-full bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
  const commonInputClass = "w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
  const commonLabelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400";
  const placeholderKey = getPlaceholderKey(source.category);

  const groupedFacilities = useMemo(() => {
    const groups: { [key: string]: Facility[] } = {};
    const ungrouped: Facility[] = [];
    
    facilities.forEach(f => {
        if (f.isCorporate) return; // Exclude corporate from regular grouping
        const groupKey = f.group || '';
        if (groupKey) {
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(f);
        } else {
            ungrouped.push(f);
        }
    });
    
    return { groups, ungrouped };
  }, [facilities]);

  const preventNonNumericKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  };


  // == Advanced UI for Category 1 & 2 ==
  if (source.category === EmissionCategory.PurchasedGoodsAndServices || source.category === EmissionCategory.CapitalGoods) {
    const placeholderText = source.category === EmissionCategory.PurchasedGoodsAndServices
      ? t('purchasedGoodsServicesPlaceholder')
      : t('capitalGoodsPlaceholder');

    const handleMethodChange = (method: CalculationMethod) => {
        let updates: Partial<EmissionSource> = { calculationMethod: method };
        if (method === 'spend') {
            updates.unit = 'KRW';
            updates.factorUnit = 'kg CO₂e / KRW';
        } else if (method === 'activity') {
            updates.unit = 'tonnes';
            updates.factorUnit = 'kg CO₂e / tonnes';
        } else if (method === 'supplier_co2e') {
            updates.monthlyQuantities = Array(12).fill(0);
        }
        onUpdate(updates);
    };
    
    const handleAnalyze = async () => {
        if (!source.fuelType) return;
        setIsLoadingAI(true);
        setAiAnalysisResult(null);
        try {
            const ai = new GoogleGenAI({apiKey: process.env.API_KEY as string});
            const promptText = source.category === EmissionCategory.PurchasedGoodsAndServices
              ? `You are a GHG accounting expert specializing in Scope 3 emissions according to the GHG Protocol. Analyze the following purchased item description and provide a structured JSON response. Item Description: "${source.fuelType}"`
              : `You are a GHG accounting expert specializing in Scope 3 emissions according to the GHG Protocol. Analyze the following capital good description and provide a structured JSON response. Item Description: "${source.fuelType}"`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: promptText,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            suggested_category: { type: Type.STRING, description: 'The most likely Scope 3 category (e.g., "1. Purchased Goods and Services", "2. Capital Goods", "4. Upstream Transportation and Distribution").' },
                            justification: { type: Type.STRING, description: "A brief explanation for your choice." },
                        }
                    },
                }
            });
            const result = JSON.parse(response.text);
            setAiAnalysisResult(result);
        } catch (error) {
            console.error("AI analysis failed:", error);
            setAiAnalysisResult({ error: "Failed to analyze." });
        } finally {
            setIsLoadingAI(false);
        }
    };
    
    const activityTotal = source.calculationMethod === 'supplier_co2e' 
        ? (source.supplierProvidedCO2e ?? 0)
        : source.monthlyQuantities.reduce((sum, q) => sum + q, 0);

    const activityUnit = source.calculationMethod === 'supplier_co2e' ? 'kg CO₂e' : source.unit;

    return (
      <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600">
        {/* Collapsed View */}
        <div className="flex justify-between items-center">
            <div className='truncate pr-2'>
                <p className="text-sm font-medium text-ghg-dark dark:text-gray-100 truncate">{source.fuelType || placeholderText}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('total')}: {activityTotal.toLocaleString()}&nbsp;
                    {renderUnit(activityUnit)} • {(totalEmissions / 1000).toLocaleString('en-US', {minimumFractionDigits: 3})} t CO₂e
                </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => setIsExpanded(!isExpanded)} className="text-sm text-ghg-green font-semibold hover:underline">
                    {isExpanded ? t('cancel') : t('editDetails')}
                </button>
                 <button onClick={onRemove} className="text-gray-400 hover:text-red-600 p-1 dark:text-gray-500 dark:hover:text-red-500" aria-label={t('removeSourceAria')}>
                    <IconTrash className="h-5 w-5" />
                </button>
            </div>
        </div>

        {/* Expanded View */}
        {isExpanded && <div className="flex flex-col gap-3 pt-3 border-t dark:border-gray-600">
            {/* GUIDANCE BOX for Category 2 */}
            {source.category === EmissionCategory.CapitalGoods && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700/50 dark:text-yellow-200 text-xs space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2"><IconInfo className="w-4 h-4" /> {t('capitalGoodsInfoTitle')}</h4>
                    <ul className="list-disc pl-5 space-y-1">
                        <li dangerouslySetInnerHTML={{ __html: t('capitalGoodsInfoDepreciation') }}></li>
                        <li dangerouslySetInnerHTML={{ __html: t('capitalGoodsInfoCategorization') }}></li>
                        <li>{t('capitalGoodsInfoScope')}</li>
                    </ul>
                </div>
            )}
            
            {/* Item Description & AI */}
            <div>
                <label htmlFor={`description-${source.id}`} className={commonLabelClass}>{t('emissionSourceDescription')}</label>
                <div className="flex gap-2">
                    <input
                        id={`description-${source.id}`}
                        type="text"
                        value={source.fuelType}
                        onChange={(e) => onUpdate({ fuelType: e.target.value })}
                        className={commonSelectClass}
                        placeholder={placeholderText}
                    />
                    <button onClick={handleAnalyze} disabled={isLoadingAI} className="px-3 py-2 bg-ghg-light-green text-white rounded-md hover:bg-ghg-green disabled:bg-gray-400 flex items-center gap-2">
                        <IconSparkles className="w-4 h-4" />
                        <span className="text-sm font-semibold">{isLoadingAI ? '...' : t('analyzeWithAI')}</span>
                    </button>
                </div>
            </div>
            {aiAnalysisResult && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 dark:bg-blue-900/30 dark:border-blue-700/50 dark:text-blue-200">
                    <h4 className="font-semibold text-sm mb-1">{t('aiAnalysis')}</h4>
                    <p className="text-xs"><span className="font-semibold">{t('suggestedCategory')}:</span> {aiAnalysisResult.suggested_category}</p>
                    <p className="text-xs"><span className="font-semibold">{t('justification')}:</span> {aiAnalysisResult.justification}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">{t('aiDisclaimer')}</p>
                </div>
            )}

            {/* Calculation Method */}
            <div>
                <label className={commonLabelClass}>{t('calculationMethod')}</label>
                <div className="flex gap-2 rounded-md bg-gray-200 dark:bg-gray-900 p-1">
                    {(['supplier_co2e', 'activity', 'spend'] as CalculationMethod[]).map(method => (
                        <button 
                            key={method}
                            onClick={() => handleMethodChange(method)}
                            className={`flex-1 text-sm py-1 rounded-md transition-colors ${source.calculationMethod === method ? 'bg-white dark:bg-gray-700 shadow font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                            {t(`${method.startsWith('supplier') ? 'supplier' : method}Method` as TranslationKey)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Conditional Inputs */}
            {source.calculationMethod === 'supplier_co2e' && (
                <div>
                    <label htmlFor={`supplier-co2e-${source.id}`} className={commonLabelClass}>{t('supplierProvidedCO2e')}</label>
                    <input
                        id={`supplier-co2e-${source.id}`}
                        type="number" step="any"
                        value={source.supplierProvidedCO2e ?? ''}
                        onChange={(e) => onUpdate({ supplierProvidedCO2e: parseFloat(e.target.value) || 0 })}
                        className={commonSelectClass} placeholder="0"
                    />
                </div>
            )}
            {(source.calculationMethod === 'activity' || source.calculationMethod === 'spend') && (<>
                 <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label htmlFor={`factor-${source.id}`} className={commonLabelClass}>{t('emissionFactor')}</label>
                        <input
                            id={`factor-${source.id}`}
                            type="number" step="any"
                            value={source.factor ?? ''}
                            onChange={(e) => onUpdate({ factor: parseFloat(e.target.value) || 0 })}
                            className={commonSelectClass} placeholder="0"
                        />
                    </div>
                    <div>
                        <label htmlFor={`factor-unit-${source.id}`} className={commonLabelClass}>{t('factorUnit')}</label>
                         <input
                            id={`factor-unit-${source.id}`}
                            type="text"
                            value={source.factorUnit ?? ''}
                            onChange={(e) => onUpdate({ factorUnit: e.target.value })}
                            className={commonSelectClass} placeholder="kg CO₂e / unit"
                        />
                    </div>
                 </div>
                 <div>
                    <label htmlFor={`factor-source-${source.id}`} className={commonLabelClass}>{t('factorSource')}</label>
                     <input
                        id={`factor-source-${source.id}`}
                        type="text"
                        value={source.factorSource ?? ''}
                        onChange={(e) => onUpdate({ factorSource: e.target.value })}
                        className={commonSelectClass} placeholder={t('factorSourcePlaceholder')}
                    />
                 </div>
            </>)}

            {/* Data Quality & Assumptions */}
             <div>
                <label htmlFor={`activityDataSource-${source.id}`} className={commonLabelClass}>{t('activityDataSource')}</label>
                <input
                    id={`activityDataSource-${source.id}`}
                    type="text"
                    value={source.activityDataSource ?? ''}
                    onChange={(e) => onUpdate({ activityDataSource: e.target.value })}
                    className={commonSelectClass} placeholder={t('activityDataSourcePlaceholder')}
                />
            </div>
            <div>
                <label htmlFor={`quality-${source.id}`} className={commonLabelClass}>{t('dataQuality')}</label>
                <select
                    id={`quality-${source.id}`}
                    value={source.dataQualityRating ?? ''}
                    // @ts-ignore
                    onChange={(e) => onUpdate({ dataQualityRating: e.target.value })}
                    className={commonSelectClass}
                >
                    <option value="" disabled>Select...</option>
                    <option value="high">{t('qualityHigh')}</option>
                    <option value="medium">{t('qualityMedium')}</option>
                    <option value="low">{t('qualityLow')}</option>
                    <option value="estimated">{t('qualityEstimated')}</option>
                </select>
            </div>

            <div>
                <label htmlFor={`assumptions-${source.id}`} className={commonLabelClass}>{t('assumptionsNotes')}</label>
                <textarea
                    id={`assumptions-${source.id}`}
                    value={source.assumptions ?? ''}
                    onChange={(e) => onUpdate({ assumptions: e.target.value })}
                    className={`${commonSelectClass} min-h-[60px]`}
                    placeholder={t('assumptionsNotesPlaceholder')}
                />
            </div>


            {/* Monthly Inputs */}
             <div className="mt-2">
                <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                    <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('totalYear')}: </span>
                        <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{totalQuantity.toLocaleString()}&nbsp;{renderUnit(source.unit)}</span>
                    </div>
                    {!isEditing && (
                    <button onClick={handleEdit} disabled={source.calculationMethod === 'supplier_co2e'} className="text-sm text-ghg-green font-semibold hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed">
                        {t('editMonthly')}
                    </button>
                    )}
                </div>
                {isEditing && (
                <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-900/50 rounded-b-lg">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {monthKeys.map((monthKey, index) => (
                            <div key={monthKey}>
                                <label className={commonLabelClass} htmlFor={`quantity-${source.id}-${index}`}>{t(monthKey)}</label>
                                <div className={`flex items-center rounded-md shadow-sm border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 focus-within:ring-1 focus-within:ring-ghg-green focus-within:border-ghg-green overflow-hidden`}>
                                    <input
                                        id={`quantity-${source.id}-${index}`}
                                        type="number"
                                        onKeyDown={preventNonNumericKeys}
                                        value={editedQuantities[index] === 0 ? '' : editedQuantities[index]}
                                        onChange={(e) => handleMonthlyChange(index, e.target.value)}
                                        className="w-0 flex-grow bg-transparent text-gray-900 dark:text-gray-200 py-1 px-2 text-sm text-right focus:outline-none"
                                        placeholder="0"
                                    />
                                    <span className="pr-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                        {renderUnit(source.unit)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button onClick={handleCancel} className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">{t('cancel')}</button>
                        <button onClick={handleSave} className="px-3 py-1 text-sm font-medium text-white bg-ghg-green rounded-md shadow-sm hover:bg-ghg-dark">{t('save')}</button>
                    </div>
                </div>
                )}
            </div>

        </div>}
      </div>
    );
  }

  // == Advanced UI for Category 3 ==
  if (source.category === EmissionCategory.FuelAndEnergyRelatedActivities) {
    if (source.isAutoGenerated) {
        return (
            <div className="flex flex-col gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/30 dark:border-blue-700/50">
                 <div className="flex justify-between items-center">
                    <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">{source.fuelType}</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">{source.description}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{(totalEmissions / 1000).toLocaleString('en-US', { minimumFractionDigits: 3 })} t CO₂e</p>
                    </div>
                </div>
            </div>
        );
    }

    // Render interactive UI for user-added sources
    const activityType = source.activityType || 'fuel_wtt';
    
    return (
        <div className={`flex flex-col gap-3 p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600`}>
            <div className="flex justify-between items-start">
                <div>
                    <label htmlFor={`activityType-${source.id}`} className={commonLabelClass}>{t('activityType')}</label>
                    <select
                        id={`activityType-${source.id}`}
                        value={activityType}
                        onChange={(e) => onUpdate({ activityType: e.target.value as any, calculationMethod: e.target.value === 'spend_based' ? 'spend' : undefined })}
                        className="text-sm bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-ghg-green focus:border-ghg-green"
                    >
                        <option value="fuel_wtt">{t('fuelWTT')}</option>
                        <option value="spend_based">{t('spendBased')}</option>
                    </select>
                </div>
                <button onClick={onRemove} className="text-gray-400 hover:text-red-600 p-1 dark:text-gray-500 dark:hover:text-red-500" aria-label={t('removeSourceAria')}>
                    <IconTrash className="h-5 w-5" />
                </button>
            </div>

            {activityType === 'fuel_wtt' && (
                <>
                    <div>
                        <label htmlFor={`description-${source.id}`} className={commonLabelClass}>{t('emissionSourceDescription')}</label>
                        <input id={`description-${source.id}`} type="text" value={source.description || ''} onChange={(e) => onUpdate({ description: e.target.value })} className={commonSelectClass} placeholder={t(placeholderKey)} />
                    </div>
                     <div>
                        <label htmlFor={`activityDataSource-${source.id}`} className={commonLabelClass}>{t('activityDataSource')}</label>
                        <input id={`activityDataSource-${source.id}`} type="text" value={source.activityDataSource ?? ''} onChange={(e) => onUpdate({ activityDataSource: e.target.value })} className={commonSelectClass} placeholder={t('activityDataSourcePlaceholder')} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <select value={source.fuelType} onChange={(e) => onFuelTypeChange(e.target.value)} className={commonSelectClass} aria-label="Fuel/Source">
                        {fuels.map((fuel: CO2eFactorFuel) => (
                            <option key={fuel.name} value={fuel.name}>
                            {language === 'ko' && fuel.translationKey ? `${t(fuel.translationKey as TranslationKey)}` : fuel.name}
                            </option>
                        ))}
                        </select>
                        <select value={source.unit} onChange={(e) => onUpdate({ unit: e.target.value })} className={commonSelectClass} aria-label="Unit">
                        { (fuels.find((f: CO2eFactorFuel) => f.name === source.fuelType) as CO2eFactorFuel)?.units.map((unit) => (
                            <option key={unit} value={unit}>{t(unit as TranslationKey) || unit}</option>
                        ))}
                        </select>
                    </div>

                    <div className="mt-2">
                         <div className={`flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 ${isEditing ? 'rounded-t-lg' : 'rounded-lg'}`}>
                            <div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('totalYear')}: </span>
                                <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{totalQuantity.toLocaleString()}&nbsp;{renderUnit(source.unit)}</span>
                            </div>
                            <div className='flex items-center gap-4'>
                                <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{(totalEmissions / 1000).toLocaleString('en-US', {minimumFractionDigits: 3})} t CO₂e</span>

                                {!isEditing && (
                                <button onClick={handleEdit} className="text-sm text-ghg-green font-semibold hover:underline">
                                    {t('editMonthly')}
                                </button>
                                )}
                            </div>
                        </div>

                        {isEditing && (
                            <div className="p-3 bg-gray-100 dark:bg-gray-900/50 rounded-b-lg">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                    {monthKeys.map((monthKey, index) => (
                                        <div key={monthKey}>
                                            <label className={commonLabelClass} htmlFor={`quantity-${source.id}-${index}`}>{t(monthKey)}</label>
                                            <div className={`flex items-center rounded-md shadow-sm border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 focus-within:ring-1 focus-within:ring-ghg-green focus-within:border-ghg-green overflow-hidden`}>
                                                <input
                                                    id={`quantity-${source.id}-${index}`}
                                                    type="number"
                                                    onKeyDown={preventNonNumericKeys}
                                                    value={editedQuantities[index] === 0 ? '' : editedQuantities[index]}
                                                    onChange={(e) => handleMonthlyChange(index, e.target.value)}
                                                    className="w-0 flex-grow bg-transparent text-gray-900 dark:text-gray-200 py-1 px-2 text-sm text-right focus:outline-none"
                                                    placeholder="0"
                                                />
                                                <span className="pr-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                    {renderUnit(source.unit)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                 <div className="flex justify-end gap-2 mt-4">
                                    <button onClick={handleCancel} className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">{t('cancel')}</button>
                                    <button onClick={handleSave} className="px-3 py-1 text-sm font-medium text-white bg-ghg-green rounded-md shadow-sm hover:bg-ghg-dark">{t('save')}</button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
            {activityType === 'spend_based' && (
                // This is a simplified version of the Cat 1/2 UI.
                // It reuses the same logic by setting calculationMethod.
                 <p className='text-sm text-center p-4 bg-yellow-50 dark:bg-yellow-900/50 rounded-md'>{t('comingSoon')}</p>
            )}

        </div>
    );
  }

  // == Advanced UI for Category 4 & 9 ==
  if (source.category === EmissionCategory.UpstreamTransportationAndDistribution || source.category === EmissionCategory.DownstreamTransportationAndDistribution) {
    const calculationMethod = source.calculationMethod || 'activity';

    const handleMethodChange = (method: Cat4CalculationMethod) => {
        let updates: Partial<EmissionSource> = { calculationMethod: method, monthlyQuantities: Array(12).fill(0) };
        if (method === 'activity') {
            const defaultMode: TransportMode = 'Road';
            const defaultVehicle = Object.keys(fuels[defaultMode])[0];
            updates = { ...updates, transportMode: defaultMode, vehicleType: defaultVehicle };
        } else if (method === 'fuel') {
            updates.fuelType = MOBILE_FUELS[0].name;
            updates.unit = MOBILE_FUELS[0].units[0];
        } else if (method === 'spend') {
            updates.fuelType = TRANSPORTATION_SPEND_FACTORS[0].name;
            updates.unit = TRANSPORTATION_SPEND_FACTORS[0].units[0];
        }
        onUpdate(updates);
    };

    const vehicleTypesForMode = source.transportMode ? Object.keys(fuels[source.transportMode]) : [];

    return (
      <div className="flex flex-col gap-3 p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600">
        <div className="flex justify-between items-start">
            <div className='flex-grow pr-4'>
                <label className={commonLabelClass}>{t('calculationMethod')}</label>
                <div className="flex gap-1 rounded-md bg-gray-200 dark:bg-gray-900 p-1 text-xs">
                    {(['activity', 'fuel', 'spend', 'supplier_specific'] as Cat4CalculationMethod[]).map(method => (
                        <button 
                            key={method}
                            onClick={() => handleMethodChange(method)}
                            className={`flex-1 py-1 rounded-md transition-colors ${calculationMethod === method ? 'bg-white dark:bg-gray-700 shadow font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                            {t(`${method}Method` as TranslationKey)}
                        </button>
                    ))}
                </div>
            </div>
            <button onClick={onRemove} className="text-gray-400 hover:text-red-600 p-1 dark:text-gray-500 dark:hover:text-red-500" aria-label={t('removeSourceAria')}>
                <IconTrash className="h-5 w-5" />
            </button>
        </div>
        
        <div>
          <label htmlFor={`description-${source.id}`} className={commonLabelClass}>{t('emissionSourceDescription')}</label>
          <input id={`description-${source.id}`} type="text" value={source.description || ''} onChange={(e) => onUpdate({ description: e.target.value })} className={commonSelectClass} placeholder={t(placeholderKey)} />
        </div>
         <div>
            <label htmlFor={`activityDataSource-${source.id}`} className={commonLabelClass}>{t('activityDataSource')}</label>
            <input id={`activityDataSource-${source.id}`} type="text" value={source.activityDataSource ?? ''} onChange={(e) => onUpdate({ activityDataSource: e.target.value })} className={commonSelectClass} placeholder={t('activityDataSourcePlaceholder')} />
        </div>

        {/* Activity-based Form */}
        {calculationMethod === 'activity' && (
            <div className="space-y-3">
                 <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className={commonLabelClass}>{t('transportMode')}</label>
                        <select value={source.transportMode} onChange={(e) => onUpdate({ transportMode: e.target.value as TransportMode, vehicleType: Object.keys(fuels[e.target.value as TransportMode])[0] })} className={commonSelectClass}>
                            {(['Road', 'Sea', 'Air', 'Rail'] as TransportMode[]).map(mode => <option key={mode} value={mode}>{t(mode as TranslationKey) || mode}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={commonLabelClass}>{t('vehicleType')}</label>
                        <select value={source.vehicleType} onChange={(e) => onUpdate({ vehicleType: e.target.value })} className={commonSelectClass}>
                            {vehicleTypesForMode.map(vType => <option key={vType} value={vType}>{t((fuels[source.transportMode!][vType] as any).translationKey as TranslationKey) || vType}</option>)}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className={commonLabelClass}>{t('distance')} (km)</label>
                        <input type="number" value={source.distanceKm || ''} onChange={e => onUpdate({ distanceKm: parseFloat(e.target.value) || 0 })} className={commonSelectClass} placeholder="0" />
                    </div>
                    <div>
                        <label className={commonLabelClass}>{t('weight')} (tonnes)</label>
                         <input type="number" value={source.weightTonnes || ''} onChange={e => onUpdate({ weightTonnes: parseFloat(e.target.value) || 0 })} className={commonSelectClass} placeholder="0" />
                    </div>
                </div>
                <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('adjustmentFactors')}</h4>
                    <div className="mt-2 space-y-2 p-3 bg-gray-100 dark:bg-gray-900/50 rounded-md">
                        <label className="flex items-center space-x-2 text-sm">
                            <input type="checkbox" checked={source.refrigerated || false} onChange={e => onUpdate({ refrigerated: e.target.checked })} className="rounded text-ghg-green focus:ring-ghg-green"/>
                            <span>{t('refrigeratedTransport')}</span>
                        </label>
                         <label className="flex items-center space-x-2 text-sm">
                            <input type="checkbox" checked={source.emptyBackhaul || false} onChange={e => onUpdate({ emptyBackhaul: e.target.checked })} className="rounded text-ghg-green focus:ring-ghg-green"/>
                            <span>{t('emptyBackhaul')}</span>
                        </label>
                         <div className="flex items-center space-x-2 text-sm">
                            <label htmlFor={`load-factor-${source.id}`}>{t('loadFactor')}</label>
                            <input id={`load-factor-${source.id}`} type="number" value={source.loadFactor || ''} onChange={e => onUpdate({ loadFactor: parseFloat(e.target.value) || 0 })} className="w-20 p-1 text-sm rounded-md" placeholder="100" />
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Fuel-based & Spend-based Forms with Monthly Data */}
        {(calculationMethod === 'fuel' || calculationMethod === 'spend') && (
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <select value={source.fuelType} onChange={(e) => onFuelTypeChange(e.target.value)} className={commonSelectClass} aria-label={t(calculationMethod === 'fuel' ? 'cat4FuelType' : 'cat4ServiceType')}>
                    {(calculationMethod === 'fuel' ? MOBILE_FUELS : TRANSPORTATION_SPEND_FACTORS).map((item: CO2eFactorFuel) => (
                        <option key={item.name} value={item.name}>
                        {language === 'ko' && item.translationKey ? t(item.translationKey as TranslationKey) : item.name}
                        </option>
                    ))}
                    </select>
                    <select value={source.unit} onChange={(e) => onUpdate({ unit: e.target.value })} className={commonSelectClass} aria-label="Unit">
                    { ((calculationMethod === 'fuel' ? MOBILE_FUELS : TRANSPORTATION_SPEND_FACTORS).find((f: CO2eFactorFuel) => f.name === source.fuelType) as CO2eFactorFuel)?.units.map((unit) => (
                        <option key={unit} value={unit}>{t(unit as TranslationKey) || unit}</option>
                    ))}
                    </select>
                </div>
                <div className="mt-2">
                    <div className={`flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 ${isEditing ? 'rounded-t-lg' : 'rounded-lg'}`}>
                        <div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('totalYear')}: </span>
                            <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{totalQuantity.toLocaleString()}&nbsp;{renderUnit(source.unit)}</span>
                        </div>
                        {!isEditing && (
                        <button onClick={handleEdit} className="text-sm text-ghg-green font-semibold hover:underline">
                            {t('editMonthly')}
                        </button>
                        )}
                    </div>

                    {isEditing && (
                        <div className="p-3 bg-gray-100 dark:bg-gray-900/50 rounded-b-lg">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {monthKeys.map((monthKey, index) => (
                                    <div key={monthKey}>
                                        <label className={commonLabelClass} htmlFor={`quantity-${source.id}-${index}`}>{t(monthKey)}</label>
                                        <div className={`flex items-center rounded-md shadow-sm border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 focus-within:ring-1 focus-within:ring-ghg-green focus-within:border-ghg-green overflow-hidden`}>
                                            <input
                                                id={`quantity-${source.id}-${index}`}
                                                type="number"
                                                onKeyDown={preventNonNumericKeys}
                                                value={editedQuantities[index] === 0 ? '' : editedQuantities[index]}
                                                onChange={(e) => handleMonthlyChange(index, e.target.value)}
                                                className="w-0 flex-grow bg-transparent text-gray-900 dark:text-gray-200 py-1 px-2 text-sm text-right focus:outline-none"
                                                placeholder="0"
                                            />
                                            <span className="pr-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                {renderUnit(source.unit)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                                <div className="flex justify-end gap-2 mt-4">
                                <button onClick={handleCancel} className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">{t('cancel')}</button>
                                <button onClick={handleSave} className="px-3 py-1 text-sm font-medium text-white bg-ghg-green rounded-md shadow-sm hover:bg-ghg-dark">{t('save')}</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}
        
        {/* Supplier-specific Form */}
        {calculationMethod === 'supplier_specific' && (
            <div>
                <label htmlFor={`supplier-co2e-${source.id}`} className={commonLabelClass}>{t('supplierProvidedCO2e')}</label>
                <input id={`supplier-co2e-${source.id}`} type="number" step="any" value={source.supplierProvidedCO2e ?? ''} onChange={(e) => onUpdate({ supplierProvidedCO2e: parseFloat(e.target.value) || 0 })} className={commonSelectClass} placeholder="0" />
            </div>
        )}

        {/* Total emissions display */}
        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md text-right">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('emissionsForSource')}: </span>
            <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{(totalEmissions / 1000).toLocaleString('en-US', {minimumFractionDigits: 3})} t CO₂e</span>
        </div>
      </div>
    );
  }

  // == Advanced UI for Category 5 ==
  if (source.category === EmissionCategory.WasteGeneratedInOperations) {
    const calculationMethod = (source.calculationMethod as Cat5CalculationMethod) || 'activity';

    const handleMethodChange = (method: Cat5CalculationMethod) => {
        let updates: Partial<EmissionSource> = { calculationMethod: method, monthlyQuantities: Array(12).fill(0) };
        if (method === 'activity') {
            updates = { ...updates, wasteType: 'MSW', treatmentMethod: 'Landfill', unit: 'tonnes' };
        } else if (method === 'spend') {
            updates = { ...updates, fuelType: WASTE_SPEND_FACTORS[0].name, unit: WASTE_SPEND_FACTORS[0].units[0] };
        }
        onUpdate(updates);
    };

    const handleWasteTypeChange = (wasteType: WasteType) => {
        const firstValidTreatment = Object.keys(WASTE_TREATMENT_FACTORS[wasteType])[0] as TreatmentMethod;
        onUpdate({ wasteType, treatmentMethod: firstValidTreatment });
    };

    const availableTreatmentMethods = source.wasteType ? Object.keys(WASTE_TREATMENT_FACTORS[source.wasteType]) as TreatmentMethod[] : [];
    
    return (
      <div className="flex flex-col gap-3 p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600">
        <div className="flex justify-between items-start">
            <div className='flex-grow pr-4'>
                <label className={commonLabelClass}>{t('calculationMethod')}</label>
                <div className="flex gap-1 rounded-md bg-gray-200 dark:bg-gray-900 p-1 text-xs">
                    {(['activity', 'supplier_specific', 'spend'] as Cat5CalculationMethod[]).map(method => (
                        <button 
                            key={method}
                            onClick={() => handleMethodChange(method)}
                            className={`flex-1 py-1 rounded-md transition-colors ${calculationMethod === method ? 'bg-white dark:bg-gray-700 shadow font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                            {t(`${method}Method` as TranslationKey)}
                        </button>
                    ))}
                </div>
            </div>
            <button onClick={onRemove} className="text-gray-400 hover:text-red-600 p-1 dark:text-gray-500 dark:hover:text-red-500" aria-label={t('removeSourceAria')}>
                <IconTrash className="h-5 w-5" />
            </button>
        </div>

        <div>
          <label htmlFor={`description-${source.id}`} className={commonLabelClass}>{t('emissionSourceDescription')}</label>
          <input id={`description-${source.id}`} type="text" value={source.description || ''} onChange={(e) => onUpdate({ description: e.target.value })} className={commonSelectClass} placeholder={t(placeholderKey)} />
        </div>
        
        {calculationMethod === 'activity' && (
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                     <div>
                        <label className={commonLabelClass}>{t('wasteType')}</label>
                        <select value={source.wasteType} onChange={(e) => handleWasteTypeChange(e.target.value as WasteType)} className={commonSelectClass}>
                            {(Object.keys(WASTE_TREATMENT_FACTORS) as WasteType[]).map(type => <option key={type} value={type}>{t(`waste${type}` as TranslationKey) || type}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={commonLabelClass}>{t('treatmentMethod')}</label>
                        <select value={source.treatmentMethod} onChange={(e) => onUpdate({ treatmentMethod: e.target.value as TreatmentMethod })} className={commonSelectClass}>
                            {availableTreatmentMethods.map(method => <option key={method} value={method}>{t(WASTE_TREATMENT_FACTORS[source.wasteType!]![method]!.translationKey)}</option>)}
                        </select>
                    </div>
                </div>

                {/* Monthly Data */}
                <div className="mt-2">
                    <div className={`flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 ${isEditing ? 'rounded-t-lg' : 'rounded-lg'}`}>
                        <div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('totalYear')}: </span>
                            <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{totalQuantity.toLocaleString()}&nbsp;{renderUnit(source.unit)}</span>
                        </div>
                        {!isEditing && (
                        <button onClick={handleEdit} className="text-sm text-ghg-green font-semibold hover:underline">
                            {t('editMonthly')}
                        </button>
                        )}
                    </div>
                     {isEditing && (
                        <div className="p-3 bg-gray-100 dark:bg-gray-900/50 rounded-b-lg">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {monthKeys.map((monthKey, index) => (
                                    <div key={monthKey}>
                                        <label className={commonLabelClass} htmlFor={`quantity-${source.id}-${index}`}>{t(monthKey)}</label>
                                        <div className={`flex items-center rounded-md shadow-sm border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 focus-within:ring-1 focus-within:ring-ghg-green focus-within:border-ghg-green overflow-hidden`}>
                                            <input id={`quantity-${source.id}-${index}`} type="number" onKeyDown={preventNonNumericKeys} value={editedQuantities[index] === 0 ? '' : editedQuantities[index]} onChange={(e) => handleMonthlyChange(index, e.target.value)} className="w-0 flex-grow bg-transparent text-gray-900 dark:text-gray-200 py-1 px-2 text-sm text-right focus:outline-none" placeholder="0" />
                                            <select value={source.unit} onChange={(e) => onUpdate({ unit: e.target.value })} className="bg-transparent text-xs text-gray-500 dark:text-gray-400 border-none focus:ring-0">
                                                <option value="tonnes">{t('tonnes')}</option>
                                                <option value="kg">kg</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={handleCancel} className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">{t('cancel')}</button>
                                <button onClick={handleSave} className="px-3 py-1 text-sm font-medium text-white bg-ghg-green rounded-md shadow-sm hover:bg-ghg-dark">{t('save')}</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Transport Section */}
                 <div className="mt-2 space-y-2 p-3 bg-gray-100 dark:bg-gray-900/50 rounded-md">
                    <label className="flex items-center space-x-2 text-sm font-medium">
                        <input type="checkbox" checked={source.includeTransport || false} onChange={e => onUpdate({ includeTransport: e.target.checked })} className="rounded text-ghg-green focus:ring-ghg-green"/>
                        <span>{t('includeTransportEmissions')}</span>
                    </label>
                    {source.includeTransport && (
                        <div className="pt-3 border-t dark:border-gray-600 space-y-3">
                            <h4 className="text-sm font-semibold">{t('transportDetails')}</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className={commonLabelClass}>{t('transportMode')}</label>
                                    <select value={source.transportMode} onChange={(e) => onUpdate({ transportMode: e.target.value as TransportMode, vehicleType: Object.keys(TRANSPORTATION_FACTORS_BY_MODE[e.target.value as TransportMode])[0] })} className={commonSelectClass}>
                                        {(['Road', 'Rail'] as TransportMode[]).map(mode => <option key={mode} value={mode}>{t(mode as TranslationKey) || mode}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={commonLabelClass}>{t('vehicleType')}</label>
                                    <select value={source.vehicleType} onChange={(e) => onUpdate({ vehicleType: e.target.value })} className={commonSelectClass} disabled={!source.transportMode}>
                                        {source.transportMode && Object.keys(TRANSPORTATION_FACTORS_BY_MODE[source.transportMode]).map(vType => <option key={vType} value={vType}>{t((TRANSPORTATION_FACTORS_BY_MODE[source.transportMode!][vType] as any).translationKey as TranslationKey) || vType}</option>)}
                                    </select>
                                </div>
                            </div>
                             <div>
                                <label className={commonLabelClass}>{t('oneWayDistance')}</label>
                                <input type="number" value={source.distanceKm || ''} onChange={e => onUpdate({ distanceKm: parseFloat(e.target.value) || 0 })} className={commonSelectClass} placeholder="0" />
                            </div>
                        </div>
                    )}
                 </div>
            </div>
        )}

        {calculationMethod === 'supplier_specific' && (
            <div>
                <label htmlFor={`supplier-co2e-${source.id}`} className={commonLabelClass}>{t('supplierProvidedCO2e')}</label>
                <input id={`supplier-co2e-${source.id}`} type="number" step="any" value={source.supplierProvidedCO2e ?? ''} onChange={(e) => onUpdate({ supplierProvidedCO2e: parseFloat(e.target.value) || 0 })} className={commonSelectClass} placeholder="0" />
            </div>
        )}

        {calculationMethod === 'spend' && (
             <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <select value={source.fuelType} onChange={(e) => onUpdate({ fuelType: e.target.value })} className={commonSelectClass} aria-label={t('cat4ServiceType')}>
                    {WASTE_SPEND_FACTORS.map((item: CO2eFactorFuel) => (
                        <option key={item.name} value={item.name}>
                        {language === 'ko' && item.translationKey ? t(item.translationKey as TranslationKey) : item.name}
                        </option>
                    ))}
                    </select>
                    <select value={source.unit} onChange={(e) => onUpdate({ unit: e.target.value })} className={commonSelectClass} aria-label="Unit">
                    { (WASTE_SPEND_FACTORS.find((f: CO2eFactorFuel) => f.name === source.fuelType) as CO2eFactorFuel)?.units.map((unit) => (
                        <option key={unit} value={unit}>{t(unit as TranslationKey) || unit}</option>
                    ))}
                    </select>
                </div>
                <div className="mt-2">
                    <div className={`flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 ${isEditing ? 'rounded-t-lg' : 'rounded-lg'}`}>
                        <div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('totalYear')}: </span>
                            <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{totalQuantity.toLocaleString()}&nbsp;{renderUnit(source.unit)}</span>
                        </div>
                        {!isEditing && (
                        <button onClick={handleEdit} className="text-sm text-ghg-green font-semibold hover:underline">
                            {t('editMonthly')}
                        </button>
                        )}
                    </div>
                     {isEditing && (
                        <div className="p-3 bg-gray-100 dark:bg-gray-900/50 rounded-b-lg">
                           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {monthKeys.map((monthKey, index) => (
                                    <div key={monthKey}>
                                        <label className={commonLabelClass} htmlFor={`quantity-${source.id}-${index}`}>{t(monthKey)}</label>
                                        <div className={`flex items-center rounded-md shadow-sm border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 focus-within:ring-1 focus-within:ring-ghg-green focus-within:border-ghg-green overflow-hidden`}>
                                            <input id={`quantity-${source.id}-${index}`} type="number" onKeyDown={preventNonNumericKeys} value={editedQuantities[index] === 0 ? '' : editedQuantities[index]} onChange={(e) => handleMonthlyChange(index, e.target.value)} className="w-0 flex-grow bg-transparent text-gray-900 dark:text-gray-200 py-1 px-2 text-sm text-right focus:outline-none" placeholder="0" />
                                            <span className="pr-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{renderUnit(source.unit)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={handleCancel} className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">{t('cancel')}</button>
                                <button onClick={handleSave} className="px-3 py-1 text-sm font-medium text-white bg-ghg-green rounded-md shadow-sm hover:bg-ghg-dark">{t('save')}</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Total emissions display */}
        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md text-right">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('emissionsForSource')}: </span>
            <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{(totalEmissions / 1000).toLocaleString('en-US', {minimumFractionDigits: 3})} t CO₂e</span>
        </div>
      </div>
    );
  }

  // == Advanced UI for Category 6 ==
  if (source.category === EmissionCategory.BusinessTravel) {
    const calculationMethod = (source.calculationMethod as Cat6CalculationMethod) || 'activity';

    const handleMethodChange = (method: Cat6CalculationMethod) => {
        let updates: Partial<EmissionSource> = { calculationMethod: method, monthlyQuantities: Array(12).fill(0) };
        if (method === 'activity') {
            updates = { ...updates, businessTravelMode: 'Air', flightClass: 'Economy', tripType: 'round-trip', fuelType: 'Long-haul (>1108 km)' };
        } else if (method === 'spend') {
            updates = { ...updates, fuelType: BUSINESS_TRAVEL_FACTORS_DETAILED.spend[0].name, unit: BUSINESS_TRAVEL_FACTORS_DETAILED.spend[0].units[0] };
        }
        onUpdate(updates);
    };

    const travelMode = source.businessTravelMode || 'Air';
    const activityFactors = BUSINESS_TRAVEL_FACTORS_DETAILED.activity;

    return (
      <div className="flex flex-col gap-3 p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600">
        <div className="flex justify-between items-start">
            <div className='flex-grow pr-4'>
                <label className={commonLabelClass}>{t('calculationMethod')}</label>
                <div className="flex gap-1 rounded-md bg-gray-200 dark:bg-gray-900 p-1 text-xs">
                    {(['activity', 'spend', 'supplier_specific'] as Cat6CalculationMethod[]).map(method => (
                        <button 
                            key={method}
                            onClick={() => handleMethodChange(method)}
                            className={`flex-1 py-1 rounded-md transition-colors ${calculationMethod === method ? 'bg-white dark:bg-gray-700 shadow font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                            {t(`${method}Method` as TranslationKey)}
                        </button>
                    ))}
                </div>
            </div>
            <button onClick={onRemove} className="text-gray-400 hover:text-red-600 p-1 dark:text-gray-500 dark:hover:text-red-500" aria-label={t('removeSourceAria')}>
                <IconTrash className="h-5 w-5" />
            </button>
        </div>

        <div>
          <label htmlFor={`description-${source.id}`} className={commonLabelClass}>{t('emissionSourceDescription')}</label>
          <input id={`description-${source.id}`} type="text" value={source.description || ''} onChange={(e) => onUpdate({ description: e.target.value })} className={commonSelectClass} placeholder={t(placeholderKey)} />
        </div>

        {calculationMethod === 'activity' && (
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className={commonLabelClass}>{t('businessTravelMode')}</label>
                        <select value={travelMode} onChange={(e) => onUpdate({ businessTravelMode: e.target.value as BusinessTravelMode })} className={commonSelectClass}>
                            {Object.keys(activityFactors).map(mode => <option key={mode} value={mode}>{t(mode as TranslationKey)}</option>)}
                        </select>
                    </div>
                </div>

                {travelMode === 'Air' && (
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className={commonLabelClass}>{t('distance')} (km)</label>
                            <input type="number" value={source.distanceKm || ''} onChange={e => onUpdate({ distanceKm: parseFloat(e.target.value) || 0 })} className={commonSelectClass} placeholder="0" />
                        </div>
                         <div>
                            <label className={commonLabelClass}>{t('flightClass')}</label>
                            <select value={source.flightClass || 'Economy'} onChange={e => onUpdate({ flightClass: e.target.value as any })} className={commonSelectClass}>
                                <option value="Economy">{t('Economy')}</option>
                                <option value="Business">{t('Business')}</option>
                                <option value="First">{t('First')}</option>
                            </select>
                        </div>
                         <div>
                            <label className={commonLabelClass}>{t('tripType')}</label>
                            <select value={source.tripType || 'round-trip'} onChange={e => onUpdate({ tripType: e.target.value as any })} className={commonSelectClass}>
                                <option value="round-trip">{t('roundTrip')}</option>
                                <option value="one-way">{t('oneWay')}</option>
                            </select>
                        </div>
                         <div>
                            <label className={commonLabelClass}>{t('passengers')}</label>
                            <input type="number" value={source.passengers || ''} onChange={e => onUpdate({ passengers: parseInt(e.target.value) || 0 })} className={commonSelectClass} placeholder="1" />
                        </div>
                    </div>
                )}
                {(travelMode === 'Rail' || travelMode === 'Bus' || travelMode === 'RentalCar' || travelMode === 'PersonalCar') && (
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className={commonLabelClass}>{t('vehicle')}</label>
                            <select value={source.fuelType || ''} onChange={e => onUpdate({ fuelType: e.target.value })} className={commonSelectClass}>
                                {Object.keys(activityFactors[travelMode]).map(v => <option key={v} value={v}>{t((activityFactors[travelMode] as any)[v].translationKey)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={commonLabelClass}>{t('distance')} (km)</label>
                            <input type="number" value={source.distanceKm || ''} onChange={e => onUpdate({ distanceKm: parseFloat(e.target.value) || 0 })} className={commonSelectClass} placeholder="0" />
                        </div>
                         {(travelMode === 'Rail' || travelMode === 'Bus') && <div>
                            <label className={commonLabelClass}>{t('passengers')}</label>
                            <input type="number" value={source.passengers || ''} onChange={e => onUpdate({ passengers: parseInt(e.target.value) || 0 })} className={commonSelectClass} placeholder="1" />
                        </div>}
                    </div>
                )}
                {travelMode === 'Hotel' && (
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className={commonLabelClass}>{t('Hotel')}</label>
                             <select value={source.fuelType || ''} onChange={e => onUpdate({ fuelType: e.target.value })} className={commonSelectClass}>
                                {Object.keys(activityFactors.Hotel).map(v => <option key={v} value={v}>{t((activityFactors.Hotel as any)[v].translationKey)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={commonLabelClass}>{t('nights')}</label>
                            <input type="number" value={source.nights || ''} onChange={e => onUpdate({ nights: parseInt(e.target.value) || 0 })} className={commonSelectClass} placeholder="0" />
                        </div>
                        <div>
                            <label className={commonLabelClass}>{t('passengers')}</label>
                            <input type="number" value={source.passengers || ''} onChange={e => onUpdate({ passengers: parseInt(e.target.value) || 0 })} className={commonSelectClass} placeholder="1" />
                        </div>
                    </div>
                )}
            </div>
        )}

        {calculationMethod === 'spend' && (
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <select value={source.fuelType} onChange={(e) => onFuelTypeChange(e.target.value)} className={commonSelectClass} aria-label={t('serviceType')}>
                    {BUSINESS_TRAVEL_FACTORS_DETAILED.spend.map((item: any) => (
                        <option key={item.name} value={item.name}>
                        {language === 'ko' && item.translationKey ? t(item.translationKey as TranslationKey) : item.name}
                        </option>
                    ))}
                    </select>
                    <select value={source.unit} onChange={(e) => onUpdate({ unit: e.target.value })} className={commonSelectClass} aria-label="Unit">
                    { (BUSINESS_TRAVEL_FACTORS_DETAILED.spend.find((f: any) => f.name === source.fuelType) as any)?.units.map((unit: string) => (
                        <option key={unit} value={unit}>{t(unit as TranslationKey) || unit}</option>
                    ))}
                    </select>
                </div>
                 <div className="mt-2">
                    <div className={`flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 ${isEditing ? 'rounded-t-lg' : 'rounded-lg'}`}>
                        <div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('totalYear')}: </span>
                            <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{totalQuantity.toLocaleString()}&nbsp;{renderUnit(source.unit)}</span>
                        </div>
                        {!isEditing && (
                        <button onClick={handleEdit} className="text-sm text-ghg-green font-semibold hover:underline">
                            {t('editMonthly')}
                        </button>
                        )}
                    </div>
                    {isEditing && (
                        <div className="p-3 bg-gray-100 dark:bg-gray-900/50 rounded-b-lg">
                           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {monthKeys.map((monthKey, index) => (
                                    <div key={monthKey}>
                                        <label className={commonLabelClass} htmlFor={`quantity-${source.id}-${index}`}>{t(monthKey)}</label>
                                        <div className={`flex items-center rounded-md shadow-sm border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 focus-within:ring-1 focus-within:ring-ghg-green focus-within:border-ghg-green overflow-hidden`}>
                                            <input id={`quantity-${source.id}-${index}`} type="number" onKeyDown={preventNonNumericKeys} value={editedQuantities[index] === 0 ? '' : editedQuantities[index]} onChange={(e) => handleMonthlyChange(index, e.target.value)} className="w-0 flex-grow bg-transparent text-gray-900 dark:text-gray-200 py-1 px-2 text-sm text-right focus:outline-none" placeholder="0" />
                                            <span className="pr-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{renderUnit(source.unit)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={handleCancel} className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">{t('cancel')}</button>
                                <button onClick={handleSave} className="px-3 py-1 text-sm font-medium text-white bg-ghg-green rounded-md shadow-sm hover:bg-ghg-dark">{t('save')}</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {calculationMethod === 'supplier_specific' && (
            <div>
                <label htmlFor={`supplier-co2e-${source.id}`} className={commonLabelClass}>{t('supplierProvidedCO2e')}</label>
                <input id={`supplier-co2e-${source.id}`} type="number" step="any" value={source.supplierProvidedCO2e ?? ''} onChange={(e) => onUpdate({ supplierProvidedCO2e: parseFloat(e.target.value) || 0 })} className={commonSelectClass} placeholder="0" />
            </div>
        )}

        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md text-right">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('emissionsForSource')}: </span>
            <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{(totalEmissions / 1000).toLocaleString('en-US', {minimumFractionDigits: 3})} t CO₂e</span>
        </div>
      </div>
    );
  }

  // == Advanced UI for Category 7 ==
  if (source.category === EmissionCategory.EmployeeCommuting) {
    const calculationMethod = (source.calculationMethod as Cat7CalculationMethod) || 'activity';

    const handleMethodChange = (method: Cat7CalculationMethod) => {
        let updates: Partial<EmissionSource> = { calculationMethod: method, monthlyQuantities: [] };
        // Set defaults for the new method
        if (method === 'activity') {
            updates = { ...updates, commutingMode: 'PersonalCar', personalCarType: 'Gasoline', unit: 'km', distanceKm: 0, daysPerYear: 0, carpoolOccupancy: 1 };
        } else if (method === 'average') {
            updates = { ...updates, totalEmployees: 0, percentTeleworking: 0, distanceKm: 0, daysPerYear: 0, modeDistribution: {} };
        } else if (method === 'spend') {
            updates = { ...updates, fuelType: fuels.spend[0].name, unit: fuels.spend[0].units[0], monthlyQuantities: Array(12).fill(0) };
        }
        onUpdate(updates);
    };
    
    const commutingMode = source.commutingMode || 'PersonalCar';
    const activityFactors = fuels.activity;

    const handleModeDistributionChange = (modeKey: string, value: string) => {
      const percentage = Math.max(0, Math.min(100, parseFloat(value) || 0));
      onUpdate({
          modeDistribution: {
              ...(source.modeDistribution || {}),
              [modeKey]: percentage,
          }
      });
    };
    
    const allCommutingTypes = useMemo(() => [
        { group: t('PersonalCar'), key: 'PersonalCar', types: Object.entries(activityFactors.PersonalCar).map(([type, data]: [string, any]) => ({ key: type, translationKey: data.translationKey })) },
        { group: t('PublicTransport'), key: 'PublicTransport', types: Object.entries(activityFactors.PublicTransport).map(([type, data]: [string, any]) => ({ key: type, translationKey: data.translationKey })) },
        { group: t('Motorbike'), key: 'Motorbike', types: Object.entries(activityFactors.Motorbike).map(([type, data]: [string, any]) => ({ key: type, translationKey: data.translationKey })) },
        { group: t('BicycleWalking'), key: 'BicycleWalking', types: Object.entries(activityFactors.BicycleWalking).map(([type, data]: [string, any]) => ({ key: type, translationKey: data.translationKey })) },
    ], [t, activityFactors]);

    // Fix: Operator '+' cannot be applied to types 'unknown' and 'number'.
    // The `val` from `Object.values` may be inferred as `unknown` by TypeScript, causing a type error.
    // Casting `val` to `number` ensures type safety for the addition operation.
    const totalDistribution = useMemo(() => Object.values(source.modeDistribution || {}).reduce((sum, val) => sum + (val as number), 0), [source.modeDistribution]);


    return (
      <div className="flex flex-col gap-3 p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600">
        <div className="flex justify-between items-start">
            <div className='flex-grow pr-4'>
                <label className={commonLabelClass}>{t('calculationMethod')}</label>
                <div className="flex gap-1 rounded-md bg-gray-200 dark:bg-gray-900 p-1 text-xs">
                    {(['activity', 'average', 'spend'] as Cat7CalculationMethod[]).map(method => (
                        <button 
                            key={method}
                            onClick={() => handleMethodChange(method)}
                            className={`flex-1 py-1 rounded-md transition-colors ${calculationMethod === method ? 'bg-white dark:bg-gray-700 shadow font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                            {t(`${method === 'average' ? 'averageData' : method}Method` as TranslationKey)}
                        </button>
                    ))}
                </div>
            </div>
            <button onClick={onRemove} className="text-gray-400 hover:text-red-600 p-1 dark:text-gray-500 dark:hover:text-red-500" aria-label={t('removeSourceAria')}>
                <IconTrash className="h-5 w-5" />
            </button>
        </div>

        <div>
          <label htmlFor={`description-${source.id}`} className={commonLabelClass}>{t('emissionSourceDescription')}</label>
          <input id={`description-${source.id}`} type="text" value={source.description || ''} onChange={(e) => onUpdate({ description: e.target.value })} className={commonSelectClass} placeholder={t(placeholderKey)} />
        </div>
         <div>
            <label htmlFor={`activityDataSource-${source.id}`} className={commonLabelClass}>{t('activityDataSource')}</label>
            <input id={`activityDataSource-${source.id}`} type="text" value={source.activityDataSource ?? ''} onChange={(e) => onUpdate({ activityDataSource: e.target.value })} className={commonSelectClass} placeholder={t('activityDataSourcePlaceholder')} />
        </div>

        {calculationMethod === 'activity' && (
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className={commonLabelClass}>{t('commutingMode')}</label>
                        <select value={commutingMode} onChange={(e) => onUpdate({ commutingMode: e.target.value as EmployeeCommutingMode })} className={commonSelectClass}>
                            {(['PersonalCar', 'Carpool', 'PublicTransport', 'Motorbike', 'BicycleWalking'] as EmployeeCommutingMode[]).map(mode => <option key={mode} value={mode}>{t(mode as TranslationKey)}</option>)}
                        </select>
                    </div>
                    {(commutingMode === 'PersonalCar' || commutingMode === 'Carpool') && (
                        <div>
                            <label className={commonLabelClass}>{t('vehicleType')}</label>
                            <select value={source.personalCarType || 'Gasoline'} onChange={e => onUpdate({ personalCarType: e.target.value as PersonalCarType })} className={commonSelectClass}>
                                {Object.keys(activityFactors.PersonalCar).map(type => <option key={type} value={type}>{t(activityFactors.PersonalCar[type].translationKey)}</option>)}
                            </select>
                        </div>
                    )}
                     {commutingMode === 'PublicTransport' && (
                        <div>
                            <label className={commonLabelClass}>{t('vehicleType')}</label>
                            <select value={source.publicTransportType || 'Bus'} onChange={e => onUpdate({ publicTransportType: e.target.value as PublicTransportType })} className={commonSelectClass}>
                                {Object.keys(activityFactors.PublicTransport).map(type => <option key={type} value={type}>{t(activityFactors.PublicTransport[type].translationKey)}</option>)}
                            </select>
                        </div>
                    )}
                </div>
                 <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className={commonLabelClass}>{t('oneWayCommuteDistance')}</label>
                        <input type="number" value={source.distanceKm ?? ''} onChange={e => onUpdate({ distanceKm: parseFloat(e.target.value) || 0 })} className={commonSelectClass} placeholder="0" />
                    </div>
                     <div>
                        <label className={commonLabelClass}>{t('commutingDaysPerYear')}</label>
                        <input type="number" value={source.daysPerYear ?? ''} onChange={e => onUpdate({ daysPerYear: parseInt(e.target.value) || 0 })} className={commonSelectClass} placeholder="0" />
                    </div>
                 </div>
                 {commutingMode === 'Carpool' && (
                     <div>
                        <label className={commonLabelClass}>{t('carpoolOccupancy')}</label>
                        <input type="number" value={source.carpoolOccupancy ?? ''} onChange={e => onUpdate({ carpoolOccupancy: parseInt(e.target.value) || 1 })} className={commonSelectClass} placeholder="2" min="1"/>
                    </div>
                 )}
            </div>
        )}

        {calculationMethod === 'average' && (
            <div className="space-y-3">
                 <div className="grid grid-cols-2 gap-2">
                     <div>
                        <label className={commonLabelClass}>{t('totalEmployees')}</label>
                        <input type="number" value={source.totalEmployees ?? ''} onChange={e => onUpdate({ totalEmployees: parseInt(e.target.value) || 0 })} className={commonSelectClass} placeholder="0" />
                    </div>
                     <div>
                        <label className={commonLabelClass}>{t('percentTeleworking')}</label>
                        <input type="number" value={source.percentTeleworking ?? ''} onChange={e => onUpdate({ percentTeleworking: parseFloat(e.target.value) || 0 })} className={commonSelectClass} placeholder="0" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className={commonLabelClass}>{t('oneWayCommuteDistance')}</label>
                        <input type="number" value={source.distanceKm ?? ''} onChange={e => onUpdate({ distanceKm: parseFloat(e.target.value) || 0 })} className={commonSelectClass} placeholder="0" />
                    </div>
                     <div>
                        <label className={commonLabelClass}>{t('commutingDaysPerYear')}</label>
                        <input type="number" value={source.daysPerYear ?? ''} onChange={e => onUpdate({ daysPerYear: parseInt(e.target.value) || 0 })} className={commonSelectClass} placeholder="0" />
                    </div>
                 </div>
                <div>
                    <label className={commonLabelClass}>{t('modeDistribution')}</label>
                    <div className="p-3 bg-gray-100 dark:bg-gray-900/50 rounded-md space-y-3">
                        {allCommutingTypes.map(group => (
                            <div key={group.key}>
                                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">{group.group}</h4>
                                {group.types.map(type => {
                                    const modeKey = `${group.key}_${type.key}`;
                                    return (
                                        <div key={modeKey} className="flex items-center justify-between gap-2 pl-2">
                                            <label className="text-sm text-gray-500 dark:text-gray-400">{t(type.translationKey)}</label>
                                            <div className="flex items-center gap-1 w-24">
                                                <input type="number" value={source.modeDistribution?.[modeKey] || ''} onChange={e => handleModeDistributionChange(modeKey, e.target.value)} className="w-full p-1 text-sm text-right rounded-md" placeholder="0" min="0" max="100" />
                                                <span className="text-sm">%</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                        <div className={`mt-2 pt-2 border-t dark:border-gray-600 flex justify-end font-semibold ${Math.abs(totalDistribution - 100) > 0.1 ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'}`}>
                            {t('totalDistribution')}: {totalDistribution.toFixed(1)}%
                        </div>
                    </div>
                </div>
            </div>
        )}
        
        {calculationMethod === 'spend' && (
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <select value={source.fuelType} onChange={(e) => onFuelTypeChange(e.target.value)} className={commonSelectClass} aria-label={t('serviceType')}>
                    {fuels.spend.map((item: any) => (
                        <option key={item.name} value={item.name}>
                        {language === 'ko' && item.translationKey ? t(item.translationKey as TranslationKey) : item.name}
                        </option>
                    ))}
                    </select>
                    <select value={source.unit} onChange={(e) => onUpdate({ unit: e.target.value })} className={commonSelectClass} aria-label="Unit">
                    { (fuels.spend.find((f: any) => f.name === source.fuelType) as any)?.units.map((unit: string) => (
                        <option key={unit} value={unit}>{t(unit as TranslationKey) || unit}</option>
                    ))}
                    </select>
                </div>
                <div className="mt-2">
                    <div className={`flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 ${isEditing ? 'rounded-t-lg' : 'rounded-lg'}`}>
                        <div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('totalYear')}: </span>
                            <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{totalQuantity.toLocaleString()}&nbsp;{renderUnit(source.unit)}</span>
                        </div>
                        {!isEditing && (
                        <button onClick={handleEdit} className="text-sm text-ghg-green font-semibold hover:underline">
                            {t('editMonthly')}
                        </button>
                        )}
                    </div>
                    {isEditing && (
                        <div className="p-3 bg-gray-100 dark:bg-gray-900/50 rounded-b-lg">
                           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {monthKeys.map((monthKey, index) => (
                                    <div key={monthKey}>
                                        <label className={commonLabelClass} htmlFor={`quantity-${source.id}-${index}`}>{t(monthKey)}</label>
                                        <div className={`flex items-center rounded-md shadow-sm border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 focus-within:ring-1 focus-within:ring-ghg-green focus-within:border-ghg-green overflow-hidden`}>
                                            <input id={`quantity-${source.id}-${index}`} type="number" onKeyDown={preventNonNumericKeys} value={editedQuantities[index] === 0 ? '' : editedQuantities[index]} onChange={(e) => handleMonthlyChange(index, e.target.value)} className="w-0 flex-grow bg-transparent text-gray-900 dark:text-gray-200 py-1 px-2 text-sm text-right focus:outline-none" placeholder="0" />
                                            <span className="pr-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{renderUnit(source.unit)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={handleCancel} className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">{t('cancel')}</button>
                                <button onClick={handleSave} className="px-3 py-1 text-sm font-medium text-white bg-ghg-green rounded-md shadow-sm hover:bg-ghg-dark">{t('save')}</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}
        
        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md text-right">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('emissionsForSource')}: </span>
            <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{(totalEmissions / 1000).toLocaleString('en-US', {minimumFractionDigits: 3})} t CO₂e</span>
        </div>
      </div>
    );
  }

  // == Advanced UI for Category 8 ==
  if (source.category === EmissionCategory.UpstreamLeasedAssets || source.category === EmissionCategory.DownstreamLeasedAssets) {
    const calculationMethod = (source.calculationMethod as Cat8CalculationMethod) || 'asset_specific';

    const handleMethodChange = (method: Cat8CalculationMethod) => {
        let updates: Partial<EmissionSource> = { calculationMethod: method, monthlyQuantities: [] };
        if (method === 'asset_specific') {
            updates = { ...updates, leasedAssetType: 'Building', energyInputs: [], leaseDurationMonths: 12 };
        } else if (method === 'area_based') {
            updates = { ...updates, leasedAssetType: 'Building', buildingType: 'Office', areaSqm: 0, leaseDurationMonths: 12 };
        } else if (method === 'spend_based') {
            const spendFactors = fuels.spend_based;
            updates = { ...updates, fuelType: spendFactors[0].name, unit: spendFactors[0].units[0], monthlyQuantities: Array(12).fill(0) };
        } else if (method === 'supplier_specific') {
            updates = { ...updates, supplierProvidedCO2e: 0, leaseDurationMonths: 12 };
        }
        onUpdate(updates);
    };

    const allEnergyAndFuelFactors = useMemo(() => {
        return [...STATIONARY_FUELS, ...MOBILE_FUELS, ...SCOPE2_ENERGY_SOURCES];
    }, []);

    const handleEnergyInputChange = (index: number, field: string, value: any) => {
        const newInputs = [...(source.energyInputs || [])];
        newInputs[index] = { ...newInputs[index], [field]: value };
        onUpdate({ energyInputs: newInputs });
    };

    const handleEnergyInputTypeChange = (index: number, newType: string) => {
        const newInputs = [...(source.energyInputs || [])];
        const factorData = allEnergyAndFuelFactors.find(f => f.name === newType);
        newInputs[index] = { ...newInputs[index], type: newType, unit: factorData?.units[0] || '' };
        onUpdate({ energyInputs: newInputs });
    };

    const addEnergyInput = () => {
        const newInputs = [...(source.energyInputs || [])];
        const defaultFactor = allEnergyAndFuelFactors[0];
        newInputs.push({
            id: `energy-${Date.now()}`,
            type: defaultFactor.name,
            value: 0,
            unit: defaultFactor.units[0],
        });
        onUpdate({ energyInputs: newInputs });
    };

    const removeEnergyInput = (index: number) => {
        const newInputs = [...(source.energyInputs || [])];
        newInputs.splice(index, 1);
        onUpdate({ energyInputs: newInputs });
    };

    return (
      <div className="flex flex-col gap-3 p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600">
        {/* Method Switcher & Remove Button */}
        <div className="flex justify-between items-start">
            <div className='flex-grow pr-4'>
                <label className={commonLabelClass}>{t('calculationMethod')}</label>
                <div className="flex gap-1 rounded-md bg-gray-200 dark:bg-gray-900 p-1 text-xs">
                    {(['asset_specific', 'area_based', 'spend_based', 'supplier_specific'] as Cat8CalculationMethod[]).map(method => (
                        <button 
                            key={method}
                            onClick={() => handleMethodChange(method)}
                            className={`flex-1 py-1 rounded-md transition-colors ${calculationMethod === method ? 'bg-white dark:bg-gray-700 shadow font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                            {t(`${method}Method` as TranslationKey)}
                        </button>
                    ))}
                </div>
            </div>
            <button onClick={onRemove} className="text-gray-400 hover:text-red-600 p-1 dark:text-gray-500 dark:hover:text-red-500" aria-label={t('removeSourceAria')}>
                <IconTrash className="h-5 w-5" />
            </button>
        </div>
        
        {/* Common Inputs */}
        <div>
            <label htmlFor={`description-${source.id}`} className={commonLabelClass}>{t('emissionSourceDescription')}</label>
            <input id={`description-${source.id}`} type="text" value={source.description || ''} onChange={(e) => onUpdate({ description: e.target.value })} className={commonSelectClass} placeholder={t(placeholderKey)} />
        </div>
        
        {calculationMethod !== 'spend_based' && (
            <div>
                <label className={commonLabelClass}>{t('leaseDurationMonths')}</label>
                <input type="number" value={source.leaseDurationMonths ?? 12} onChange={e => onUpdate({ leaseDurationMonths: parseInt(e.target.value) || 12 })} className={commonSelectClass} placeholder="12" min="1" max="12"/>
            </div>
        )}

        {/* Asset-specific Form */}
        {calculationMethod === 'asset_specific' && (
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className={commonLabelClass}>{t('leasedAssetType')}</label>
                        <select value={source.leasedAssetType} onChange={(e) => onUpdate({ leasedAssetType: e.target.value as LeasedAssetType })} className={commonSelectClass}>
                            {(['Building', 'Vehicle', 'Equipment'] as LeasedAssetType[]).map(type => <option key={type} value={type}>{t(type as TranslationKey) || type}</option>)}
                        </select>
                    </div>
                </div>
                {source.leasedAssetType === 'Vehicle' && <div className="p-2 bg-yellow-50 text-yellow-800 text-xs rounded-md">{t('cat8VehicleGuidance')}</div>}
                
                {/* Energy Inputs */}
                <div>
                    <label className={commonLabelClass}>{t('energyInputs')}</label>
                    <div className="space-y-2 p-2 bg-gray-100 dark:bg-gray-900/50 rounded-md">
                        {(source.energyInputs || []).map((input, index) => {
                            const factorData = allEnergyAndFuelFactors.find(f => f.name === input.type);
                            return (
                                <div key={input.id} className="p-2 border rounded dark:border-gray-600 bg-white dark:bg-gray-800">
                                    <div className="flex justify-end">
                                        <button onClick={() => removeEnergyInput(index)} className="text-gray-400 hover:text-red-500"><IconTrash className="w-4 h-4" /></button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <select value={input.type} onChange={(e) => handleEnergyInputTypeChange(index, e.target.value)} className={commonSelectClass}>
                                            {allEnergyAndFuelFactors.map(f => <option key={f.name} value={f.name}>{language === 'ko' && f.translationKey ? t(f.translationKey as TranslationKey) : f.name}</option>)}
                                        </select>
                                        <select value={input.unit} onChange={(e) => handleEnergyInputChange(index, 'unit', e.target.value)} className={commonSelectClass}>
                                            {factorData?.units.map((u: string) => <option key={u} value={u}>{t(u as TranslationKey) || u}</option>)}
                                        </select>
                                    </div>
                                    <div className="mt-2">
                                        <label className={commonLabelClass}>{t('annualConsumption')}</label>
                                        <input type="number" value={input.value} onChange={(e) => handleEnergyInputChange(index, 'value', parseFloat(e.target.value) || 0)} className={commonSelectClass} placeholder="0" />
                                    </div>
                                </div>
                            );
                        })}
                        <button onClick={addEnergyInput} className="w-full text-sm bg-ghg-light-green/50 text-ghg-dark font-semibold py-1 px-2 rounded-md hover:bg-ghg-light-green/80 transition-colors">{t('addEnergyInput')}</button>
                    </div>
                </div>
            </div>
        )}
        
        {/* Area-based Form */}
        {calculationMethod === 'area_based' && (
             <div className="space-y-3">
                <div className="p-2 bg-blue-50 text-blue-800 dark:text-blue-200 text-xs rounded-md">{t('cat8AreaGuidance')}</div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className={commonLabelClass}>{t('buildingType')}</label>
                        <select value={source.buildingType} onChange={(e) => onUpdate({ buildingType: e.target.value as BuildingType })} className={commonSelectClass}>
                            {Object.entries(fuels.area_based).map(([type, data]: [string, any]) => <option key={type} value={type}>{t(data.translationKey as TranslationKey)}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className={commonLabelClass}>{t('areaSqm')}</label>
                        <input type="number" value={source.areaSqm || ''} onChange={e => onUpdate({ areaSqm: parseFloat(e.target.value) || 0 })} className={commonSelectClass} placeholder="0" />
                    </div>
                </div>
            </div>
        )}

        {/* Spend-based Form */}
        {calculationMethod === 'spend_based' && (
             <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <select value={source.fuelType} onChange={(e) => onFuelTypeChange(e.target.value)} className={commonSelectClass}>
                        {fuels.spend_based.map((item: any) => (
                            <option key={item.name} value={item.name}>{language === 'ko' && item.translationKey ? t(item.translationKey as TranslationKey) : item.name}</option>
                        ))}
                    </select>
                    <select value={source.unit} onChange={(e) => onUpdate({ unit: e.target.value })} className={commonSelectClass}>
                        {(fuels.spend_based.find((f: any) => f.name === source.fuelType) as any)?.units.map((unit: string) => (
                            <option key={unit} value={unit}>{t(unit as TranslationKey) || unit}</option>
                        ))}
                    </select>
                </div>
                 <div className="mt-2">
                    <div className={`flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 ${isEditing ? 'rounded-t-lg' : 'rounded-lg'}`}>
                        <div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('totalYear')}: </span>
                            <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{totalQuantity.toLocaleString()}&nbsp;{renderUnit(source.unit)}</span>
                        </div>
                        {!isEditing && (
                        <button onClick={handleEdit} className="text-sm text-ghg-green font-semibold hover:underline">
                            {t('editMonthly')}
                        </button>
                        )}
                    </div>
                    {isEditing && (
                         <div className="p-3 bg-gray-100 dark:bg-gray-900/50 rounded-b-lg">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {monthKeys.map((monthKey, index) => (
                                    <div key={monthKey}>
                                        <label className={commonLabelClass} htmlFor={`quantity-${source.id}-${index}`}>{t(monthKey)}</label>
                                        <div className={`flex items-center rounded-md shadow-sm border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 focus-within:ring-1 focus-within:ring-ghg-green focus-within:border-ghg-green overflow-hidden`}>
                                            <input id={`quantity-${source.id}-${index}`} type="number" onKeyDown={preventNonNumericKeys} value={editedQuantities[index] === 0 ? '' : editedQuantities[index]} onChange={(e) => handleMonthlyChange(index, e.target.value)} className="w-0 flex-grow bg-transparent text-gray-900 dark:text-gray-200 py-1 px-2 text-sm text-right focus:outline-none" placeholder="0" />
                                            <span className="pr-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{renderUnit(source.unit)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={handleCancel} className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">{t('cancel')}</button>
                                <button onClick={handleSave} className="px-3 py-1 text-sm font-medium text-white bg-ghg-green rounded-md shadow-sm hover:bg-ghg-dark">{t('save')}</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}
        
        {/* Supplier-specific Form */}
        {calculationMethod === 'supplier_specific' && (
            <div>
                <label htmlFor={`supplier-co2e-${source.id}`} className={commonLabelClass}>{t('supplierProvidedCO2e')}</label>
                <input id={`supplier-co2e-${source.id}`} type="number" step="any" value={source.supplierProvidedCO2e ?? ''} onChange={(e) => onUpdate({ supplierProvidedCO2e: parseFloat(e.target.value) || 0 })} className={commonSelectClass} placeholder="0" />
            </div>
        )}

        {/* Total emissions display */}
        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md text-right">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('emissionsForSource')}: </span>
            <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{(totalEmissions / 1000).toLocaleString('en-US', {minimumFractionDigits: 3})} t CO₂e</span>
        </div>
      </div>
    );
  }

  // == Advanced UI for Category 10 ==
  if (source.category === EmissionCategory.ProcessingOfSoldProducts) {
    const calculationMethod = (source.calculationMethod as Cat10CalculationMethod) || 'process_specific';

    const methodTranslationMap: Record<Cat10CalculationMethod, TranslationKey> = {
        'process_specific': 'processSpecificMethod',
        'customer_specific': 'customerSpecificMethod',
        'spend': 'spendMethod'
    };

    const handleMethodChange = (method: Cat10CalculationMethod) => {
        let updates: Partial<EmissionSource> = { calculationMethod: method, monthlyQuantities: Array(12).fill(0) };
        if (method === 'process_specific') {
            const defaultProcess = fuels.activity[0];
            updates = { ...updates, processingMethod: defaultProcess.name, unit: defaultProcess.units[0] };
        } else if (method === 'spend') {
            const defaultSpend = fuels.spend[0];
            updates = { ...updates, fuelType: defaultSpend.name, unit: defaultSpend.units[0] };
        } else if (method === 'customer_specific') {
            updates = { ...updates, supplierDataType: 'total_co2e', supplierProvidedCO2e: 0, energyInputs: [] };
        }
        onUpdate(updates);
    };

    const handleProcessChange = (processName: string) => {
        const processData = fuels.activity.find((p: any) => p.name === processName);
        if (processData) {
            onUpdate({ processingMethod: processName, unit: processData.units[0] });
        }
    };
    
    // Logic for energy inputs, copied from Cat 8
    const allEnergyAndFuelFactors = useMemo(() => {
        return [...STATIONARY_FUELS, ...MOBILE_FUELS, ...SCOPE2_ENERGY_SOURCES];
    }, []);

    const handleEnergyInputChange = (index: number, field: string, value: any) => {
        const newInputs = [...(source.energyInputs || [])];
        newInputs[index] = { ...newInputs[index], [field]: value };
        onUpdate({ energyInputs: newInputs });
    };

    const handleEnergyInputTypeChange = (index: number, newType: string) => {
        const newInputs = [...(source.energyInputs || [])];
        const factorData = allEnergyAndFuelFactors.find(f => f.name === newType);
        newInputs[index] = { ...newInputs[index], type: newType, unit: factorData?.units[0] || '' };
        onUpdate({ energyInputs: newInputs });
    };

    const addEnergyInput = () => {
        const newInputs = [...(source.energyInputs || [])];
        const defaultFactor = allEnergyAndFuelFactors[0];
        newInputs.push({
            id: `energy-${Date.now()}`,
            type: defaultFactor.name,
            value: 0,
            unit: defaultFactor.units[0],
        });
        onUpdate({ energyInputs: newInputs });
    };

    const removeEnergyInput = (index: number) => {
        const newInputs = [...(source.energyInputs || [])];
        newInputs.splice(index, 1);
        onUpdate({ energyInputs: newInputs });
    };

    const handleAnalyzeCat10 = async () => {
        if (!source.description) return;
        setIsLoadingAI(true);
        setAiAnalysisResult(null);
        const knownProcesses = (fuels.activity as any[]).map(f => f.name).join(', ');

        try {
            const ai = new GoogleGenAI({apiKey: process.env.API_KEY as string});
            const promptText = `As a GHG Protocol expert for Scope 3 Category 10 (Processing of Sold Products), analyze the following downstream processing description. Determine the most appropriate calculation method ('process_specific', 'customer_specific', 'spend') and suggest a specific process type if applicable.

Description: "${source.description}"

Available 'process_specific' types: ${knownProcesses}.
Available 'spend' type: 'Downstream Processing Services (spend)'.

Provide a structured JSON response.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: promptText,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            suggested_calculation_method: { type: Type.STRING, description: "One of: 'process_specific', 'customer_specific', 'spend'." },
                            suggested_process_name: { type: Type.STRING, description: `If method is 'process_specific', suggest one of the known process names. Otherwise, null.` },
                            justification: { type: Type.STRING, description: "A brief explanation for your choices." },
                        }
                    },
                }
            });
            const result = JSON.parse(response.text);
            setAiAnalysisResult(result);
        } catch (error) {
            console.error("AI analysis failed:", error);
            setAiAnalysisResult({ error: "Failed to analyze." });
        } finally {
            setIsLoadingAI(false);
        }
    };
    
    const handleApplyAISuggestion = () => {
        if (!aiAnalysisResult) return;
        const { suggested_calculation_method, suggested_process_name } = aiAnalysisResult;

        const updates: Partial<EmissionSource> = {
            calculationMethod: suggested_calculation_method,
        };

        if (suggested_calculation_method === 'process_specific' && suggested_process_name) {
            const processData = fuels.activity.find((p: any) => p.name === suggested_process_name);
            if (processData) {
                updates.processingMethod = processData.name;
                updates.unit = processData.units[0];
            }
        } else if (suggested_calculation_method === 'spend') {
            const spendData = fuels.spend[0];
            updates.fuelType = spendData.name;
            updates.unit = spendData.units[0];
        }

        onUpdate(updates);
        setAiAnalysisResult(null);
    };

    return (
      <div className="flex flex-col gap-3 p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600">
        {/* Method Switcher & Remove Button */}
        <div className="flex justify-between items-start">
            <div className='flex-grow pr-4'>
                <label className={commonLabelClass}>{t('calculationMethod')}</label>
                <div className="flex gap-1 rounded-md bg-gray-200 dark:bg-gray-900 p-1 text-xs">
                    {(['process_specific', 'customer_specific', 'spend'] as Cat10CalculationMethod[]).map(method => (
                        <button 
                            key={method}
                            onClick={() => handleMethodChange(method)}
                            className={`flex-1 py-1 rounded-md transition-colors ${calculationMethod === method ? 'bg-white dark:bg-gray-700 shadow font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                            {t(methodTranslationMap[method])}
                        </button>
                    ))}
                </div>
            </div>
            <button onClick={onRemove} className="text-gray-400 hover:text-red-600 p-1 dark:text-gray-500 dark:hover:text-red-500" aria-label={t('removeSourceAria')}>
                <IconTrash className="h-5 w-5" />
            </button>
        </div>
        
        {/* Common Inputs */}
        <div>
            <label htmlFor={`description-${source.id}`} className={commonLabelClass}>{t('emissionSourceDescription')}</label>
            <div className="flex gap-2">
                <input id={`description-${source.id}`} type="text" value={source.description || ''} onChange={(e) => onUpdate({ description: e.target.value })} className={commonSelectClass} placeholder={t(placeholderKey)} />
                <button onClick={handleAnalyzeCat10} disabled={isLoadingAI || !source.description} className="px-3 py-2 bg-ghg-light-green text-white rounded-md hover:bg-ghg-green disabled:bg-gray-400 flex items-center gap-2">
                    <IconSparkles className="w-4 h-4" />
                    <span className="text-sm font-semibold">{isLoadingAI ? '...' : t('analyzeWithAI')}</span>
                </button>
            </div>
        </div>
         {aiAnalysisResult && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 dark:bg-blue-900/30 dark:border-blue-700/50 text-xs space-y-2">
                <h4 className="font-semibold text-sm mb-1">{t('aiAnalysis')}</h4>
                <p><span className="font-semibold">{t('suggestedMethod')}:</span> {t(methodTranslationMap[aiAnalysisResult.suggested_calculation_method as Cat10CalculationMethod])}</p>
                {aiAnalysisResult.suggested_process_name && <p><span className="font-semibold">{t('suggestedProcess')}:</span> {t((fuels.activity.find((f:any) => f.name === aiAnalysisResult.suggested_process_name)?.translationKey) as TranslationKey)}</p>}
                <p><span className="font-semibold">{t('justification')}:</span> {aiAnalysisResult.justification}</p>
                <div className="flex justify-between items-center mt-2 pt-2 border-t dark:border-blue-700/50">
                    <p className="text-blue-600 dark:text-blue-300">{t('aiDisclaimer')}</p>
                    <button onClick={handleApplyAISuggestion} className="bg-blue-500 text-white font-semibold py-1 px-3 rounded-md hover:bg-blue-600 text-xs">{t('applySuggestion')}</button>
                </div>
            </div>
        )}
         <div>
            <label htmlFor={`activityDataSource-${source.id}`} className={commonLabelClass}>{t('activityDataSource')}</label>
            <input id={`activityDataSource-${source.id}`} type="text" value={source.activityDataSource ?? ''} onChange={(e) => onUpdate({ activityDataSource: e.target.value })} className={commonSelectClass} placeholder={t('activityDataSourcePlaceholder')} />
        </div>

        {/* Process-specific Form */}
        {calculationMethod === 'process_specific' && (
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className={commonLabelClass}>{t('processingMethod')}</label>
                        <select value={source.processingMethod} onChange={(e) => handleProcessChange(e.target.value)} className={commonSelectClass}>
                            {fuels.activity.map((item: any) => (
                                <option key={item.name} value={item.name}>{t(item.translationKey as TranslationKey)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                         <label className={commonLabelClass}>{t('unit')}</label>
                         <select value={source.unit} onChange={(e) => onUpdate({ unit: e.target.value })} className={commonSelectClass}>
                            {(fuels.activity.find((f: any) => f.name === source.processingMethod) as any)?.units.map((unit: string) => (
                                <option key={unit} value={unit}>{t(unit as TranslationKey) || unit}</option>
                            ))}
                        </select>
                    </div>
                </div>
                 <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm">
                    <strong>{t('emissionFactor')}:</strong> {(fuels.activity.find((f: any) => f.name === source.processingMethod) as any)?.factors[source.unit] || 0} kg CO₂e / {renderUnit(source.unit)}
                </div>

                {/* Monthly Data */}
                <div className="mt-2">
                    <div className={`flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 ${isEditing ? 'rounded-t-lg' : 'rounded-lg'}`}>
                        <div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('totalProcessed')}: </span>
                            <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{totalQuantity.toLocaleString()}&nbsp;{renderUnit(source.unit)}</span>
                        </div>
                        {!isEditing && (
                        <button onClick={handleEdit} className="text-sm text-ghg-green font-semibold hover:underline">
                            {t('editMonthly')}
                        </button>
                        )}
                    </div>
                     {isEditing && (
                        <div className="p-3 bg-gray-100 dark:bg-gray-900/50 rounded-b-lg">
                           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {monthKeys.map((monthKey, index) => (
                                    <div key={monthKey}>
                                        <label className={commonLabelClass} htmlFor={`quantity-${source.id}-${index}`}>{t(monthKey)}</label>
                                        <div className={`flex items-center rounded-md shadow-sm border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 focus-within:ring-1 focus-within:ring-ghg-green focus-within:border-ghg-green overflow-hidden`}>
                                            <input id={`quantity-${source.id}-${index}`} type="number" onKeyDown={preventNonNumericKeys} value={editedQuantities[index] === 0 ? '' : editedQuantities[index]} onChange={(e) => handleMonthlyChange(index, e.target.value)} className="w-0 flex-grow bg-transparent text-gray-900 dark:text-gray-200 py-1 px-2 text-sm text-right focus:outline-none" placeholder="0" />
                                            <span className="pr-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{renderUnit(source.unit)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={handleCancel} className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">{t('cancel')}</button>
                                <button onClick={handleSave} className="px-3 py-1 text-sm font-medium text-white bg-ghg-green rounded-md shadow-sm hover:bg-ghg-dark">{t('save')}</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}
        
        {/* Customer-specific Form */}
        {calculationMethod === 'customer_specific' && (
            <div className="space-y-3">
                <div className='flex-grow'>
                    <label className={commonLabelClass}>{t('dataType')}</label>
                    <div className="flex gap-1 rounded-md bg-gray-200 dark:bg-gray-900 p-1 text-xs">
                        <button onClick={() => onUpdate({ supplierDataType: 'total_co2e' })} className={`flex-1 py-1 rounded-md transition-colors ${source.supplierDataType === 'total_co2e' ? 'bg-white dark:bg-gray-700 shadow font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{t('totalCO2e')}</button>
                        <button onClick={() => onUpdate({ supplierDataType: 'energy_data' })} className={`flex-1 py-1 rounded-md transition-colors ${source.supplierDataType === 'energy_data' ? 'bg-white dark:bg-gray-700 shadow font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{t('energyConsumptionData')}</button>
                    </div>
                </div>

                {source.supplierDataType === 'total_co2e' && (
                    <div>
                        <label htmlFor={`supplier-co2e-${source.id}`} className={commonLabelClass}>{t('supplierProvidedCO2e')}</label>
                        <input id={`supplier-co2e-${source.id}`} type="number" step="any" value={source.supplierProvidedCO2e ?? ''} onChange={(e) => onUpdate({ supplierProvidedCO2e: parseFloat(e.target.value) || 0 })} className={commonSelectClass} placeholder="0" />
                    </div>
                )}
                
                {source.supplierDataType === 'energy_data' && (
                     <div>
                        <label className={commonLabelClass}>{t('energyInputs')}</label>
                        <div className="space-y-2 p-2 bg-gray-100 dark:bg-gray-900/50 rounded-md">
                            {(source.energyInputs || []).map((input, index) => {
                                const factorData = allEnergyAndFuelFactors.find(f => f.name === input.type);
                                return (
                                    <div key={input.id} className="p-2 border rounded dark:border-gray-600 bg-white dark:bg-gray-800">
                                        <div className="flex justify-end">
                                            <button onClick={() => removeEnergyInput(index)} className="text-gray-400 hover:text-red-500"><IconTrash className="w-4 h-4" /></button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <select value={input.type} onChange={(e) => handleEnergyInputTypeChange(index, e.target.value)} className={commonSelectClass}>
                                                {allEnergyAndFuelFactors.map(f => <option key={f.name} value={f.name}>{language === 'ko' && f.translationKey ? t(f.translationKey as TranslationKey) : f.name}</option>)}
                                            </select>
                                            <select value={input.unit} onChange={(e) => handleEnergyInputChange(index, 'unit', e.target.value)} className={commonSelectClass}>
                                                {factorData?.units.map((u: string) => <option key={u} value={u}>{t(u as TranslationKey) || u}</option>)}
                                            </select>
                                        </div>
                                        <div className="mt-2">
                                            <label className={commonLabelClass}>{t('annualConsumption')}</label>
                                            <input type="number" value={input.value} onChange={(e) => handleEnergyInputChange(index, 'value', parseFloat(e.target.value) || 0)} className={commonSelectClass} placeholder="0" />
                                        </div>
                                    </div>
                                );
                            })}
                            <button onClick={addEnergyInput} className="w-full text-sm bg-ghg-light-green/50 text-ghg-dark font-semibold py-1 px-2 rounded-md hover:bg-ghg-light-green/80 transition-colors">{t('addEnergyInput')}</button>
                        </div>
                    </div>
                )}
            </div>
        )}
        
        {/* Spend-based Form */}
        {calculationMethod === 'spend' && (
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <select value={source.fuelType} onChange={(e) => onFuelTypeChange(e.target.value)} className={commonSelectClass} aria-label="Service Type">
                        {fuels.spend.map((item: any) => (
                            <option key={item.name} value={item.name}>{t(item.translationKey as TranslationKey)}</option>
                        ))}
                    </select>
                     <select value={source.unit} onChange={(e) => onUpdate({ unit: e.target.value })} className={commonSelectClass} aria-label="Unit">
                        {(fuels.spend.find((f: any) => f.name === source.fuelType) as any)?.units.map((unit: string) => (
                            <option key={unit} value={unit}>{t(unit as TranslationKey) || unit}</option>
                        ))}
                    </select>
                </div>
                 <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm">
                    <strong>{t('emissionFactor')}:</strong> {(fuels.spend.find((f: any) => f.name === source.fuelType) as any)?.factors[source.unit] || 0} kg CO₂e / {renderUnit(source.unit)}
                </div>
                <div className="mt-2">
                    <div className={`flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 ${isEditing ? 'rounded-t-lg' : 'rounded-lg'}`}>
                        <div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('totalYear')}: </span>
                            <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{totalQuantity.toLocaleString()}&nbsp;{renderUnit(source.unit)}</span>
                        </div>
                        {!isEditing && (
                        <button onClick={handleEdit} className="text-sm text-ghg-green font-semibold hover:underline">
                            {t('editMonthly')}
                        </button>
                        )}
                    </div>
                    {isEditing && (
                         <div className="p-3 bg-gray-100 dark:bg-gray-900/50 rounded-b-lg">
                           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {monthKeys.map((monthKey, index) => (
                                    <div key={monthKey}>
                                        <label className={commonLabelClass} htmlFor={`quantity-${source.id}-${index}`}>{t(monthKey)}</label>
                                        <div className={`flex items-center rounded-md shadow-sm border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 focus-within:ring-1 focus-within:ring-ghg-green focus-within:border-ghg-green overflow-hidden`}>
                                            <input id={`quantity-${source.id}-${index}`} type="number" onKeyDown={preventNonNumericKeys} value={editedQuantities[index] === 0 ? '' : editedQuantities[index]} onChange={(e) => handleMonthlyChange(index, e.target.value)} className="w-0 flex-grow bg-transparent text-gray-900 dark:text-gray-200 py-1 px-2 text-sm text-right focus:outline-none" placeholder="0" />
                                            <span className="pr-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{renderUnit(source.unit)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={handleCancel} className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">{t('cancel')}</button>
                                <button onClick={handleSave} className="px-3 py-1 text-sm font-medium text-white bg-ghg-green rounded-md shadow-sm hover:bg-ghg-dark">{t('save')}</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Total emissions display */}
        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md text-right">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('emissionsForSource')}: </span>
            <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{(totalEmissions / 1000).toLocaleString('en-US', {minimumFractionDigits: 3})} t CO₂e</span>
        </div>
      </div>
    );
  }

  // == Default UI for all other categories ==
  const selectedFuel = Array.isArray(fuels) ? fuels.find((f: any) => f.name === source.fuelType) : null;
  const isFugitive = selectedFuel && 'gwp' in selectedFuel;
  
  const getCalculationDetails = () => {
      const totalEmissionsInTonnes = (totalEmissions / 1000).toLocaleString('en-US', {minimumFractionDigits: 3, maximumFractionDigits: 3});
      if (isFugitive) {
        const gwp = (selectedFuel as Refrigerant).gwp;
        return (
          <div className="p-1">
            <p className="text-center font-bold mb-2 border-b border-gray-600 pb-1">{t('emissionsForSource')}</p>
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-left items-center">
                <span className="font-semibold">{t('activityData')}</span>
                <span className="text-right">{totalQuantity.toLocaleString()} kg</span>
                
                <span className="font-semibold">GWP</span>
                <span className="text-right">&times; {gwp.toLocaleString()}</span>
                
                <div className="col-span-2 my-1 border-t border-gray-500"></div>

                <span className="font-bold text-base">{t('total')}</span>
                <span className="font-bold text-base text-right">= {totalEmissionsInTonnes} t CO₂e</span>
            </div>
          </div>
        );
      }

      const factor = selectedFuel && 'factors' in selectedFuel ? selectedFuel.factors[source.unit] || 0 : 0;
      return (
          <div className="p-1">
            <p className="text-center font-bold mb-2 border-b border-gray-600 pb-1">{t('emissionsForSource')}</p>
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-left items-center">
                <span className="font-semibold">{t('activityData')}</span>
                <span className="text-right">{totalQuantity.toLocaleString()}&nbsp;{renderUnit(source.unit)}</span>
                
                <span className="font-semibold">{t('emissionFactor')}</span>
                <span className="text-right">&times; {factor.toLocaleString()} kg CO₂e</span>
                
                <div className="col-span-2 my-1 border-t border-gray-500"></div>

                <span className="font-bold text-base">{t('total')}</span>
                <span className="font-bold text-base text-right">= {totalEmissionsInTonnes} t CO₂e</span>
            </div>
          </div>
      )
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600">
      <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
        <select
          value={source.facilityId}
          onChange={(e) => onUpdate({ facilityId: e.target.value })}
          className={commonSelectClass}
          aria-label={t('facility')}
        >
          {facilities.filter(f => f.isCorporate).map(f => (
            <option key={f.id} value={f.id}>{t('corporateLevelFacility')}</option>
          ))}
          {Object.entries(groupedFacilities.groups).map(([groupName, facilitiesInGroup]) => (
              <optgroup key={groupName} label={groupName}>
                  {(facilitiesInGroup as Facility[]).map((facility) => (
                      <option key={facility.id} value={facility.id}>{facility.name}</option>
                  ))}
              </optgroup>
          ))}
          {groupedFacilities.ungrouped.length > 0 && (
              <optgroup label={t('ungroupedFacilities')}>
                  {groupedFacilities.ungrouped.map((facility) => (
                      <option key={facility.id} value={facility.id}>{facility.name}</option>
                  ))}
              </optgroup>
          )}
        </select>
         <button onClick={onRemove} className="text-gray-400 hover:text-red-600 p-1 dark:text-gray-500 dark:hover:text-red-500" aria-label={t('removeSourceAria')}>
          <IconTrash className="h-5 w-5" />
        </button>
      </div>
      <div>
        <label htmlFor={`description-${source.id}`} className={commonLabelClass}>{t('emissionSourceDescription')}</label>
        <input
            id={`description-${source.id}`}
            type="text"
            value={source.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            className={commonSelectClass}
            placeholder={t(placeholderKey)}
        />
      </div>
       <div>
        <label htmlFor={`activityDataSource-${source.id}`} className={commonLabelClass}>{t('activityDataSource')}</label>
        <input
            id={`activityDataSource-${source.id}`}
            type="text"
            value={source.activityDataSource ?? ''}
            onChange={(e) => onUpdate({ activityDataSource: e.target.value })}
            className={commonSelectClass}
            placeholder={t('activityDataSourcePlaceholder')}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select value={source.fuelType} onChange={(e) => onFuelTypeChange(e.target.value)} className={commonSelectClass} aria-label="Fuel/Source">
          {Array.isArray(fuels) && fuels.map((fuel: any) => (
            <option key={fuel.name} value={fuel.name}>
              {language === 'ko' && fuel.translationKey ? `${t(fuel.translationKey as TranslationKey)}` : fuel.name}
            </option>
          ))}
        </select>
        <select value={source.unit} onChange={(e) => onUpdate({ unit: e.target.value })} className={commonSelectClass} aria-label="Unit" disabled={isFugitive}>
          {isFugitive ? (<option value="kg">kg</option>) : (
            selectedFuel && 'units' in selectedFuel && (selectedFuel as CO2eFactorFuel).units.map((unit) => (
              <option key={unit} value={unit}>{t(unit as TranslationKey) || unit}</option>
            ))
          )}
        </select>
      </div>
      
      {source.category === EmissionCategory.PurchasedEnergy && source.fuelType === 'Grid Electricity' && (
        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-900/50 rounded-md">
            <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={provideMarketData} onChange={toggleMarketData} className="rounded text-ghg-green focus:ring-ghg-green"/>
                <span>{t('provideMarketData')}</span>
            </label>
            {provideMarketData && (
                <div className="mt-2">
                    <label htmlFor={`market-factor-${source.id}`} className={commonLabelClass}>{t('marketFactor')}</label>
                    <input id={`market-factor-${source.id}`} type="number" step="any" value={source.marketBasedFactor ?? ''} onChange={(e) => handleMarketFactorChange(e.target.value)} className="w-full mt-1 bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green" placeholder="0"/>
                </div>
            )}
        </div>
      )}

      <div className="mt-2">
        <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded-t-md">
            <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('totalYear')}: </span>
                <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{totalQuantity.toLocaleString()}&nbsp;{renderUnit(source.unit)}</span>
            </div>
            {!isEditing && (
              <button onClick={handleEdit} className="text-sm text-ghg-green font-semibold hover:underline">
                  {t('editMonthly')}
              </button>
            )}
        </div>
        <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded-b-md border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-1 group relative">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('emissionsForSource')}: </span>
                <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{(totalEmissions / 1000).toLocaleString('en-US', {minimumFractionDigits: 3})} t CO₂e</span>
                <IconInfo className="w-4 h-4 text-gray-400 cursor-pointer" />
                <div className="absolute bottom-full mb-2 w-max max-w-sm bg-gray-800 text-white text-xs rounded-lg shadow-lg py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {getCalculationDetails()}
                </div>
            </div>
        </div>

        {isEditing && (
            <div className="p-3 bg-gray-100 dark:bg-gray-900/50 rounded-b-lg">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {monthKeys.map((monthKey, index) => (
                        <div key={monthKey}>
                            <label className={commonLabelClass} htmlFor={`quantity-${source.id}-${index}`}>{t(monthKey)}</label>
                             <div className={`flex items-center rounded-md shadow-sm border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 focus-within:ring-1 focus-within:ring-ghg-green focus-within:border-ghg-green overflow-hidden`}>
                                <input
                                    id={`quantity-${source.id}-${index}`}
                                    type="number"
                                    onKeyDown={preventNonNumericKeys}
                                    value={editedQuantities[index] === 0 ? '' : editedQuantities[index]}
                                    onChange={(e) => handleMonthlyChange(index, e.target.value)}
                                    className="w-0 flex-grow bg-transparent text-gray-900 dark:text-gray-200 py-1 px-2 text-sm text-right focus:outline-none"
                                    placeholder="0"
                                />
                                <span className="pr-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                    {renderUnit(source.unit)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={handleCancel} className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">{t('cancel')}</button>
                    <button onClick={handleSave} className="px-3 py-1 text-sm font-medium text-white bg-ghg-green rounded-md shadow-sm hover:bg-ghg-dark">{t('save')}</button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};