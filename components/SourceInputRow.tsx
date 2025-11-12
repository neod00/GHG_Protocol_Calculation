import React, { useState, useEffect } from 'react';
import { EmissionSource, Facility, Refrigerant, CO2eFactorFuel, EmissionCategory } from '../types';
import { useTranslation } from '../LanguageContext';
import { TranslationKey } from '../translations';
import { IconInfo, IconTrash } from './IconComponents';

interface SourceInputRowProps {
  source: EmissionSource;
  onUpdate: (updatedSource: Partial<EmissionSource>) => void;
  onRemove: () => void;
  onFuelTypeChange: (newFuelType: string) => void;
  fuels: (CO2eFactorFuel | Refrigerant)[];
  facilities: Facility[];
  calculateEmissions: (source: EmissionSource) => { scope1: number, scope2Location: number, scope2Market: number, scope3: number };
}

export const SourceInputRow: React.FC<SourceInputRowProps> = ({ source, onUpdate, onRemove, onFuelTypeChange, fuels, facilities, calculateEmissions }) => {
  const { t, language } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuantities, setEditedQuantities] = useState([...source.monthlyQuantities]);
  const [provideMarketData, setProvideMarketData] = useState(typeof source.marketBasedFactor !== 'undefined');

  // Set default dataType and unit for new/legacy Category 1 sources
  useEffect(() => {
    if (source.category === EmissionCategory.PurchasedGoodsAndServices && !source.dataType) {
      onUpdate({
        dataType: 'spend_krw',
        unit: 'KRW',
        customFactor: source.customFactor ?? 0,
      });
    }
  }, [source.category, source.dataType, source.customFactor, onUpdate]);

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
        // Scope 3 Categories with specific placeholders
        case EmissionCategory.CapitalGoods:
            return 'capitalGoodsPlaceholder';
        case EmissionCategory.FuelAndEnergyRelatedActivities:
            return 'fuelEnergyPlaceholder';
        case EmissionCategory.UpstreamTransportationAndDistribution:
            return 'upstreamTransportPlaceholder';
        case EmissionCategory.WasteGeneratedInOperations: // Scope 3 Waste
            return 'scope3WastePlaceholder';
        case EmissionCategory.BusinessTravel:
            return 'businessTravelPlaceholder';
        case EmissionCategory.EmployeeCommuting:
            return 'employeeCommutingPlaceholder';
        case EmissionCategory.UpstreamLeasedAssets:
            return 'upstreamLeasedAssetsPlaceholder';
        case EmissionCategory.DownstreamTransportationAndDistribution:
            return 'downstreamTransportPlaceholder';
        case EmissionCategory.ProcessingOfSoldProducts:
            return 'processingSoldProductsPlaceholder';
        case EmissionCategory.UseOfSoldProducts:
            return 'useOfSoldProductsPlaceholder';
        case EmissionCategory.EndOfLifeTreatmentOfSoldProducts:
            return 'endOfLifePlaceholder';
        case EmissionCategory.DownstreamLeasedAssets:
            return 'downstreamLeasedAssetsPlaceholder';
        case EmissionCategory.Franchises:
            return 'franchisesPlaceholder';
        case EmissionCategory.Investments:
            return 'investmentsPlaceholder';
        case EmissionCategory.StationaryCombustion:
        default:
            return 'emissionSourceDescriptionPlaceholder';
    }
  }

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
  const totalEmissions = emissionResults.scope1 + emissionResults.scope2Market + emissionResults.scope3;
  const monthKeys: TranslationKey[] = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const commonSelectClass = "w-full bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
  const commonInputClass = "w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
  const commonLabelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400";
  const placeholderKey = getPlaceholderKey(source.category);


  // == Category 1: Purchased Goods & Services (Hybrid Input UI) ==
  if (source.category === EmissionCategory.PurchasedGoodsAndServices) {
    const handleDataTypeChange = (newDataType: string) => {
      let newUnit = 'KRW';
      if (newDataType === 'spend_usd') newUnit = 'USD';
      if (newDataType === 'weight_tonnes') newUnit = 'tonnes';
      onUpdate({ dataType: newDataType, unit: newUnit });
    };

    const factorUnitDisplay = {
      'spend_krw': 'kg CO₂e / KRW',
      'spend_usd': 'kg CO₂e / USD',
      'weight_tonnes': 'kg CO₂e / tonnes',
    }[source.dataType || ''] || '';

    const getCat1CalculationDetails = () => {
      const factor = source.customFactor || 0;
      return (
        <>
          <span className="font-bold">{t('calculationLogic')}:</span><br/>
          {totalQuantity.toLocaleString()} {t(source.unit as TranslationKey) || source.unit} ({t('activityData')})<br/>
          &times; {factor.toLocaleString()} kg CO₂e / {t(source.unit as TranslationKey) || source.unit} ({t('emissionFactor')})<br/>
          = {(totalEmissions).toLocaleString('en-US', {maximumFractionDigits: 2})} kg CO₂e
        </>
      );
    };

    return (
      <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600">
        <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
          <select
            value={source.facilityId}
            onChange={(e) => onUpdate({ facilityId: e.target.value })}
            className={commonSelectClass}
            aria-label={t('facility')}
          >
            {facilities.map((facility) => (
              <option key={facility.id} value={facility.id}>{facility.name}</option>
            ))}
          </select>
          <button onClick={onRemove} className="text-gray-400 hover:text-red-600 p-1 dark:text-gray-500 dark:hover:text-red-500" aria-label={t('removeSourceAria')}>
            <IconTrash className="h-5 w-5" />
          </button>
        </div>

        <div>
            <label htmlFor={`description-${source.id}`} className={commonLabelClass}>{t('emissionSourceDescription')}</label>
            <input
                id={`description-${source.id}`}
                type="text"
                value={source.fuelType}
                onChange={(e) => onUpdate({ fuelType: e.target.value })}
                className={commonSelectClass}
                placeholder={t('purchasedGoodsServicesPlaceholder')}
            />
        </div>

        <div className="grid grid-cols-2 gap-2">
            <div>
                <label htmlFor={`data-type-${source.id}`} className={commonLabelClass}>{t('dataType')}</label>
                <select id={`data-type-${source.id}`} value={source.dataType} onChange={(e) => handleDataTypeChange(e.target.value)} className={commonSelectClass}>
                    <option value="spend_krw">{t('spendKRW')}</option>
                    <option value="spend_usd">{t('spendUSD')}</option>
                    <option value="weight_tonnes">{t('weightTonnes')}</option>
                </select>
            </div>
            <div>
                <label htmlFor={`factor-${source.id}`} className={commonLabelClass}>{t('emissionFactor')}</label>
                <div className="relative">
                    <input
                        id={`factor-${source.id}`}
                        type="number"
                        step="any"
                        value={source.customFactor ?? ''}
                        onChange={(e) => onUpdate({ customFactor: parseFloat(e.target.value) || 0 })}
                        className={`${commonSelectClass} pr-24`}
                        placeholder="0"
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-gray-500 pointer-events-none">{factorUnitDisplay}</span>
                </div>
            </div>
        </div>
        
        {/* Monthly Data Section */}
        <div className="mt-2">
            <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded-t-md">
                <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('totalYear')}: </span>
                    <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{totalQuantity.toLocaleString()} {t(source.unit as TranslationKey) || source.unit}</span>
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
                        {getCat1CalculationDetails()}
                    </div>
                </div>
            </div>

            {isEditing && (
            <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-900/50 rounded-b-lg">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {monthKeys.map((monthKey, index) => (
                        <div key={monthKey}>
                            <label className={commonLabelClass} htmlFor={`quantity-${source.id}-${index}`}>{t(monthKey)}</label>
                            <input id={`quantity-${source.id}-${index}`} type="number" value={editedQuantities[index]} onChange={(e) => handleMonthlyChange(index, e.target.value)} className={commonInputClass} placeholder="0" />
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
  }

  // == Default UI for all other categories ==
  const selectedFuel = fuels.find(f => f.name === source.fuelType);
  const isFugitive = selectedFuel && 'gwp' in selectedFuel;
  
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

      const factor = selectedFuel && 'factors' in selectedFuel ? selectedFuel.factors[source.unit] || 0 : 0;
      return (
          <>
            <span className="font-bold">{t('calculationLogic')}:</span><br/>
            {totalQuantity.toLocaleString()} {t(source.unit as TranslationKey) || source.unit} ({t('activityData')})<br/>
            &times; {typeof factor === 'number' ? factor.toLocaleString() : 'N/A'} kg CO₂e / {t(source.unit as TranslationKey) || source.unit} ({t('emissionFactor')})<br/>
            = {(totalEmissions).toLocaleString('en-US', {maximumFractionDigits: 2})} kg CO₂e
          </>
      )
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600">
      <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
        <select
          value={source.facilityId}
          onChange={(e) => onUpdate({ facilityId: e.target.value })}
          className={commonSelectClass}
          aria-label={t('facility')}
        >
          {facilities.map((facility) => (
            <option key={facility.id} value={facility.id}>{facility.name}</option>
          ))}
        </select>
         <button onClick={onRemove} className="text-gray-400 hover:text-red-600 p-1 dark:text-gray-500 dark:hover:text-red-500" aria-label={t('removeSourceAria')}>
          <IconTrash className="h-5 w-5" />
        </button>
      </div>
      <div>
        <label htmlFor={`description-${source.id}`} className={commonLabelClass}>{t('emissionSourceDescription')}</label>
        <input
            id={`description-${source.id}`}
            type="text"
            value={source.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            className={commonSelectClass}
            placeholder={t(placeholderKey)}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select value={source.fuelType} onChange={(e) => onFuelTypeChange(e.target.value)} className={commonSelectClass} aria-label="Fuel/Source">
          {fuels.map((fuel) => (
            <option key={fuel.name} value={fuel.name}>
              {language === 'ko' && fuel.translationKey ? `${t(fuel.translationKey as TranslationKey)}` : fuel.name}
            </option>
          ))}
        </select>
        <select value={source.unit} onChange={(e) => onUpdate({ unit: e.target.value })} className={commonSelectClass} aria-label="Unit" disabled={isFugitive}>
          {isFugitive ? (<option value="kg">kg</option>) : (
            selectedFuel && 'units' in selectedFuel && selectedFuel.units.map((unit) => (
              <option key={unit} value={unit}>{t(unit as TranslationKey) || unit}</option>
            ))
          )}
        </select>
      </div>
      
      {source.category === EmissionCategory.PurchasedEnergy && source.fuelType === 'Grid Electricity' && (
        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-900/50 rounded-md">
            <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={provideMarketData} onChange={toggleMarketData} className="rounded text-ghg-green focus:ring-ghg-green"/>
                <span>{t('provideMarketData')}</span>
            </label>
            {provideMarketData && (
                <div className="mt-2">
                    <label htmlFor={`market-factor-${source.id}`} className={commonLabelClass}>{t('marketFactor')}</label>
                    <input id={`market-factor-${source.id}`} type="number" step="any" value={source.marketBasedFactor ?? ''} onChange={(e) => handleMarketFactorChange(e.target.value)} className="w-full mt-1 bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green" placeholder="0"/>
                </div>
            )}
        </div>
      )}

      <div className="mt-2">
        <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded-t-md">
            <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('totalYear')}: </span>
                <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{totalQuantity.toLocaleString()} {t(source.unit as TranslationKey) || source.unit}</span>
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
                            <label className={commonLabelClass} htmlFor={`quantity-${source.id}-${index}`}>{t(monthKey)}</label>
                            <input id={`quantity-${source.id}-${index}`} type="number" value={editedQuantities[index]} onChange={(e) => handleMonthlyChange(index, e.target.value)} className={commonInputClass} placeholder="0"/>
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