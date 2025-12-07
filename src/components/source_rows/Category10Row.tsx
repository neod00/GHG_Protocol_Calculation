
import React, { useState, useEffect } from 'react';
import { EmissionSource, Cat10CalculationMethod, CO2eFactorFuel } from '../../types';
import { useTranslation } from '../../context/LanguageContext';
// FIX: Changed import path to be more explicit.
import { TranslationKey } from '../../translations/index';
import { IconTrash, IconSparkles, IconCheck, IconAlertTriangle, IconInfo, IconFactory, IconX } from '../IconComponents';
import { GoogleGenAI, Type } from '@google/genai';
import { STATIONARY_FUELS, MOBILE_FUELS, SCOPE2_ENERGY_SOURCES } from '../../constants/index';

interface SourceInputRowProps {
    source: EmissionSource;
    onUpdate: (updatedSource: Partial<EmissionSource>) => void;
    onRemove: () => void;
    onFuelTypeChange: (newFuelType: string) => void;
    fuels: any;
    facilities: any[];
    calculateEmissions: (source: EmissionSource) => { scope1: number, scope2Location: number, scope2Market: number, scope3: number };
}

export const Category10Row: React.FC<SourceInputRowProps> = ({ source, onUpdate, onRemove, fuels, calculateEmissions }) => {
    const { t, language } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);

    const totalEmissions = calculateEmissions(source).scope3;
    const commonSelectClass = "w-full bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
    const commonInputClass = "w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
    const commonLabelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

    const calculationMethod: Cat10CalculationMethod = source.calculationMethod as Cat10CalculationMethod || 'process_specific';

    // Ensure default calculation method
    useEffect(() => {
        if (!source.calculationMethod) {
            const defaultProcess = fuels.activity?.[0]?.name || '';
            onUpdate({ calculationMethod: 'process_specific', processingMethod: defaultProcess, unit: 'tonnes' });
        }
    }, []);

    const handleMethodChange = (method: Cat10CalculationMethod) => {
        let updates: Partial<EmissionSource> = { calculationMethod: method };
        if (method === 'spend') {
            updates.unit = 'USD';
            // Default to first spend factor
            if (fuels.spend && fuels.spend.length > 0) {
                updates.fuelType = fuels.spend[0].name;
            }
        } else if (method === 'customer_specific') {
            updates.supplierDataType = source.supplierDataType || 'total_co2e';
            if (updates.supplierDataType === 'total_co2e') {
                updates.unit = 'kg CO₂e';
            } else {
                updates.unit = ''; // Unit varies by energy input
            }
        } else {
            updates.unit = 'tonnes'; // Default for process_specific
        }
        onUpdate(updates);
    };

    const handleSupplierDataTypeChange = (type: 'total_co2e' | 'energy_data') => {
        onUpdate({ supplierDataType: type, unit: type === 'total_co2e' ? 'kg CO₂e' : '' });
    };

    const handleTotalChange = (value: string) => {
        const val = parseFloat(value);
        const newQuantities = Array(12).fill(0);
        newQuantities[0] = isNaN(val) ? 0 : val;
        onUpdate({ monthlyQuantities: newQuantities });
    };

    // --- Energy Input Management for Customer Specific Method ---
    // Combine all potential energy sources for the dropdown
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

    // --- AI Analysis ---
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
            const promptText = `You are a GHG Protocol Scope 3 expert. Analyze this sold product description: "${source.description}" to determine if it falls under Category 10 (Processing of Sold Products).
            
            1. Intermediate Product Check: Is this an intermediate product (e.g., resin, steel sheet, engine) that requires further processing by the customer? Or is it a final product (e.g., toaster, car)?
               - If Final Product -> Category 10 is likely 0 (or N/A). Flag as 'Category 11 (Use)'.
            2. Process Identification: If intermediate, what is the likely downstream processing method? (e.g., Molding, Stamping, Assembly, Heat Treatment).
            3. Boundary Check: 
               - If the processing happens *before* sale (in your factory), flag as 'Scope 1 & 2'.
               - If it's waste treatment of the product after use, flag as 'Category 12'.
            
            Return structured JSON.
            
            IMPORTANT: Respond in ${language === 'ko' ? 'Korean' : 'English'}.`;

            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    is_intermediate_product: { type: Type.BOOLEAN },
                    suggested_process: { type: Type.STRING },
                    boundary_warning: { type: Type.STRING, description: "'Scope 1 & 2', 'Category 11', 'Category 12', or null" },
                    reasoning: { type: Type.STRING },
                    suggested_factor_name: { type: Type.STRING, description: "Match closest to: Chemical Processing, Metal Forging, Rolling, Heat Treatment, Assembly, Molding/Forming, Welding" }
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

        if (aiAnalysisResult.suggested_factor_name) {
            // Try to match suggested process to available activity factors
            const match = fuels.activity.find((p: any) => p.name.toLowerCase().includes(aiAnalysisResult.suggested_factor_name.toLowerCase()) || aiAnalysisResult.suggested_factor_name.toLowerCase().includes(p.name.toLowerCase()));
            if (match) {
                updates.processingMethod = match.name;
                updates.calculationMethod = 'process_specific';
            }
        }

        onUpdate(updates);
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
                    <p className="text-sm font-medium text-ghg-dark dark:text-gray-100 truncate">{source.description || t('processingOfSoldProductsPlaceholder')}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('total')}: {calculationMethod === 'customer_specific' && source.supplierDataType === 'energy_data' ? `${(source.energyInputs || []).length} ${t('energyInputs')}` : `${source.monthlyQuantities.reduce((a, b) => a + b, 0).toLocaleString()} ${source.unit}`} • <span className="font-semibold text-ghg-green">{(totalEmissions / 1000).toLocaleString('en-US', { minimumFractionDigits: 3 })} t CO₂e</span>
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

                    {/* Category 10 Guidance Box */}
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-800 dark:bg-purple-900/30 dark:border-purple-700/50 dark:text-purple-200 text-xs space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2"><IconInfo className="w-4 h-4" /> {t('cat10GuidanceTitle')}</h4>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>{t('cat10GuidanceText')}</li>
                            <li dangerouslySetInnerHTML={{ __html: t('cat10BoundaryNote') }}></li>
                            <li dangerouslySetInnerHTML={{ __html: t('cat10CalculationMethods') }}></li>
                        </ul>
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200">
                            <p className="flex items-start gap-2 mb-1">
                                <IconInfo className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span dangerouslySetInnerHTML={{ __html: t('cat10Scope1Warning') }}></span>
                            </p>
                            <p className="flex items-start gap-2 mb-1">
                                <IconInfo className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span dangerouslySetInnerHTML={{ __html: t('cat10Category11Warning') }}></span>
                            </p>
                            <p className="flex items-start gap-2">
                                <IconInfo className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span dangerouslySetInnerHTML={{ __html: t('cat10Category12Warning') }}></span>
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
                                placeholder={t('processingOfSoldProductsPlaceholder')}
                            />
                            <button onClick={handleAnalyze} disabled={isLoadingAI || !source.description} className="px-3 py-1 bg-ghg-light-green text-white rounded-md hover:bg-ghg-green disabled:bg-gray-400 flex items-center gap-2 text-sm whitespace-nowrap">
                                <IconSparkles className="w-4 h-4" />
                                <span>{isLoadingAI ? '...' : t('analyzeWithAI')}</span>
                            </button>
                        </div>
                    </div>

                    {/* AI Result Panel */}
                    {aiAnalysisResult && (
                        <div className={`p-3 border rounded-lg text-xs ${aiAnalysisResult.boundary_warning || !aiAnalysisResult.is_intermediate_product ? 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200' : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200'}`}>
                            {/* Boundary Warning Header */}
                            {(aiAnalysisResult.boundary_warning || !aiAnalysisResult.is_intermediate_product) && (
                                <div className="space-y-2 mb-2">
                                    <div className="flex items-center gap-2 font-bold text-yellow-700 dark:text-yellow-400">
                                        <IconAlertTriangle className="w-4 h-4" />
                                        {t('boundaryWarning')}: {aiAnalysisResult.boundary_warning || "Not an intermediate product"}
                                    </div>
                                    {aiAnalysisResult.boundary_warning?.includes('Scope 1') && (
                                        <p className="text-xs" dangerouslySetInnerHTML={{ __html: t('cat10Scope1Warning') }}></p>
                                    )}
                                    {aiAnalysisResult.boundary_warning?.includes('Category 11') && (
                                        <p className="text-xs" dangerouslySetInnerHTML={{ __html: t('cat10Category11Warning') }}></p>
                                    )}
                                    {aiAnalysisResult.boundary_warning?.includes('Category 12') && (
                                        <p className="text-xs" dangerouslySetInnerHTML={{ __html: t('cat10Category12Warning') }}></p>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-1">
                                <p><span className="font-semibold">Intermediate Product:</span> {aiAnalysisResult.is_intermediate_product ? 'Yes' : 'No'}</p>
                                <p><span className="font-semibold">{t('suggestedProcess')}:</span> {aiAnalysisResult.suggested_process}</p>
                                <p className="col-span-2 mt-1 italic opacity-80">{aiAnalysisResult.reasoning}</p>
                            </div>

                            <div className="flex justify-end mt-2">
                                {aiAnalysisResult.is_intermediate_product && (
                                    <button onClick={applyAiResult} className="px-2 py-1 bg-white dark:bg-gray-700 border rounded hover:bg-gray-100 dark:hover:bg-gray-600 font-semibold flex items-center gap-1">
                                        <IconCheck className="w-3 h-3" /> {t('applySuggestion')}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Method Selector */}
                    <div>
                        <label className={commonLabelClass}>{t('calculationMethod')}</label>
                        <div className="flex gap-1 rounded-md bg-gray-200 dark:bg-gray-900 p-1 text-xs">
                            {(['process_specific', 'customer_specific', 'spend'] as Cat10CalculationMethod[]).map(method => (
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
                                {calculationMethod === 'process_specific' && (
                                    <p className="flex items-start gap-2">
                                        <IconInfo className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                        <span>{t('cat10MethodProcessSpecific')}</span>
                                    </p>
                                )}
                                {calculationMethod === 'customer_specific' && (
                                    <p className="flex items-start gap-2">
                                        <IconInfo className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                        <span>{t('cat10MethodCustomerSpecific')}</span>
                                    </p>
                                )}
                                {calculationMethod === 'spend' && (
                                    <p className="flex items-start gap-2">
                                        <IconInfo className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                        <span>{t('cat10MethodSpend')}</span>
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* === PROCESS SPECIFIC METHOD === */}
                    {calculationMethod === 'process_specific' && (
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className={commonLabelClass}>{t('processingMethod')}</label>
                                <select value={source.processingMethod} onChange={e => onUpdate({ processingMethod: e.target.value })} className={commonSelectClass}>
                                    {fuels.activity.map((p: any) => <option key={p.name} value={p.name}>{t(p.translationKey)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={commonLabelClass}>{t('totalProcessed')} (tonnes)</label>
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

                    {/* === CUSTOMER SPECIFIC METHOD === */}
                    {calculationMethod === 'customer_specific' && (
                        <div>
                            <div className="flex items-center gap-4 mb-3 p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                                <label className="flex items-center gap-2 text-xs cursor-pointer">
                                    <input
                                        type="radio"
                                        name={`supplierData-${source.id}`}
                                        checked={source.supplierDataType === 'total_co2e'}
                                        onChange={() => handleSupplierDataTypeChange('total_co2e')}
                                        className="text-ghg-green focus:ring-ghg-green"
                                    />
                                    {t('totalCO2e')}
                                </label>
                                <label className="flex items-center gap-2 text-xs cursor-pointer">
                                    <input
                                        type="radio"
                                        name={`supplierData-${source.id}`}
                                        checked={source.supplierDataType === 'energy_data'}
                                        onChange={() => handleSupplierDataTypeChange('energy_data')}
                                        className="text-ghg-green focus:ring-ghg-green"
                                    />
                                    {t('energyConsumptionData')}
                                </label>
                            </div>

                            {source.supplierDataType === 'total_co2e' ? (
                                <div>
                                    <label className={commonLabelClass}>{t('supplierProvidedCO2e')}</label>
                                    <input
                                        type="number"
                                        value={source.supplierProvidedCO2e || ''}
                                        onChange={e => onUpdate({ supplierProvidedCO2e: parseFloat(e.target.value) })}
                                        className={commonInputClass}
                                        placeholder="0"
                                    />
                                </div>
                            ) : (
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
                                        <IconInfo className="w-3 h-3" /> {t('dataQuality')}: {t('qualityHigh')} (Site-specific data)
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* === SPEND METHOD === */}
                    {calculationMethod === 'spend' && (
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className={commonLabelClass}>{t('suggestedSpendCategory')}</label>
                                <select value={source.fuelType} onChange={e => onUpdate({ fuelType: e.target.value })} className={commonSelectClass}>
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

                </div>
            )}
        </div>
    );
};
