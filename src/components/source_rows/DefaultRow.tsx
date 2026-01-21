import React, { useState, useEffect, useMemo } from 'react';
import { EmissionSource, Facility, Refrigerant, CO2eFactorFuel, EmissionCategory, CalculationResult } from '../../types';
import { useTranslation } from '../../context/LanguageContext';
// FIX: Changed import path to be more explicit.
import { TranslationKey } from '../../translations/index';
import { IconTrash, IconInfo } from '../IconComponents';
import { convertUnit, isUSUnit, US_TO_SI_MAPPING, VOLUME_CONVERSIONS, MASS_CONVERSIONS } from '../../constants/unitConversions';

interface SourceInputRowProps {
  source: EmissionSource;
  onUpdate: (updatedSource: Partial<EmissionSource>) => void;
  onRemove: () => void;
  onFuelTypeChange: (newFuelType: string) => void;
  fuels: any;
  facilities: Facility[];
  calculateEmissions: (source: EmissionSource) => CalculationResult;
  isAuditModeEnabled?: boolean;
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

export const DefaultRow: React.FC<SourceInputRowProps> = ({ source, onUpdate, onRemove, onFuelTypeChange, fuels, facilities, calculateEmissions, isAuditModeEnabled = false }) => {
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
  const displayTotalQuantity = isEditing
    ? editedQuantities.reduce((sum, q) => sum + q, 0)
    : totalQuantity;
  const emissionResults = calculateEmissions(source);
  const totalEmissions = emissionResults.scope1 + emissionResults.scope2Location + emissionResults.scope2Market + emissionResults.scope3;
  const monthKeys: TranslationKey[] = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const commonSelectClass = "w-full bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
  const commonInputClass = "w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
  const commonLabelClass = "block text-xs font-medium text-gray-500 dark:text-gray-300";
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

      {/* US Unit Conversion Preview - 해외 사업장용 단위 환산 미리보기 */}
      {isUSUnit(source.unit) && displayTotalQuantity > 0 && (() => {
        const siUnit = US_TO_SI_MAPPING[source.unit];
        if (!siUnit) return null;

        const conversionResult = convertUnit(displayTotalQuantity, source.unit, siUnit);
        if (!conversionResult.found) return null;

        // Find source info from conversion tables
        const allConversions = [...VOLUME_CONVERSIONS, ...MASS_CONVERSIONS];
        const conversionInfo = allConversions.find(c => c.fromUnit === source.unit && c.toUnit === siUnit);

        return (
          <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
            <div className="flex items-start gap-2">
              <IconInfo className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 text-xs">
                <p className="text-amber-800 dark:text-amber-200">
                  <span className="font-medium">{t('unitConversionHint' as TranslationKey)}:</span>{' '}
                  <span className="font-bold">{conversionResult.convertedValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>{' '}
                  <span>{siUnit}</span>
                </p>
                <p className="text-amber-600 dark:text-amber-400 mt-0.5">
                  {t('conversionFactor' as TranslationKey)}: {conversionResult.factor} {siUnit}/{source.unit}
                  {conversionInfo?.source && (
                    <span className="ml-2">
                      ({t('conversionSource' as TranslationKey)}: {conversionInfo.source})
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {source.category === EmissionCategory.PurchasedEnergy && (
        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg space-y-3">
          <div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
              {t('scope2DualReportingInfoText')}
            </p>
          </div>

          {/* 기존 시장 배출계수 입력 (하위 호환성) */}
          <div>
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

          {/* 녹색프리미엄 입력 (한국 특화) */}
          <div className="border-t border-blue-200 dark:border-blue-700 pt-3">
            <label className="flex items-center space-x-2 text-sm font-medium text-green-800 dark:text-green-200 mb-2">
              <input
                type="checkbox"
                checked={!!source.powerMix?.greenPremium}
                onChange={(e) => {
                  if (e.target.checked) {
                    const currentPowerMix = source.powerMix || {};
                    onUpdate({
                      powerMix: {
                        ...currentPowerMix,
                        greenPremium: {
                          quantity: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                          factor: 0,
                          treatAsRenewable: false,
                          supplierFactorProvided: false
                        }
                      }
                    });
                  } else {
                    const { greenPremium, ...rest } = source.powerMix || {};
                    onUpdate({ powerMix: rest });
                  }
                }}
                className="rounded text-ghg-green"
              />
              <span>{t('greenPremiumTitle')}</span>
            </label>

            {source.powerMix?.greenPremium && (
              <div className="mt-2 space-y-3">
                {/* 녹색프리미엄 전력 사용량 (월별) */}
                <div>
                  <label className="block text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                    녹색프리미엄 전력 사용량 (월별)
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {source.powerMix.greenPremium.quantity.map((q, idx) => (
                      <div key={idx}>
                        <input
                          type="number"
                          step="any"
                          value={q || ''}
                          onChange={(e) => {
                            const newQty = [...source.powerMix!.greenPremium!.quantity];
                            newQty[idx] = parseFloat(e.target.value) || 0;
                            onUpdate({
                              powerMix: {
                                ...source.powerMix!,
                                greenPremium: {
                                  ...source.powerMix!.greenPremium!,
                                  quantity: newQty
                                }
                              }
                            });
                          }}
                          className={commonInputClass}
                          placeholder={t(monthKeys[idx] as TranslationKey)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 재생에너지 계약수단으로 간주 여부 */}
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
                    <input
                      type="checkbox"
                      checked={source.powerMix.greenPremium.treatAsRenewable || false}
                      onChange={(e) => {
                        onUpdate({
                          powerMix: {
                            ...source.powerMix!,
                            greenPremium: {
                              ...source.powerMix!.greenPremium!,
                              treatAsRenewable: e.target.checked
                            }
                          }
                        });
                      }}
                      className="rounded text-ghg-green"
                    />
                    <span>{t('treatAsRenewable')}</span>
                  </label>

                  {source.powerMix.greenPremium.treatAsRenewable ? (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-green-700 dark:text-green-300">
                        ✅ {t('greenPremiumAsRenewableNote')}
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">
                        ⚠️ {t('greenPremiumKETSWarning')}
                      </p>

                      {/* 공급사 배출계수 입력 */}
                      <div className="mt-2">
                        <label className="flex items-center space-x-2 text-xs">
                          <input
                            type="checkbox"
                            checked={source.powerMix.greenPremium.supplierFactorProvided || false}
                            onChange={(e) => {
                              onUpdate({
                                powerMix: {
                                  ...source.powerMix!,
                                  greenPremium: {
                                    ...source.powerMix!.greenPremium!,
                                    supplierFactorProvided: e.target.checked
                                  }
                                }
                              });
                            }}
                            className="rounded text-ghg-green"
                          />
                          <span className="text-green-700 dark:text-green-300">
                            {t('supplierFactorProvided')}
                          </span>
                        </label>

                        {source.powerMix.greenPremium.supplierFactorProvided && (
                          <div className="mt-2">
                            <label className="block text-xs text-green-700 dark:text-green-300 mb-1">
                              {t('supplierFactor')}
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                step="any"
                                value={source.powerMix.greenPremium.supplierFactor ?? 0}
                                onChange={(e) => {
                                  onUpdate({
                                    powerMix: {
                                      ...source.powerMix!,
                                      greenPremium: {
                                        ...source.powerMix!.greenPremium!,
                                        supplierFactor: parseFloat(e.target.value) || 0
                                      }
                                    }
                                  });
                                }}
                                className={commonInputClass}
                              />
                              <span className="text-xs text-green-600 dark:text-green-400 whitespace-nowrap">
                                kg CO₂e / {renderUnit(source.unit)}
                              </span>
                            </div>
                          </div>
                        )}

                        {!source.powerMix.greenPremium.supplierFactorProvided && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            배출계수 0 적용
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="text-xs text-green-700 dark:text-green-300">
                        ⚠️ {t('greenPremiumNotAsRenewableNote')}
                      </p>
                    </div>
                  )}
                </div>

                {/* 계약 정보 */}
                <div>
                  <label className="block text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                    계약 번호 (선택사항)
                  </label>
                  <input
                    type="text"
                    value={source.powerMix.greenPremium.contractId || ''}
                    onChange={(e) => {
                      onUpdate({
                        powerMix: {
                          ...source.powerMix!,
                          greenPremium: {
                            ...source.powerMix!.greenPremium!,
                            contractId: e.target.value
                          }
                        }
                      });
                    }}
                    className={commonInputClass}
                    placeholder="녹색프리미엄-2024-001"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-2">
        <div className={`flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 ${isEditing ? 'rounded-t-lg' : 'rounded-lg'}`}>
          <div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('totalYear')}: </span>
            <span className="text-sm font-bold text-ghg-dark dark:text-gray-100">{displayTotalQuantity.toLocaleString()}&nbsp;{renderUnit(source.unit)}</span>
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
                      value={editedQuantities[index] === 0 && editedQuantities[index] !== source.monthlyQuantities[index] ? '0' : (editedQuantities[index] === 0 ? '' : editedQuantities[index])}
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
              <button onClick={handleCancel} className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">{t('cancel')}</button>
              <button onClick={handleSave} className="px-3 py-1 text-sm font-medium text-white bg-ghg-green rounded-md shadow-sm hover:bg-ghg-dark">{t('save')}</button>
            </div>
          </div>
        )}
      </div>

      {/* Audit Mode: Formula Display Panel */}
      {isAuditModeEnabled && emissionResults.formula && (
        <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-amber-600 dark:text-amber-400 text-lg">🔍</span>
            <div className="flex-1">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-1">
                {language === 'ko' ? '산정 수식 (Calculation Formula)' : 'Calculation Formula'}
              </p>
              <p className="text-sm font-mono text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/40 px-2 py-1 rounded">
                {emissionResults.formula}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};