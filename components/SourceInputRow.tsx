import React, { useState } from 'react';
import { EmissionSource, Fuel, Facility, Refrigerant, CO2eFactorFuel, EmissionCategory } from '../types';
import { useTranslation } from '../LanguageContext';
import { TranslationKey } from '../translations';
import { IconInfo } from './IconComponents';
import { GWP_VALUES } from '../constants';

interface SourceInputRowProps {
  source: EmissionSource;
  onUpdate: (updatedSource: Partial<EmissionSource>) => void;
  onRemove: () => void;
  onFuelTypeChange: (newFuelType: string) => void;
  fuels: (Fuel | Refrigerant | CO2eFactorFuel)[];
  facilities: Facility[];
  calculateEmissions: (source: EmissionSource) => { scope1: number, scope2Location: number, scope2Market: number, biogenic: number };
}

export const SourceInputRow: React.FC<SourceInputRowProps> = ({ source, onUpdate, onRemove, onFuelTypeChange, fuels, facilities, calculateEmissions }) => {
  const { t, language } = useTranslation();
  const selectedFuel = fuels.find(f => f.name === source.fuelType);
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuantities, setEditedQuantities] = useState([...source.monthlyQuantities]);
  const [provideMarketData, setProvideMarketData] = useState(typeof source.marketBasedFactor !== 'undefined');

  const handleMonthlyChange = (monthIndex: number, value: string) => {
    const newQuantities = [...editedQuantities];
    newQuantities[monthIndex] = parseFloat(value) || 0;
    setEditedQuantities(newQuantities);
  };
  
  const handleEdit = () => {
    setEditedQuantities([...source.monthlyQuantities]);
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
  const totalEmissions = emissionResults.scope1 + emissionResults.scope2Market;
  
  const isFugitive = selectedFuel && 'gwp' in selectedFuel;
  const isCombustion = selectedFuel && 'factors' in selectedFuel && typeof Object.values(selectedFuel.factors)[0] === 'object';
  
  const getCalculationDetails = () => {
      if (isFugitive) {
        const gwp = (selectedFuel as Refrigerant).gwp;
        return (
          <>
            <span className="font-bold">{t('calculationLogic')}:</span><br/>
            {totalQuantity.toLocaleString()} kg ({t('activityData')})<br/>
            &times; {gwp.toLocaleString()} (GWP)<br/>
            = {(totalEmissions).toLocaleString('en-US', {maximumFractionDigits: 2})} kg CO₂e
          </>
        );
      }
      if (isCombustion) {
        const fuel = selectedFuel as Fuel;
        const factors = fuel.factors[source.unit];
        return (
          <>
            <span className="font-bold">{t('calculationLogic')}:</span><br/>
            CO₂: {totalQuantity.toLocaleString()} {source.unit} &times; {factors.co2} kg/unit = {(totalQuantity * factors.co2).toLocaleString()} kg<br/>
            CH₄: {totalQuantity.toLocaleString()} {source.unit} &times; {factors.ch4} kg/unit &times; {GWP_VALUES.ch4} GWP = {(totalQuantity * factors.ch4 * GWP_VALUES.ch4).toLocaleString()} kg CO₂e<br/>
            N₂O: {totalQuantity.toLocaleString()} {source.unit} &times; {factors.n2o} kg/unit &times; {GWP_VALUES.n2o} GWP = {(totalQuantity * factors.n2o * GWP_VALUES.n2o).toLocaleString()} kg CO₂e
          </>
        );
      }
      // For Scope 2 and simple process emissions
      const factor = selectedFuel && 'factors' in selectedFuel ? selectedFuel.factors[source.unit] || 0 : 0;
      return (
          <>
            <span className="font-bold">{t('calculationLogic')}:</span><br/>
            {totalQuantity.toLocaleString()} {source.unit} ({t('activityData')})<br/>
            &times; {typeof factor === 'number' ? factor.toLocaleString() : 'N/A'} kg CO₂e / {source.unit} ({t('emissionFactor')})<br/>
            = {(totalEmissions).toLocaleString('en-US', {maximumFractionDigits: 2})} kg CO₂e
          </>
      )
  };

  const monthKeys: TranslationKey[] = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  return (
    <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600">
      <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
        <select
          value={source.facilityId}
          onChange={(e) => onUpdate({ facilityId: e.target.value })}
          className="w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green"
          aria-label={t('facility')}
        >
          {facilities.map((facility) => (
            <option key={facility.id} value={facility.id}>
              {facility.name}
            </option>
          ))}
        </select>
         <button
          onClick={onRemove}
          className="text-gray-400 hover:text-red-600 p-1 dark:text-gray-500 dark:hover:text-red-500"
          aria-label={t('removeSourceAria')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select
          value={source.fuelType}
          onChange={(e) => onFuelTypeChange(e.target.value)}
          className="w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green"
           aria-label="Fuel/Source"
        >
          {fuels.map((fuel) => (
            <option key={fuel.name} value={fuel.name}>
              {language === 'ko' && fuel.translationKey ? `${t(fuel.translationKey)}` : fuel.name}
            </option>
          ))}
        </select>
        <select
          value={source.unit}
          onChange={(e) => onUpdate({ unit: e.target.value })}
          className="w-full bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green"
          aria-label="Unit"
          disabled={isFugitive}
        >
          {isFugitive ? (
            <option value="kg">kg</option>
          ) : (
            selectedFuel && 'units' in selectedFuel && selectedFuel.units.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))
          )}
        </select>
      </div>
      
      {/* Scope 2 Market-based input */}
      {source.category === EmissionCategory.PurchasedEnergy && source.fuelType === 'Grid Electricity' && (
        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-900/50 rounded-md">
            <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                    type="checkbox"
                    checked={provideMarketData}
                    onChange={toggleMarketData}
                    className="rounded text-ghg-green focus:ring-ghg-green"
                />
                <span>{t('provideMarketData')}</span>
            </label>
            {provideMarketData && (
                <div className="mt-2">
                    <label htmlFor={`market-factor-${source.id}`} className="block text-xs font-medium text-gray-500 dark:text-gray-400">{t('marketFactor')}</label>
                    <input
                        id={`market-factor-${source.id}`}
                        type="number"
                        step="any"
                        value={source.marketBasedFactor ?? ''}
                        onChange={(e) => handleMarketFactorChange(e.target.value)}
                        className="w-full mt-1 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green"
                        placeholder="0"
                    />
                </div>
            )}
        </div>
      )}

      <div className="mt-2">
        <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded-t-md">
            <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('totalYear')}: </span>
                <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{totalQuantity.toLocaleString()} {source.unit}</span>
            </div>
            {!isEditing && (
              <button onClick={handleEdit} className="text-sm text-ghg-green font-semibold hover:underline">
                  {t('editMonthly')}
              </button>
            )}
        </div>
        <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded-b-md border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-1 group relative">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('emissionsForSource')}: </span>
                <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{(totalEmissions / 1000).toLocaleString('en-US', {minimumFractionDigits: 3})} t CO₂e</span>
                <IconInfo className="w-4 h-4 text-gray-400 cursor-pointer" />
                <div className="absolute bottom-full mb-2 w-max max-w-sm bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {getCalculationDetails()}
                </div>
            </div>
        </div>

        {isEditing && (
            <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-900/50 rounded-b-lg">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {monthKeys.map((monthKey, index) => (
                        <div key={monthKey}>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400" htmlFor={`quantity-${source.id}-${index}`}>{t(monthKey)}</label>
                            <input
                            id={`quantity-${source.id}-${index}`}
                            type="number"
                            value={editedQuantities[index]}
                            onChange={(e) => handleMonthlyChange(index, e.target.value)}
                            className="w-full border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green"
                            placeholder="0"
                            />
                        </div>
                    ))}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={handleCancel} className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">
                        {t('cancel')}
                    </button>
                    <button onClick={handleSave} className="px-3 py-1 text-sm font-medium text-white bg-ghg-green rounded-md shadow-sm hover:bg-ghg-dark">
                        {t('save')}
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};