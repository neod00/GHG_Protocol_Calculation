import React, { useState, useEffect, useMemo } from 'react';
import { EmissionSource, Facility, Refrigerant, CO2eFactorFuel, EmissionCategory, CalculationMethod, Cat4CalculationMethod, TransportMode } from '../types';
import { useTranslation } from '../LanguageContext';
import { TranslationKey } from '../translations';
import { IconInfo, IconTrash, IconSparkles } from './IconComponents';
import { GoogleGenAI, Type } from '@google/genai';
import { MOBILE_FUELS, TRANSPORTATION_SPEND_FACTORS } from '../constants';

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
            // FIX: Corrected typo in translation key. 'processingSoldProductsPlaceholder' should be 'processingOfSoldProductsPlaceholder'.
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
    setEditedQuantities([...source.monthlyQuantities]);
    setIsEditing(true);
  };

  const handleCancel = () => {
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

    const activityUnit = source.calculationMethod === 'supplier_co2e' ? 'kg CO₂e' : (t(source.unit as TranslationKey) || source.unit);

    return (
      <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600">
        {/* Collapsed View */}
        <div className="flex justify-between items-center">
            <div className='truncate pr-2'>
                <p className="text-sm font-medium text-ghg-dark dark:text-gray-100 truncate">{source.fuelType || placeholderText}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('total')}: {activityTotal.toLocaleString()} {activityUnit} • {(totalEmissions / 1000).toLocaleString('en-US', {minimumFractionDigits: 3})} t CO₂e
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
                        <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{totalQuantity.toLocaleString()} {t(source.unit as TranslationKey) || source.unit}</span>
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
                                        className="flex-grow bg-transparent text-gray-900 dark:text-gray-200 py-1 px-2 text-sm text-right focus:outline-none"
                                        placeholder="0"
                                    />
                                    <span className="pr-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                        {t(source.unit as TranslationKey) || source.unit}
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
                                <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{totalQuantity.toLocaleString()} {t(source.unit as TranslationKey) || source.unit}</span>
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
                                                    className="flex-grow bg-transparent text-gray-900 dark:text-gray-200 py-1 px-2 text-sm text-right focus:outline-none"
                                                    placeholder="0"
                                                />
                                                <span className="pr-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                    {t(source.unit as TranslationKey) || source.unit}
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

  // == Advanced UI for Category 4 ==
  if (source.category === EmissionCategory.UpstreamTransportationAndDistribution) {
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
                            <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{totalQuantity.toLocaleString()} {t(source.unit as TranslationKey) || source.unit}</span>
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
                                                className="flex-grow bg-transparent text-gray-900 dark:text-gray-200 py-1 px-2 text-sm text-right focus:outline-none"
                                                placeholder="0"
                                            />
                                            <span className="pr-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                {t(source.unit as TranslationKey) || source.unit}
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

  // == Default UI for all other categories ==
  const selectedFuel = fuels.find((f: any) => f.name === source.fuelType);
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
                <span className="text-right">{totalQuantity.toLocaleString()} {t(source.unit as TranslationKey) || source.unit}</span>
                
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
      <div className="grid grid-cols-2 gap-2">
        <select value={source.fuelType} onChange={(e) => onFuelTypeChange(e.target.value)} className={commonSelectClass} aria-label="Fuel/Source">
          {fuels.map((fuel: any) => (
            <option key={fuel.name} value={fuel.name}>
              {language === 'ko' && fuel.translationKey ? `${t(fuel.translationKey as TranslationKey)}` : fuel.name}
            </option>
          ))}
        </select>
        <select value={source.unit} onChange={(e) => onUpdate({ unit: e.target.value })} className={commonSelectClass} aria-label="Unit" disabled={isFugitive}>
          {isFugitive ? (<option value="kg">kg</option>) : (
            // FIX: The `units` property exists only on the `CO2eFactorFuel` type. The compiler needs
            // an explicit cast to narrow the type of `selectedFuel` before accessing `units`.
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
                <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{totalQuantity.toLocaleString()} {t(source.unit as TranslationKey) || source.unit}</span>
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
                                    className="flex-grow bg-transparent text-gray-900 dark:text-gray-200 py-1 px-2 text-sm text-right focus:outline-none"
                                    placeholder="0"
                                />
                                <span className="pr-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                    {t(source.unit as TranslationKey) || source.unit}
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