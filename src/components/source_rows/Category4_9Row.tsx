
import React, { useState, useEffect } from 'react';
import { EmissionSource, Cat4CalculationMethod, TransportMode, CO2eFactorFuel, EmissionCategory } from '../../types';
import { useTranslation } from '../../context/LanguageContext';
// FIX: Changed import path to be more explicit.
import { TranslationKey } from '../../translations/index';
import { IconTrash, IconSparkles, IconCheck, IconX, IconInfo } from '../IconComponents';
import { GoogleGenAI, Type } from '@google/genai';
import { MOBILE_FUELS, TRANSPORTATION_SPEND_FACTORS } from '../../constants/index';
import { MethodologyWizard } from '../MethodologyWizard';
import { calculateDQIScore, getDQIRating, DataQualityIndicator } from '../../types';
import { DQISection } from '../DQISection';
import { getDQIColor, getDQIBgColor } from '../../utils/dqiUtils';

interface SourceInputRowProps {
    source: EmissionSource;
    onUpdate: (updatedSource: Partial<EmissionSource>) => void;
    onRemove: () => void;
    onFuelTypeChange: (newFuelType: string) => void;
    fuels: any;
    facilities: any[];
    calculateEmissions: (source: EmissionSource) => { scope1: number, scope2Location: number, scope2Market: number, scope3: number };
}

export const Category4_9Row: React.FC<SourceInputRowProps> = ({ source, onUpdate, onRemove, onFuelTypeChange, fuels, calculateEmissions }) => {
    const { t, language } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
    const [showMethodologyWizard, setShowMethodologyWizard] = useState(false);

    const totalEmissions = calculateEmissions(source).scope3;
    const commonSelectClass = "w-full bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
    const commonInputClass = "w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
    const commonLabelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

    // Logic to handle downstream warehousing which is Cat 4 compatible
    const isWarehousing = source.downstreamActivityType === 'warehousing';

    // Determine active method. Default to 'activity' unless explicit or warehousing.
    const activeMethod = isWarehousing ? 'warehousing' : (source.calculationMethod as Cat4CalculationMethod || 'activity');

    const handleActivityTypeChange = (type: 'transportation' | 'warehousing') => {
        if (type === 'transportation') {
            onUpdate({
                downstreamActivityType: 'transportation',
                calculationMethod: 'activity',
                unit: 'tonne-km'
            });
        } else {
            onUpdate({
                downstreamActivityType: 'warehousing',
                calculationMethod: 'average',
                unit: 'tonne-days', // or USD as default
                fuelType: TRANSPORTATION_SPEND_FACTORS[1]?.name || ''
            });
        }
    };

    const handleMethodChange = (method: string) => {
        onUpdate({
            calculationMethod: method as Cat4CalculationMethod,
            // Reset units based on method
            unit: method === 'activity' ? 'tonne-km' : method === 'spend' ? 'USD' : method === 'fuel' ? 'liters' : method === 'average' ? 'tonne-days' : 'kg CO₂e'
        });
    };

    const dqiScore = calculateDQIScore(source.dataQualityIndicator || {
        technologicalRep: 3,
        temporalRep: 3,
        geographicalRep: 3,
        completeness: 3,
        reliability: 3,
    });
    const dqiRating = getDQIRating(dqiScore);

    const displayTotalQuantity = source.monthlyQuantities.reduce((a, b) => a + b, 0);
    const renderUnit = (u: string) => u;

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
            const promptText = `As a GHG Protocol expert for Scope 3, Category ${source.category === EmissionCategory.UpstreamTransportationAndDistribution ? '4 (Upstream Transport)' : '9 (Downstream Transport)'}, analyze this logistics description: "${source.description}". 
            
            1. Extract Trip Details: Origin, Destination, likely Transport Mode (Road, Sea, Air, Rail), and Vehicle Type.
            2. Estimate Distance: kg, km, and total kg-km/tonne-km using geography/geopolitics if specific locations are mentioned.
            3. Boundary Check (CRITICAL):
               - If transport costs are likely included in the product price (CIF), it belongs in Category 1, not Category 4. Flag as 'Category 1 overlap'.
               - If it implies company-owned vehicles (e.g., "our fleet"), it's Scope 1.
            
            Return structured JSON.
            
            IMPORTANT: Respond in ${language === 'ko' ? 'Korean' : 'English'}.`;

            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    origin: { type: Type.STRING },
                    destination: { type: Type.STRING },
                    estimated_distance_km: { type: Type.NUMBER },
                    suggested_mode: { type: Type.STRING, description: 'Road, Sea, Air, or Rail' },
                    suggested_vehicle: { type: Type.STRING },
                    suggested_method: { type: Type.STRING, description: "'activity', 'fuel', or 'spend'" },
                    justification: { type: Type.STRING },
                    boundary_warning: { type: Type.STRING, description: "'Scope 1', 'Category 1 overlap', or null" },
                }
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
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

        if (aiAnalysisResult.origin) updates.origin = aiAnalysisResult.origin;
        if (aiAnalysisResult.destination) updates.destination = aiAnalysisResult.destination;
        if (aiAnalysisResult.estimated_distance_km) updates.distanceKm = aiAnalysisResult.estimated_distance_km;

        if (aiAnalysisResult.suggested_method) {
            updates.calculationMethod = aiAnalysisResult.suggested_method as Cat4CalculationMethod;
        }

        if (aiAnalysisResult.suggested_mode && ['Road', 'Sea', 'Air', 'Rail'].includes(aiAnalysisResult.suggested_mode)) {
            updates.transportMode = aiAnalysisResult.suggested_mode as TransportMode;
            const vehicles = Object.keys(fuels[aiAnalysisResult.suggested_mode] || {});
            if (vehicles.length > 0) {
                updates.vehicleType = vehicles[0];
            }
        }
        onUpdate(updates);
    };

    const activityTotalDisplay = () => {
        if (isWarehousing) {
            return `${source.monthlyQuantities.reduce((a, b) => a + b, 0).toLocaleString()} ${source.unit}`;
        }
        switch (activeMethod) {
            case 'activity':
                return `${(source.distanceKm || 0).toLocaleString()} km, ${(source.weightTonnes || 0).toLocaleString()} t`;
            case 'fuel':
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

    return (
        <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600">
            {/* Compact View */}
            <div className="flex justify-between items-center">
                <div className='truncate pr-2'>
                    <p className="text-sm font-medium text-ghg-dark dark:text-gray-100 truncate">
                        {source.description || (isWarehousing ? t('warehousing') : t('upstreamTransportPlaceholder'))}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('total')}: {activityTotalDisplay()} • <span className="font-semibold text-ghg-green">{(totalEmissions / 1000).toLocaleString('en-US', { minimumFractionDigits: 3 })} t CO₂e</span>
                        {source.dataQualityIndicator && (
                            <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${getDQIBgColor(dqiScore)} ${getDQIColor(dqiScore)}`}>
                                DQI: {dqiScore.toFixed(1)}
                            </span>
                        )}
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

                    {/* Category 4 Guidance Box */}
                    {source.category === EmissionCategory.UpstreamTransportationAndDistribution && (
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-800 dark:bg-purple-900/30 dark:border-purple-700/50 dark:text-purple-200 text-xs space-y-2">
                            <h4 className="font-semibold text-sm flex items-center gap-2"><IconInfo className="w-4 h-4" /> {t('cat4GuidanceTitle')}</h4>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>{t('cat4GuidanceText')}</li>
                                <li dangerouslySetInnerHTML={{ __html: t('cat4BoundaryNote') }}></li>
                                <li dangerouslySetInnerHTML={{ __html: t('cat4CalculationMethods') }}></li>
                            </ul>
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200">
                                <p className="flex items-start gap-2">
                                    <IconInfo className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span dangerouslySetInnerHTML={{ __html: t('cat4Category1Warning') }}></span>
                                </p>
                                <div className="mt-2 text-xs" dangerouslySetInnerHTML={{ __html: t('cat4InvoiceChecklist') }}></div>
                            </div>
                        </div>
                    )}

                    {/* Category 9 Guidance Box */}
                    {source.category === EmissionCategory.DownstreamTransportationAndDistribution && (
                        <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg text-pink-800 dark:bg-pink-900/30 dark:border-pink-700/50 dark:text-pink-200 text-xs space-y-2">
                            <h4 className="font-semibold text-sm flex items-center gap-2"><IconInfo className="w-4 h-4" /> {t('cat9GuidanceTitle')}</h4>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>{t('cat9GuidanceText')}</li>
                                <li dangerouslySetInnerHTML={{ __html: t('cat9BoundaryNote') }}></li>
                                <li dangerouslySetInnerHTML={{ __html: t('cat9CalculationMethods') }}></li>
                            </ul>
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200">
                                <p className="flex items-start gap-2 mb-1">
                                    <IconInfo className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span dangerouslySetInnerHTML={{ __html: t('cat9Scope1Warning') }}></span>
                                </p>
                                <p className="flex items-start gap-2 mb-1">
                                    <IconInfo className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span dangerouslySetInnerHTML={{ __html: t('cat9Category4Warning') }}></span>
                                </p>
                                <p className="flex items-start gap-2">
                                    <IconInfo className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span dangerouslySetInnerHTML={{ __html: t('cat9IncotermsWarning') }}></span>
                                </p>
                            </div>
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200">
                                <p className="text-xs" dangerouslySetInnerHTML={{ __html: t('cat9IncotermsNote') }}></p>
                            </div>
                        </div>
                    )}

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
                                placeholder={t('upstreamTransportPlaceholder')}
                            />
                            <button onClick={handleAnalyze} disabled={isLoadingAI || !source.description} className="px-3 py-1 bg-ghg-light-green text-white rounded-md hover:bg-ghg-green disabled:bg-gray-400 flex items-center gap-2 text-sm whitespace-nowrap">
                                <IconSparkles className="w-4 h-4" />
                                <span>{isLoadingAI ? '...' : t('analyzeWithAI')}</span>
                            </button>
                        </div>
                    </div>

                    {/* AI Result Panel */}
                    {aiAnalysisResult && (
                        <div className={`p-3 border rounded-lg shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 ${aiAnalysisResult.boundary_warning ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:border-amber-800' : 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800'}`}>
                            {aiAnalysisResult.boundary_warning && (
                                <div className="space-y-2 mb-2">
                                    <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400 text-xs">
                                        <IconInfo className="w-4 h-4 text-amber-500" />
                                        {t('boundaryWarning') || 'Boundary Warning'}: {aiAnalysisResult.boundary_warning}
                                    </div>
                                    {aiAnalysisResult.boundary_warning?.includes('Category 1 overlap') && (
                                        <p className="text-[10px] opacity-80" dangerouslySetInnerHTML={{ __html: t('cat4Category1Warning') }}></p>
                                    )}
                                    {aiAnalysisResult.boundary_warning?.includes('Scope 1') && (
                                        <p className="text-[10px] opacity-80">{t('scope1OverlapText') || 'This activity might belong to your company-owned fleet (Scope 1).'}</p>
                                    )}
                                </div>
                            )}

                            <h4 className="font-bold text-xs mb-2 flex items-center gap-1.5">✨ {t('aiAnalysis')}</h4>
                            <div className="space-y-1.5 opacity-90 text-[11px] leading-relaxed">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 py-1 border-y border-black/5 dark:border-white/5 my-1">
                                    <p><span className="font-bold text-gray-600 dark:text-gray-400">{t('origin')}:</span> {aiAnalysisResult.origin}</p>
                                    <p><span className="font-bold text-gray-600 dark:text-gray-400">{t('destination')}:</span> {aiAnalysisResult.destination}</p>
                                    <p><span className="font-bold text-gray-600 dark:text-gray-400">{t('estimatedDistance')}:</span> {aiAnalysisResult.estimated_distance_km} km</p>
                                    <p><span className="font-bold text-gray-600 dark:text-gray-400">{t('suggestedTransportMode')}:</span> {aiAnalysisResult.suggested_mode}</p>
                                </div>
                                <p><span className="font-bold text-gray-600 dark:text-gray-400">{t('justification')}:</span> {aiAnalysisResult.justification}</p>
                            </div>

                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-black/5 dark:border-white/5">
                                <p className="text-[10px] text-gray-500 italic">{t('aiDisclaimer')}</p>
                                <button onClick={applyAiResult} className="px-3 py-1 text-[11px] font-bold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:border-ghg-green hover:text-ghg-green dark:hover:text-emerald-400 shadow-sm transition-all active:scale-95 flex items-center gap-1.5">
                                    <IconCheck className="w-3.5 h-3.5" />
                                    {t('applySuggestion')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Activity Type Selector (Transport vs Distribution) */}
                    <div className="space-y-2">
                        <label className={commonLabelClass}>{t('activityType') || 'Activity Type'}</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleActivityTypeChange('transportation')}
                                className={`flex-1 py-2 px-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${!isWarehousing ? 'border-ghg-green bg-emerald-50 text-ghg-green dark:bg-emerald-900/30 font-bold' : 'border-gray-200 bg-white text-gray-400 dark:bg-gray-800 dark:border-gray-700'}`}
                            >
                                <span className="text-lg">🚚</span>
                                <span className="text-xs">{t('transportation') || 'Transportation'}</span>
                            </button>
                            <button
                                onClick={() => handleActivityTypeChange('warehousing')}
                                className={`flex-1 py-2 px-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${isWarehousing ? 'border-ghg-green bg-emerald-50 text-ghg-green dark:bg-emerald-900/30 font-bold' : 'border-gray-200 bg-white text-gray-400 dark:bg-gray-800 dark:border-gray-700'}`}
                            >
                                <span className="text-lg">🏢</span>
                                <span className="text-xs">{t('distribution') || 'Distribution'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Method Selector Segmented Control */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className={commonLabelClass}>{t('calculationMethod')}</label>
                            <button
                                onClick={() => setShowMethodologyWizard(true)}
                                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-800 transition-all hover:shadow-sm"
                            >
                                <span>📊</span>
                                {language === 'ko' ? '방법론 선택 가이드' : 'Methodology Guide'}
                            </button>
                        </div>
                        <div className="flex gap-1 rounded-md bg-gray-200 dark:bg-gray-900 p-1 text-xs overflow-x-auto">
                            {(isWarehousing ? ['site_specific', 'average'] : ['fuel', 'activity', 'spend']).map(method => (
                                <button
                                    key={method}
                                    onClick={() => handleMethodChange(method)}
                                    className={`flex-1 py-1 px-2 rounded-md transition-colors whitespace-nowrap ${activeMethod === method ? 'bg-white dark:bg-gray-700 shadow font-semibold text-ghg-green' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                                >
                                    {method === 'site_specific' ? (language === 'ko' ? '장소 기반 산정법' : 'Site-specific Method') :
                                        method === 'average' ? (language === 'ko' ? '평균 산정법' : 'Average-data Method') :
                                            method === 'fuel' ? (language === 'ko' ? '연료 기반 산정법' : 'Fuel-based Method') :
                                                method === 'activity' ? (language === 'ko' ? '거리 기반 산정법' : 'Distance-based Method') :
                                                    method === 'spend' ? (language === 'ko' ? '지출 기반 산정법' : 'Spend-based Method') :
                                                        t(`${method}Method` as TranslationKey)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* === METHOD: ACTIVITY (Distance * Weight) === */}
                    {activeMethod === 'activity' && (
                        <>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className={commonLabelClass}>{t('origin')}</label>
                                    <input type="text" value={source.origin || ''} onChange={e => onUpdate({ origin: e.target.value })} className={commonInputClass} placeholder="City, Country" />
                                </div>
                                <div>
                                    <label className={commonLabelClass}>{t('destination')}</label>
                                    <input type="text" value={source.destination || ''} onChange={e => onUpdate({ destination: e.target.value })} className={commonInputClass} placeholder="City, Country" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 p-2 border rounded-md dark:border-gray-600 bg-white dark:bg-gray-800/50">
                                <div>
                                    <label className={commonLabelClass}>{t('transportMode')}</label>
                                    <select value={source.transportMode} onChange={e => onUpdate({ transportMode: e.target.value as TransportMode, vehicleType: Object.keys(fuels[e.target.value])[0] })} className={commonSelectClass}>
                                        {Object.keys(fuels).map(mode => <option key={mode} value={mode}>{t(mode as TranslationKey)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={commonLabelClass}>{t('vehicleType')}</label>
                                    <select value={source.vehicleType} onChange={e => onUpdate({ vehicleType: e.target.value })} className={commonSelectClass}>
                                        {(() => {
                                            const mode = source.transportMode;
                                            if (!mode || !fuels[mode]) return null;
                                            return Object.keys(fuels[mode]).map(vehicle => (
                                                <option key={vehicle} value={vehicle}>{t(fuels[mode][vehicle]?.translationKey)}</option>
                                            ));
                                        })()}
                                    </select>
                                </div>
                                <div>
                                    <label className={commonLabelClass}>{t('distance')} (km)</label>
                                    <input type="number" value={source.distanceKm || ''} onChange={e => onUpdate({ distanceKm: parseFloat(e.target.value) })} className={commonInputClass} />
                                </div>
                                <div>
                                    <label className={commonLabelClass}>{t('weight')} (tonnes)</label>
                                    <input type="number" value={source.weightTonnes || ''} onChange={e => onUpdate({ weightTonnes: parseFloat(e.target.value) })} className={commonInputClass} />
                                </div>
                            </div>

                            {/* Activity-based Calculation Details */}
                            {source.category === EmissionCategory.UpstreamTransportationAndDistribution && (
                                <div className="p-2 bg-blue-50 border border-blue-200 rounded-md text-blue-800 dark:bg-blue-900/30 dark:border-blue-700/50 dark:text-blue-200 text-xs">
                                    <p className="font-semibold mb-1" dangerouslySetInnerHTML={{ __html: t('cat4ActivityCalculation') }}></p>
                                </div>
                            )}
                            {source.category === EmissionCategory.DownstreamTransportationAndDistribution && (
                                <div className="p-2 bg-blue-50 border border-blue-200 rounded-md text-blue-800 dark:bg-blue-900/30 dark:border-blue-700/50 dark:text-blue-200 text-xs">
                                    <p className="font-semibold mb-1" dangerouslySetInnerHTML={{ __html: t('cat9MethodActivity') }}></p>
                                </div>
                            )}

                            {/* Advanced Adjustment Factors */}
                            <div className="p-2 border rounded-md dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
                                <p className="text-xs font-semibold mb-2 text-gray-600 dark:text-gray-300">{t('adjustmentFactors')}</p>
                                <div className="flex flex-wrap gap-4">
                                    <label className="flex items-center space-x-2 text-xs cursor-pointer">
                                        <input type="checkbox" checked={source.refrigerated || false} onChange={e => onUpdate({ refrigerated: e.target.checked })} className="rounded text-ghg-green focus:ring-ghg-green" />
                                        <span>{t('refrigeratedTransport')} (x1.2)</span>
                                    </label>
                                    <label className="flex items-center space-x-2 text-xs cursor-pointer">
                                        <input type="checkbox" checked={source.emptyBackhaul || false} onChange={e => onUpdate({ emptyBackhaul: e.target.checked })} className="rounded text-ghg-green focus:ring-ghg-green" />
                                        <span>{t('emptyBackhaul')}</span>
                                    </label>
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <span className="text-xs">{t('loadFactor')}:</span>
                                        <input type="range" min="0" max="100" value={source.loadFactor || 100} onChange={e => onUpdate({ loadFactor: parseInt(e.target.value) })} className="w-24 accent-ghg-green" />
                                        <span className="text-xs w-8">{source.loadFactor || 100}%</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* === METHOD: FUEL === */}
                    {activeMethod === 'fuel' && (
                        <div className="p-2 border rounded-md dark:border-gray-600">
                            <label className={commonLabelClass}>{t('cat4FuelType')}</label>
                            <select value={source.fuelType} onChange={e => onFuelTypeChange(e.target.value)} className={commonSelectClass}>
                                {MOBILE_FUELS.map(f => <option key={f.name} value={f.name}>{t(f.translationKey as TranslationKey)}</option>)}
                            </select>
                            <div className="mt-2">
                                <label className={commonLabelClass}>{t('totalYear')} ({t('liters')})</label>
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

                    {/* === METHOD: SPEND & WAREHOUSING === */}
                    {(activeMethod === 'spend' || activeMethod === 'warehousing') && (
                        <div className="p-2 border rounded-md dark:border-gray-600">
                            <label className={commonLabelClass}>{t('cat4ServiceType')}</label>
                            <select value={source.fuelType} onChange={e => onFuelTypeChange(e.target.value)} className={commonSelectClass}>
                                {TRANSPORTATION_SPEND_FACTORS.map(f => <option key={f.name} value={f.name}>{t(f.translationKey as TranslationKey)}</option>)}
                            </select>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <div>
                                    <label className={commonLabelClass}>{t('dataType')}</label>
                                    <select value={source.unit} onChange={e => onUpdate({ unit: e.target.value })} className={commonSelectClass}>
                                        <option value="USD">USD</option>
                                        <option value="KRW">KRW</option>
                                    </select>
                                </div>
                                <div>
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
                        </div>
                    )}

                    {/* === METHOD: SITE SPECIFIC (Distribution) === */}
                    {isWarehousing && activeMethod === 'site_specific' && (
                        <div className="space-y-3">
                            <div className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
                                <label className={commonLabelClass}>{t('energyInputs') || 'Energy Inputs for Facility'}</label>
                                {(source.energyInputs || []).map((input, idx) => (
                                    <div key={input.id} className="grid grid-cols-3 gap-2 mb-2">
                                        <select
                                            value={input.type}
                                            onChange={e => {
                                                const newInputs = [...(source.energyInputs || [])];
                                                newInputs[idx].type = e.target.value;
                                                onUpdate({ energyInputs: newInputs });
                                            }}
                                            className={commonSelectClass}
                                        >
                                            <option value="Grid Electricity">{t('electricity')}</option>
                                            <option value="Natural Gas">{t('naturalGas')}</option>
                                            <option value="Diesel">{t('diesel')}</option>
                                        </select>
                                        <input
                                            type="number"
                                            value={input.value || ''}
                                            onChange={e => {
                                                const newInputs = [...(source.energyInputs || [])];
                                                newInputs[idx].value = parseFloat(e.target.value);
                                                onUpdate({ energyInputs: newInputs });
                                            }}
                                            className={commonInputClass}
                                            placeholder="0"
                                        />
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs text-gray-500">{input.unit}</span>
                                            <button onClick={() => {
                                                const newInputs = source.energyInputs?.filter((_, i) => i !== idx);
                                                onUpdate({ energyInputs: newInputs });
                                            }} className="text-red-500 hover:text-red-700"><IconX className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={() => {
                                        const newInputs = [...(source.energyInputs || []), { id: Math.random().toString(), type: 'Grid Electricity', value: 0, unit: 'kWh' }];
                                        onUpdate({ energyInputs: newInputs });
                                    }}
                                    className="w-full py-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-500 hover:border-ghg-green hover:text-ghg-green transition-all"
                                >
                                    + {t('addEnergyInput') || 'Add Energy Input'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* === METHOD: AVERAGE (Distribution) === */}
                    {isWarehousing && activeMethod === 'average' && (
                        <div className="p-2 border rounded-md dark:border-gray-600">
                            <label className={commonLabelClass}>{t('storageActivity') || 'Storage Activity Data'}</label>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <div>
                                    <label className={commonLabelClass}>{t('storageUnit') || 'Unit'}</label>
                                    <select value={source.unit} onChange={e => onUpdate({ unit: e.target.value })} className={commonSelectClass}>
                                        <option value="tonne-days">tonne-days</option>
                                        <option value="pallet-weeks">pallet-weeks</option>
                                        <option value="m2">m² (Area-based)</option>
                                    </select>
                                </div>
                                <div>
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
                        </div>
                    )}

                    <DQISection
                        dataQualityIndicator={source.dataQualityIndicator}
                        language={language}
                        onUpdate={(indicator, rating) => onUpdate({ dataQualityIndicator: indicator, dataQualityRating: rating })}
                    />
                </div>
            )}

            {showMethodologyWizard && (
                <MethodologyWizard
                    isOpen={showMethodologyWizard}
                    onClose={() => setShowMethodologyWizard(false)}
                    onSelectMethod={(method) => {
                        handleMethodChange(method);
                        setShowMethodologyWizard(false);
                    }}
                    category={source.category}
                    currentMethod={activeMethod as any}
                />
            )}
        </div>
    );
};
