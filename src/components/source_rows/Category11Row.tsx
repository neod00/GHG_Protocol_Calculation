
import React, { useState, useEffect } from 'react';
import { EmissionSource, Cat11CalculationMethod, CO2eFactorFuel } from '../../types';
import { useTranslation } from '../../context/LanguageContext';
import { TranslationKey } from '../../translations/index';
import { IconTrash, IconSparkles, IconCheck, IconAlertTriangle, IconInfo } from '../IconComponents';
import { GoogleGenAI, Type } from '@google/genai';
import { STATIONARY_FUELS, MOBILE_FUELS, SCOPE2_FACTORS_BY_REGION } from '../../constants/index';

interface SourceInputRowProps {
    source: EmissionSource;
    onUpdate: (updatedSource: Partial<EmissionSource>) => void;
    onRemove: () => void;
    onFuelTypeChange: (newFuelType: string) => void;
    fuels: any;
    facilities: any[];
    calculateEmissions: (source: EmissionSource) => { scope1: number, scope2Location: number, scope2Market: number, scope3: number };
}

export const Category11Row: React.FC<SourceInputRowProps> = ({ source, onUpdate, onRemove, calculateEmissions }) => {
    const { t, language } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);

    const totalEmissions = calculateEmissions(source).scope3;
    const commonSelectClass = "w-full bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
    const commonInputClass = "w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
    const commonLabelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

    const calculationMethod: Cat11CalculationMethod = source.calculationMethod as Cat11CalculationMethod || 'energy_consumption';

    // Ensure default calculation method
    useEffect(() => {
        if (!source.calculationMethod) {
            onUpdate({
                calculationMethod: 'energy_consumption',
                unit: 'kWh',
                productLifetime: 5,
                annualEnergyConsumption: 0,
                energyRegion: 'South Korea' // Default
            });
        }
    }, []);

    const handleMethodChange = (method: Cat11CalculationMethod) => {
        let updates: Partial<EmissionSource> = { calculationMethod: method };
        if (method === 'energy_consumption') {
            updates.unit = 'kWh';
            updates.fuelType = 'Grid Electricity';
        } else if (method === 'fuel_consumption') {
            updates.unit = 'liters';
            updates.fuelType = MOBILE_FUELS[0].name; // Default fuel
        } else if (method === 'ghg_data') {
            updates.unit = 'kg CO₂e'; // Per unit lifetime
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
            const promptText = `You are a GHG Protocol Scope 3 expert. Analyze this sold product description: "${source.description}".
            
            1. Use Phase Type: Determine if it's 'Indirect Use Phase' (uses electricity/heat) or 'Direct Use Phase' (burns fuel like gas/diesel) or 'None' (no greenhouse gas emissions during use).
            2. Estimate Data:
               - Product Lifetime (years)
               - Annual Energy Consumption (value and unit: kWh, liters, etc.)
               - Likely Fuel/Energy Source (e.g., Grid Electricity, Gasoline, Diesel, Natural Gas)
            3. Boundary Check (CRITICAL):
               - If it sounds like an intermediate product (e.g., engine part) that doesn't consume energy on its own, flag as 'Category 10 (Processing)'.
               - If it emits GHGs only when disposed, flag as 'Category 12'.
            
            Return structured JSON.
            
            IMPORTANT: Respond in ${language === 'ko' ? 'Korean' : 'English'}.`;

            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    use_phase_type: { type: Type.STRING, description: "'Indirect', 'Direct', 'None'" },
                    estimated_lifetime_years: { type: Type.NUMBER },
                    annual_consumption: { type: Type.NUMBER },
                    consumption_unit: { type: Type.STRING, description: "kWh, liters, kg, etc." },
                    energy_source: { type: Type.STRING },
                    boundary_warning: { type: Type.STRING, description: "Conflicting Category name or null" },
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

        if (aiAnalysisResult.estimated_lifetime_years) updates.productLifetime = aiAnalysisResult.estimated_lifetime_years;
        if (aiAnalysisResult.annual_consumption) updates.annualEnergyConsumption = aiAnalysisResult.annual_consumption;

        if (aiAnalysisResult.use_phase_type === 'Indirect') {
            updates.calculationMethod = 'energy_consumption';
            updates.unit = 'kWh'; // Standardizing on kWh for electricity
            updates.fuelType = 'Grid Electricity';
        } else if (aiAnalysisResult.use_phase_type === 'Direct') {
            updates.calculationMethod = 'fuel_consumption';
            // Try to match fuel type
            const allFuels = [...MOBILE_FUELS, ...STATIONARY_FUELS];
            const match = allFuels.find(f => f.name.toLowerCase().includes(aiAnalysisResult.energy_source?.toLowerCase()) || aiAnalysisResult.energy_source?.toLowerCase().includes(f.name.toLowerCase()));
            if (match) {
                updates.fuelType = match.name;
                updates.unit = match.units[0];
            }
        }

        onUpdate(updates);
    };

    const preventNonNumericKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (['e', 'E', '+', '-'].includes(e.key)) {
            e.preventDefault();
        }
    };

    const renderCalculationLogic = () => {
        const units = source.monthlyQuantities.reduce((a, b) => a + b, 0);
        const lifetime = source.productLifetime || 1;
        const annual = source.annualEnergyConsumption || 0;

        if (calculationMethod === 'energy_consumption' || calculationMethod === 'fuel_consumption') {
            return (
                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300 font-mono">
                    {t('calculationLogic')}: <br />
                    {units.toLocaleString()} ({t('unitsSold')}) × {lifetime} ({t('years')}) × {annual} ({source.unit}/{t('year')}) × {t('emissionFactor')}
                </div>
            );
        }
        return null;
    };

    // Combine fuels for direct use phase dropdown
    const directFuels = [...MOBILE_FUELS, ...STATIONARY_FUELS].sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600">
            {/* Compact View */}
            <div className="flex justify-between items-center">
                <div className='truncate pr-2'>
                    <p className="text-sm font-medium text-ghg-dark dark:text-gray-100 truncate">{source.description || t('useOfSoldProductsPlaceholder')}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('total')}: {source.monthlyQuantities.reduce((a, b) => a + b, 0).toLocaleString()} {t('unit')} • <span className="font-semibold text-ghg-green">{(totalEmissions / 1000).toLocaleString('en-US', { minimumFractionDigits: 3 })} t CO₂e</span>
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

                    {/* Category 11 Guidance Box */}
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-800 dark:bg-purple-900/30 dark:border-purple-700/50 dark:text-purple-200 text-xs space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2"><IconInfo className="w-4 h-4" /> {t('cat11GuidanceTitle')}</h4>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>{t('cat11GuidanceText')}</li>
                            <li dangerouslySetInnerHTML={{ __html: t('cat11BoundaryNote') }}></li>
                            <li dangerouslySetInnerHTML={{ __html: t('cat11CalculationMethods') }}></li>
                        </ul>
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200">
                            <p className="flex items-start gap-2 mb-1">
                                <IconInfo className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span dangerouslySetInnerHTML={{ __html: t('cat11Category10Warning') }}></span>
                            </p>
                            <p className="flex items-start gap-2">
                                <IconInfo className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span dangerouslySetInnerHTML={{ __html: t('cat11Category12Warning') }}></span>
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
                                placeholder={t('useOfSoldProductsPlaceholder')}
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
                            {aiAnalysisResult.boundary_warning && (
                                <div className="space-y-2 mb-2">
                                    <div className="flex items-center gap-2 font-bold text-yellow-700 dark:text-yellow-400">
                                        <IconAlertTriangle className="w-4 h-4" />
                                        {t('boundaryWarning')}: {aiAnalysisResult.boundary_warning}
                                    </div>
                                    {aiAnalysisResult.boundary_warning?.includes('Category 10') && (
                                        <p className="text-xs" dangerouslySetInnerHTML={{ __html: t('cat11Category10Warning') }}></p>
                                    )}
                                    {aiAnalysisResult.boundary_warning?.includes('Category 12') && (
                                        <p className="text-xs" dangerouslySetInnerHTML={{ __html: t('cat11Category12Warning') }}></p>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-1">
                                <p><span className="font-semibold">{t('usePhaseType')}:</span> {aiAnalysisResult.use_phase_type}</p>
                                <p><span className="font-semibold">{t('estimatedLifetime')}:</span> {aiAnalysisResult.estimated_lifetime_years} {t('years')}</p>
                                <p><span className="font-semibold">{t('annualConsumption')}:</span> {aiAnalysisResult.annual_consumption} {aiAnalysisResult.consumption_unit}</p>
                                <p><span className="font-semibold">{t('energySource')}:</span> {aiAnalysisResult.energy_source}</p>
                            </div>

                            <div className="flex justify-end mt-2">
                                <button onClick={applyAiResult} className="px-2 py-1 bg-white dark:bg-gray-700 border rounded hover:bg-gray-100 dark:hover:bg-gray-600 font-semibold flex items-center gap-1">
                                    <IconCheck className="w-3 h-3" /> {t('applySuggestion')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Method Selector */}
                    <div>
                        <label className={commonLabelClass}>{t('calculationMethod')}</label>
                        <div className="flex gap-1 rounded-md bg-gray-200 dark:bg-gray-900 p-1 text-xs">
                            {(['energy_consumption', 'fuel_consumption', 'ghg_data'] as Cat11CalculationMethod[]).map(method => (
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
                        {calculationMethod && (
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200 text-xs">
                                {calculationMethod === 'energy_consumption' && (
                                    <p className="flex items-start gap-2">
                                        <IconInfo className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                        <span>{t('cat11MethodEnergyConsumption')}</span>
                                    </p>
                                )}
                                {calculationMethod === 'fuel_consumption' && (
                                    <p className="flex items-start gap-2">
                                        <IconInfo className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                        <span>{t('cat11MethodFuelConsumption')}</span>
                                    </p>
                                )}
                                {calculationMethod === 'ghg_data' && (
                                    <p className="flex items-start gap-2">
                                        <IconInfo className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                        <span>{t('cat11MethodGhgData')}</span>
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* === INDIRECT (ELECTRICITY) METHOD === */}
                    {calculationMethod === 'energy_consumption' && (
                        <div className="space-y-2">
                            <div className="p-2 bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200 text-xs rounded flex items-start gap-2">
                                <IconInfo className="w-4 h-4 flex-shrink-0" />
                                {t('indirectUsePhaseInfo')}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className={commonLabelClass}>{t('gridRegion')}</label>
                                    <select value={source.energyRegion || 'South Korea'} onChange={e => onUpdate({ energyRegion: e.target.value })} className={commonSelectClass}>
                                        {Object.keys(SCOPE2_FACTORS_BY_REGION).map(r => <option key={r} value={r}>{t(SCOPE2_FACTORS_BY_REGION[r].translationKey as TranslationKey)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={commonLabelClass}>{t('annualConsumption')} (kWh)</label>
                                    <input type="number" value={source.annualEnergyConsumption || ''} onChange={e => onUpdate({ annualEnergyConsumption: parseFloat(e.target.value) })} className={commonInputClass} />
                                </div>
                                <div>
                                    <label className={commonLabelClass}>{t('productLifetime')} ({t('years')})</label>
                                    <input type="number" value={source.productLifetime || ''} onChange={e => onUpdate({ productLifetime: parseFloat(e.target.value) })} className={commonInputClass} />
                                </div>
                                <div>
                                    <label className={commonLabelClass}>{t('unitsSoldTotal')}</label>
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
                            {renderCalculationLogic()}
                        </div>
                    )}

                    {/* === DIRECT (FUEL) METHOD === */}
                    {calculationMethod === 'fuel_consumption' && (
                        <div className="space-y-2">
                            <div className="p-2 bg-orange-50 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200 text-xs rounded flex items-start gap-2">
                                <IconInfo className="w-4 h-4 flex-shrink-0" />
                                {t('directUsePhaseInfo')}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className={commonLabelClass}>{t('fuelType')}</label>
                                    <select value={source.fuelType} onChange={e => {
                                        const fuel = directFuels.find(f => f.name === e.target.value);
                                        onUpdate({ fuelType: e.target.value, unit: fuel ? fuel.units[0] : '' });
                                    }} className={commonSelectClass}>
                                        {directFuels.map(f => <option key={f.name} value={f.name}>{language === 'ko' && f.translationKey ? t(f.translationKey as TranslationKey) : f.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={commonLabelClass}>{t('annualConsumption')} ({source.unit})</label>
                                    <input type="number" value={source.annualEnergyConsumption || ''} onChange={e => onUpdate({ annualEnergyConsumption: parseFloat(e.target.value) })} className={commonInputClass} />
                                </div>
                                <div>
                                    <label className={commonLabelClass}>{t('productLifetime')} ({t('years')})</label>
                                    <input type="number" value={source.productLifetime || ''} onChange={e => onUpdate({ productLifetime: parseFloat(e.target.value) })} className={commonInputClass} />
                                </div>
                                <div>
                                    <label className={commonLabelClass}>{t('unitsSoldTotal')}</label>
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
                            {renderCalculationLogic()}
                        </div>
                    )}

                    {/* === GHG DATA METHOD === */}
                    {calculationMethod === 'ghg_data' && (
                        <div className="space-y-2">
                            <div>
                                <label className={commonLabelClass}>{t('lifetimeEmissionsPerUnit')} (kg CO₂e)</label>
                                <input
                                    type="number"
                                    value={source.factor || ''}
                                    onChange={e => onUpdate({ factor: parseFloat(e.target.value) })}
                                    className={commonInputClass}
                                />
                            </div>
                            <div>
                                <label className={commonLabelClass}>{t('unitsSoldTotal')}</label>
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
                </div>
            )}
        </div>
    );
};