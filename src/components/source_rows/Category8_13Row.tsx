
import React, { useState, useEffect } from 'react';
import { EmissionSource, Cat8CalculationMethod, LeasedAssetType, BuildingType } from '../../types';
import { useTranslation } from '../../context/LanguageContext';
// FIX: Changed import path to be more explicit.
import { TranslationKey } from '../../translations/index';
import { IconTrash, IconX, IconSparkles, IconCheck, IconAlertTriangle, IconBuilding, IconCar, IconFactory } from '../IconComponents';


interface SourceInputRowProps {
    source: EmissionSource;
    onUpdate: (updatedSource: Partial<EmissionSource>) => void;
    onRemove: () => void;
    onFuelTypeChange: (newFuelType: string) => void;
    fuels: any;
    facilities: any[];
    calculateEmissions: (source: EmissionSource) => { scope1: number, scope2Location: number, scope2Market: number, scope3: number };
}

export const Category8_13Row: React.FC<SourceInputRowProps> = ({ source, onUpdate, onRemove, fuels, calculateEmissions }) => {
    const { t, language } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);


    const totalEmissions = calculateEmissions(source).scope3;
    const commonSelectClass = "w-full bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
    const commonInputClass = "w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
    const commonLabelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

    const calculationMethod: Cat8CalculationMethod = source.calculationMethod as Cat8CalculationMethod || 'asset_specific';

    // Ensure default values
    useEffect(() => {
        if (!source.calculationMethod) {
            onUpdate({ calculationMethod: 'asset_specific', leasedAssetType: 'Building', buildingType: 'Office', leaseDurationMonths: 12 });
        }
    }, []);

    const handleMethodChange = (method: Cat8CalculationMethod) => {
        let updates: Partial<EmissionSource> = { calculationMethod: method };
        if (method === 'spend_based') {
            updates.unit = 'USD';
            if (fuels.spend_based && fuels.spend_based.length > 0) {
                updates.fuelType = fuels.spend_based[0].name;
            }
        } else if (method === 'supplier_specific') {
            updates.unit = 'kg CO₂e';
        } else {
            updates.unit = ''; // Unit varies by energy input or area
        }
        onUpdate(updates);
    };

    const addEnergyInput = () => {
        const defaultFuel = fuels.asset_specific_fuels?.[0];
        if (!defaultFuel) return;
        const newInputs = [...(source.energyInputs || []), { id: `input-${Date.now()}`, type: defaultFuel.name, value: 0, unit: defaultFuel.units[0] }];
        onUpdate({ energyInputs: newInputs });
    };

    const updateEnergyInput = (id: string, update: { type?: string, value?: number, unit?: string }) => {
        const newInputs = (source.energyInputs || []).map(input => {
            if (input.id === id) {
                const updatedInput = { ...input, ...update };
                if (update.type) {
                    const fuelData = fuels.asset_specific_fuels.find((f: any) => f.name === update.type);
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
                    {t('areaSqm')} × {t('emissionFactor')} (kWh/m²/yr) × {t('gridElectricity')} Factor × ({source.leaseDurationMonths || 12}/12)
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
                    <div className="flex items-center gap-2">
                        {source.leasedAssetType === 'Building' && <IconBuilding className="w-4 h-4 text-gray-500" />}
                        {source.leasedAssetType === 'Vehicle' && <IconCar className="w-4 h-4 text-gray-500" />}
                        {source.leasedAssetType === 'Equipment' && <IconFactory className="w-4 h-4 text-gray-500" />}
                        <p className="text-sm font-medium text-ghg-dark dark:text-gray-100 truncate">{source.description || t('upstreamLeasedAssetsPlaceholder')}</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {calculationMethod === 'asset_specific' && `${(source.energyInputs || []).length} ${t('energyInputs')} • `}
                        {calculationMethod === 'area_based' && `${source.areaSqm || 0} m² • `}
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
                                placeholder={t('upstreamLeasedAssetsPlaceholder')}
                            />
                        </div>
                    </div>

                    {/* Method Selector */}
                    <div>
                        <label className={commonLabelClass}>{t('calculationMethod')}</label>
                        <div className="flex gap-1 rounded-md bg-gray-200 dark:bg-gray-900 p-1 text-xs">
                            {(['asset_specific', 'area_based', 'spend_based', 'supplier_specific']).map(method => (
                                <button
                                    key={method}
                                    onClick={() => handleMethodChange(method as Cat8CalculationMethod)}
                                    className={`flex-1 py-1 px-2 rounded-md transition-colors whitespace-nowrap ${calculationMethod === method ? 'bg-white dark:bg-gray-700 shadow font-semibold text-ghg-green' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                                >
                                    {t(`${method}Method` as TranslationKey)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Asset Type Config */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className={commonLabelClass}>{t('leasedAssetType')}</label>
                            <select value={source.leasedAssetType} onChange={e => onUpdate({ leasedAssetType: e.target.value as LeasedAssetType })} className={commonSelectClass}>
                                {(['Building', 'Vehicle', 'Equipment'] as LeasedAssetType[]).map(type => <option key={type} value={type}>{t(type)}</option>)}
                            </select>
                        </div>
                        {calculationMethod !== 'supplier_specific' && (
                            <div>
                                <label className={commonLabelClass}>{t('leaseDurationMonths')}</label>
                                <input
                                    type="number" min="1" max="12"
                                    value={source.leaseDurationMonths || 12}
                                    onChange={e => onUpdate({ leaseDurationMonths: Math.min(12, Math.max(1, parseInt(e.target.value))) })}
                                    className={commonInputClass}
                                />
                            </div>
                        )}
                    </div>

                    {/* === ASSET SPECIFIC (Energy Inputs) === */}
                    {calculationMethod === 'asset_specific' && (
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
                                            {fuels.asset_specific_fuels?.map((f: any) => <option key={f.name} value={f.name}>{t(f.translationKey)}</option>)}
                                        </select>
                                        <input
                                            type="number"
                                            value={input.value}
                                            onChange={e => updateEnergyInput(input.id, { value: parseFloat(e.target.value) })}
                                            onKeyDown={preventNonNumericKeys}
                                            className={`${commonInputClass} py-1 h-8`}
                                            placeholder="Annual Qty"
                                        />
                                        <select value={input.unit} onChange={e => updateEnergyInput(input.id, { unit: e.target.value })} className={`${commonSelectClass} py-1 w-20 h-8`}>
                                            {fuels.asset_specific_fuels?.find((f: any) => f.name === input.type)?.units.map((u: string) => <option key={u} value={u}>{t(u as TranslationKey)}</option>)}
                                        </select>
                                        <button onClick={() => removeEnergyInput(input.id)} className="text-gray-400 hover:text-red-500 p-1"><IconX className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* === AREA BASED === */}
                    {calculationMethod === 'area_based' && (
                        <div className="space-y-2">
                            {source.leasedAssetType === 'Building' ? (
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className={commonLabelClass}>{t('buildingType')}</label>
                                        <select value={source.buildingType} onChange={e => onUpdate({ buildingType: e.target.value as BuildingType })} className={commonSelectClass}>
                                            {['Office', 'Warehouse', 'Factory', 'Retail', 'DataCenter'].map(type => <option key={type} value={type}>{t(`buildingType${type}` as TranslationKey)}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={commonLabelClass}>{t('areaSqm')}</label>
                                        <input type="number" value={source.areaSqm || ''} onChange={e => onUpdate({ areaSqm: parseFloat(e.target.value) })} className={commonInputClass} />
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-yellow-600 p-2 bg-yellow-50 rounded">{t('cat8VehicleGuidance')}</p>
                            )}
                            <p className="text-xs text-gray-500">{t('cat8AreaGuidance')}</p>
                            {renderCalculationLogic()}
                        </div>
                    )}

                    {/* === SPEND BASED === */}
                    {calculationMethod === 'spend_based' && (
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className={commonLabelClass}>{t('serviceType')}</label>
                                <select value={source.fuelType} onChange={e => onUpdate({ fuelType: e.target.value })} className={commonSelectClass}>
                                    {fuels.spend_based && fuels.spend_based.map((f: any) => <option key={f.name} value={f.name}>{t(f.translationKey)}</option>)}
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
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        const arr = Array(12).fill(0);
                                        arr[0] = isNaN(val) ? 0 : val;
                                        onUpdate({ monthlyQuantities: arr });
                                    }}
                                    onKeyDown={preventNonNumericKeys}
                                    className={commonInputClass}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    )}

                    {/* === SUPPLIER SPECIFIC === */}
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
                        </div>
                    )}

                </div>
            )}
        </div>
    );
};
