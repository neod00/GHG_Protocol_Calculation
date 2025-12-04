
import React, { useState, useEffect } from 'react';
import { EmissionSource, Cat14CalculationMethod, FranchiseType } from '../../types';
import { useTranslation } from '../../context/LanguageContext';
import { TranslationKey } from '../../translations/index';
import { IconTrash, IconSparkles, IconCheck, IconAlertTriangle, IconInfo, IconBuilding, IconX } from '../IconComponents';
import { GoogleGenAI, Type } from '@google/genai';
import { FRANCHISES_FACTORS_DETAILED, SCOPE2_FACTORS_BY_REGION, STATIONARY_FUELS, MOBILE_FUELS, SCOPE2_ENERGY_SOURCES } from '../../constants/index';

interface SourceInputRowProps {
    source: EmissionSource;
    onUpdate: (updatedSource: Partial<EmissionSource>) => void;
    onRemove: () => void;
    onFuelTypeChange: (newFuelType: string) => void;
    fuels: any;
    facilities: any[];
    calculateEmissions: (source: EmissionSource) => { scope1: number, scope2Location: number, scope2Market: number, scope3: number };
}

export const Category14Row: React.FC<SourceInputRowProps> = ({ source, onUpdate, onRemove, calculateEmissions }) => {
    const { t, language } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);

    const totalEmissions = calculateEmissions(source).scope3;
    const commonSelectClass = "w-full bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
    const commonInputClass = "w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
    const commonLabelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

    const calculationMethod: Cat14CalculationMethod = source.calculationMethod as Cat14CalculationMethod || 'franchise_specific';

    // Ensure default calculation method
    useEffect(() => {
        if (!source.calculationMethod) {
            onUpdate({
                calculationMethod: 'franchise_specific',
                franchiseType: 'Restaurant',
                unit: 'kg CO₂e'
            });
        }
    }, []);

    const handleMethodChange = (method: Cat14CalculationMethod) => {
        let updates: Partial<EmissionSource> = { calculationMethod: method };
        if (method === 'franchise_specific') {
            updates.unit = ''; // Unit depends on energy input
        } else if (method === 'area_based') {
            updates.unit = 'm²';
        } else if (method === 'average_data') {
            updates.unit = 'unit'; // Stores
        }
        onUpdate(updates);
    };

    const handleTotalChange = (value: string) => {
        const val = parseFloat(value);
        const newQuantities = Array(12).fill(0);
        newQuantities[0] = isNaN(val) ? 0 : val;
        onUpdate({ monthlyQuantities: newQuantities });
    };

    // --- Energy Input Management for Franchise Specific Method ---
    const energyOptions = [
        ...STATIONARY_FUELS,
        ...MOBILE_FUELS,
        ...SCOPE2_ENERGY_SOURCES
    ];

    const addEnergyInput = () => {
        const defaultFuel = energyOptions[0];
        const newInputs = [...(source.energyInputs || []), { id: `input-${Date.now()}`, type: defaultFuel.name, value: 0, unit: defaultFuel.units[0] }];
        onUpdate({ energyInputs: newInputs });
    };

    const updateEnergyInput = (id: string, update: { type?: string, value?: number, unit?: string }) => {
        const newInputs = (source.energyInputs || []).map(input => {
            if (input.id === id) {
                const updatedInput = { ...input, ...update };
                if (update.type) {
                    const fuelData = energyOptions.find(f => f.name === update.type);
                    if (fuelData) {
                        updatedInput.unit = fuelData.units[0];
                    }
                }
                return updatedInput;
            }
            return input;
        });
        onUpdate({ energyInputs: newInputs });
    };

    const removeEnergyInput = (id: string) => {
        const newInputs = (source.energyInputs || []).filter(input => input.id !== id);
        onUpdate({ energyInputs: newInputs });
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
            const promptText = `You are a GHG Protocol Scope 3 expert. Analyze this franchise description: "${source.description}".
            
            1. Classification: Identify Franchise Type (Restaurant, Retail, Service, ConvenienceStore, CoffeeShop).
            2. Quantification: Estimate Number of Stores or Total Area (sqm).
            3. Boundary Check (CRITICAL):
               - If the franchisor has "Operational Control" (e.g. corporate-owned store), flag as 'Scope 1 & 2'.
               - If the franchisor leases the building to the franchisee (but franchisee operates), it's Cat 13 (Downstream Leased Assets). However, if the franchisor treats it as a franchise, Cat 14 is preferred to avoid double counting. Note the nuance.
            
            Return structured JSON.
            
            IMPORTANT: Respond in ${language === 'ko' ? 'Korean' : 'English'}.`;

            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    franchise_type: { type: Type.STRING },
                    estimated_count: { type: Type.NUMBER },
                    estimated_area_sqm: { type: Type.NUMBER },
                    boundary_warning: { type: Type.STRING, description: "'Scope 1 & 2', 'Category 13', or null" },
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

        const typeMap: Record<string, FranchiseType> = {
            'Restaurant': 'Restaurant', 'Retail': 'Retail', 'Service': 'Service',
            'ConvenienceStore': 'ConvenienceStore', 'CoffeeShop': 'CoffeeShop'
        };

        if (aiAnalysisResult.franchise_type && typeMap[aiAnalysisResult.franchise_type]) {
            updates.franchiseType = typeMap[aiAnalysisResult.franchise_type];
        }

        if (aiAnalysisResult.estimated_area_sqm) {
            updates.areaSqm = aiAnalysisResult.estimated_area_sqm;
            if (calculationMethod !== 'area_based') updates.calculationMethod = 'area_based';
        } else if (aiAnalysisResult.estimated_count) {
            const arr = Array(12).fill(0);
            arr[0] = aiAnalysisResult.estimated_count;
            updates.monthlyQuantities = arr;
            if (calculationMethod !== 'average_data') updates.calculationMethod = 'average_data';
        }

        onUpdate(updates);
    };

    const preventNonNumericKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (['e', 'E', '+', '-'].includes(e.key)) {
            e.preventDefault();
        }
    };

    const renderCalculationLogic = () => {
        if (calculationMethod === 'area_based') {
            return (
                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300 font-mono">
                    {t('calculationLogic')}: <br />
                    {t('areaSqm')} × {t('avgEnergyIntensity')} ({t('franchiseType')}) × {t('gridFactor')}
                </div>
            );
        } else if (calculationMethod === 'average_data') {
            return (
                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300 font-mono">
                    {t('calculationLogic')}: <br />
                    {t('numberOfStores')} × {t('avgEmissionsPerStore')}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600">
            {/* Compact View */}
            <div className="flex justify-between items-center">
                <div className='truncate pr-2'>
                    <p className="text-sm font-medium text-ghg-dark dark:text-gray-100 truncate">{source.description || t('franchisesPlaceholder')}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('total')}: {calculationMethod === 'franchise_specific' ? `${(source.energyInputs || []).length} ${t('energyInputs')}` : `${source.monthlyQuantities.reduce((a, b) => a + b, 0).toLocaleString()} ${calculationMethod === 'area_based' ? 'm²' : t('unit')}`} • <span className="font-semibold text-ghg-green">{(totalEmissions / 1000).toLocaleString('en-US', { minimumFractionDigits: 3 })} t CO₂e</span>
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
                                placeholder={t('franchisesPlaceholder')}
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
                                <div className="flex items-center gap-2 font-bold mb-2 text-yellow-700 dark:text-yellow-400">
                                    <IconAlertTriangle className="w-4 h-4" />
                                    {t('boundaryWarning')}: {aiAnalysisResult.boundary_warning}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-1">
                                <p><span className="font-semibold">{t('franchiseType')}:</span> {aiAnalysisResult.franchise_type}</p>
                                {aiAnalysisResult.estimated_area_sqm && <p><span className="font-semibold">{t('areaSqm')}:</span> {aiAnalysisResult.estimated_area_sqm}</p>}
                                {aiAnalysisResult.estimated_count && <p><span className="font-semibold">{t('numberOfStores')}:</span> {aiAnalysisResult.estimated_count}</p>}
                            </div>
                            <p className="mt-1 italic opacity-80">{aiAnalysisResult.reasoning}</p>

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
                            {(['franchise_specific', 'area_based', 'average_data'] as Cat14CalculationMethod[]).map(method => (
                                <button
                                    key={method}
                                    onClick={() => handleMethodChange(method)}
                                    className={`flex-1 py-1 px-2 rounded-md transition-colors whitespace-nowrap ${calculationMethod === method ? 'bg-white dark:bg-gray-700 shadow font-semibold text-ghg-green' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                                >
                                    {t(`${method}Method` as TranslationKey)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* === FRANCHISE SPECIFIC (Actual Energy) === */}
                    {calculationMethod === 'franchise_specific' && (
                        <div>
                            <div className="flex justify-between items-center mb-1 mt-2">
                                <label className={commonLabelClass}>{t('energyInputs')}</label>
                                <button onClick={addEnergyInput} className="text-xs text-ghg-green font-semibold hover:underline flex items-center gap-1">
                                    + {t('addEnergyInput')}
                                </button>
                            </div>
                            <div className="space-y-2">
                                {(source.energyInputs || []).length === 0 && <p className="text-xs text-gray-400 italic text-center py-2">{t('noSourcesHelp')}</p>}
                                {(source.energyInputs || []).map(input => (
                                    <div key={input.id} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-center p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                        <select value={input.type} onChange={e => updateEnergyInput(input.id, { type: e.target.value })} className={`${commonSelectClass} py-1 h-8`}>
                                            {energyOptions.map((f: any) => <option key={f.name} value={f.name}>{language === 'ko' && f.translationKey ? t(f.translationKey) : f.name}</option>)}
                                        </select>
                                        <input
                                            type="number"
                                            value={input.value}
                                            onChange={e => updateEnergyInput(input.id, { value: parseFloat(e.target.value) })}
                                            onKeyDown={preventNonNumericKeys}
                                            className={`${commonInputClass} py-1 h-8`}
                                            placeholder="Qty"
                                        />
                                        <select value={input.unit} onChange={e => updateEnergyInput(input.id, { unit: e.target.value })} className={`${commonSelectClass} py-1 w-20 h-8`}>
                                            {energyOptions.find(f => f.name === input.type)?.units.map(u => <option key={u} value={u}>{t(u as TranslationKey)}</option>)}
                                        </select>
                                        <button onClick={() => removeEnergyInput(input.id)} className="text-gray-400 hover:text-red-500 p-1"><IconX className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
                                <IconInfo className="w-3 h-3" /> {t('dataQuality')}: {t('qualityHigh')} (Primary data)
                            </p>
                        </div>
                    )}

                    {/* === AREA BASED & AVERAGE DATA === */}
                    {(calculationMethod === 'area_based' || calculationMethod === 'average_data') && (
                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className={commonLabelClass}>{t('franchiseType')}</label>
                                    <select value={source.franchiseType || 'Restaurant'} onChange={e => onUpdate({ franchiseType: e.target.value as FranchiseType })} className={commonSelectClass}>
                                        {Object.keys(FRANCHISES_FACTORS_DETAILED.area_based).map(type => <option key={type} value={type}>{t(`franchise${type}` as TranslationKey)}</option>)}
                                    </select>
                                </div>
                                {calculationMethod === 'area_based' ? (
                                    <div>
                                        <label className={commonLabelClass}>{t('totalArea')} (m²)</label>
                                        <input
                                            type="number"
                                            value={source.monthlyQuantities.reduce((a, b) => a + b, 0) || ''}
                                            onChange={(e) => handleTotalChange(e.target.value)}
                                            onKeyDown={preventNonNumericKeys}
                                            className={commonInputClass}
                                            placeholder="0"
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className={commonLabelClass}>{t('numberOfStores')}</label>
                                        <input
                                            type="number"
                                            value={source.monthlyQuantities.reduce((a, b) => a + b, 0) || ''}
                                            onChange={(e) => handleTotalChange(e.target.value)}
                                            onKeyDown={preventNonNumericKeys}
                                            className={commonInputClass}
                                            placeholder="0"
                                        />
                                    </div>
                                )}
                            </div>

                            {calculationMethod === 'area_based' && (
                                <div>
                                    <label className={commonLabelClass}>{t('gridRegion')}</label>
                                    <select value={source.energyRegion || 'South Korea'} onChange={e => onUpdate({ energyRegion: e.target.value })} className={commonSelectClass}>
                                        {Object.keys(SCOPE2_FACTORS_BY_REGION).map(r => <option key={r} value={r}>{t(SCOPE2_FACTORS_BY_REGION[r].translationKey as TranslationKey)}</option>)}
                                    </select>
                                </div>
                            )}

                            {renderCalculationLogic()}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
