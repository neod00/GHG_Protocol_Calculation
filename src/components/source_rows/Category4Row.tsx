
import React, { useState } from 'react';
import { EmissionSource, Cat4CalculationMethod, TransportMode, CO2eFactorFuel, EmissionCategory } from '../../types';
import { useTranslation } from '../../context/LanguageContext';
import { TranslationKey } from '../../translations/index';
import { IconTrash, IconSparkles, IconCheck, IconX, IconInfo, IconPlus } from '../IconComponents';
import { GoogleGenAI, Type } from '@google/genai';
import { MOBILE_FUELS, TRANSPORTATION_SPEND_FACTORS, CAT4_WAREHOUSE_FACTORS } from '../../constants/index';
import { MethodologyWizard } from '../MethodologyWizard';
import { CalculationMethod } from '../../types';

interface SourceInputRowProps {
    source: EmissionSource;
    onUpdate: (updatedSource: Partial<EmissionSource>) => void;
    onRemove: () => void;
    onFuelTypeChange: (newFuelType: string) => void;
    fuels: any;
    facilities: any[];
    calculateEmissions: (source: EmissionSource) => { scope1: number, scope2Location: number, scope2Market: number, scope3: number };
}

export const Category4Row: React.FC<SourceInputRowProps> = ({ source, onUpdate, onRemove, onFuelTypeChange, fuels, calculateEmissions }) => {
    const { t, language } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
    const [showMethodologyWizard, setShowMethodologyWizard] = useState(false);

    const emissions = calculateEmissions(source);
    const totalEmissions = emissions.scope3;

    const commonSelectClass = "w-full bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
    const commonInputClass = "w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
    const commonLabelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

    const activeMethod = source.calculationMethod as Cat4CalculationMethod || 'activity';

    // Grouping methods for the UI hierarchy
    const transportMethods: Cat4CalculationMethod[] = ['fuel', 'activity', 'spend', 'supplier_specific'];
    const distributionMethods: Cat4CalculationMethod[] = ['site_based', 'average_data'];

    // Determine current activity type group
    const currentActivityGroup = distributionMethods.includes(activeMethod) ? 'distribution' : 'transportation';

    const handleMethodChange = (method: Cat4CalculationMethod) => {
        const updates: Partial<EmissionSource> = { calculationMethod: method };

        // Default unit & nested data resets based on method
        if (method === 'activity') {
            updates.unit = 'tonne-km';
            updates.transportMode = 'Road';
        } else if (method === 'fuel') {
            updates.unit = 'liters';
            updates.fuelType = MOBILE_FUELS[0].name;
        } else if (method === 'spend') {
            updates.unit = 'USD';
            updates.fuelType = TRANSPORTATION_SPEND_FACTORS[0].name;
        } else if (method === 'supplier_specific') {
            updates.unit = 'kg CO2e';
        } else if (method === 'site_based') {
            updates.unit = 'kg CO2e';
            if (!source.energyInputs || source.energyInputs.length === 0) {
                updates.energyInputs = [{ id: '1', type: 'Grid Electricity', value: 0, unit: 'kWh' }];
            }
        } else if (method === 'average_data') {
            updates.unit = 'm3-day';
            updates.warehouseType = Object.keys(CAT4_WAREHOUSE_FACTORS)[0];
        }

        onUpdate(updates);
    };

    const handleActivityGroupChange = (group: 'transportation' | 'distribution') => {
        if (group === 'transportation') {
            handleMethodChange('activity');
        } else {
            handleMethodChange('average_data');
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
            const promptText = `As a GHG Protocol expert for Scope 3, Category 4 (Upstream Transportation and Distribution), analyze the following description: "${source.description}". 

            CRITICAL BOUNDARY CHECK:
            If the description implies transport using vehicles OWNED or OPERATED by the reporting company (e.g., "our delivery fleet", "company-owned truck"), the combustion emissions are Scope 1. Category 4 only includes upstream transportation services purchased by the company.

            Evaluate if this belongs to:
            1. 'transportation': Upstream transportation of goods.
            2. 'distribution': Storage/warehousing in third-party facilities.

            Suggest the best calculation method among: 'activity' (distance-based), 'fuel' (fuel-based), 'spend' (spend-based), 'site_based', or 'average_data'.

            Extract or estimate: Origin, Destination, estimated_distance_km, and weight_tonnes if applicable.

            Provide a structured JSON response.
            
            IMPORTANT: Respond in ${language === 'ko' ? 'Korean' : 'English'}.`;

            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    activity_group: { type: Type.STRING, description: "'transportation' or 'distribution'" },
                    suggested_method: { type: Type.STRING, description: "One of: 'activity', 'fuel', 'spend', 'site_based', 'average_data'" },
                    origin: { type: Type.STRING },
                    destination: { type: Type.STRING },
                    estimated_distance_km: { type: Type.NUMBER },
                    weight_tonnes: { type: Type.NUMBER, nullable: true },
                    justification: { type: Type.STRING, description: "Detailed reason for your categorization and method choice." },
                    boundary_warning: { type: Type.STRING, description: "'Scope 1' if owned assets are implied, otherwise null." },
                }
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: promptText,
                config: {
                    responseMimeType: "application/json",
                    responseSchema,
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

        if (aiAnalysisResult.activity_group) {
            const group = aiAnalysisResult.activity_group as 'transportation' | 'distribution';
            // handleActivityGroupChange updates the actual calculation method
            if (group === 'distribution') {
                updates.calculationMethod = aiAnalysisResult.suggested_method || 'average_data';
            } else {
                updates.calculationMethod = aiAnalysisResult.suggested_method || 'activity';
            }
        }

        if (aiAnalysisResult.origin) updates.origin = aiAnalysisResult.origin;
        if (aiAnalysisResult.destination) updates.destination = aiAnalysisResult.destination;
        if (aiAnalysisResult.estimated_distance_km) updates.distanceKm = aiAnalysisResult.estimated_distance_km;
        if (aiAnalysisResult.weight_tonnes) updates.weightTonnes = aiAnalysisResult.weight_tonnes;

        onUpdate(updates);
    };

    const activityTotalDisplay = () => {
        const total = source.monthlyQuantities.reduce((a, b) => a + b, 0);
        switch (activeMethod) {
            case 'activity':
                return `${(source.distanceKm || 0).toLocaleString()} km × ${(source.weightTonnes || 0).toLocaleString()} t`;
            case 'fuel':
            case 'spend':
                return `${total.toLocaleString()} ${source.unit}`;
            case 'supplier_specific':
            case 'site_based':
                return `${(source.supplierProvidedCO2e || 0).toLocaleString()} kg CO₂e`;
            case 'average_data':
                return `${total.toLocaleString()} m³-day`;
            default:
                return '-';
        }
    };

    const preventNonNumericKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (['e', 'E', '+', '-'].includes(e.key)) {
            e.preventDefault();
        }
    };

    const addEnergyInput = () => {
        const inputs = source.energyInputs || [];
        const newInputs = [...inputs, { id: Date.now().toString(), type: 'Grid Electricity', value: 0, unit: 'kWh' }];
        onUpdate({ energyInputs: newInputs });
    };

    const updateEnergyInput = (id: string, field: string, value: any) => {
        const inputs = (source.energyInputs || []).map(input =>
            input.id === id ? { ...input, [field]: value } : input
        );
        onUpdate({ energyInputs: inputs });
    };

    const removeEnergyInput = (id: string) => {
        const inputs = (source.energyInputs || []).filter(input => input.id !== id);
        onUpdate({ energyInputs: inputs });
    };

    return (
        <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600">
            {/* Compact View */}
            <div className="flex justify-between items-center">
                <div className='truncate pr-2'>
                    <p className="text-sm font-medium text-ghg-dark dark:text-gray-100 truncate">
                        {source.description || t('upstreamTransportPlaceholder')}
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
                                <div className="flex items-center gap-2 font-bold mb-2 text-amber-700 dark:text-amber-400">
                                    <IconInfo className="w-4 h-4" />
                                    {t('categoryMismatch')}: {aiAnalysisResult.boundary_warning === 'Scope 1' ? t('cat3Scope1Warning') : aiAnalysisResult.boundary_warning}
                                </div>
                            )}
                            <h4 className="font-bold text-xs mb-2 flex items-center gap-1.5">✨ {t('aiAnalysis')}</h4>
                            <div className="space-y-1.5 opacity-90 text-[11px] leading-relaxed">
                                <p><span className="font-bold text-gray-600 dark:text-gray-400">{t('suggestedActivityType')}:</span> {aiAnalysisResult.activity_group === 'transportation' ? t('cat4Transportation') : t('cat4Distribution')}</p>
                                <p><span className="font-bold text-gray-600 dark:text-gray-400">{t('calculationMethod')}:</span> {t(
                                    aiAnalysisResult.suggested_method === 'activity' ? 'cat4ActivityMethod' :
                                        aiAnalysisResult.suggested_method === 'fuel' ? 'cat4FuelMethod' :
                                            aiAnalysisResult.suggested_method === 'spend' ? 'cat4SpendMethod' :
                                                aiAnalysisResult.suggested_method === 'site_based' ? 'cat4SiteBasedMethod' :
                                                    'cat4AverageDataMethod' as TranslationKey
                                )}</p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 py-1 border-y border-black/5 dark:border-white/5 my-1">
                                    <p><span className="font-bold text-gray-600 dark:text-gray-400">{t('origin')}:</span> {aiAnalysisResult.origin}</p>
                                    <p><span className="font-bold text-gray-600 dark:text-gray-400">{t('destination')}:</span> {aiAnalysisResult.destination}</p>
                                    <p><span className="font-bold text-gray-600 dark:text-gray-400">{t('estimatedDistance')}:</span> {aiAnalysisResult.estimated_distance_km} km</p>
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

                    {/* Calculation Method Selection - Hierarchical */}
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                            <label className={commonLabelClass}>{t('dataType')} & {t('calculationMethod')}</label>
                            <button
                                onClick={() => setShowMethodologyWizard(true)}
                                className="text-[11px] text-ghg-green font-bold flex items-center gap-1.5 bg-ghg-green/5 dark:bg-ghg-green/10 px-3 py-1 rounded-full border border-ghg-green/30 transition-all hover:bg-ghg-green/10 hover:shadow-sm"
                            >
                                <span className="text-base">📊</span>
                                {language === 'ko' ? '방법론 선택 가이드' : 'Methodology Guide'}
                            </button>
                        </div>

                        {/* Step 1: Activity Type Selection */}
                        <div className="flex gap-1 p-1 bg-gray-200 dark:bg-gray-900 rounded-md max-w-sm">
                            <button
                                onClick={() => handleActivityGroupChange('transportation')}
                                className={`flex-1 py-1 px-3 rounded-md text-[11px] transition-all font-bold ${currentActivityGroup === 'transportation' ? 'bg-white dark:bg-gray-700 shadow text-ghg-green' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                {t('cat4Transportation')}
                            </button>
                            <button
                                onClick={() => handleActivityGroupChange('distribution')}
                                className={`flex-1 py-1 px-3 rounded-md text-[11px] transition-all font-bold ${currentActivityGroup === 'distribution' ? 'bg-white dark:bg-gray-700 shadow text-ghg-green' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                {t('cat4Distribution')}
                            </button>
                        </div>

                        {/* Step 2: Calculation Method Selection based on group */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 rounded-md bg-gray-200 dark:bg-gray-900 p-1 text-[10px] sm:text-xs">
                            {(currentActivityGroup === 'transportation' ? transportMethods : distributionMethods).map(method => (
                                <button
                                    key={method}
                                    onClick={() => handleMethodChange(method)}
                                    className={`py-1.5 px-1 rounded-md transition-all whitespace-nowrap ${activeMethod === method ? 'bg-white dark:bg-gray-700 shadow font-bold text-ghg-green' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium'}`}
                                >
                                    {t(
                                        method === 'activity' ? 'cat4ActivityMethod' :
                                            method === 'fuel' ? 'cat4FuelMethod' :
                                                method === 'spend' ? 'cat4SpendMethod' :
                                                    method === 'supplier_specific' ? 'supplier_specificMethod' :
                                                        method === 'site_based' ? 'cat4SiteBasedMethod' :
                                                            'cat4AverageDataMethod' as TranslationKey
                                    )}
                                </button>
                            ))}
                        </div>
                        {/* Method description */}
                        <div className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 leading-relaxed italic">
                            {activeMethod === 'activity' && <p dangerouslySetInnerHTML={{ __html: t('cat4MethodActivity') }}></p>}
                            {activeMethod === 'fuel' && <p dangerouslySetInnerHTML={{ __html: t('cat4MethodFuel') }}></p>}
                            {activeMethod === 'spend' && <p dangerouslySetInnerHTML={{ __html: t('cat4MethodSpend') }}></p>}
                            {activeMethod === 'supplier_specific' && <p dangerouslySetInnerHTML={{ __html: t('cat4MethodSupplier') }}></p>}
                            {activeMethod === 'site_based' && <p dangerouslySetInnerHTML={{ __html: t('cat4MethodSiteBased') }}></p>}
                            {activeMethod === 'average_data' && <p dangerouslySetInnerHTML={{ __html: t('cat4MethodAverageData') }}></p>}
                        </div>
                    </div>

                    {/* Method UI Sections */}
                    {activeMethod === 'activity' && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className={commonLabelClass}>{t('origin')}</label>
                                    <input type="text" value={source.origin || ''} onChange={e => onUpdate({ origin: e.target.value })} className={commonInputClass} placeholder="Seoul, Korea" />
                                </div>
                                <div>
                                    <label className={commonLabelClass}>{t('destination')}</label>
                                    <input type="text" value={source.destination || ''} onChange={e => onUpdate({ destination: e.target.value })} className={commonInputClass} placeholder="New York, USA" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 p-2 border rounded-md dark:border-gray-600 bg-white dark:bg-gray-700/30">
                                <div>
                                    <label className={commonLabelClass}>{t('transportMode')}</label>
                                    <select value={source.transportMode} onChange={e => onUpdate({ transportMode: e.target.value as TransportMode, vehicleType: Object.keys(fuels[e.target.value])[0] })} className={commonSelectClass}>
                                        {Object.keys(fuels).filter(m => ['Road', 'Sea', 'Air', 'Rail'].includes(m)).map(mode => <option key={mode} value={mode}>{t(mode as TranslationKey)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={commonLabelClass}>{t('vehicleType')}</label>
                                    <select value={source.vehicleType} onChange={e => onUpdate({ vehicleType: e.target.value })} className={commonSelectClass}>
                                        {(() => {
                                            const mode = source.transportMode || 'Road';
                                            if (!fuels[mode]) return null;
                                            return Object.keys(fuels[mode]).map(vehicle => (
                                                <option key={vehicle} value={vehicle}>{t(fuels[mode][vehicle]?.translationKey)}</option>
                                            ));
                                        })()}
                                    </select>
                                </div>
                                <div>
                                    <label className={commonLabelClass}>{t('distance')} (km)</label>
                                    <input type="number" value={source.distanceKm || ''} onChange={e => onUpdate({ distanceKm: parseFloat(e.target.value) })} className={commonInputClass} onKeyDown={preventNonNumericKeys} />
                                </div>
                                <div>
                                    <label className={commonLabelClass}>{t('weight')} (tonnes)</label>
                                    <input type="number" value={source.weightTonnes || ''} onChange={e => onUpdate({ weightTonnes: parseFloat(e.target.value) })} className={commonInputClass} onKeyDown={preventNonNumericKeys} />
                                </div>
                            </div>

                            {/* Adjustment Factors */}
                            <div className="p-2 border rounded-md dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
                                <p className="text-[10px] font-semibold mb-2 text-gray-600 dark:text-gray-300 uppercase tracking-tight">{t('adjustmentFactors')}</p>
                                <div className="flex flex-wrap gap-4">
                                    <label className="flex items-center space-x-2 text-xs cursor-pointer">
                                        <input type="checkbox" checked={source.refrigerated || false} onChange={e => onUpdate({ refrigerated: e.target.checked })} className="rounded text-ghg-green focus:ring-ghg-green" />
                                        <span>{t('refrigeratedTransport')} (x1.2)</span>
                                    </label>
                                    <label className="flex items-center space-x-2 text-xs cursor-pointer">
                                        <input type="checkbox" checked={source.emptyBackhaul || false} onChange={e => onUpdate({ emptyBackhaul: e.target.checked })} className="rounded text-ghg-green focus:ring-ghg-green" />
                                        <span>{t('emptyBackhaul')} (x2.0)</span>
                                    </label>
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <span className="text-xs">{t('loadFactor')}:</span>
                                        <input type="range" min="1" max="100" value={source.loadFactor || 100} onChange={e => onUpdate({ loadFactor: parseInt(e.target.value) })} className="w-24 accent-ghg-green" />
                                        <span className="text-xs w-8">{source.loadFactor || 100}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeMethod === 'fuel' && (
                        <div className="p-2 border rounded-md dark:border-gray-600 bg-white dark:bg-gray-700/30">
                            <label className={commonLabelClass}>{t('cat4FuelType')}</label>
                            <select value={source.fuelType} onChange={e => onFuelTypeChange(e.target.value)} className={commonSelectClass}>
                                {MOBILE_FUELS.map(f => <option key={f.name} value={f.name}>{t(f.translationKey as TranslationKey)}</option>)}
                            </select>
                            <div className="mt-2">
                                <label className={commonLabelClass}>{t('totalYear')} ({t('liters')})</label>
                                <input type="number" value={source.monthlyQuantities[0] || ''} onChange={e => handleTotalChange(e.target.value)} className={commonInputClass} onKeyDown={preventNonNumericKeys} placeholder="0" />
                            </div>
                        </div>
                    )}

                    {activeMethod === 'spend' && (
                        <div className="p-2 border rounded-md dark:border-gray-600 bg-white dark:bg-gray-700/30">
                            <label className={commonLabelClass}>{t('cat4ServiceType')}</label>
                            <select value={source.fuelType} onChange={e => onFuelTypeChange(e.target.value)} className={commonSelectClass}>
                                {TRANSPORTATION_SPEND_FACTORS.map(f => <option key={f.name} value={f.name}>{t(f.translationKey as TranslationKey)}</option>)}
                            </select>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <div>
                                    <label className={commonLabelClass}>{t('unit')}</label>
                                    <select value={source.unit} onChange={e => onUpdate({ unit: e.target.value })} className={commonSelectClass}>
                                        <option value="USD">USD</option>
                                        <option value="KRW">KRW</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={commonLabelClass}>{t('totalYear')}</label>
                                    <input type="number" value={source.monthlyQuantities[0] || ''} onChange={e => handleTotalChange(e.target.value)} className={commonInputClass} onKeyDown={preventNonNumericKeys} placeholder="0" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeMethod === 'supplier_specific' && (
                        <div className="p-2 border rounded-md dark:border-gray-600 bg-white dark:bg-gray-700/30">
                            <label className={commonLabelClass}>{t('supplierProvidedCO2e')} (kg CO₂e)</label>
                            <input type="number" value={source.supplierProvidedCO2e || ''} onChange={e => onUpdate({ supplierProvidedCO2e: parseFloat(e.target.value) })} className={commonInputClass} placeholder="0" />
                        </div>
                    )}

                    {activeMethod === 'site_based' && (
                        <div className="p-2 border rounded-md dark:border-gray-600 bg-white dark:bg-gray-700/30 space-y-3">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{t('franchise_specificMethod')}</p>
                            {(source.energyInputs || []).map((input, idx) => (
                                <div key={input.id} className="flex gap-2 items-end border-b pb-2 last:border-0">
                                    <div className="flex-1">
                                        <label className={commonLabelClass}>{t('energyType')}</label>
                                        <select value={input.type} onChange={e => updateEnergyInput(input.id, 'type', e.target.value)} className={commonSelectClass}>
                                            <optgroup label="Electricity & Heat">
                                                <option value="Grid Electricity">Grid Electricity</option>
                                                <option value="Purchased Steam">Purchased Steam</option>
                                            </optgroup>
                                            <optgroup label="Stationary Fuels">
                                                {fuels.Stationary?.map((f: any) => <option key={f.name} value={f.name}>{t(f.translationKey)}</option>)}
                                            </optgroup>
                                        </select>
                                    </div>
                                    <div className="w-24">
                                        <label className={commonLabelClass}>{t('quantity')}</label>
                                        <input type="number" value={input.value || ''} onChange={e => updateEnergyInput(input.id, 'value', parseFloat(e.target.value))} className={commonInputClass} />
                                    </div>
                                    <div className="w-20">
                                        <label className={commonLabelClass}>{t('unit')}</label>
                                        <select value={input.unit} onChange={e => updateEnergyInput(input.id, 'unit', e.target.value)} className={commonSelectClass}>
                                            <option value="kWh">kWh</option>
                                            <option value="liters">liters</option>
                                            <option value="kg">kg</option>
                                            <option value="MJ">MJ</option>
                                        </select>
                                    </div>
                                    <button onClick={() => removeEnergyInput(input.id)} className="text-gray-400 hover:text-red-500 mb-2">
                                        <IconTrash className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button onClick={addEnergyInput} className="text-xs text-ghg-green flex items-center gap-1 hover:underline">
                                <IconPlus className="w-3 h-3" /> {t('addSource')}
                            </button>
                        </div>
                    )}

                    {activeMethod === 'average_data' && (
                        <div className="p-2 border rounded-md dark:border-gray-600 bg-white dark:bg-gray-700/30 grid grid-cols-2 gap-3">
                            <div>
                                <label className={commonLabelClass}>{t('warehouseType')}</label>
                                <select value={source.warehouseType} onChange={e => onUpdate({ warehouseType: e.target.value })} className={commonSelectClass}>
                                    {Object.keys(CAT4_WAREHOUSE_FACTORS).map(type =>
                                        <option key={type} value={type}>{t(type === 'Ambient Warehouse (Average)' ? 'warehouseAmbient' : type === 'Chilled Warehouse' ? 'warehouseChilled' : 'warehouseFrozen' as TranslationKey)}</option>
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className={commonLabelClass}>{t('storageDays')}</label>
                                <input type="number" value={source.storageDays || ''} onChange={e => onUpdate({ storageDays: parseFloat(e.target.value) })} className={commonInputClass} placeholder="0" />
                            </div>
                            <div className="col-span-2">
                                <label className={commonLabelClass}>{t('volume')} (m³)</label>
                                <input type="number" value={source.monthlyQuantities[0] || ''} onChange={e => handleTotalChange(e.target.value)} className={commonInputClass} placeholder="0" />
                                <p className="text-[10px] text-gray-500 mt-1 italic">Formula: Volume (m³) × Storage Duration (Days) × Warehouse Factor</p>
                            </div>
                        </div>
                    )}

                </div>
            )}
            {/* Methodology Wizard Integration */}
            <MethodologyWizard
                isOpen={showMethodologyWizard}
                onClose={() => setShowMethodologyWizard(false)}
                onSelectMethod={(method) => handleMethodChange(method as any)}
                currentMethod={source.calculationMethod as CalculationMethod}
                category={source.category}
            />
        </div>
    );
};
