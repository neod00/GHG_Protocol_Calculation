
import React, { useState, useEffect } from 'react';
import { EmissionSource, Cat5CalculationMethod, WasteType, TreatmentMethod, TransportMode, EmissionCategory, DataQualityIndicator, calculateDQIScore, getDQIRating } from '../../types';
import { useTranslation } from '../../context/LanguageContext';
import { TranslationKey } from '../../translations/index';
import { IconTrash, IconSparkles, IconCheck, IconInfo, IconCar, IconAlertTriangle } from '../IconComponents';
import { GoogleGenAI, Type } from '@google/genai';
import { DQISection } from '../DQISection';
import { MethodologyWizard } from '../MethodologyWizard';
import { DEFAULT_TREATMENT_RATIOS } from '../../constants/scope3/category5';
import { TRANSPORTATION_FACTORS_BY_MODE } from '../../constants/scope3/category4_9';

interface SourceInputRowProps {
    source: EmissionSource;
    onUpdate: (updatedSource: Partial<EmissionSource>) => void;
    onRemove: () => void;
    onFuelTypeChange: (newFuelType: string) => void;
    fuels: any;
    facilities: any[];
    calculateEmissions: (source: EmissionSource) => { scope1: number, scope2Location: number, scope2Market: number, scope3: number };
}

export const Category5Row: React.FC<SourceInputRowProps> = ({ source, onUpdate, onRemove, onFuelTypeChange, fuels, calculateEmissions }) => {
    const { t, language } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    const totalEmissions = calculateEmissions(source).scope3;
    const commonSelectClass = "w-full bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
    const commonInputClass = "w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
    const commonLabelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

    const calculationMethod: Cat5CalculationMethod = source.calculationMethod as Cat5CalculationMethod || 'activity';

    // Ensure default calculation method
    useEffect(() => {
        if (!source.calculationMethod) {
            onUpdate({ calculationMethod: 'activity', unit: 'tonnes' });
        }
    }, []);

    // DQI update handler
    const handleDQIUpdate = (indicator: DataQualityIndicator, rating: 'high' | 'medium' | 'low' | 'estimated') => {
        onUpdate({
            dataQualityIndicator: indicator,
            dataQualityRating: rating,
        });
    };

    const handleMethodChange = (method: Cat5CalculationMethod) => {
        let updates: Partial<EmissionSource> = { calculationMethod: method };

        if (method === 'activity') {
            updates.unit = 'tonnes';
            updates.includeTransport = source.includeTransport ?? false;
        } else if (method === 'spend') {
            updates.unit = 'USD';
            // Default to the first spend factor if available
            if (fuels.spend && fuels.spend.length > 0 && !source.fuelType) {
                updates.fuelType = fuels.spend[0].name;
            }
        } else if (method === 'supplier_specific') {
            updates.unit = 'kg CO₂e';
        } else if (method === 'average') {
            updates.unit = 'tonnes';
            // Set default treatment ratios
            if (!source.treatmentRatios) {
                updates.treatmentRatios = DEFAULT_TREATMENT_RATIOS.default;
            }
        }

        onUpdate(updates);
    };

    const handleTotalChange = (value: string) => {
        const val = parseFloat(value);
        const newQuantities = Array(12).fill(0);
        newQuantities[0] = isNaN(val) ? 0 : val;
        onUpdate({ monthlyQuantities: newQuantities });
    };

    const handleAnalyze = async () => {
        if (!source.description) return;
        setIsLoadingAI(true);
        setAiAnalysisResult(null);

        try {
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
            if (!apiKey) {
                alert(t('apiKeyMissing'));
                setIsLoadingAI(false);
                return;
            }
            const ai = new GoogleGenAI({ apiKey: apiKey as string });
            // Context specific to GHG Protocol Category 5
            const promptText = `You are a GHG Protocol Scope 3 expert. Analyze this waste stream description: "${source.description}".
            
            1. Classification: Identify the Waste Type (MSW, Paper, Plastics, Food, Metal, Hazardous) and likely Treatment Method (Landfill, Incineration, Recycling, Composting).
            2. Hazardous Check: Is this waste likely hazardous?
            3. Boundary Check (CRITICAL):
               - If it sounds like Construction/Demolition waste (e.g., concrete, rubble, bricks), flag it as 'Category 2 (Capital Goods)' or 'Project-specific'.
               - If it sounds like End-of-Life of Sold Products (e.g., customer returning used product), flag it as 'Category 12'.
               - If it sounds like Process Scrap sold for value, note it might be a byproduct (Scope 1 or Cat 1 boundary).
            
            Return structured JSON.
            
            IMPORTANT: Respond in ${language === 'ko' ? 'Korean' : 'English'}.`;

            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    waste_type: { type: Type.STRING },
                    treatment_method: { type: Type.STRING },
                    is_hazardous: { type: Type.BOOLEAN },
                    boundary_warning: { type: Type.STRING, description: "Name of the conflicting Category (e.g., 'Category 2', 'Category 12') or null if strictly Category 5." },
                    reasoning: { type: Type.STRING },
                }
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: promptText,
                config: { responseMimeType: "application/json", responseSchema },
            });
            const result = JSON.parse(response.text || '{}');
            setAiAnalysisResult(result);
        } catch (error) {
            console.error("AI analysis failed:", error);
            setAiAnalysisResult({ error: "Failed to analyze." });
        } finally {
            setIsLoadingAI(false);
        }
    };

    const applyAiResult = () => {
        if (!aiAnalysisResult) return;
        const updates: Partial<EmissionSource> = {};

        // Map AI result to our fixed types
        const wasteTypeMap: Record<string, string> = {
            'MSW': 'MSW', 'Paper': 'Paper', 'Plastics': 'Plastics',
            'Food': 'Food', 'Metal': 'Metal', 'Hazardous': 'Hazardous'
        };

        if (aiAnalysisResult.waste_type && wasteTypeMap[aiAnalysisResult.waste_type]) {
            updates.wasteType = wasteTypeMap[aiAnalysisResult.waste_type] as WasteType;
        }

        // Fuzzy match treatment method
        if (aiAnalysisResult.treatment_method) {
            const targetType = updates.wasteType || source.wasteType || 'MSW';
            const availableTreatments = Object.keys(fuels.activity[targetType] || {});
            const match = availableTreatments.find(t => t.toLowerCase().includes(aiAnalysisResult.treatment_method.toLowerCase()));
            if (match) {
                updates.treatmentMethod = match as TreatmentMethod;
            } else if (availableTreatments.length > 0) {
                // Default to first available if no match found, or keep existing
            }
        }

        onUpdate(updates);
    };

    const activityTotalDisplay = () => {
        switch (calculationMethod) {
            case 'activity':
                return `${source.monthlyQuantities.reduce((a, b) => a + b, 0).toLocaleString()} ${t(source.unit as TranslationKey) || source.unit}`;
            case 'spend':
                return `${source.monthlyQuantities.reduce((a, b) => a + b, 0).toLocaleString()} ${source.unit}`;
            case 'supplier_specific':
                return `${(source.supplierProvidedCO2e || 0).toLocaleString()} kg CO₂e`;
            default:
                return '-';
        }
    };

    const preventNonNumericKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (['e', 'E', '+', '-'].includes(e.key)) {
            e.preventDefault();
        }
    };

    // Determine transport fuels for the dropdown if transport is included
    const transportFuels: any = fuels.upstreamTransport && Object.keys(fuels.upstreamTransport).length > 0
        ? fuels.upstreamTransport
        : TRANSPORTATION_FACTORS_BY_MODE;

    return (
        <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600">
            {/* Compact View */}
            <div className="flex justify-between items-center">
                <div className='truncate pr-2'>
                    <p className="text-sm font-medium text-ghg-dark dark:text-gray-100 truncate">{source.description || t('scope3WastePlaceholder')}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('total')}: {activityTotalDisplay()} • <span className="font-semibold text-ghg-green">{(totalEmissions / 1000).toLocaleString('en-US', { minimumFractionDigits: 3 })} t CO₂e</span>
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
            {isExpanded && (
                <div className="flex flex-col gap-3 pt-3 border-t dark:border-gray-600">

                    {/* Category 5 Guidance Box */}
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-800 dark:bg-orange-900/30 dark:border-orange-700/50 dark:text-orange-200 text-xs space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2"><IconInfo className="w-4 h-4" /> {t('cat5GuidanceTitle')}</h4>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>{t('cat5GuidanceText')}</li>
                            <li dangerouslySetInnerHTML={{ __html: t('cat5BoundaryNote') }}></li>
                            <li dangerouslySetInnerHTML={{ __html: t('cat5CalculationMethods') }}></li>
                        </ul>
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200 text-xs">
                            <p dangerouslySetInnerHTML={{ __html: t('cat5EmissionFactorSource') }}></p>
                        </div>
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200">
                            <p className="flex items-start gap-2">
                                <IconInfo className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span dangerouslySetInnerHTML={{ __html: t('cat5Scope1Warning') }}></span>
                            </p>
                        </div>
                    </div>

                    {/* Description & AI */}
                    <div>
                        <label htmlFor={`description-${source.id}`} className={commonLabelClass}>{t('emissionSourceDescription')}</label>
                        <div className="flex gap-2">
                            <input
                                id={`description-${source.id}`}
                                type="text"
                                value={source.description}
                                onChange={(e) => onUpdate({ description: e.target.value })}
                                className={commonInputClass}
                                placeholder={t('scope3WastePlaceholder')}
                            />
                            <button onClick={handleAnalyze} disabled={isLoadingAI || !source.description} className="px-3 py-1 bg-ghg-light-green text-white rounded-md hover:bg-ghg-green disabled:bg-gray-400 flex items-center gap-2 text-sm whitespace-nowrap">
                                <IconSparkles className="w-4 h-4" />
                                <span>{isLoadingAI ? '...' : t('analyzeWithAI')}</span>
                            </button>
                        </div>
                    </div>

                    {/* AI Result Panel */}
                    {aiAnalysisResult && (
                        <div className={`p-3 border rounded-lg text-xs ${aiAnalysisResult.boundary_warning ? 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200' : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200'}`}>
                            {/* Boundary Warning Header */}
                            {aiAnalysisResult.boundary_warning && (
                                <div className="space-y-2 mb-2">
                                    <div className="flex items-center gap-2 font-bold text-yellow-700 dark:text-yellow-400">
                                        <IconAlertTriangle className="w-4 h-4" />
                                        {t('boundaryWarning')}: {aiAnalysisResult.boundary_warning}
                                    </div>
                                    {aiAnalysisResult.boundary_warning?.includes('Category 2') && (
                                        <p className="text-xs" dangerouslySetInnerHTML={{ __html: t('cat5Category2Warning') }}></p>
                                    )}
                                    {aiAnalysisResult.boundary_warning?.includes('Category 12') && (
                                        <p className="text-xs" dangerouslySetInnerHTML={{ __html: t('cat5Category12Warning') }}></p>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-1">
                                <p><span className="font-semibold">{t('suggestedWasteType')}:</span> {aiAnalysisResult.waste_type}</p>
                                <p><span className="font-semibold">{t('suggestedTreatmentMethod')}:</span> {aiAnalysisResult.treatment_method}</p>

                                {/* Hazardous Alert */}
                                {aiAnalysisResult.is_hazardous && (
                                    <p className="col-span-2 flex items-center gap-1 text-red-600 font-bold mt-1">
                                        <IconAlertTriangle className="w-3 h-3" /> {t('hazardousWasteDetected')}
                                    </p>
                                )}

                                <p className="col-span-2 mt-1 italic opacity-80">{aiAnalysisResult.reasoning}</p>
                            </div>

                            <div className="flex justify-end mt-2">
                                <button onClick={applyAiResult} className="px-2 py-1 bg-white dark:bg-gray-700 border rounded hover:bg-gray-100 dark:hover:bg-gray-600 font-semibold flex items-center gap-1">
                                    <IconCheck className="w-3 h-3" /> {t('applySuggestion')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Method Selector */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className={commonLabelClass}>{t('calculationMethod')}</label>
                            <button
                                onClick={() => setIsWizardOpen(true)}
                                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-800 transition-all hover:shadow-sm"
                            >
                                <span>📊</span>
                                {language === 'ko' ? '방법론 선택 가이드' : 'Methodology Guide'}
                            </button>
                        </div>
                        <div className="flex gap-1 rounded-md bg-gray-200 dark:bg-gray-900 p-1 text-xs">
                            {(['activity', 'average', 'spend', 'supplier_specific'] as Cat5CalculationMethod[]).map(method => (
                                <button
                                    key={method}
                                    onClick={() => handleMethodChange(method)}
                                    className={`flex-1 py-1 px-2 rounded-md transition-colors whitespace-nowrap ${calculationMethod === method ? 'bg-white dark:bg-gray-700 shadow font-semibold text-ghg-green' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                                >
                                    {t(`${method}Method` as TranslationKey)}
                                </button>
                            ))}
                        </div>
                        {/* Calculation Method Descriptions */}
                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                            {calculationMethod === 'activity' && <p dangerouslySetInnerHTML={{ __html: t('cat5MethodActivity') }}></p>}
                            {calculationMethod === 'average' && <p>{language === 'ko' ? '총 폐기물량에 국가 통계 기반 처리방식별 비율과 평균 배출계수를 적용합니다. 폐기물 종류/처리방법 구분이 어려울 때 사용합니다.' : 'Applies national statistics-based treatment ratios and average emission factors to total waste. Used when waste type/treatment distinction is difficult.'}</p>}
                            {calculationMethod === 'spend' && <p dangerouslySetInnerHTML={{ __html: t('cat5MethodSpend') }}></p>}
                            {calculationMethod === 'supplier_specific' && <p dangerouslySetInnerHTML={{ __html: t('cat5MethodSupplier') }}></p>}
                        </div>
                    </div>

                    {/* === ACTIVITY METHOD === */}
                    {calculationMethod === 'activity' && (
                        <>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className={commonLabelClass}>{t('wasteType')}</label>
                                    <select value={source.wasteType} onChange={e => onUpdate({ wasteType: e.target.value as WasteType, treatmentMethod: Object.keys(fuels.activity[e.target.value as WasteType] || {})[0] as TreatmentMethod })} className={commonSelectClass}>
                                        {Object.keys(fuels.activity).map(type => <option key={type} value={type}>{t(`waste${type}` as TranslationKey)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={commonLabelClass}>{t('treatmentMethod')}</label>
                                    <select value={source.treatmentMethod} onChange={e => onUpdate({ treatmentMethod: e.target.value as TreatmentMethod })} className={commonSelectClass}>
                                        {(() => {
                                            const type = source.wasteType;
                                            if (!type || !fuels.activity[type]) return null;
                                            return Object.keys(fuels.activity[type]).map(method => (
                                                <option key={method} value={method}>{t(fuels.activity[type][method]?.translationKey)}</option>
                                            ));
                                        })()}
                                    </select>
                                </div>
                            </div>

                            {/* Total Weight */}
                            <div>
                                <label className={commonLabelClass}>{t('totalYear')} ({t('tonnes')})</label>
                                <input
                                    type="number"
                                    value={source.monthlyQuantities.reduce((a, b) => a + b, 0) || ''}
                                    onChange={(e) => handleTotalChange(e.target.value)}
                                    onKeyDown={preventNonNumericKeys}
                                    className={commonInputClass}
                                    placeholder="0"
                                />
                            </div>

                            {/* Activity-based Calculation Details */}
                            <div className="p-2 bg-blue-50 border border-blue-200 rounded-md text-blue-800 dark:bg-blue-900/30 dark:border-blue-700/50 dark:text-blue-200 text-xs">
                                <p className="font-semibold mb-1" dangerouslySetInnerHTML={{ __html: t('cat5ActivityCalculation') }}></p>
                            </div>

                            {/* Transport Integration */}
                            <div className="p-3 border border-dashed border-gray-300 rounded-md dark:border-gray-600 bg-gray-50 dark:bg-gray-800/30">
                                <label className="flex items-center space-x-2 text-sm cursor-pointer mb-2">
                                    <input type="checkbox" checked={source.includeTransport || false} onChange={e => onUpdate({ includeTransport: e.target.checked })} className="rounded text-ghg-green focus:ring-ghg-green" />
                                    <span className="font-semibold text-ghg-dark dark:text-gray-200 flex items-center gap-1">
                                        <IconCar className="w-4 h-4" /> {t('includeTransportEmissions')}
                                    </span>
                                </label>

                                {source.includeTransport && (
                                    <div className="space-y-3 pl-2 border-l-2 border-gray-300 dark:border-gray-600 ml-1">
                                        <div className="p-2 bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200 text-xs rounded flex items-start gap-2">
                                            <IconInfo className="w-4 h-4 flex-shrink-0" />
                                            <span dangerouslySetInnerHTML={{ __html: t('cat5TransportWarning') }}></span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            <div>
                                                <label className={commonLabelClass}>{t('transportMode')}</label>
                                                <select value={source.transportMode || 'Road'} onChange={e => onUpdate({ transportMode: e.target.value as TransportMode, vehicleType: Object.keys(transportFuels[e.target.value] || {})[0] })} className={commonSelectClass}>
                                                    {Object.keys(transportFuels).map(mode => <option key={mode} value={mode}>{t(mode as TranslationKey)}</option>)}
                                                </select>
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className={commonLabelClass}>{t('vehicleType')}</label>
                                                <select value={source.vehicleType} onChange={e => onUpdate({ vehicleType: e.target.value })} className={commonSelectClass}>
                                                    {(() => {
                                                        const mode = source.transportMode;
                                                        if (!mode || !transportFuels[mode]) return null;
                                                        return Object.keys(transportFuels[mode]).map(vehicle => (
                                                            <option key={vehicle} value={vehicle}>{t(transportFuels[mode][vehicle]?.translationKey)}</option>
                                                        ));
                                                    })()}
                                                </select>
                                            </div>
                                            <div className="sm:col-span-3">
                                                <label className={commonLabelClass}>{t('oneWayDistance')}</label>
                                                <input type="number" value={source.distanceKm || ''} onChange={e => onUpdate({ distanceKm: parseFloat(e.target.value) })} className={commonInputClass} placeholder="km" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* === SPEND METHOD === */}
                    {calculationMethod === 'spend' && (
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className={commonLabelClass}>{t('serviceType')}</label>
                                <select value={source.fuelType} onChange={e => onFuelTypeChange(e.target.value)} className={commonSelectClass}>
                                    {fuels.spend && fuels.spend.map((f: any) => <option key={f.name} value={f.name}>{t(f.translationKey)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={commonLabelClass}>{t('dataType')}</label>
                                <select value={source.unit} onChange={e => onUpdate({ unit: e.target.value })} className={commonSelectClass}>
                                    <option value="USD">USD</option>
                                    <option value="KRW">KRW</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className={commonLabelClass}>{t('totalYear')}</label>
                                <input
                                    type="number"
                                    value={source.monthlyQuantities.reduce((a, b) => a + b, 0) || ''}
                                    onChange={(e) => handleTotalChange(e.target.value)}
                                    onKeyDown={preventNonNumericKeys}
                                    className={commonInputClass}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    )}

                    {/* === SUPPLIER SPECIFIC METHOD === */}
                    {calculationMethod === 'supplier_specific' && (
                        <div className="p-3 border rounded-md dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
                            <label className={commonLabelClass}>{t('supplierProvidedCO2e')}</label>
                            <input
                                type="number"
                                value={source.supplierProvidedCO2e || ''}
                                onChange={e => onUpdate({ supplierProvidedCO2e: parseFloat(e.target.value) })}
                                className={commonInputClass}
                                placeholder="0"
                            />
                            <p className="text-xs text-gray-500 mt-1">{t('supplierDataNote')}</p>
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200 text-xs">
                                <p className="flex items-start gap-2">
                                    <IconInfo className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span dangerouslySetInnerHTML={{ __html: t('cat5TransportWarning') }}></span>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* === AVERAGE METHOD === */}
                    {calculationMethod === 'average' && (
                        <div className="space-y-3">
                            {/* Total Waste Quantity */}
                            <div>
                                <label className={commonLabelClass}>
                                    {language === 'ko' ? '총 폐기물 배출량 (tonnes)' : 'Total Waste Quantity (tonnes)'}
                                </label>
                                <input
                                    type="number"
                                    value={source.monthlyQuantities.reduce((a, b) => a + b, 0) || ''}
                                    onChange={(e) => handleTotalChange(e.target.value)}
                                    onKeyDown={preventNonNumericKeys}
                                    className={commonInputClass}
                                    placeholder="0"
                                />
                            </div>

                            {/* Treatment Ratios */}
                            <div className="p-3 border rounded-md dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
                                <label className={`${commonLabelClass} mb-2`}>
                                    {language === 'ko' ? '처리방식별 비율 (%)' : 'Treatment Ratios (%)'}
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="text-xs text-gray-500">{t('landfill')}</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={(source.treatmentRatios?.landfill ?? DEFAULT_TREATMENT_RATIOS.default.landfill) * 100}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) / 100;
                                                onUpdate({
                                                    treatmentRatios: {
                                                        ...source.treatmentRatios ?? DEFAULT_TREATMENT_RATIOS.default,
                                                        landfill: val
                                                    }
                                                });
                                            }}
                                            className={commonInputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">{t('incineration')}</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={(source.treatmentRatios?.incineration ?? DEFAULT_TREATMENT_RATIOS.default.incineration) * 100}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) / 100;
                                                onUpdate({
                                                    treatmentRatios: {
                                                        ...source.treatmentRatios ?? DEFAULT_TREATMENT_RATIOS.default,
                                                        incineration: val
                                                    }
                                                });
                                            }}
                                            className={commonInputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">{t('recycling')}</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={(source.treatmentRatios?.recycling ?? DEFAULT_TREATMENT_RATIOS.default.recycling) * 100}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) / 100;
                                                onUpdate({
                                                    treatmentRatios: {
                                                        ...source.treatmentRatios ?? DEFAULT_TREATMENT_RATIOS.default,
                                                        recycling: val
                                                    }
                                                });
                                            }}
                                            className={commonInputClass}
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    {language === 'ko'
                                        ? '※ 기본값: 전국 폐기물 발생 및 처리 현황 통계 기준 (사업장폐기물)'
                                        : '※ Defaults based on national waste statistics (industrial waste)'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* DQI Section */}
                    <DQISection
                        dataQualityIndicator={source.dataQualityIndicator}
                        language={language}
                        onUpdate={handleDQIUpdate}
                    />
                </div>
            )}

            {/* Methodology Wizard */}
            <MethodologyWizard
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                onSelectMethod={(method) => handleMethodChange(method as Cat5CalculationMethod)}
                category={EmissionCategory.WasteGeneratedInOperations}
            />
        </div>
    );
};
