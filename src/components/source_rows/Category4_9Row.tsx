
import React, { useState, useEffect } from 'react';
import { EmissionSource, Cat4CalculationMethod, TransportMode, CO2eFactorFuel, EmissionCategory } from '../../types';
import { useTranslation } from '../../context/LanguageContext';
// FIX: Changed import path to be more explicit.
import { TranslationKey } from '../../translations/index';
import { IconTrash, IconSparkles, IconCheck, IconX, IconInfo } from '../IconComponents';
import { GoogleGenAI, Type } from '@google/genai';
import { MOBILE_FUELS, TRANSPORTATION_SPEND_FACTORS } from '../../constants/index';

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

    const totalEmissions = calculateEmissions(source).scope3;
    const commonSelectClass = "w-full bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
    const commonInputClass = "w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
    const commonLabelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

    // Logic to handle downstream warehousing which is Cat 4 compatible
    const isWarehousing = source.downstreamActivityType === 'warehousing';

    // Determine active method. Default to 'activity' unless explicit or warehousing.
    const activeMethod = isWarehousing ? 'warehousing' : (source.calculationMethod as Cat4CalculationMethod || 'activity');

    const handleMethodChange = (method: string) => {
        if (method === 'warehousing') {
            onUpdate({
                downstreamActivityType: 'warehousing',
                calculationMethod: 'spend',
                fuelType: TRANSPORTATION_SPEND_FACTORS[1]?.name || '', // Default to warehousing spend
                unit: 'USD'
            });
        } else {
            onUpdate({
                downstreamActivityType: 'transportation',
                calculationMethod: method as Cat4CalculationMethod,
                // Reset units based on method
                unit: method === 'activity' ? 'tonne-km' : method === 'spend' ? 'USD' : method === 'fuel' ? 'liters' : 'kg CO₂e'
            });
        }
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
            const promptText = `As a GHG Protocol Scope 3 expert, analyze this logistics description: "${source.description}". 
            Extract the Origin, Destination, likely Transport Mode (Road, Sea, Air, Rail), and Vehicle Type.
            Estimate the distance between origin and destination in km using your knowledge of geography.
            Check if the description implies company-owned vehicles (e.g., "our fleet", "company truck") which would be Scope 1, not Scope 3.
            Provide a structured JSON response.
            
            IMPORTANT: Respond in ${language === 'ko' ? 'Korean' : 'English'}.`;

            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    origin: { type: Type.STRING },
                    destination: { type: Type.STRING },
                    estimated_distance_km: { type: Type.NUMBER },
                    suggested_mode: { type: Type.STRING, description: 'Road, Sea, Air, or Rail' },
                    suggested_vehicle: { type: Type.STRING },
                    weight_tonnes: { type: Type.NUMBER, nullable: true },
                    scope_1_warning: { type: Type.BOOLEAN, description: "True if it sounds like Scope 1 (owned assets)." },
                    justification: { type: Type.STRING },
                }
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: promptText,
                config: {
                    responseMimeType: "application/json",
                    responseSchema,
                    // tools: [{ googleMaps: {} }] // Enable Maps grounding for distance - Temporarily disabled due to type error
                },
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
        if (aiAnalysisResult.weight_tonnes) updates.weightTonnes = aiAnalysisResult.weightTonnes;
        if (aiAnalysisResult.suggested_mode && ['Road', 'Sea', 'Air', 'Rail'].includes(aiAnalysisResult.suggested_mode)) {
            updates.transportMode = aiAnalysisResult.suggested_mode as TransportMode;
            // Try to match vehicle
            const vehicles = Object.keys(fuels[aiAnalysisResult.suggested_mode] || {});
            if (vehicles.length > 0) {
                // Simple fuzzy match or default to first
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
                        <div className={`p-3 border rounded-lg text-xs ${aiAnalysisResult.scope_1_warning ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200' : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200'}`}>
                            {aiAnalysisResult.scope_1_warning && (
                                <div className="flex items-center gap-2 font-bold mb-2">
                                    <IconX className="w-4 h-4" /> {t('scope1OverlapWarning')}
                                </div>
                            )}
                            {aiAnalysisResult.scope_1_warning && <p className="mb-2">{t('scope1OverlapText')}</p>}

                            <div className="grid grid-cols-2 gap-1">
                                <p><span className="font-semibold">{t('origin')}:</span> {aiAnalysisResult.origin}</p>
                                <p><span className="font-semibold">{t('destination')}:</span> {aiAnalysisResult.destination}</p>
                                <p><span className="font-semibold">{t('estimatedDistance')}:</span> {aiAnalysisResult.estimated_distance_km} km</p>
                                <p><span className="font-semibold">{t('suggestedTransportMode')}:</span> {aiAnalysisResult.suggested_mode}</p>
                            </div>
                            <div className="flex justify-end mt-2">
                                <button onClick={applyAiResult} className="px-2 py-1 bg-white dark:bg-gray-700 border rounded hover:bg-gray-100 dark:hover:bg-gray-600 font-semibold flex items-center gap-1">
                                    <IconCheck className="w-3 h-3" /> {t('applySuggestion')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Method Selector Segmented Control */}
                    <div>
                        <label className={commonLabelClass}>{t('calculationMethod')}</label>
                        <div className="flex gap-1 rounded-md bg-gray-200 dark:bg-gray-900 p-1 text-xs overflow-x-auto">
                            {(['activity', 'fuel', 'spend', 'supplier_specific', 'warehousing']).map(method => (
                                <button
                                    key={method}
                                    onClick={() => handleMethodChange(method)}
                                    className={`flex-1 py-1 px-2 rounded-md transition-colors whitespace-nowrap ${activeMethod === method ? 'bg-white dark:bg-gray-700 shadow font-semibold text-ghg-green' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                                >
                                    {t(method === 'warehousing' ? 'warehousing' : `${method}Method` as TranslationKey)}
                                </button>
                            ))}
                        </div>
                        {/* Calculation Method Descriptions */}
                        {source.category === EmissionCategory.UpstreamTransportationAndDistribution && (
                            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                {activeMethod === 'activity' && <p dangerouslySetInnerHTML={{ __html: t('cat4MethodActivity') }}></p>}
                                {activeMethod === 'fuel' && <p dangerouslySetInnerHTML={{ __html: t('cat4MethodFuel') }}></p>}
                                {activeMethod === 'spend' && <p dangerouslySetInnerHTML={{ __html: t('cat4MethodSpend') }}></p>}
                                {activeMethod === 'supplier_specific' && <p dangerouslySetInnerHTML={{ __html: t('cat4MethodSupplier') }}></p>}
                            </div>
                        )}
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

                    {/* === METHOD: SUPPLIER SPECIFIC === */}
                    {activeMethod === 'supplier_specific' && (
                        <div className="p-2 border rounded-md dark:border-gray-600">
                            <label className={commonLabelClass}>{t('supplierProvidedCO2e')}</label>
                            <input
                                type="number"
                                value={source.supplierProvidedCO2e || ''}
                                onChange={e => onUpdate({ supplierProvidedCO2e: parseFloat(e.target.value) })}
                                className={commonInputClass}
                                placeholder="0"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
