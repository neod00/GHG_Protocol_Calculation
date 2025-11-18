import React, { useState } from 'react';
import { EmissionSource, Cat7CalculationMethod, EmployeeCommutingMode } from '../../types';
import { useTranslation } from '../../LanguageContext';
// FIX: Changed import path to be more explicit.
import { TranslationKey } from '../../translations/index';
import { IconTrash } from '../IconComponents';

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
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    
    const totalEmissions = calculateEmissions(source).scope3;
    const commonSelectClass = "w-full bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
    const commonLabelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400";
    
    const calculationMethod: Cat7CalculationMethod = source.calculationMethod as Cat7CalculationMethod || 'activity';

    const activityTotalDisplay = () => {
        return `${(totalEmissions / 1000).toLocaleString('en-US', { minimumFractionDigits: 3 })} t CO₂e`;
    };

    return (
        <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600">
            {/* Compact View */}
            <div className="flex justify-between items-center">
                <div className='truncate pr-2'>
                    <p className="text-sm font-medium text-ghg-dark dark:text-gray-100 truncate">{source.description || t('employeeCommutingPlaceholder')}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activityTotalDisplay()}</p>
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
                        <label className={commonLabelClass}>{t('commutingMode')}</label>
                        <select value={source.commutingMode} onChange={e => onUpdate({ commutingMode: e.target.value as EmployeeCommutingMode })} className={commonSelectClass}>
                            {Object.keys(fuels.activity).map(mode => <option key={mode} value={mode}>{t(mode as TranslationKey)}</option>)}
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
};