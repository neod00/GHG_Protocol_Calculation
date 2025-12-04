import React, { useState, useEffect, useMemo } from 'react';
import { EmissionSource, Facility, Refrigerant, CO2eFactorFuel, EmissionCategory } from '../../types';
import { useTranslation } from '../../context/LanguageContext';
// FIX: Changed import path to be more explicit.
import { TranslationKey } from '../../translations/index';
import { IconTrash } from '../IconComponents';

interface SourceInputRowProps {
  source: EmissionSource;
  onUpdate: (updatedSource: Partial<EmissionSource>) => void;
  onRemove: () => void;
  onFuelTypeChange: (newFuelType: string) => void;
  fuels: any;
  facilities: Facility[];
  calculateEmissions: (source: EmissionSource) => { scope1: number, scope2Location: number, scope2Market: number, scope3: number };
}

const getPlaceholderKey = (category: EmissionCategory): TranslationKey => {
  switch (category) {
    case EmissionCategory.FugitiveEmissions:
      return 'fugitiveDescriptionPlaceholder';
    case EmissionCategory.ProcessEmissions:
      return 'processDescriptionPlaceholder';
    case EmissionCategory.MobileCombustion:
      return 'mobileDescriptionPlaceholder';
    case EmissionCategory.Waste: // Scope 1 Waste
      return 'wasteDescriptionPlaceholder';
    case EmissionCategory.PurchasedEnergy:
      return 'energyDescriptionPlaceholder';
    case EmissionCategory.StationaryCombustion:
    default:
      return 'emissionSourceDescriptionPlaceholder';
  }
}

export const DefaultRow: React.FC<SourceInputRowProps> = ({ source, onUpdate, onRemove, onFuelTypeChange, fuels, facilities, calculateEmissions }) => {
  const { t, language } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuantities, setEditedQuantities] = useState([...source.monthlyQuantities]);
  const [provideMarketData, setProvideMarketData] = useState(typeof source.marketBasedFactor !== 'undefined');

  useEffect(() => {
    if (!isEditing) {
      setEditedQuantities([...source.monthlyQuantities]);
    }
  }, [source.monthlyQuantities, isEditing]);

  const renderUnit = (unit: string) => {
    if (unit === 'cubic meters') {
      return <span>m<sup>3</sup></span>;
    }
    return t(unit as TranslationKey) || unit;
  };

  const handleMonthlyChange = (monthIndex: number, value: string) => {
    const newQuantities = [...editedQuantities];
    newQuantities[monthIndex] = parseFloat(value) || 0;
    setEditedQuantities(newQuantities);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = () => {
    onUpdate({ monthlyQuantities: editedQuantities });
    setIsEditing(false);
  };

  const handleMarketFactorChange = (value: string) => {
    onUpdate({ marketBasedFactor: parseFloat(value) || 0 });
  };

  const toggleMarketData = () => {
    const isProviding = !provideMarketData;
    setProvideMarketData(isProviding);
    if (!isProviding) {
      const { marketBasedFactor, ...rest } = source;
      onUpdate({ ...rest, marketBasedFactor: undefined });
    } else {
      onUpdate({ marketBasedFactor: 0 });
    }
  };

  const totalQuantity = source.monthlyQuantities.reduce((sum, q) => sum + q, 0);
  const emissionResults = calculateEmissions(source);
  const totalEmissions = emissionResults.scope1 + emissionResults.scope2Location + emissionResults.scope2Market + emissionResults.scope3;
  const monthKeys: TranslationKey[] = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const commonSelectClass = "w-full bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
  const commonInputClass = "w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
  const commonLabelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400";
  const placeholderKey = getPlaceholderKey(source.category);

  const groupedFacilities = useMemo(() => {
    const groups: { [key: string]: Facility[] } = {};
    const ungrouped: Facility[] = [];
    const corporate: Facility[] = [];

    facilities.forEach(f => {
      if (f.isCorporate) {
        corporate.push(f);
        return;
      }
      const groupKey = f.group || '';
      if (groupKey) {
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(f);
      } else {
        ungrouped.push(f);
      }
    });

    return { groups, ungrouped, corporate };
  }, [facilities]);

  const preventNonNumericKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600">
      <div className="flex items-start gap-2">
        <div className="w-1/3">
          <label className={commonLabelClass} htmlFor={`facility-${source.id}`}>{t('facility')}</label>
          <select
            id={`facility-${source.id}`}
            value={source.facilityId}
            onChange={(e) => onUpdate({ facilityId: e.target.value })}
            className={commonSelectClass}
          >
            {Object.keys(groupedFacilities.groups).map(group => (
              <optgroup label={group} key={group}>
                {groupedFacilities.groups[group].map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </optgroup>
            ))}
            {groupedFacilities.ungrouped.length > 0 && (
              <optgroup label={t('ungroupedFacilities')}>
                {groupedFacilities.ungrouped.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </optgroup>
            )}
            {groupedFacilities.corporate.length > 0 && (
              <optgroup label={t('corporateLevelFacility')}>
                {groupedFacilities.corporate.map(f => <option key={f.id} value={f.id}>{t('corporateLevelFacility')}</option>)}
              </optgroup>
            )}
          </select>
        </div>
        <div className="flex-grow">
          <label htmlFor={`description-${source.id}`} className={commonLabelClass}>{t('emissionSourceDescription')}</label>
          <input
            id={`description-${source.id}`}
            type="text"
            value={source.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            className={commonInputClass}
            placeholder={t(placeholderKey)}
          />
        </div>
        <div className="pt-5">
          <button onClick={onRemove} className="text-gray-400 hover:text-red-600 p-1 dark:text-gray-500 dark:hover:text-red-500" aria-label={t('removeSourceAria')}>
            <IconTrash className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select value={source.fuelType} onChange={(e) => onFuelTypeChange(e.target.value)} className={commonSelectClass} aria-label="Fuel/Source">
          {Array.isArray(fuels) && fuels.map((fuel: Refrigerant | CO2eFactorFuel) => (
            <option key={fuel.name} value={fuel.name}>
              {language === 'ko' && fuel.translationKey ? `${t(fuel.translationKey as TranslationKey)}` : fuel.name}
            </option>
          ))}
        </select>
        {Array.isArray(fuels) && 'units' in (fuels.find((f: CO2eFactorFuel | Refrigerant) => f.name === source.fuelType) || {}) &&
          <select value={source.unit} onChange={(e) => onUpdate({ unit: e.target.value })} className={commonSelectClass} aria-label="Unit">
            {(fuels.find((f: CO2eFactorFuel) => f.name === source.fuelType) as CO2eFactorFuel)?.units.map((unit) => (
              <option key={unit} value={unit}>{t(unit as TranslationKey) || unit}</option>
            ))}
          </select>
        }
      </div>

      {source.category === EmissionCategory.PurchasedEnergy && (
        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <label className="flex items-center space-x-2 text-sm text-blue-800 dark:text-blue-200">
            <input type="checkbox" checked={provideMarketData} onChange={toggleMarketData} className="rounded text-ghg-green focus:ring-ghg-green" />
            <span>{t('provideMarketData')}</span>
          </label>
          {provideMarketData && (
            <div className="mt-2">
              <label htmlFor={`market-factor-${source.id}`} className="block text-xs font-medium text-blue-700 dark:text-blue-300">{t('marketFactor')}</label>
              <div className="flex items-center gap-2">
                <input
                  id={`market-factor-${source.id}`}
                  type="number"
                  step="any"
                  value={source.marketBasedFactor ?? ''}
                  onChange={(e) => handleMarketFactorChange(e.target.value)}
                  className={`${commonInputClass} mt-1`}
                />
                <span className="mt-1 text-xs text-blue-600 dark:text-blue-400 whitespace-nowrap">
                  kg CO₂e / {renderUnit(source.unit)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-2">
        <div className={`flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 ${isEditing ? 'rounded-t-lg' : 'rounded-lg'}`}>
          <div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('totalYear')}: </span>
            <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{totalQuantity.toLocaleString()}&nbsp;{renderUnit(source.unit)}</span>
          </div>
          <div className='flex items-center gap-4'>
            <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{(totalEmissions / 1000).toLocaleString('en-US', { minimumFractionDigits: 3 })} t CO₂e</span>

            {!isEditing && (
              <button onClick={handleEdit} className="text-sm text-ghg-green font-semibold hover:underline">
                {t('editMonthly')}
              </button>
            )}
          </div>
        </div>

        {isEditing && (
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