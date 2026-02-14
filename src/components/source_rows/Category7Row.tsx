
import React, { useState, useEffect } from 'react';
import { EmissionSource, Cat7CalculationMethod, EmployeeCommutingMode, PersonalCarType, PublicTransportType, EmissionCategory, DataQualityIndicator } from '../../types';
import { useTranslation } from '../../context/LanguageContext';
import { TranslationKey } from '../../translations/index';
import { IconTrash, IconSparkles, IconCheck, IconAlertTriangle, IconInfo, IconUsers } from '../IconComponents';
import { GoogleGenAI, Type } from '@google/genai';
import { DQISection } from '../DQISection';
import { MethodologyWizard } from '../MethodologyWizard';


interface SourceInputRowProps {
    source: EmissionSource;
    onUpdate: (updatedSource: Partial<EmissionSource>) => void;
    onRemove: () => void;
    onFuelTypeChange: (newFuelType: string) => void;
    fuels: any;
    facilities: any[];
    calculateEmissions: (source: EmissionSource) => { scope1: number, scope2Location: number, scope2Market: number, scope3: number };
}

export const Category7Row: React.FC<SourceInputRowProps> = ({ source, onUpdate, onRemove, fuels, calculateEmissions }) => {
    const { t, language } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    // DQI update handler
    const handleDQIUpdate = (indicator: DataQualityIndicator, rating: 'high' | 'medium' | 'low' | 'estimated') => {
        onUpdate({ dataQualityIndicator: indicator });
    };


    const totalEmissions = calculateEmissions(source).scope3;
    const commonSelectClass = "w-full bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
    const commonInputClass = "w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
    const commonLabelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

    const calculationMethod: Cat7CalculationMethod = source.calculationMethod as Cat7CalculationMethod || 'activity';

    // Ensure default values
    useEffect(() => {
        if (!source.calculationMethod) {
            onUpdate({
                calculationMethod: 'activity',
                commutingMode: 'PersonalCar',
                personalCarType: 'Gasoline',
                carpoolOccupancy: 1,
                daysPerYear: 240,
                unit: 'km'
            });
        }
    }, []);

    const handleMethodChange = (method: Cat7CalculationMethod) => {
        let updates: Partial<EmissionSource> = { calculationMethod: method };
        if (method === 'spend') {
            updates.unit = 'USD';
            if (fuels.spend && fuels.spend.length > 0) {
                updates.fuelType = fuels.spend[0].name;
            }
        } else {
            updates.unit = 'km'; // For activity and average
        }
        // Update mode distribution for average method to ensure calculator works
        if (method === 'average') {
            const modeKey = `${source.commutingMode || 'PersonalCar'}_${source.personalCarType || 'Gasoline'}`;
            updates.modeDistribution = { [modeKey]: 100 };
        }
        onUpdate(updates);
    };

    const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const mode = e.target.value as EmployeeCommutingMode;
        const updates: Partial<EmissionSource> = { commutingMode: mode };

        // Set default sub-type
        if (mode === 'PersonalCar' || mode === 'Carpool') {
            updates.personalCarType = 'Gasoline';
        } else if (mode === 'PublicTransport') {
            updates.publicTransportType = 'Bus';
        }

        // Reset carpool occupancy if not carpool
        if (mode !== 'Carpool') {
            updates.carpoolOccupancy = 1;
        }

        // Update distribution for average method
        if (calculationMethod === 'average') {
            const subType = updates.personalCarType || source.personalCarType || 'Gasoline'; // Simplify for update
            const modeKey = `${mode}_${subType}`;
            updates.modeDistribution = { [modeKey]: 100 };
        }

        onUpdate(updates);
    };

    const handleSubTypeChange = (val: string) => {
        const updates: Partial<EmissionSource> = {};
        if (source.commutingMode === 'PersonalCar' || source.commutingMode === 'Carpool') {
            updates.personalCarType = val as PersonalCarType;
        } else if (source.commutingMode === 'PublicTransport') {
            updates.publicTransportType = val as PublicTransportType;
        }

        // Update distribution for average method
        if (calculationMethod === 'average') {
            const mode = source.commutingMode || 'PersonalCar';
            const modeKey = `${mode}_${val}`;
            updates.modeDistribution = { [modeKey]: 100 };
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
            const promptText = `You are a GHG Protocol Scope 3 expert. Analyze this employee commuting description: "${source.description}".
            
            1. Extract Commuting Details: Home location, Workplace location, Mode (PersonalCar, Carpool, PublicTransport, Motorbike, BicycleWalking).
            2. Determine Sub-type:
               - If PersonalCar/Carpool: Fuel type (Gasoline, Diesel, Electric, Hybrid, LPG).
               - If PublicTransport: Type (Bus, Subway).
            3. Estimate Distance: Calculate the estimated one-way distance in km.
            4. Boundary Check (CRITICAL): 
               - If it describes business travel (e.g., client meetings, conferences), flag as 'Category 6'.
               - If it implies a company-owned vehicle where company pays for fuel, flag as 'Scope 1'.
               - If it describes teleworking/working from home, note that it should be excluded.
            
            Return structured JSON.
            
            IMPORTANT: Respond in ${language === 'ko' ? 'Korean' : 'English'}.`;

            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    mode: { type: Type.STRING, description: 'PersonalCar, Carpool, PublicTransport, Motorbike, BicycleWalking' },
                    sub_type: { type: Type.STRING, description: 'Specific fuel or type (e.g., Gasoline, Bus)' },
                    home_location: { type: Type.STRING },
                    workplace_location: { type: Type.STRING },
                    estimated_distance_km: { type: Type.NUMBER },
                    carpool_occupancy: { type: Type.NUMBER, description: 'Number of people per vehicle for carpool' },
                    boundary_warning: { type: Type.STRING, description: "'Category 6' or 'Scope 1' or null" },
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

        if (aiAnalysisResult.home_location) updates.origin = aiAnalysisResult.home_location;
        if (aiAnalysisResult.workplace_location) updates.destination = aiAnalysisResult.workplace_location;
        if (aiAnalysisResult.estimated_distance_km) updates.distanceKm = aiAnalysisResult.estimated_distance_km;
        if (aiAnalysisResult.carpool_occupancy) updates.carpoolOccupancy = aiAnalysisResult.carpool_occupancy;

        if (aiAnalysisResult.mode && Object.keys(fuels.activity).includes(aiAnalysisResult.mode)) {
            updates.commutingMode = aiAnalysisResult.mode as EmployeeCommutingMode;

            // Auto-select sub-type based on AI suggestion
            if (aiAnalysisResult.mode === 'PersonalCar' || aiAnalysisResult.mode === 'Carpool') {
                const availableTypes = Object.keys(fuels.activity.PersonalCar || {});
                if (availableTypes.length > 0) {
                    let matchedType = availableTypes[0];
                    if (aiAnalysisResult.sub_type) {
                        const found = availableTypes.find(t => t.toLowerCase().includes(aiAnalysisResult.sub_type.toLowerCase()) || aiAnalysisResult.sub_type.toLowerCase().includes(t.toLowerCase()));
                        if (found) matchedType = found;
                    }
                    updates.personalCarType = matchedType as PersonalCarType;
                }
            } else if (aiAnalysisResult.mode === 'PublicTransport') {
                const availableTypes = Object.keys(fuels.activity.PublicTransport || {});
                if (availableTypes.length > 0) {
                    let matchedType = availableTypes[0];
                    if (aiAnalysisResult.sub_type) {
                        const found = availableTypes.find(t => t.toLowerCase().includes(aiAnalysisResult.sub_type.toLowerCase()) || aiAnalysisResult.sub_type.toLowerCase().includes(t.toLowerCase()));
                        if (found) matchedType = found;
                    }
                    updates.publicTransportType = matchedType as PublicTransportType;
                }
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
        if (calculationMethod === 'average') {
            return (
                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300 font-mono">
                    {t('calculationLogic')}: <br />
                    {t('totalEmployees')} × (1 - {source.percentTeleworking || 0}%) × {t('distance')} × 2 × {t('commutingDaysPerYear')} × {t('emissionFactor')}
                </div>
            );
        } else if (calculationMethod === 'activity') {
            return (
                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300 font-mono">
                    {t('calculationLogic')}: <br />
                    {t('distance')} × 2 × {t('commutingDaysPerYear')} × {t('emissionFactor')}
                    {source.commutingMode === 'Carpool' ? ` ÷ ${source.carpoolOccupancy} (${t('carpoolOccupancy')})` : ''}
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
                    <p className="text-sm font-medium text-ghg-dark dark:text-gray-100 truncate">{source.description || t('employeeCommutingPlaceholder')}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {calculationMethod === 'average' && `${source.totalEmployees || 0} ${t('totalEmployees')} • `}
                        <span className="font-semibold text-ghg-green">{(totalEmissions / 1000).toLocaleString('en-US', { minimumFractionDigits: 3 })} t CO₂e</span>
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

                    {/* Category 7 Guidance Box */}
                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-800 dark:bg-indigo-900/30 dark:border-indigo-700/50 dark:text-indigo-200 text-xs space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2"><IconInfo className="w-4 h-4" /> {t('cat7GuidanceTitle')}</h4>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>{t('cat7GuidanceText')}</li>
                            <li dangerouslySetInnerHTML={{ __html: t('cat7BoundaryNote') }}></li>
                            <li dangerouslySetInnerHTML={{ __html: t('cat7CalculationMethods') }}></li>
                        </ul>
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200">
                            <p className="flex items-start gap-2 mb-1">
                                <IconInfo className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span dangerouslySetInnerHTML={{ __html: t('cat7Scope1Warning') }}></span>
                            </p>
                            <p className="flex items-start gap-2">
                                <IconInfo className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span dangerouslySetInnerHTML={{ __html: t('cat7Category6Warning') }}></span>
                            </p>
                        </div>
                        {(source.commutingMode === 'Carpool') && (
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200">
                                <p className="text-xs" dangerouslySetInnerHTML={{ __html: t('cat7CarpoolNote') }}></p>
                            </div>
                        )}
                        {calculationMethod === 'average' && (
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200">
                                <p className="text-xs" dangerouslySetInnerHTML={{ __html: t('cat7TeleworkingNote') }}></p>
                            </div>
                        )}
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
                                placeholder={t('employeeCommutingPlaceholder')}
                            />
                            <button onClick={handleAnalyze} disabled={isLoadingAI || !source.description} className="px-3 py-1 bg-ghg-light-green text-white rounded-md hover:bg-ghg-green disabled:bg-gray-400 flex items-center gap-2 text-sm whitespace-nowrap">
                                <IconSparkles className="w-4 h-4" />
                                <span>{isLoadingAI ? '...' : t('analyzeWithAI')}</span>
                            </button>
                        </div>
                    </div>

                    {/* AI Result Panel */}
                    {aiAnalysisResult && (
                        <div className={`p-3 border rounded-lg text-xs ${aiAnalysisResult.boundary_warning ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200' : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200'}`}>
                            {aiAnalysisResult.boundary_warning && (
                                <div className="flex items-center gap-2 font-bold mb-2">
                                    <IconAlertTriangle className="w-4 h-4" />
                                    {t('boundaryWarning')}: {aiAnalysisResult.boundary_warning}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-1">
                                {aiAnalysisResult.home_location && <p><span className="font-semibold">{t('origin')}:</span> {aiAnalysisResult.home_location}</p>}
                                {aiAnalysisResult.workplace_location && <p><span className="font-semibold">{t('destination')}:</span> {aiAnalysisResult.workplace_location}</p>}
                                {aiAnalysisResult.mode && <p><span className="font-semibold">{t('commutingMode')}:</span> {aiAnalysisResult.mode}</p>}
                                {aiAnalysisResult.estimated_distance_km && <p><span className="font-semibold">{t('estimatedDistance')}:</span> {aiAnalysisResult.estimated_distance_km} km</p>}
                                {aiAnalysisResult.sub_type && <p><span className="font-semibold">{t('type')}:</span> {aiAnalysisResult.sub_type}</p>}
                                {aiAnalysisResult.carpool_occupancy && <p><span className="font-semibold">{t('carpoolOccupancy')}:</span> {aiAnalysisResult.carpool_occupancy}</p>}
                            </div>

                            <div className="flex justify-end mt-2">
                                <button onClick={applyAiResult} className="px-2 py-1 bg-white dark:bg-gray-700 border rounded hover:bg-gray-100 dark:hover:bg-gray-600 font-semibold flex items-center gap-1">
                                    <IconCheck className="w-3 h-3" /> {t('applySuggestion')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Method Selector */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className={commonLabelClass}>{t('calculationMethod')}</label>
                            <button
                                onClick={() => setIsWizardOpen(true)}
                                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-800 transition-all hover:shadow-sm"
                            >
                                <span>📊</span>
                                {language === 'ko' ? '방법론 선택 가이드' : 'Methodology Guide'}
                            </button>
                        </div>
                        <div className="flex gap-1 rounded-md bg-gray-200 dark:bg-gray-900 p-1 text-xs">
                            {(['activity', 'average', 'spend']).map(method => (
                                <button
                                    key={method}
                                    onClick={() => handleMethodChange(method as Cat7CalculationMethod)}
                                    className={`flex-1 py-1 px-2 rounded-md transition-colors whitespace-nowrap ${calculationMethod === method ? 'bg-white dark:bg-gray-700 shadow font-semibold text-ghg-green' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                                >
                                    {t(`${method}Method` as TranslationKey)}
                                </button>
                            ))}
                        </div>
                        {/* Calculation Method Descriptions */}
                        {calculationMethod === 'activity' && (
                            <p className="text-xs text-gray-500 mt-1" dangerouslySetInnerHTML={{ __html: t('cat7MethodActivity') }}></p>
                        )}
                        {calculationMethod === 'average' && (
                            <p className="text-xs text-gray-500 mt-1" dangerouslySetInnerHTML={{ __html: t('cat7MethodAverage') }}></p>
                        )}
                        {calculationMethod === 'spend' && (
                            <p className="text-xs text-gray-500 mt-1" dangerouslySetInnerHTML={{ __html: t('cat7MethodSpend') }}></p>
                        )}
                    </div>

                    {/* === ACTIVITY & AVERAGE INPUTS === */}
                    {calculationMethod !== 'spend' && (
                        <>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className={commonLabelClass}>{t('commutingMode')}</label>
                                    <select value={source.commutingMode} onChange={handleModeChange} className={commonSelectClass}>
                                        {Object.keys(fuels.activity).map(mode => <option key={mode} value={mode}>{t(mode as TranslationKey)}</option>)}
                                    </select>
                                </div>
                                {/* Sub-type Selection */}
                                {(source.commutingMode === 'PersonalCar' || source.commutingMode === 'Carpool') && (
                                    <div>
                                        <label className={commonLabelClass}>{t('vehicleType')}</label>
                                        <select value={source.personalCarType} onChange={e => handleSubTypeChange(e.target.value)} className={commonSelectClass}>
                                            {Object.keys(fuels.activity.PersonalCar).map(type => <option key={type} value={type}>{t(fuels.activity.PersonalCar[type].translationKey)}</option>)}
                                        </select>
                                    </div>
                                )}
                                {source.commutingMode === 'PublicTransport' && (
                                    <div>
                                        <label className={commonLabelClass}>{t('type')}</label>
                                        <select value={source.publicTransportType} onChange={e => handleSubTypeChange(e.target.value)} className={commonSelectClass}>
                                            {Object.keys(fuels.activity.PublicTransport).map(type => <option key={type} value={type}>{t(fuels.activity.PublicTransport[type].translationKey)}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="p-3 border border-dashed border-gray-300 rounded-md dark:border-gray-600 bg-gray-50 dark:bg-gray-800/30">
                                {/* Average Method Specifics */}
                                {calculationMethod === 'average' && (
                                    <div className="grid grid-cols-2 gap-2 mb-2 border-b pb-2 border-gray-200 dark:border-gray-600">
                                        <div>
                                            <label className={commonLabelClass}>{t('totalEmployees')}</label>
                                            <div className="relative">
                                                <IconUsers className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                                                <input type="number" value={source.totalEmployees || ''} onChange={e => onUpdate({ totalEmployees: parseInt(e.target.value) })} className={`${commonInputClass} pl-8`} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={commonLabelClass}>{t('percentTeleworking')}</label>
                                            <div className="flex items-center gap-2">
                                                <input type="number" min="0" max="100" value={source.percentTeleworking || 0} onChange={e => onUpdate({ percentTeleworking: parseFloat(e.target.value) })} className={commonInputClass} />
                                                <span className="text-xs">%</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className={commonLabelClass}>{t('oneWayCommuteDistance')} (km)</label>
                                        <input type="number" value={source.distanceKm || ''} onChange={e => onUpdate({ distanceKm: parseFloat(e.target.value) })} className={commonInputClass} />
                                    </div>
                                    <div>
                                        <label className={commonLabelClass}>{t('commutingDaysPerYear')}</label>
                                        <input type="number" value={source.daysPerYear || 240} onChange={e => onUpdate({ daysPerYear: parseInt(e.target.value) })} className={commonInputClass} />
                                    </div>
                                </div>

                                {(source.commutingMode === 'Carpool' || source.commutingMode === 'PersonalCar') && (
                                    <div className="mt-2">
                                        <label className={commonLabelClass}>{t('carpoolOccupancy')}</label>
                                        <div className="flex items-center gap-2">
                                            <input type="range" min="1" max="5" step="0.1" value={source.carpoolOccupancy || 1} onChange={e => onUpdate({ carpoolOccupancy: parseFloat(e.target.value) })} className="w-full accent-ghg-green" />
                                            <span className="text-sm font-bold w-8 text-center">{source.carpoolOccupancy || 1}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 text-right">1 = Solo Driver</p>
                                    </div>
                                )}
                            </div>
                            {renderCalculationLogic()}
                        </>
                    )}

                    {/* === SPEND METHOD === */}
                    {calculationMethod === 'spend' && (
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className={commonLabelClass}>{t('serviceType')}</label>
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
                    {/* DQI Section */}
                    <DQISection
                        dataQualityIndicator={source.dataQualityIndicator}
                        language={language}
                        onUpdate={handleDQIUpdate}
                    />

                </div>
            )}

            {/* Methodology Wizard Modal */}
            <MethodologyWizard
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                category={EmissionCategory.EmployeeCommuting}
                onSelectMethod={(method) => handleMethodChange(method as Cat7CalculationMethod)}
            />
        </div>
    );
};
