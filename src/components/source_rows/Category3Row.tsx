import React, { useState, useEffect } from 'react';
import { EmissionSource, CO2eFactorFuel } from '../../types';
import { useTranslation } from '../../context/LanguageContext';
import { TranslationKey } from '../../translations/index';
import { IconTrash, IconSparkles, IconInfo, IconChevronDown, IconChevronUp } from '../IconComponents';
import { GoogleGenAI, Type } from '@google/genai';
import { MethodologyWizard } from '../MethodologyWizard';
import { CalculationMethod, calculateDQIScore, getDQIRating, DataQualityIndicator } from '../../types';
import { DQISection } from '../DQISection';
import { getDQIColor, getDQIBgColor, getDQIRatingLabel } from '../../utils/dqiUtils';

interface SourceInputRowProps {
    source: EmissionSource;
    onUpdate: (updatedSource: Partial<EmissionSource>) => void;
    onRemove: () => void;
    onFuelTypeChange: (newFuelType: string) => void;
    fuels: any;
    facilities: any[];
    calculateEmissions: (source: EmissionSource) => { scope1: number, scope2Location: number, scope2Market: number, scope3: number };
}

export const Category3Row: React.FC<SourceInputRowProps> = ({ source, onUpdate, onRemove, onFuelTypeChange, fuels, facilities, calculateEmissions }) => {
    const { t, language } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedQuantities, setEditedQuantities] = useState([...source.monthlyQuantities]);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
    const [showMethodologyWizard, setShowMethodologyWizard] = useState(false);

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
                model: 'gemini-2.0-flash', // Updated to 2.0-flash
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
            if (aiAnalysisResult.activity_type === 'fuel_wtt') {
                updates.calculationMethod = 'activity';
            }
        }
        if (aiAnalysisResult.suggested_fuel_name) {
            onFuelTypeChange(aiAnalysisResult.suggested_fuel_name);
        }
        onUpdate(updates);
    };

    const handleMethodChange = (method: CalculationMethod) => {
        let updates: Partial<EmissionSource> = {
            calculationMethod: method,
        };
        if (method === 'supplier_co2e') {
            updates.activityType = 'spend_based';
        } else if (method === 'activity') {
            updates.activityType = 'fuel_wtt';
        }
        onUpdate(updates);
    };

    const totalQuantity = source.monthlyQuantities.reduce((sum, q) => sum + q, 0);
    const displayTotalQuantity = isEditing
        ? editedQuantities.reduce((sum, q) => sum + q, 0)
        : totalQuantity;
    const emissionResults = calculateEmissions(source);
    const totalEmissions = emissionResults.scope3;
    const monthKeys: TranslationKey[] = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const commonSelectClass = "w-full bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green transition-colors";
    const commonInputClass = "w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green transition-colors";
    const commonLabelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

    const renderUnit = (unit: string) => t(unit as TranslationKey) || unit;

    const preventNonNumericKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (['e', 'E', '+', '-'].includes(e.key)) {
            e.preventDefault();
        }
    };

    const placeholderText = t('fuelEnergyPlaceholder');
    const activityUnit = source.unit;

    const dqiScore = calculateDQIScore(source.dataQualityIndicator || {
        technologicalRep: 3,
        temporalRep: 3,
        geographicalRep: 3,
        completeness: 3,
        reliability: 3,
    });
    const dqiRating = getDQIRating(dqiScore);

    return (
        <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 font-sans shadow-sm transition-all duration-200">
            {/* Row Summary Header */}
            <div className="flex justify-between items-center cursor-pointer group" onClick={() => setIsExpanded(!isExpanded)}>
                <div className='truncate pr-2'>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {source.description || placeholderText}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                        <span className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                            {source.calculationMethod === 'supplier_co2e' ? t('supplierMethod') : t('activityMethod')}
                        </span>
                        <span>•</span>
                        {t('totalYear')}: <span className="font-bold text-gray-700 dark:text-gray-300">{source.isAutoGenerated ? (totalEmissions / 1000).toLocaleString('en-US', { minimumFractionDigits: 3 }) + ' t CO₂e' : displayTotalQuantity.toLocaleString() + ' ' + renderUnit(activityUnit)}</span>
                        {!source.isAutoGenerated && (
                            <>
                                <span>•</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">{(totalEmissions / 1000).toLocaleString('en-US', { minimumFractionDigits: 3 })} t CO₂e</span>
                                {source.dataQualityIndicator && (
                                    <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${getDQIBgColor(dqiScore)} ${getDQIColor(dqiScore)}`}>
                                        DQI: {dqiScore.toFixed(1)}
                                    </span>
                                )}
                            </>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {!source.isAutoGenerated && (
                        <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-full transition-all text-gray-400 hover:text-emerald-600 shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
                            {isExpanded ? <IconChevronUp className="w-5 h-5" /> : <IconChevronDown className="w-5 h-5" />}
                        </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="text-gray-400 hover:text-red-500 p-1.5 transition-colors" aria-label={t('removeSourceAria')}>
                        <IconTrash className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Detailed Form Section */}
            {isExpanded && (
                <div className="flex flex-col gap-5 pt-4 border-t border-gray-200 dark:border-gray-700 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">

                    {/* Guidance / Warning Boxes */}
                    {source.isAutoGenerated ? (
                        <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-blue-900 dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-200 text-xs space-y-2">
                            <h4 className="font-bold text-[13px] flex items-center gap-2"><IconInfo className="w-4 h-4 text-blue-500" /> {t('cat3AutoCalcDetails')}</h4>
                            <p className="font-medium opacity-90">{t('cat3AutoCalcMethod')}</p>
                            <div className="opacity-80 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('cat3TandDCalculation') }}></div>
                            <p className="mt-2 pt-2 border-t border-blue-100 dark:border-blue-800/50 italic opacity-70" dangerouslySetInnerHTML={{ __html: t('cat3FutureImprovement') }}></p>
                        </div>
                    ) : (
                        <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg text-emerald-900 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-200 text-[11px] leading-relaxed">
                            <h4 className="font-bold text-xs flex items-center gap-2 mb-2"><IconInfo className="w-4 h-4 text-emerald-500" /> {t('cat3GuidanceTitle')}</h4>
                            <ul className="list-disc pl-4 space-y-1 text-gray-700 dark:text-gray-300">
                                <li>{t('cat3GuidanceText')}</li>
                                <li dangerouslySetInnerHTML={{ __html: t('cat3BoundaryNote') }}></li>
                                <li dangerouslySetInnerHTML={{ __html: t('cat3WTTNote') }}></li>
                                <li dangerouslySetInnerHTML={{ __html: t('cat3TandDNote') }}></li>
                                <li dangerouslySetInnerHTML={{ __html: t('cat3AutoCalculation') }}></li>
                            </ul>
                        </div>
                    )}

                    {!source.isAutoGenerated && (
                        <div className="space-y-4">
                            {/* Description & AI Analysis */}
                            <div className="space-y-3">
                                <label htmlFor={`description-${source.id}`} className={commonLabelClass}>{t('emissionSourceDescription')}</label>
                                <div className="flex gap-2">
                                    <input
                                        id={`description-${source.id}`}
                                        type="text"
                                        value={source.description}
                                        onChange={(e) => onUpdate({ description: e.target.value })}
                                        className={commonInputClass}
                                        placeholder={t('fuelEnergyPlaceholder')}
                                    />
                                    <button onClick={handleAnalyze} disabled={isLoadingAI || !source.description} className="shrink-0 px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-md hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 flex items-center gap-2 text-xs shadow-md transition-all active:scale-95">
                                        <IconSparkles className="w-4 h-4" />
                                        <span>{isLoadingAI ? '...' : t('analyzeWithAI')}</span>
                                    </button>
                                </div>

                                {aiAnalysisResult && (
                                    <div className={`p-3 border rounded-lg shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 ${aiAnalysisResult.boundary_warning ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:border-amber-800' : 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800'}`}>
                                        {aiAnalysisResult.boundary_warning && (
                                            <div className="flex items-center gap-2 font-bold mb-2 text-amber-700 dark:text-amber-400">
                                                <IconInfo className="w-4 h-4" />
                                                {t('categoryMismatch')}: {aiAnalysisResult.boundary_warning === 'Scope 1' ? t('cat3Scope1Warning') : aiAnalysisResult.boundary_warning === 'Scope 2' ? t('cat3Scope2Warning') : aiAnalysisResult.boundary_warning}
                                            </div>
                                        )}
                                        <h4 className="font-bold text-xs mb-2 flex items-center gap-1.5">✨ {t('aiAnalysis')}</h4>
                                        <div className="space-y-1.5 opacity-90 text-[11px] leading-relaxed">
                                            <p><span className="font-bold text-gray-600 dark:text-gray-400">{t('suggestedActivityType')}:</span> {aiAnalysisResult.activity_type}</p>
                                            <p><span className="font-bold text-gray-600 dark:text-gray-400">{t('suggestedFuelName')}:</span> {aiAnalysisResult.suggested_fuel_name}</p>
                                            <p><span className="font-bold text-gray-600 dark:text-gray-400">{t('justification')}:</span> {aiAnalysisResult.justification}</p>
                                        </div>
                                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-black/5 dark:border-white/5">
                                            <p className="text-[10px] text-gray-500 italic">{t('aiDisclaimer')}</p>
                                            <button onClick={handleApplySuggestion} className="px-3 py-1 text-[11px] font-bold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-sm transition-all active:scale-95">
                                                {t('applySuggestion')}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Methodology Selection */}
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
                                <div className="flex gap-1 rounded-lg bg-gray-100 dark:bg-gray-900/50 p-1 border border-gray-200 dark:border-gray-800">
                                    {(['supplier_co2e', 'activity'] as CalculationMethod[]).map(method => (
                                        <button
                                            key={method}
                                            onClick={() => handleMethodChange(method)}
                                            className={`flex-1 text-[11px] py-2 px-2 rounded-md transition-all ${source.calculationMethod === method ? 'bg-white dark:bg-gray-700 shadow-sm font-bold text-emerald-600 dark:text-emerald-300' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                                            {t(method === 'activity' ? 'cat3MethodActivity' : 'cat3MethodSupplier')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Supplier CO2e Input */}
                            {source.calculationMethod === 'supplier_co2e' && (
                                <div className="p-4 bg-white dark:bg-gray-900/30 border border-emerald-100 dark:border-emerald-900/20 rounded-xl shadow-sm space-y-3 animate-in fade-in slide-in-from-top-1">
                                    <label htmlFor={`supplier-co2e-${source.id}`} className="block text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                        📥 {t('supplierProvidedCO2e')}
                                    </label>
                                    <div className="relative">
                                        <input
                                            id={`supplier-co2e-${source.id}`}
                                            type="number"
                                            step="any"
                                            value={source.supplierProvidedCO2e === 0 ? '' : source.supplierProvidedCO2e}
                                            onChange={(e) => onUpdate({ supplierProvidedCO2e: parseFloat(e.target.value) || 0 })}
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-emerald-50 dark:border-emerald-900/20 rounded-lg py-2.5 px-3 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all appearance-none"
                                            placeholder="0"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-500">kg CO₂e</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 leading-relaxed italic">
                                        {language === 'ko' ? '* 공급업체로부터 직접 제공받은 WTT/송배전 손실 데이터가 있는 경우 입력하세요.' : '* Enter data provided by suppliers specifically for upstream/T&D emissions.'}
                                    </p>
                                </div>
                            )}

                            {/* Activity Data Selection (Fuel & Unit) */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={commonLabelClass}>{t('fuelType')}</label>
                                    <select value={source.fuelType} onChange={(e) => onFuelTypeChange(e.target.value)} className={commonSelectClass} aria-label="Fuel/Source">
                                        {Array.isArray(fuels) && fuels.map((fuel: CO2eFactorFuel) => (
                                            <option key={fuel.name} value={fuel.name}>
                                                {language === 'ko' && fuel.translationKey ? `${t(fuel.translationKey as TranslationKey)}` : fuel.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={commonLabelClass}>{t('unit')}</label>
                                    {Array.isArray(fuels) && (
                                        <select value={source.unit} onChange={(e) => onUpdate({ unit: e.target.value })} className={commonSelectClass} aria-label="Unit">
                                            {(fuels.find((f: CO2eFactorFuel) => f.name === source.fuelType) as CO2eFactorFuel)?.units.map((unit) => (
                                                <option key={unit} value={unit}>{t(unit as TranslationKey) || unit}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>

                            {/* Monthly Activity Grid / Summary */}
                            <div className="space-y-4 pt-2">
                                <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400">{source.calculationMethod === 'supplier_co2e' ? t('emissions') : t('totalQuantity')}</span>
                                        <span className="text-base font-black text-gray-900 dark:text-white">
                                            {source.calculationMethod === 'supplier_co2e' ? (source.supplierProvidedCO2e || 0).toLocaleString() + ' kg CO₂e' : displayTotalQuantity.toLocaleString() + ' ' + renderUnit(source.unit)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-5">
                                        <div className="flex flex-col items-end gap-0.5">
                                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-500">{source.calculationMethod === 'supplier_co2e' ? t('totalYear') : t('emissions')}</span>
                                            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{(totalEmissions / 1000).toLocaleString('en-US', { minimumFractionDigits: 3 })} t CO₂e</span>
                                        </div>
                                        {!isEditing && source.calculationMethod === 'activity' && (
                                            <button onClick={handleEdit} className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-black hover:bg-emerald-100 dark:hover:bg-emerald-800 transition-all border border-emerald-100 dark:border-emerald-800 shadow-sm active:scale-95">
                                                {t('editMonthly')}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {isEditing && source.calculationMethod === 'activity' && (
                                    <div className="p-4 bg-white dark:bg-gray-800 border-2 border-emerald-100 dark:border-emerald-900/30 rounded-xl shadow-lg animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                            {monthKeys.map((monthKey, index) => (
                                                <div key={monthKey} className="space-y-1">
                                                    <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-300" htmlFor={`quantity-${source.id}-${index}`}>{t(monthKey)}</label>
                                                    <div className="relative">
                                                        <input
                                                            id={`quantity-${source.id}-${index}`}
                                                            type="number"
                                                            step="any"
                                                            onKeyDown={preventNonNumericKeys}
                                                            value={editedQuantities[index] === 0 && editedQuantities[index] !== source.monthlyQuantities[index] ? '0' : (editedQuantities[index] === 0 ? '' : editedQuantities[index])}
                                                            onChange={(e) => handleMonthlyChange(index, e.target.value)}
                                                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 px-2 text-xs font-bold text-gray-900 dark:text-white text-right focus:ring-2 focus:ring-emerald-500 focus:outline-none pr-8 transition-all"
                                                            placeholder="0"
                                                        />
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-400">{renderUnit(source.unit)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
                                            <button onClick={handleCancel} className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors uppercase tracking-wider">{t('cancel')}</button>
                                            <button onClick={handleSave} className="px-6 py-2 text-xs font-black text-white bg-emerald-600 rounded-lg shadow-md hover:bg-emerald-700 active:scale-95 transition-all uppercase tracking-widest">
                                                {t('save')}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <DQISection
                                    dataQualityIndicator={source.dataQualityIndicator}
                                    language={language}
                                    onUpdate={(indicator, rating) => onUpdate({ dataQualityIndicator: indicator, dataQualityRating: rating })}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Methodology Wizard Integration */}
            <MethodologyWizard
                isOpen={showMethodologyWizard}
                onClose={() => setShowMethodologyWizard(false)}
                onSelectMethod={(method) => handleMethodChange(method)}
                currentMethod={source.calculationMethod as CalculationMethod}
                category={source.category}
            />
        </div>
    );
};