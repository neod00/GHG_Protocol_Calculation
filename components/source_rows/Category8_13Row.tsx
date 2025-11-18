import React, { useState } from 'react';
import { EmissionSource, Cat8CalculationMethod, LeasedAssetType } from '../../types';
import { useTranslation } from '../../LanguageContext';
// FIX: Changed import path to be more explicit.
import { TranslationKey } from '../../translations/index';
import { IconTrash, IconX } from '../IconComponents';

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
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    
    const totalEmissions = calculateEmissions(source).scope3;
    const commonSelectClass = "w-full bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
    const commonInputClass = "w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
    const commonLabelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400";
    
    const calculationMethod: Cat8CalculationMethod = source.calculationMethod as Cat8CalculationMethod || 'asset_specific';

    const addEnergyInput = () => {
        const newInputs = [...(source.energyInputs || []), { id: `input-${Date.now()}`, type: fuels.asset_specific_fuels[0].name, value: 0, unit: fuels.asset_specific_fuels[0].units[0] }];
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
    
    return (
        <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600">
            {/* Compact View */}
            <div className="flex justify-between items-center">
                <div className='truncate pr-2'>
                    <p className="text-sm font-medium text-ghg-dark dark:text-gray-100 truncate">{source.description || t('upstreamLeasedAssetsPlaceholder')}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(totalEmissions / 1000).toLocaleString('en-US', { minimumFractionDigits: 3 })} t CO₂e
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
                    <div>
                        <label className={commonLabelClass}>{t('leasedAssetType')}</label>
                        <select value={source.leasedAssetType} onChange={e => onUpdate({ leasedAssetType: e.target.value as LeasedAssetType })} className={commonSelectClass}>
                            {(['Building', 'Vehicle', 'Equipment'] as LeasedAssetType[]).map(type => <option key={type} value={type}>{t(type)}</option>)}
                        </select>
                    </div>
                    {source.leasedAssetType === 'Building' && calculationMethod === 'asset_specific' && (
                        <div>
                             <h4 className="text-sm font-medium mt-2 mb-1">{t('energyInputs')}</h4>
                             <div className="space-y-2">
                                {(source.energyInputs || []).map(input => (
                                    <div key={input.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-end p-2 bg-gray-100 dark:bg-gray-700 rounded">
                                        <select value={input.type} onChange={e => updateEnergyInput(input.id, { type: e.target.value })} className={commonSelectClass}>
                                            {fuels.asset_specific_fuels.map((f: any) => <option key={f.name} value={f.name}>{t(f.translationKey)}</option>)}
                                        </select>
                                        <input type="number" value={input.value} onChange={e => updateEnergyInput(input.id, { value: parseFloat(e.target.value) })} className={commonInputClass} />
                                         <select value={input.unit} onChange={e => updateEnergyInput(input.id, { unit: e.target.value })} className={commonSelectClass}>
                                            {fuels.asset_specific_fuels.find((f: any) => f.name === input.type)?.units.map((u: string) => <option key={u} value={u}>{t(u as TranslationKey)}</option>)}
                                        </select>
                                        <button onClick={() => removeEnergyInput(input.id)}><IconX className="w-4 h-4 text-gray-500" /></button>
                                    </div>
                                ))}
                             </div>
                             <button onClick={addEnergyInput} className="mt-2 text-sm text-ghg-green font-semibold hover:underline">{t('addEnergyInput')}</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};