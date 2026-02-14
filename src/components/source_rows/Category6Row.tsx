
import React, { useState, useEffect } from 'react';
import { EmissionSource, Cat6CalculationMethod, BusinessTravelMode, FlightClass, TripType, EmissionCategory, DataQualityIndicator } from '../../types';
import { useTranslation } from '../../context/LanguageContext';
import { TranslationKey } from '../../translations/index';
import { IconTrash, IconSparkles, IconCheck, IconAlertTriangle, IconPlane, IconBuilding, IconInfo } from '../IconComponents';
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

export const Category6Row: React.FC<SourceInputRowProps> = ({ source, onUpdate, onRemove, fuels, calculateEmissions }) => {
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

    const calculationMethod: Cat6CalculationMethod = source.calculationMethod as Cat6CalculationMethod || 'activity';

    // Ensure default calculation method and default values
    useEffect(() => {
        if (!source.calculationMethod) {
            onUpdate({ calculationMethod: 'activity', unit: 'passenger-km', businessTravelMode: 'Air', flightClass: 'Economy' });
        } else if (source.calculationMethod === 'activity' && source.businessTravelMode !== 'Air' && !source.fuelType && fuels?.activity?.[source.businessTravelMode || 'Rail']) {
            // Auto-select first sub-type if missing for non-Air modes to prevent 0 emissions
            const firstType = Object.keys(fuels.activity[source.businessTravelMode || 'Rail'])[0];
            if (firstType) onUpdate({ fuelType: firstType });
        }
    }, []);

    const handleMethodChange = (method: Cat6CalculationMethod) => {
        let updates: Partial<EmissionSource> = { calculationMethod: method };
        if (method === 'activity') {
            updates.unit = source.businessTravelMode === 'Hotel' ? 'night' : 'passenger-km';
        } else if (method === 'fuel') {
            updates.unit = 'liters';
            // Default to first fuel type for cars
            if (source.businessTravelMode === 'RentalCar' || source.businessTravelMode === 'PersonalCar') {
                const carTypes = Object.keys(fuels.activity[source.businessTravelMode] || {});
                if (carTypes.length > 0) {
                    updates.fuelType = carTypes[0];
                }
            }
        } else if (method === 'spend') {
            updates.unit = 'USD';
            // Default to first spend factor
            if (fuels.spend && fuels.spend.length > 0) {
                updates.fuelType = fuels.spend[0].name;
            }
        } else if (method === 'supplier_specific') {
            updates.unit = 'kg CO₂e';
        }
        onUpdate(updates);
    };

    const handleTotalChange = (value: string) => {
        const val = parseFloat(value);
        // Update the annual total by setting the first month and resetting others
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
            const promptText = `You are a GHG Protocol Scope 3 expert. Analyze this business travel description: "${source.description}".
            
            1. Extract Trip Details: Origin, Destination, Mode (Air, Rail, Bus, RentalCar, PersonalCar, Hotel).
            2. Determine Sub-type:
               - If Air: Flight Class (Economy, Business, First).
               - If PersonalCar/RentalCar: Fuel type (Gasoline, Diesel, Electric, Hybrid, LPG).
               - If Rail: Type (National Rail, High-speed Rail, Subway).
            3. Estimate Distance: Calculate the estimated one-way distance in km.
            4. Boundary Check (CRITICAL): 
               - If it describes commuting (home to work), flag as 'Category 7'.
               - If it implies a company-owned vehicle (e.g. "Company fleet"), flag as 'Scope 1'.
            
            Return structured JSON.
            
            IMPORTANT: Respond in ${language === 'ko' ? 'Korean' : 'English'}.`;

            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    mode: { type: Type.STRING, description: 'Air, Rail, Bus, RentalCar, PersonalCar, Hotel' },
                    sub_type: { type: Type.STRING, description: 'Specific fuel or type (e.g., Gasoline, High-speed Rail)' },
                    origin: { type: Type.STRING },
                    destination: { type: Type.STRING },
                    flight_class: { type: Type.STRING, description: 'Economy, Business, First' },
                    estimated_distance_km: { type: Type.NUMBER },
                    number_of_nights: { type: Type.NUMBER, description: "For hotels" },
                    boundary_warning: { type: Type.STRING, description: "'Category 7' or 'Scope 1' or null" },
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

        if (aiAnalysisResult.origin) updates.origin = aiAnalysisResult.origin;
        if (aiAnalysisResult.destination) updates.destination = aiAnalysisResult.destination;
        if (aiAnalysisResult.estimated_distance_km) updates.distanceKm = aiAnalysisResult.estimated_distance_km;
        if (aiAnalysisResult.number_of_nights && aiAnalysisResult.mode === 'Hotel') updates.nights = aiAnalysisResult.number_of_nights;

        if (aiAnalysisResult.mode && Object.keys(fuels.activity).includes(aiAnalysisResult.mode)) {
            updates.businessTravelMode = aiAnalysisResult.mode as BusinessTravelMode;

            // Auto-select sub-type based on AI suggestion or default to first available
            if (aiAnalysisResult.mode !== 'Air') {
                const availableTypes = Object.keys(fuels.activity[aiAnalysisResult.mode] || {});
                if (availableTypes.length > 0) {
                    // Try to match AI sub_type (fuzzy match)
                    let matchedType = availableTypes[0];
                    if (aiAnalysisResult.sub_type) {
                        const found = availableTypes.find(t => t.toLowerCase().includes(aiAnalysisResult.sub_type.toLowerCase()) || aiAnalysisResult.sub_type.toLowerCase().includes(t.toLowerCase()));
                        if (found) matchedType = found;
                    }
                    updates.fuelType = matchedType;
                }
            }
        }

        if (aiAnalysisResult.flight_class && ['Economy', 'Business', 'First'].includes(aiAnalysisResult.flight_class)) {
            updates.flightClass = aiAnalysisResult.flight_class as FlightClass;
        }

        onUpdate(updates);
    };

    const activityTotalDisplay = () => {
        switch (calculationMethod) {
            case 'activity':
                if (source.businessTravelMode === 'Hotel') {
                    return `${(source.nights || 0)} ${t('night')}`;
                }
                return `${(source.distanceKm || 0).toLocaleString()} km`;
            case 'fuel':
                return `${(source.fuelConsumptionLiters || 0).toLocaleString()} L`;
            case 'spend':
                return `${source.monthlyQuantities.reduce((a, b) => a + b, 0).toLocaleString()} ${source.unit}`;
            case 'supplier_specific':
                return `${(source.supplierProvidedCO2e || 0).toLocaleString()} kg CO₂e`;
            default:
                return '-';
        }
    };

    const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newMode = e.target.value as BusinessTravelMode;
        const updates: Partial<EmissionSource> = { businessTravelMode: newMode };

        // Automatically set a default sub-type/fuelType to avoid 0 emissions
        if (newMode === 'Air') {
            updates.flightClass = 'Economy';
        } else if (fuels.activity[newMode]) {
            // Select the first available type for this mode
            const firstType = Object.keys(fuels.activity[newMode])[0];
            if (firstType) {
                updates.fuelType = firstType;
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
                    <p className="text-sm font-medium text-ghg-dark dark:text-gray-100 truncate">{source.description || t('businessTravelPlaceholder')}</p>
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

                    {/* Category 6 Guidance Box */}
                    <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg text-cyan-800 dark:bg-cyan-900/30 dark:border-cyan-700/50 dark:text-cyan-200 text-xs space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2"><IconInfo className="w-4 h-4" /> {t('cat6GuidanceTitle')}</h4>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>{t('cat6GuidanceText')}</li>
                            <li dangerouslySetInnerHTML={{ __html: t('cat6BoundaryNote') }}></li>
                            <li dangerouslySetInnerHTML={{ __html: t('cat6CalculationMethods') }}></li>
                        </ul>
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200">
                            <p className="flex items-start gap-2 mb-1">
                                <IconInfo className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span dangerouslySetInnerHTML={{ __html: t('cat6Scope1Warning') }}></span>
                            </p>
                            <p className="flex items-start gap-2">
                                <IconInfo className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span dangerouslySetInnerHTML={{ __html: t('cat6Category7Warning') }}></span>
                            </p>
                        </div>
                        {(source.businessTravelMode === 'Air') && (
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200">
                                <p className="text-xs" dangerouslySetInnerHTML={{ __html: t('cat6AirDistanceNote') }}></p>
                            </div>
                        )}
                        {(source.businessTravelMode === 'RentalCar' || source.businessTravelMode === 'PersonalCar') && (
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200">
                                <p className="text-xs" dangerouslySetInnerHTML={{ __html: t('cat6VehicleCountNote') }}></p>
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
                                placeholder={t('businessTravelPlaceholder')}
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
                                <p><span className="font-semibold">{t('origin')}:</span> {aiAnalysisResult.origin}</p>
                                <p><span className="font-semibold">{t('destination')}:</span> {aiAnalysisResult.destination}</p>
                                <p><span className="font-semibold">{t('suggestedTravelMode')}:</span> {aiAnalysisResult.mode}</p>
                                {aiAnalysisResult.mode === 'Hotel' ? (
                                    <p><span className="font-semibold">{t('nights')}:</span> {aiAnalysisResult.number_of_nights}</p>
                                ) : (
                                    <p><span className="font-semibold">{t('estimatedDistance')}:</span> {aiAnalysisResult.estimated_distance_km} km</p>
                                )}
                                {aiAnalysisResult.sub_type && <p><span className="font-semibold">{t('suggestedTravelType')}:</span> {aiAnalysisResult.sub_type}</p>}
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
                            {(['activity', 'fuel', 'spend', 'supplier_specific']).map(method => {
                                const isFuelDisabled = method === 'fuel' && source.businessTravelMode !== 'RentalCar' && source.businessTravelMode !== 'PersonalCar';
                                return (
                                    <button
                                        key={method}
                                        onClick={() => handleMethodChange(method as Cat6CalculationMethod)}
                                        className={`flex-1 py-1 px-2 rounded-md transition-colors whitespace-nowrap ${calculationMethod === method
                                                ? 'bg-white dark:bg-gray-700 shadow font-semibold text-ghg-green'
                                                : isFuelDisabled
                                                    ? 'opacity-40 cursor-not-allowed text-gray-400 dark:text-gray-600 line-through'
                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                                            }`}
                                        disabled={isFuelDisabled}
                                        title={isFuelDisabled ? (language === 'ko' ? '연료 기반은 렌터카/자가용에만 적용 가능합니다' : 'Fuel-based is only for Rental/Personal Car') : undefined}
                                    >
                                        {t(`${method}Method` as TranslationKey)}
                                    </button>
                                );
                            })}
                        </div>
                        {calculationMethod === 'activity' && (source.businessTravelMode === 'RentalCar' || source.businessTravelMode === 'PersonalCar') && (
                            <p className="text-xs text-gray-500 mt-1" dangerouslySetInnerHTML={{ __html: t('cat6FuelBasedNote') }}></p>
                        )}
                    </div>

                    {/* === ACTIVITY METHOD === */}
                    {calculationMethod === 'activity' && (
                        <>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className={commonLabelClass}>{t('businessTravelMode')}</label>
                                    <select value={source.businessTravelMode} onChange={handleModeChange} className={commonSelectClass}>
                                        {Object.keys(fuels.activity).map(mode => <option key={mode} value={mode}>{t(mode as TranslationKey)}</option>)}
                                    </select>
                                </div>
                                {source.businessTravelMode !== 'Hotel' && (
                                    <div>
                                        <label className={commonLabelClass}>{t('vehicle')}/{t('type')}</label>
                                        {/* Logic to select subtype based on mode */}
                                        {source.businessTravelMode === 'Air' ? (
                                            <select value={source.flightClass} onChange={e => onUpdate({ flightClass: e.target.value as FlightClass })} className={commonSelectClass}>
                                                <option value="Economy">{t('Economy')}</option>
                                                <option value="Business">{t('Business')}</option>
                                                <option value="First">{t('First')}</option>
                                            </select>
                                        ) : (
                                            <select value={source.fuelType || ''} onChange={e => onUpdate({ fuelType: e.target.value })} className={commonSelectClass}>
                                                {!source.fuelType && <option value="" disabled>{t('type')}</option>}
                                                {(() => {
                                                    const mode = source.businessTravelMode;
                                                    if (!mode || !fuels.activity[mode]) return null;
                                                    return Object.keys(fuels.activity[mode]).map(type => {
                                                        const item = fuels.activity[mode][type];
                                                        if (item?.factor !== undefined) return <option key={type} value={type}>{t(item.translationKey)}</option>;
                                                        return null;
                                                    });
                                                })()}
                                            </select>
                                        )}
                                    </div>
                                )}
                                {source.businessTravelMode === 'Hotel' && (
                                    <div>
                                        <label className={commonLabelClass}>{t('serviceType')}</label>
                                        <select value={source.fuelType || ''} onChange={e => onUpdate({ fuelType: e.target.value })} className={commonSelectClass}>
                                            {Object.keys(fuels.activity.Hotel).map(type => <option key={type} value={type}>{t(fuels.activity.Hotel[type].translationKey)}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Route & Distance (Not for Hotel) */}
                            {source.businessTravelMode !== 'Hotel' && (
                                <div className="p-3 border border-dashed border-gray-300 rounded-md dark:border-gray-600 bg-gray-50 dark:bg-gray-800/30">
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <input type="text" value={source.origin || ''} onChange={e => onUpdate({ origin: e.target.value })} className={commonInputClass} placeholder={t('origin')} />
                                        <input type="text" value={source.destination || ''} onChange={e => onUpdate({ destination: e.target.value })} className={commonInputClass} placeholder={t('destination')} />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="col-span-1">
                                            <label className={commonLabelClass}>{t('tripType')}</label>
                                            <select value={source.tripType} onChange={e => onUpdate({ tripType: e.target.value as TripType })} className={commonSelectClass}>
                                                <option value="round-trip">{t('roundTrip')}</option>
                                                <option value="one-way">{t('oneWay')}</option>
                                            </select>
                                        </div>
                                        <div className="col-span-1">
                                            <label className={commonLabelClass}>{t('oneWayDistance')} (km)</label>
                                            <input type="number" value={source.distanceKm || ''} onChange={e => onUpdate({ distanceKm: parseFloat(e.target.value) })} className={commonInputClass} />
                                        </div>
                                        {(source.businessTravelMode === 'RentalCar' || source.businessTravelMode === 'PersonalCar') ? (
                                            <div className="col-span-1">
                                                <label className={commonLabelClass}>{t('vehicleCount') || '차량 대수'} (vehicles)</label>
                                                <input type="number" value={source.vehicleCount || 1} onChange={e => onUpdate({ vehicleCount: parseInt(e.target.value) || 1 })} className={commonInputClass} min="1" />
                                            </div>
                                        ) : (
                                            <div className="col-span-1">
                                                <label className={commonLabelClass}>{t('passengers')}</label>
                                                <input type="number" value={source.passengers || 1} onChange={e => onUpdate({ passengers: parseInt(e.target.value) })} className={commonInputClass} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Hotel Specific Inputs */}
                            {source.businessTravelMode === 'Hotel' && (
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className={commonLabelClass}>{t('nights')}</label>
                                        <input type="number" value={source.nights || ''} onChange={e => onUpdate({ nights: parseFloat(e.target.value) })} className={commonInputClass} />
                                    </div>
                                    <div>
                                        <label className={commonLabelClass}>{t('passengers')}</label>
                                        <input type="number" value={source.passengers || 1} onChange={e => onUpdate({ passengers: parseInt(e.target.value) })} className={commonInputClass} />
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* === FUEL METHOD === */}
                    {calculationMethod === 'fuel' && (
                        <>
                            {(source.businessTravelMode === 'RentalCar' || source.businessTravelMode === 'PersonalCar') ? (
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className={commonLabelClass}>{t('businessTravelMode')}</label>
                                        <select value={source.businessTravelMode} onChange={handleModeChange} className={commonSelectClass}>
                                            <option value="RentalCar">{t('RentalCar')}</option>
                                            <option value="PersonalCar">{t('PersonalCar')}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={commonLabelClass}>{t('fuelType')}</label>
                                        <select value={source.fuelType || ''} onChange={e => onUpdate({ fuelType: e.target.value })} className={commonSelectClass}>
                                            {(() => {
                                                const mode = source.businessTravelMode;
                                                if (!mode || !fuels.activity[mode]) return null;
                                                return Object.keys(fuels.activity[mode]).map(type => {
                                                    const item = fuels.activity[mode][type];
                                                    if (item?.factor !== undefined && (type.includes('Gasoline') || type.includes('Diesel'))) {
                                                        return <option key={type} value={type}>{t(item.translationKey)}</option>;
                                                    }
                                                    return null;
                                                });
                                            })()}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={commonLabelClass}>{t('fuelConsumption') || '연료 소비량'} (L)</label>
                                        <input
                                            type="number"
                                            value={source.fuelConsumptionLiters || ''}
                                            onChange={e => onUpdate({ fuelConsumptionLiters: parseFloat(e.target.value) })}
                                            className={commonInputClass}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className={commonLabelClass}>{t('vehicleCount') || '차량 대수'} (vehicles)</label>
                                        <input
                                            type="number"
                                            value={source.vehicleCount || 1}
                                            onChange={e => onUpdate({ vehicleCount: parseInt(e.target.value) || 1 })}
                                            className={commonInputClass}
                                            min="1"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200 text-xs">
                                    <p>{t('cat6FuelBasedNote')}</p>
                                </div>
                            )}
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

                    {/* === SUPPLIER SPECIFIC METHOD === */}
                    {calculationMethod === 'supplier_specific' && (
                        <div className="p-3 border rounded-md dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
                            <label className={commonLabelClass}>{t('supplierProvidedCO2e')}</label>
                            <input
                                type="number"
                                value={source.supplierProvidedCO2e || ''}
                                onChange={e => onUpdate({ supplierProvidedCO2e: parseFloat(e.target.value) })}
                                className={commonInputClass}
                                placeholder="0"
                            />
                            <p className="text-xs text-gray-500 mt-1">{t('qualityHigh')}</p>
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
                category={EmissionCategory.BusinessTravel}
                onSelectMethod={(method) => handleMethodChange(method as Cat6CalculationMethod)}
            />
        </div>
    );
};
