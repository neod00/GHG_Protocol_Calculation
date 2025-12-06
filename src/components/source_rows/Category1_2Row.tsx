import React, { useState, useEffect } from 'react';
import { EmissionSource, CalculationMethod, EmissionCategory } from '../../types';
import { useTranslation } from '../../context/LanguageContext';
// FIX: Changed import path to be more explicit.
import { TranslationKey } from '../../translations/index';
import { IconInfo, IconTrash, IconSparkles } from '../IconComponents';
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

export const Category1_2Row: React.FC<SourceInputRowProps> = ({ source, onUpdate, onRemove, calculateEmissions }) => {
    const { t, language } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [editedQuantities, setEditedQuantities] = useState([...source.monthlyQuantities]);

    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);

    useEffect(() => {
        if ((source.category === EmissionCategory.PurchasedGoodsAndServices || source.category === EmissionCategory.CapitalGoods) && !source.calculationMethod) {
            onUpdate({
                calculationMethod: 'spend',
                unit: 'KRW',
                factor: source.factor ?? 0,
                factorUnit: 'kg CO₂e / KRW'
            });
        }
    }, [source.category, source.calculationMethod, source.factor, onUpdate]);

    useEffect(() => {
        if (!isEditing) {
            setEditedQuantities([...source.monthlyQuantities]);
        }
    }, [source.monthlyQuantities, isEditing]);

    const renderUnit = (unit: string) => {
        return t(unit as TranslationKey) || unit;
    };

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
        if (!source.fuelType) return;
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
            const promptText = `You are a GHG accounting expert specializing in Scope 3 emissions according to the GHG Protocol. Analyze the following purchased item description and provide a structured JSON response. Item Description: "${source.fuelType}"
        
        IMPORTANT: Respond in ${language === 'ko' ? 'Korean' : 'English'}.`;
            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    suggested_category: { type: Type.STRING, description: 'The most likely Scope 3 category (e.g., "1. Purchased Goods and Services", "2. Capital Goods", "4. Upstream Transportation and Distribution").' },
                    justification: { type: Type.STRING, description: "A brief explanation for your choice." },
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
            let errorDetails = error instanceof Error ? error.message : String(error);

            try {
                // Attempt to list available models to help debug
                // @ts-ignore
                const response = await ai.models.list();
                // @ts-ignore
                const modelNames = response?.models?.map((m: any) => m.name)?.join(', ') || 'No models found';
                errorDetails += `\n\nAvailable models: ${modelNames}`;
            } catch (listError) {
                console.error("Failed to list models:", listError);
                errorDetails += `\n\nFailed to list models: ${listError instanceof Error ? listError.message : String(listError)}`;
            }

            setAiAnalysisResult({ error: "Failed to analyze.", details: errorDetails });
        } finally {
            setIsLoadingAI(false);
        }
    };

    const totalQuantity = source.monthlyQuantities.reduce((sum, q) => sum + q, 0);
    const totalEmissions = calculateEmissions(source).scope3;
    const monthKeys: TranslationKey[] = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const commonSelectClass = "w-full bg-white text-gray-900 dark:bg-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500";
    const commonLabelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400";

    const preventNonNumericKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (['e', 'E', '+', '-'].includes(e.key)) {
            e.preventDefault();
        }
    };

    const placeholderText = source.category === EmissionCategory.PurchasedGoodsAndServices
        ? t('purchasedGoodsServicesPlaceholder')
        : t('capitalGoodsPlaceholder');

    const handleMethodChange = (method: CalculationMethod) => {
        let updates: Partial<EmissionSource> = { calculationMethod: method };
        if (method === 'spend') {
            updates.unit = 'KRW';
            updates.factorUnit = 'kg CO₂e / KRW';
        } else if (method === 'activity') {
            updates.unit = 'tonnes';
            updates.factorUnit = 'kg CO₂e / tonnes';
        } else if (method === 'supplier_co2e') {
            updates.monthlyQuantities = Array(12).fill(0);
        }
        onUpdate(updates);
    };

    const activityTotal = source.calculationMethod === 'supplier_co2e'
        ? (source.supplierProvidedCO2e ?? 0)
        : source.monthlyQuantities.reduce((sum, q) => sum + q, 0);

    const activityUnit = source.calculationMethod === 'supplier_co2e' ? 'kg CO₂e' : source.unit;

    return (
        <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex justify-between items-center">
                <div className='truncate pr-2'>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{source.fuelType || placeholderText}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('total')}: {activityTotal.toLocaleString()}&nbsp;
                        {renderUnit(activityUnit)} • {(totalEmissions / 1000).toLocaleString('en-US', { minimumFractionDigits: 3 })} t CO₂e
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => setIsExpanded(!isExpanded)} className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                        {isExpanded ? t('cancel') : t('editDetails')}
                    </button>
                    <button onClick={onRemove} className="text-gray-400 hover:text-red-600 p-1 dark:text-gray-500 dark:hover:text-red-500" aria-label={t('removeSourceAria')}>
                        <IconTrash className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {isExpanded && <div className="flex flex-col gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                {source.category === EmissionCategory.PurchasedGoodsAndServices && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 dark:bg-blue-900/30 dark:border-blue-700/50 dark:text-blue-200 text-xs space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2"><IconInfo className="w-4 h-4" /> {t('cat1GuidanceTitle')}</h4>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>{t('cat1GuidanceText')}</li>
                            <li dangerouslySetInnerHTML={{ __html: t('cat1BoundaryNote') }}></li>
                            <li dangerouslySetInnerHTML={{ __html: t('cat1CalculationMethods') }}></li>
                        </ul>
                    </div>
                )}
                {source.category === EmissionCategory.CapitalGoods && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700/50 dark:text-yellow-200 text-xs space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2"><IconInfo className="w-4 h-4" /> {t('capitalGoodsInfoTitle')}</h4>
                        <ul className="list-disc pl-5 space-y-1">
                            <li dangerouslySetInnerHTML={{ __html: t('capitalGoodsInfoDepreciation') }}></li>
                            <li dangerouslySetInnerHTML={{ __html: t('capitalGoodsInfoCategorization') }}></li>
                            <li>{t('capitalGoodsInfoScope')}</li>
                            <li dangerouslySetInnerHTML={{ __html: t('capitalGoodsInfoDistinction') }}></li>
                        </ul>
                    </div>
                )}

                <div>
                    <label htmlFor={`description-${source.id}`} className={commonLabelClass}>{t('emissionSourceDescription')}</label>
                    <div className="flex gap-2">
                        <input
                            id={`description-${source.id}`}
                            type="text"
                            value={source.fuelType}
                            onChange={(e) => onUpdate({ fuelType: e.target.value })}
                            className={commonSelectClass}
                            placeholder={placeholderText}
                        />
                        <button onClick={handleAnalyze} disabled={isLoadingAI || !source.fuelType} className="px-3 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-gray-400 flex items-center gap-2 shadow-sm">
                            <IconSparkles className="w-4 h-4" />
                            <span className="text-sm font-semibold">{isLoadingAI ? '...' : t('analyzeWithAI')}</span>
                        </button>
                    </div>
                </div>
                {aiAnalysisResult && (
                    <div className={`p-3 border rounded-lg text-xs ${(aiAnalysisResult.suggested_category?.includes('2.') && source.category === EmissionCategory.PurchasedGoodsAndServices) ||
                        (aiAnalysisResult.suggested_category?.includes('1.') && source.category === EmissionCategory.CapitalGoods) ||
                        (aiAnalysisResult.suggested_category?.includes('4.') && source.category === EmissionCategory.PurchasedGoodsAndServices)
                        ? 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200'
                        : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200'
                        }`}>
                        {((aiAnalysisResult.suggested_category?.includes('2.') && source.category === EmissionCategory.PurchasedGoodsAndServices) ||
                            (aiAnalysisResult.suggested_category?.includes('1.') && source.category === EmissionCategory.CapitalGoods)) && (
                                <div className="flex items-center gap-2 font-bold mb-2">
                                    <IconInfo className="w-4 h-4" />
                                    {t('categoryMismatch')}: {aiAnalysisResult.suggested_category}
                                </div>
                            )}
                        {aiAnalysisResult.suggested_category?.includes('4.') && source.category === EmissionCategory.PurchasedGoodsAndServices && (
                            <div className="flex items-start gap-2 font-bold mb-2 text-yellow-800 dark:text-yellow-200">
                                <IconInfo className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p>{t('categoryMismatch')}: {aiAnalysisResult.suggested_category}</p>
                                    <p className="text-xs font-normal mt-1" dangerouslySetInnerHTML={{ __html: t('cat1TransportWarning') }}></p>
                                </div>
                            </div>
                        )}
                        <p className="text-xs mb-1"><span className="font-semibold">{t('suggestedCategory')}:</span> {aiAnalysisResult.suggested_category}</p>
                        <p className="text-xs"><span className="font-semibold">{t('justification')}:</span> {aiAnalysisResult.justification}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-300 mt-2 italic">{t('aiDisclaimer')}</p>
                    </div>
                )}
                {/* Error Display with Details */}
                {aiAnalysisResult?.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs whitespace-pre-wrap">
                        <strong>Error:</strong> {aiAnalysisResult.error}
                        <br />
                        <div className="mt-1 font-mono text-[10px] opacity-80">
                            {aiAnalysisResult.details}
                        </div>
                    </div>
                )}

                <div>
                    <label className={commonLabelClass}>{t('calculationMethod')}</label>
                    <div className="flex gap-2 rounded-md bg-gray-100 dark:bg-gray-900 p-1">
                        {(['supplier_co2e', 'activity', 'spend'] as CalculationMethod[]).map(method => (
                            <button
                                key={method}
                                onClick={() => handleMethodChange(method)}
                                className={`flex-1 text-sm py-1 rounded-md transition-colors ${source.calculationMethod === method ? 'bg-white dark:bg-gray-700 shadow font-semibold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'}`}>
                                {t(`${method.startsWith('supplier') ? 'supplier' : method}Method` as TranslationKey)}
                            </button>
                        ))}
                    </div>
                    {source.calculationMethod && (
                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                            {source.calculationMethod === 'supplier_co2e' && (
                                <p className="flex items-start gap-2">
                                    <IconInfo className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    <span>{source.category === EmissionCategory.PurchasedGoodsAndServices ? t('cat1MethodSupplier') : t('cat2MethodSupplier')}</span>
                                </p>
                            )}
                            {source.calculationMethod === 'activity' && (
                                <p className="flex items-start gap-2">
                                    <IconInfo className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    <span>{source.category === EmissionCategory.PurchasedGoodsAndServices ? t('cat1MethodActivity') : t('cat2MethodActivity')}</span>
                                </p>
                            )}
                            {source.calculationMethod === 'spend' && (
                                <p className="flex items-start gap-2">
                                    <IconInfo className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    <span>{source.category === EmissionCategory.PurchasedGoodsAndServices ? t('cat1MethodSpend') : t('cat2MethodSpend')}</span>
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {source.category === EmissionCategory.CapitalGoods && (
                    <>
                        <div>
                            <label htmlFor={`capital-goods-type-${source.id}`} className={commonLabelClass}>{t('capitalGoodsType')}</label>
                            <select
                                id={`capital-goods-type-${source.id}`}
                                value={source.capitalGoodsType || ''}
                                onChange={(e) => onUpdate({ capitalGoodsType: e.target.value as any || undefined })}
                                className={commonSelectClass}
                            >
                                <option value="">Select...</option>
                                <option value="Building">{t('capitalGoodsTypeBuilding')}</option>
                                <option value="Vehicle">{t('capitalGoodsTypeVehicle')}</option>
                                <option value="ManufacturingEquipment">{t('capitalGoodsTypeManufacturingEquipment')}</option>
                                <option value="ITEquipment">{t('capitalGoodsTypeITEquipment')}</option>
                                <option value="OfficeEquipment">{t('capitalGoodsTypeOfficeEquipment')}</option>
                                <option value="Other">{t('capitalGoodsTypeOther')}</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor={`acquisition-year-${source.id}`} className={commonLabelClass}>{t('acquisitionYear')}</label>
                            <input
                                id={`acquisition-year-${source.id}`}
                                type="text"
                                value={source.acquisitionYear || ''}
                                onChange={(e) => onUpdate({ acquisitionYear: e.target.value })}
                                className={commonSelectClass}
                                placeholder={t('acquisitionYearPlaceholder')}
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('acquisitionYearNote')}</p>
                        </div>
                    </>
                )}
                {source.calculationMethod === 'supplier_co2e' && (
                    <div>
                        <label htmlFor={`supplier-co2e-${source.id}`} className={commonLabelClass}>{t('supplierProvidedCO2e')}</label>
                        <input
                            id={`supplier-co2e-${source.id}`}
                            type="number" step="any"
                            value={source.supplierProvidedCO2e ?? ''}
                            onChange={(e) => onUpdate({ supplierProvidedCO2e: parseFloat(e.target.value) || 0 })}
                            className={commonSelectClass} placeholder="0"
                        />
                    </div>
                )}
                {(source.calculationMethod === 'activity' || source.calculationMethod === 'spend') && (<>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label htmlFor={`factor-${source.id}`} className={commonLabelClass}>{t('emissionFactor')}</label>
                            <input
                                id={`factor-${source.id}`}
                                type="number" step="any"
                                value={source.factor ?? ''}
                                onChange={(e) => onUpdate({ factor: parseFloat(e.target.value) || 0 })}
                                className={commonSelectClass} placeholder="0"
                            />
                        </div>
                        <div>
                            <label htmlFor={`factor-unit-${source.id}`} className={commonLabelClass}>{t('factorUnit')}</label>
                            <input
                                id={`factor-unit-${source.id}`}
                                type="text"
                                value={source.factorUnit ?? ''}
                                onChange={(e) => onUpdate({ factorUnit: e.target.value })}
                                className={commonSelectClass} placeholder="kg CO₂e / unit"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor={`factor-source-${source.id}`} className={commonLabelClass}>{t('factorSource')}</label>
                        <input
                            id={`factor-source-${source.id}`}
                            type="text"
                            value={source.factorSource ?? ''}
                            onChange={(e) => onUpdate({ factorSource: e.target.value })}
                            className={commonSelectClass} placeholder={t('factorSourcePlaceholder')}
                        />
                    </div>
                    {source.category === EmissionCategory.PurchasedGoodsAndServices && (
                        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200 text-xs">
                            <p className="flex items-start gap-2">
                                <IconInfo className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span dangerouslySetInnerHTML={{ __html: t('cat1TransportWarning') }}></span>
                            </p>
                        </div>
                    )}
                </>)}

                <div>
                    <label htmlFor={`activityDataSource-${source.id}`} className={commonLabelClass}>{t('activityDataSource')}</label>
                    <input
                        id={`activityDataSource-${source.id}`}
                        type="text"
                        value={source.activityDataSource ?? ''}
                        onChange={(e) => onUpdate({ activityDataSource: e.target.value })}
                        className={commonSelectClass} placeholder={t('activityDataSourcePlaceholder')}
                    />
                </div>
                <div>
                    <label htmlFor={`quality-${source.id}`} className={commonLabelClass}>{t('dataQuality')}</label>
                    <select
                        id={`quality-${source.id}`}
                        value={source.dataQualityRating ?? ''}
                        // @ts-ignore
                        onChange={(e) => onUpdate({ dataQualityRating: e.target.value })}
                        className={commonSelectClass}
                    >
                        <option value="" disabled>Select...</option>
                        <option value="high">{t('qualityHigh')}</option>
                        <option value="medium">{t('qualityMedium')}</option>
                        <option value="low">{t('qualityLow')}</option>
                        <option value="estimated">{t('qualityEstimated')}</option>
                    </select>
                </div>

                <div>
                    <label htmlFor={`assumptions-${source.id}`} className={commonLabelClass}>{t('assumptionsNotes')}</label>
                    <textarea
                        id={`assumptions-${source.id}`}
                        value={source.assumptions ?? ''}
                        onChange={(e) => onUpdate({ assumptions: e.target.value })}
                        className={`${commonSelectClass} min-h-[60px]`}
                        placeholder={t('assumptionsNotesPlaceholder')}
                    />
                </div>

                <div className="mt-2">
                    <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-900/50 p-2 rounded-md">
                        <div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('totalYear')}: </span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{totalQuantity.toLocaleString()}&nbsp;{renderUnit(source.unit)}</span>
                        </div>
                        {!isEditing && (
                            <button onClick={handleEdit} disabled={source.calculationMethod === 'supplier_co2e'} className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed">
                                {t('editMonthly')}
                            </button>
                        )}
                    </div>
                    {isEditing && (
                        <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-900/50 rounded-b-lg">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {monthKeys.map((monthKey, index) => (
                                    <div key={monthKey}>
                                        <label className={commonLabelClass} htmlFor={`quantity-${source.id}-${index}`}>{t(monthKey)}</label>
                                        <div className={`flex items-center rounded-md shadow-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus-within:ring-1 focus-within:ring-emerald-500 focus-within:border-emerald-500 overflow-hidden`}>
                                            <input
                                                id={`quantity-${source.id}-${index}`}
                                                type="number"
                                                onKeyDown={preventNonNumericKeys}
                                                value={editedQuantities[index] === 0 ? '' : editedQuantities[index]}
                                                onChange={(e) => handleMonthlyChange(index, e.target.value)}
                                                className="w-0 flex-grow bg-transparent text-gray-900 dark:text-white py-1 px-2 text-sm text-right focus:outline-none"
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
                                <button onClick={handleCancel} className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600">{t('cancel')}</button>
                                <button onClick={handleSave} className="px-3 py-1 text-sm font-medium text-white bg-emerald-600 rounded-md shadow-sm hover:bg-emerald-700">{t('save')}</button>
                            </div>
                        </div>
                    )}
                </div>

            </div>}
        </div>
    );
};