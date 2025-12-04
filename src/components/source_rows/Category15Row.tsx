

import React, { useState, useEffect } from 'react';
import { EmissionSource, Cat15CalculationMethod, InvestmentType, CO2eFactorFuel } from '../../types';
import { useTranslation } from '../../context/LanguageContext';
import { TranslationKey } from '../../translations/index';
import { IconTrash, IconSparkles, IconCheck, IconAlertTriangle, IconInfo } from '../IconComponents';
import { GoogleGenAI, Type } from '@google/genai';

interface SourceInputRowProps {
    source: EmissionSource;
    onUpdate: (updatedSource: Partial<EmissionSource>) => void;
    onRemove: () => void;
    onFuelTypeChange: (newFuelType: string) => void;
    fuels: any;
    facilities: any[];
    calculateEmissions: (source: EmissionSource) => { scope1: number, scope2Location: number, scope2Market: number, scope3: number };
}

export const Category15Row: React.FC<SourceInputRowProps> = ({ source, onUpdate, onRemove, onFuelTypeChange, fuels, calculateEmissions }) => {
    const { t, language } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);

    const totalEmissions = calculateEmissions(source).scope3;
    const commonSelectClass = "w-full bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
    const commonInputClass = "w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
    const commonLabelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

    const calculationMethod: Cat15CalculationMethod = source.calculationMethod as Cat15CalculationMethod || 'investment_specific';

    // Ensure default calculation method
    useEffect(() => {
        if (!source.calculationMethod) {
            onUpdate({
                calculationMethod: 'investment_specific',
                investmentType: 'Equity',
                unit: 'kg CO₂e' // Final unit
            });
        }
    }, []);

    const handleMethodChange = (method: Cat15CalculationMethod) => {
        let updates: Partial<EmissionSource> = { calculationMethod: method };
        if (method === 'investment_specific') {
            updates.unit = 'kg CO₂e'; // Calculated explicitly
        } else if (method === 'average_data') {
            updates.unit = 'USD invested';
            // Set default sector
            if (fuels.length > 0) {
                updates.fuelType = fuels[0].name;
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
            const promptText = `You are a GHG Protocol Scope 3 Category 15 (Investments) expert. Analyze this investment description: "${source.description}".
            
            1. Classification: Identify Investment Type (Equity, Debt, ProjectFinance, RealEstate, Other).
            2. Sector: Estimate the industry sector (e.g., Tech, Manufacturing, Energy, Real Estate).
            3. Boundary Check (CRITICAL):
               - If it sounds like a subsidiary (>50% share) or we have "Operational Control", flag as 'Scope 1 & 2'.
               - If it is a leased asset we occupy, flag as 'Category 8 (Upstream Leased)'.
            
            Return structured JSON.
            
            IMPORTANT: Respond in ${language === 'ko' ? 'Korean' : 'English'}.`;

            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    investment_type: { type: Type.STRING },
                    suggested_sector: { type: Type.STRING },
                    boundary_warning: { type: Type.STRING, description: "'Scope 1 & 2', 'Category 8', or null" },
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

        if (aiAnalysisResult.investment_type && ['Equity', 'Debt', 'ProjectFinance', 'RealEstate'].includes(aiAnalysisResult.investment_type)) {
            updates.investmentType = aiAnalysisResult.investment_type as InvestmentType;
        }

        if (aiAnalysisResult.suggested_sector) {
            updates.investeeSector = aiAnalysisResult.suggested_sector;
            // Try to map to available average data fuels
            const match = fuels.find((f: any) => f.name.toLowerCase().includes(aiAnalysisResult.suggested_sector.toLowerCase()) || aiAnalysisResult.suggested_sector.toLowerCase().includes(f.name.toLowerCase()));
            if (match) {
                updates.fuelType = match.name;
            }
        }

        onUpdate(updates);
    };

    const preventNonNumericKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (['e', 'E', '+', '-'].includes(e.key)) {
            e.preventDefault();
        }
    };

    const attributionFactor = (source.investmentValue && source.companyValue) ? (source.investmentValue / source.companyValue) : 0;
    const attributionPercent = (attributionFactor * 100).toFixed(2);

    const renderCalculationLogic = () => {
        if (calculationMethod === 'investment_specific') {
            return (
                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300 font-mono">
                    {t('calculationLogic')}: <br />
                    {t('investeeEmissions')} × ({t('investmentValue')} / {t('companyValue')}) = {t('emissions')} × {attributionPercent}%
                </div>
            );
        } else if (calculationMethod === 'average_data') {
            return (
                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300 font-mono">
                    {t('calculationLogic')}: <br />
                    {t('investmentValue')} × {t('emissionFactor')} ({t('investeeSector')})
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
                    <p className="text-sm font-medium text-ghg-dark dark:text-gray-100 truncate">{source.description || t('investmentsPlaceholder')}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('total')}: {source.investmentValue ? source.investmentValue.toLocaleString() + ' USD' : '-'} • <span className="font-semibold text-ghg-green">{(totalEmissions / 1000).toLocaleString('en-US', { minimumFractionDigits: 3 })} t CO₂e</span>
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
                                placeholder={t('investmentsPlaceholder')}
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
                                <p><span className="font-semibold">{t('investmentType')}:</span> {aiAnalysisResult.investment_type}</p>
                                <p><span className="font-semibold">{t('investeeSector')}:</span> {aiAnalysisResult.suggested_sector}</p>
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
                            {(['investment_specific', 'average_data'] as Cat15CalculationMethod[]).map(method => (
                                <button
                                    key={method}
                                    onClick={() => handleMethodChange(method)}
                                    className={`flex-1 py-1 px-2 rounded-md transition-colors whitespace-nowrap ${calculationMethod === method ? 'bg-white dark:bg-gray-700 shadow font-semibold text-ghg-green' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                                >
                                    {t((method === 'average_data' ? 'average_dataMethod_Invest' : `${method}Method`) as TranslationKey)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* === INVESTMENT SPECIFIC (PCAF) === */}
                    {calculationMethod === 'investment_specific' && (
                        <div className="space-y-3">
                            <div className="p-3 border rounded-md dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
                                <h4 className="text-xs font-bold mb-2 text-gray-700 dark:text-gray-300">{t('attributionFactor')} ({attributionPercent}%)</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className={commonLabelClass}>{t('investmentValue')} (USD)</label>
                                        <input
                                            type="number"
                                            value={source.investmentValue || ''}
                                            onChange={e => onUpdate({ investmentValue: parseFloat(e.target.value) })}
                                            className={commonInputClass}
                                            placeholder="Your Investment"
                                        />
                                    </div>
                                    <div>
                                        <label className={commonLabelClass}>{t('companyValue')} (EVIC/Project Cost)</label>
                                        <input
                                            type="number"
                                            value={source.companyValue || ''}
                                            onChange={e => onUpdate({ companyValue: parseFloat(e.target.value) })}
                                            className={commonInputClass}
                                            placeholder="Total Value"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className={commonLabelClass}>{t('investeeEmissions')} (Scope 1 + 2, kg CO₂e)</label>
                                <input
                                    type="number"
                                    value={source.supplierProvidedCO2e || ''}
                                    onChange={e => onUpdate({ supplierProvidedCO2e: parseFloat(e.target.value) })}
                                    className={commonInputClass}
                                    placeholder="Annual Emissions of Investee"
                                />
                                <p className="text-xs text-gray-500 mt-1">{t('qualityHigh')}: {t('supplierDataNote')}</p>
                            </div>

                            {renderCalculationLogic()}
                        </div>
                    )}

                    {/* === AVERAGE DATA === */}
                    {calculationMethod === 'average_data' && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className={commonLabelClass}>{t('investeeSector')}</label>
                                    <select value={source.fuelType} onChange={e => onFuelTypeChange(e.target.value)} className={commonSelectClass}>
                                        {fuels.map((f: any) => <option key={f.name} value={f.name}>{language === 'ko' && f.translationKey ? t(f.translationKey) : f.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={commonLabelClass}>{t('investmentValue')} (USD)</label>
                                    <input
                                        type="number"
                                        value={source.investmentValue || ''}
                                        onChange={e => {
                                            const val = parseFloat(e.target.value);
                                            onUpdate({ investmentValue: val });
                                            // Update monthlyQuantities for calculator compat
                                            const arr = Array(12).fill(0);
                                            arr[0] = val || 0;
                                            onUpdate({ monthlyQuantities: arr });
                                        }}
                                        className={commonInputClass}
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className={commonLabelClass}>{t('dataType')}</label>
                                    <select value={source.unit} onChange={e => onUpdate({ unit: e.target.value })} className={commonSelectClass}>
                                        <option value="USD invested">USD</option>
                                        <option value="KRW invested">KRW</option>
                                    </select>
                                </div>
                            </div>

                            {renderCalculationLogic()}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};