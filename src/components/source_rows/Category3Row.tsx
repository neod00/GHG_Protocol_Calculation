import React, { useState, useEffect } from 'react';
import { EmissionSource, CO2eFactorFuel } from '../../types';
import { useTranslation } from '../../context/LanguageContext';
// FIX: Changed import path to be more explicit.
import { TranslationKey } from '../../translations/index';
import { IconTrash, IconSparkles, IconInfo } from '../IconComponents';
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

// FIX: Added component body and return statement to resolve the error.
export const Category3Row: React.FC<SourceInputRowProps> = ({ source, onUpdate, onRemove, onFuelTypeChange, fuels, calculateEmissions }) => {
    const { t, language } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [editedQuantities, setEditedQuantities] = useState([...source.monthlyQuantities]);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);

    useEffect(() => {
        if (!isEditing) {
            setEditedQuantities([...source.monthlyQuantities]);
        }
    }, [source.monthlyQuantities, isEditing]);

    const handleMonthlyChange = (monthIndex: number, value: string) => {
        const newQuantities = [...editedQuantities];
        newQuantities[monthIndex] = parseFloat(value) || 0;
        setEditedQuantities(newQuantities);
    };

    const handleEdit = () => setIsEditing(true);
    const handleCancel = () => setIsEditing(false);
    const handleSave = () => {
        onUpdate({ monthlyQuantities: editedQuantities });
        setIsEditing(false);
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
            const fuelNames = (fuels as any[]).map(f => f.name).join(', ');
            const promptText = `As a GHG Protocol expert for Scope 3, Category 3 (Fuel- and Energy-Related Activities), analyze the following description: "${source.description}". 

            CRITICAL BOUNDARY CHECKS:
            1. If this fuel is burned in company-owned equipment, the COMBUSTION emissions are Scope 1, NOT Category 3. Only the WTT (upstream) emissions belong in Category 3.
            2. If this is purchased energy (electricity, steam, etc.), the consumption emissions are Scope 2, and upstream emissions are automatically calculated. Do NOT manually enter them here.
            3. Category 3 only includes: (a) WTT emissions of fuels NOT burned by the company, OR (b) WTT emissions of fuels that ARE burned (but only the upstream part, not combustion).

            Determine if this is a 'fuel_wtt' (upstream emissions of a specific fuel) or a 'spend_based' activity. If it is 'fuel_wtt', suggest the most likely fuel type. Available fuel types are: ${fuelNames}. 

            Provide a structured JSON response.
            
            IMPORTANT: Respond in ${language === 'ko' ? 'Korean' : 'English'}.`;
            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    activity_type: { type: Type.STRING, description: "Either 'fuel_wtt' or 'spend_based'." },
                    suggested_fuel_name: { type: Type.STRING, description: "If activity_type is 'fuel_wtt', the name of the most likely fuel. Otherwise, null." },
                    justification: { type: Type.STRING, description: "A brief explanation for your choice." },
                    boundary_warning: { type: Type.STRING, description: "'Scope 1', 'Scope 2', or null if this is correctly placed in Category 3." },
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

    const handleApplySuggestion = () => {
        if (!aiAnalysisResult) return;
        const updates: Partial<EmissionSource> = {};
        if (aiAnalysisResult.activity_type) {
            updates.activityType = aiAnalysisResult.activity_type;
        }
        if (aiAnalysisResult.suggested_fuel_name) {
            onFuelTypeChange(aiAnalysisResult.suggested_fuel_name);
        }
        onUpdate(updates);
    };

    const totalQuantity = source.monthlyQuantities.reduce((sum, q) => sum + q, 0);
    const emissionResults = calculateEmissions(source);
    const totalEmissions = emissionResults.scope3;
    const monthKeys: TranslationKey[] = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const commonSelectClass = "w-full bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
    const commonInputClass = "w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
    const commonLabelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400";

    const renderUnit = (unit: string) => t(unit as TranslationKey) || unit;

    const preventNonNumericKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (['e', 'E', '+', '-'].includes(e.key)) {
            e.preventDefault();
        }
    };

    return (
        <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600">
            {/* Category 3 Guidance Box */}
            {!source.isAutoGenerated && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 dark:bg-green-900/30 dark:border-green-700/50 dark:text-green-200 text-xs space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2"><IconInfo className="w-4 h-4" /> {t('cat3GuidanceTitle')}</h4>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>{t('cat3GuidanceText')}</li>
                        <li dangerouslySetInnerHTML={{ __html: t('cat3BoundaryNote') }}></li>
                        <li dangerouslySetInnerHTML={{ __html: t('cat3WTTNote') }}></li>
                        <li dangerouslySetInnerHTML={{ __html: t('cat3TandDNote') }}></li>
                        <li dangerouslySetInnerHTML={{ __html: t('cat3AutoCalculation') }}></li>
                    </ul>
                </div>
            )}

            {/* Auto-calculation Details */}
            {source.isAutoGenerated && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 dark:bg-blue-900/30 dark:border-blue-700/50 dark:text-blue-200 text-xs space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2"><IconInfo className="w-4 h-4" /> {t('cat3AutoCalcDetails')}</h4>
                    <p className="text-xs font-medium">{t('cat3AutoCalcMethod')}</p>
                    <div className="text-xs space-y-1" dangerouslySetInnerHTML={{ __html: t('cat3TandDCalculation') }}></div>
                    <p className="text-xs mt-2 pt-2 border-t border-blue-300 dark:border-blue-600" dangerouslySetInnerHTML={{ __html: t('cat3FutureImprovement') }}></p>
                </div>
            )}

            <div className="flex items-start gap-2">
                <div className="flex-grow">
                    <label htmlFor={`description-${source.id}`} className={commonLabelClass}>{t('emissionSourceDescription')}</label>
                    <div className="flex gap-2">
                        <input
                            id={`description-${source.id}`}
                            type="text"
                            value={source.description}
                            onChange={(e) => onUpdate({ description: e.target.value })}
                            className={commonInputClass}
                            placeholder={t('fuelEnergyPlaceholder')}
                            disabled={source.isAutoGenerated}
                        />
                        {!source.isAutoGenerated && (
                            <button onClick={handleAnalyze} disabled={isLoadingAI || !source.description} className="px-3 py-1 bg-ghg-light-green text-white rounded-md hover:bg-ghg-green disabled:bg-gray-400 flex items-center gap-2 text-sm">
                                <IconSparkles className="w-4 h-4" />
                                <span>{isLoadingAI ? '...' : t('analyzeWithAI')}</span>
                            </button>
                        )}
                    </div>
                </div>
                <div className="pt-5">
                    <button onClick={onRemove} className="text-gray-400 hover:text-red-600 p-1 dark:text-gray-500 dark:hover:text-red-500" aria-label={t('removeSourceAria')}>
                        <IconTrash className="h-5 w-5" />
                    </button>
                </div>
            </div>
            {aiAnalysisResult && (
                <div className={`p-3 border rounded-lg ${aiAnalysisResult.boundary_warning ? 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200' : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700/50 dark:text-blue-200'}`}>
                    {aiAnalysisResult.boundary_warning && (
                        <div className="flex items-center gap-2 font-bold mb-2 text-yellow-800 dark:text-yellow-200">
                            <IconInfo className="w-4 h-4" />
                            {t('categoryMismatch')}: {aiAnalysisResult.boundary_warning === 'Scope 1' ? t('cat3Scope1Warning') : aiAnalysisResult.boundary_warning === 'Scope 2' ? t('cat3Scope2Warning') : aiAnalysisResult.boundary_warning}
                        </div>
                    )}
                    <h4 className="font-semibold text-sm mb-1">{t('aiAnalysis')}</h4>
                    <p className="text-xs"><span className="font-semibold">{t('suggestedActivityType')}:</span> {aiAnalysisResult.activity_type}</p>
                    <p className="text-xs"><span className="font-semibold">{t('suggestedFuelName')}:</span> {aiAnalysisResult.suggested_fuel_name}</p>
                    <p className="text-xs"><span className="font-semibold">{t('justification')}:</span> {aiAnalysisResult.justification}</p>
                    <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-blue-600 dark:text-blue-300">{t('aiDisclaimer')}</p>
                        <button onClick={handleApplySuggestion} className="px-2 py-1 text-xs font-semibold bg-white border border-blue-300 rounded-md hover:bg-blue-100">{t('applySuggestion')}</button>
                    </div>
                </div>
            )}

            {/* Scope 1, 2 Warning */}
            {!source.isAutoGenerated && source.activityType === 'fuel_wtt' && (
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200 text-xs">
                    <p className="flex items-start gap-2">
                        <IconInfo className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span dangerouslySetInnerHTML={{ __html: t('cat3Scope1Warning') }}></span>
                    </p>
                </div>
            )}

            {!source.isAutoGenerated && source.activityType === 'energy_upstream' && (
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200 text-xs">
                    <p className="flex items-start gap-2">
                        <IconInfo className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span dangerouslySetInnerHTML={{ __html: t('cat3Scope2Warning') }}></span>
                    </p>
                </div>
            )}

            {!source.isAutoGenerated && (
                <div className="grid grid-cols-2 gap-2">
                    <select value={source.fuelType} onChange={(e) => onFuelTypeChange(e.target.value)} className={commonSelectClass} aria-label="Fuel/Source">
                        {Array.isArray(fuels) && fuels.map((fuel: CO2eFactorFuel) => (
                            <option key={fuel.name} value={fuel.name}>
                                {language === 'ko' && fuel.translationKey ? `${t(fuel.translationKey as TranslationKey)}` : fuel.name}
                            </option>
                        ))}
                    </select>
                    {Array.isArray(fuels) && 'units' in (fuels.find((f: CO2eFactorFuel) => f.name === source.fuelType) || {}) &&
                        <select value={source.unit} onChange={(e) => onUpdate({ unit: e.target.value })} className={commonSelectClass} aria-label="Unit">
                            {(fuels.find((f: CO2eFactorFuel) => f.name === source.fuelType) as CO2eFactorFuel)?.units.map((unit) => (
                                <option key={unit} value={unit}>{t(unit as TranslationKey) || unit}</option>
                            ))}
                        </select>
                    }
                </div>
            )}
            <div className="mt-2">
                <div className={`flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 ${isEditing ? 'rounded-t-lg' : 'rounded-lg'}`}>
                    <div>
                        {source.isAutoGenerated ? (
                            <div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('totalYear')}: </span>
                                <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{(totalEmissions / 1000).toLocaleString('en-US', { minimumFractionDigits: 3 })} t CO₂e</span>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('cat3AutoCalcDetails')}</p>
                            </div>
                        ) : (
                            <>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('totalYear')}: </span>
                                <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{totalQuantity.toLocaleString()}&nbsp;{renderUnit(source.unit)}</span>
                            </>
                        )}
                    </div>
                    <div className='flex items-center gap-4'>
                        {!source.isAutoGenerated && (
                            <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{(totalEmissions / 1000).toLocaleString('en-US', { minimumFractionDigits: 3 })} t CO₂e</span>
                        )}
                        {!isEditing && !source.isAutoGenerated && (
                            <button onClick={handleEdit} className="text-sm text-ghg-green font-semibold hover:underline">
                                {t('editMonthly')}
                            </button>
                        )}
                    </div>
                </div>

                {/* Auto-calculation Details */}
                {source.isAutoGenerated && source.assumptions && (
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                        <p className="font-semibold mb-1">{t('assumptionsNotes')}:</p>
                        <div className="text-xs space-y-1" dangerouslySetInnerHTML={{ __html: source.assumptions.replace(/\n/g, '<br>') }}></div>
                    </div>
                )}

                {isEditing && !source.isAutoGenerated && (
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