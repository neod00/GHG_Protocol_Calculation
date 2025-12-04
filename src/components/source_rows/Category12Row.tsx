
import React, { useState, useEffect } from 'react';
import { EmissionSource, Cat12CalculationMethod, WasteType } from '../../types';
import { useTranslation } from '../../context/LanguageContext';
import { TranslationKey } from '../../translations/index';
import { IconTrash, IconSparkles, IconCheck, IconAlertTriangle, IconRecycle, IconInfo } from '../IconComponents';
import { GoogleGenAI, Type } from '@google/genai';
import { WASTE_FACTORS_DETAILED } from '../../constants/index';

interface SourceInputRowProps {
    source: EmissionSource;
    onUpdate: (updatedSource: Partial<EmissionSource>) => void;
    onRemove: () => void;
    onFuelTypeChange: (newFuelType: string) => void;
    fuels: any;
    facilities: any[];
    calculateEmissions: (source: EmissionSource) => { scope1: number, scope2Location: number, scope2Market: number, scope3: number };
}

export const Category12Row: React.FC<SourceInputRowProps> = ({ source, onUpdate, onRemove, calculateEmissions }) => {
    const { t, language } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);

    const totalEmissions = calculateEmissions(source).scope3;
    const commonSelectClass = "w-full bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
    const commonInputClass = "w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
    const commonLabelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

    const calculationMethod: Cat12CalculationMethod = source.calculationMethod as Cat12CalculationMethod || 'waste_stream';

    // Ensure default calculation method
    useEffect(() => {
        if (!source.calculationMethod) {
            onUpdate({
                calculationMethod: 'waste_stream',
                unit: 'tonnes',
                wasteType: 'Plastics',
                disposalRatios: { landfill: 50, incineration: 20, recycling: 30 }
            });
        }
    }, []);

    const handleMethodChange = (method: Cat12CalculationMethod) => {
        let updates: Partial<EmissionSource> = { calculationMethod: method };
        if (method === 'waste_stream') {
            updates.unit = 'tonnes';
        } else if (method === 'units_sold') {
            updates.unit = 'units';
        } else if (method === 'spend') {
            updates.unit = 'USD';
        }
        onUpdate(updates);
    };

    const handleRatioChange = (type: 'landfill' | 'incineration' | 'recycling', value: number) => {
        const currentRatios = source.disposalRatios || { landfill: 0, incineration: 0, recycling: 0 };
        onUpdate({ disposalRatios: { ...currentRatios, [type]: value } });
    };

    const handleTotalChange = (value: string) => {
        const val = parseFloat(value);
        const newQuantities = Array(12).fill(0);
        newQuantities[0] = isNaN(val) ? 0 : val;
        onUpdate({ monthlyQuantities: newQuantities });
    };

    const ratios = source.disposalRatios || { landfill: 0, incineration: 0, recycling: 0 };
    const ratioSum = (ratios.landfill || 0) + (ratios.incineration || 0) + (ratios.recycling || 0);
    const isRatioValid = Math.abs(ratioSum - 100) < 0.1;

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
            const promptText = `You are a GHG Protocol Scope 3 expert. Analyze this sold product for End-of-Life (Category 12) treatment: "${source.description}".
            
            1. Material Identification: Determine the dominant material (Plastics, Paper, Metal, Food, Electronics/Hazardous).
            2. EOL Scenario: Suggest a typical disposal split % (Landfill, Incineration, Recycling) based on the material and typical global practices.
            3. Boundary Check: 
               - If this is packaging waste, note it.
               - If this sounds like "Operations Waste" (Cat 5), flag it.
            
            Return structured JSON.
            
            IMPORTANT: Respond in ${language === 'ko' ? 'Korean' : 'English'}.`;

            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    dominant_material: { type: Type.STRING, description: "Plastics, Paper, Metal, Food, Hazardous, MSW" },
                    suggested_ratios: {
                        type: Type.OBJECT,
                        properties: {
                            landfill: { type: Type.NUMBER },
                            incineration: { type: Type.NUMBER },
                            recycling: { type: Type.NUMBER }
                        }
                    },
                    boundary_warning: { type: Type.STRING, description: "'Category 5', 'Category 11', or null" },
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

        if (aiAnalysisResult.suggested_ratios) {
            updates.disposalRatios = {
                landfill: aiAnalysisResult.suggested_ratios.landfill || 0,
                incineration: aiAnalysisResult.suggested_ratios.incineration || 0,
                recycling: aiAnalysisResult.suggested_ratios.recycling || 0,
            };
        }

        // Map AI material to supported WasteTypes in Cat 5/12 constants
        const materialMap: Record<string, WasteType> = {
            'Plastics': 'Plastics', 'Paper': 'Paper', 'Metal': 'Metal',
            'Food': 'Food', 'Hazardous': 'Hazardous', 'MSW': 'MSW'
        };
        if (aiAnalysisResult.dominant_material && materialMap[aiAnalysisResult.dominant_material]) {
            updates.wasteType = materialMap[aiAnalysisResult.dominant_material];
        } else if (aiAnalysisResult.dominant_material === 'Electronics') {
            updates.wasteType = 'Hazardous'; // Or MSW, depending on definition, but electronics usually require special handling
        }

        onUpdate(updates);
    };

    const preventNonNumericKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (['e', 'E', '+', '-'].includes(e.key)) {
            e.preventDefault();
        }
    };

    const renderCalculationLogic = () => {
        return (
            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300 font-mono">
                {t('calculationLogic')}: <br />
                Σ (Total Weight × Ratio% × Treatment Factor)
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600">
            {/* Compact View */}
            <div className="flex justify-between items-center">
                <div className='truncate pr-2'>
                    <p className="text-sm font-medium text-ghg-dark dark:text-gray-100 truncate">{source.description || t('endOfLifePlaceholder')}</p>
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
                                placeholder={t('endOfLifePlaceholder')}
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
                                <p><span className="font-semibold">{t('suggestedMaterial')}:</span> {aiAnalysisResult.dominant_material}</p>
                                <p><span className="font-semibold">{t('disposalScenario')}:</span> L:{aiAnalysisResult.suggested_ratios?.landfill}% / I:{aiAnalysisResult.suggested_ratios?.incineration}% / R:{aiAnalysisResult.suggested_ratios?.recycling}%</p>
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
                            {(['waste_stream', 'units_sold', 'spend'] as Cat12CalculationMethod[]).map(method => (
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

                    {/* === WASTE STREAM (WEIGHT) === */}
                    {(calculationMethod === 'waste_stream' || calculationMethod === 'units_sold') && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className={commonLabelClass}>{t('materialType')}</label>
                                    <select value={source.wasteType || 'MSW'} onChange={e => onUpdate({ wasteType: e.target.value as WasteType })} className={commonSelectClass}>
                                        {Object.keys(WASTE_FACTORS_DETAILED.activity).map(type => <option key={type} value={type}>{t(`waste${type}` as TranslationKey)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={commonLabelClass}>{calculationMethod === 'units_sold' ? t('totalUnitsSold') : t('totalWeightSold')}</label>
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

                            {calculationMethod === 'units_sold' && (
                                <div>
                                    <label className={commonLabelClass}>{t('weightPerUnit')} (kg)</label>
                                    <input
                                        type="number"
                                        value={source.soldProductWeight || ''}
                                        onChange={e => onUpdate({ soldProductWeight: parseFloat(e.target.value) })}
                                        className={commonInputClass}
                                        placeholder="0"
                                    />
                                </div>
                            )}

                            <div className="p-3 border border-dashed border-gray-300 rounded-md dark:border-gray-600 bg-gray-50 dark:bg-gray-800/30">
                                <p className="text-xs font-semibold mb-2 text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                    <IconRecycle className="w-4 h-4" /> {t('disposalScenario')} (Total: {ratioSum}%)
                                </p>
                                {!isRatioValid && <p className="text-xs text-red-500 font-bold mb-2">{t('ratioError')}</p>}
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="text-[10px] text-gray-500">{t('landfill')} (%)</label>
                                        <input type="number" min="0" max="100" value={ratios.landfill} onChange={e => handleRatioChange('landfill', parseFloat(e.target.value))} className={`${commonInputClass} text-center`} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500">{t('incineration')} (%)</label>
                                        <input type="number" min="0" max="100" value={ratios.incineration} onChange={e => handleRatioChange('incineration', parseFloat(e.target.value))} className={`${commonInputClass} text-center`} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500">{t('recycling')} (%)</label>
                                        <input type="number" min="0" max="100" value={ratios.recycling} onChange={e => handleRatioChange('recycling', parseFloat(e.target.value))} className={`${commonInputClass} text-center`} />
                                    </div>
                                </div>
                            </div>

                            {renderCalculationLogic()}
                        </div>
                    )}

                    {/* === SPEND METHOD === */}
                    {calculationMethod === 'spend' && (
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className={commonLabelClass}>{t('dataType')}</label>
                                <select value={source.unit} onChange={e => onUpdate({ unit: e.target.value })} className={commonSelectClass}>
                                    <option value="USD">USD</option>
                                    <option value="KRW">KRW</option>
                                </select>
                            </div>
                            <div>
                                <label className={commonLabelClass}>{t('totalSpendYear')}</label>
                                <input
                                    type="number"
                                    value={source.monthlyQuantities.reduce((a, b) => a + b, 0) || ''}
                                    onChange={(e) => handleTotalChange(e.target.value)}
                                    onKeyDown={preventNonNumericKeys}
                                    className={commonInputClass}
                                    placeholder="0"
                                />
                            </div>
                            <div className="col-span-2">
                                <p className="text-xs text-gray-500 bg-gray-100 p-2 rounded">{t('cat12SpendNote')}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
