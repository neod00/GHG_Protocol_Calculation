import React, { useState, useMemo, useRef } from 'react';
import { EditableRefrigerant, EditableCO2eFactorFuel, EmissionCategory } from '../types';
import { useTranslation } from '../context/LanguageContext';
// FIX: Changed import path to be more explicit.
import { ALL_SCOPE3_CATEGORIES, SCOPE2_FACTORS_BY_REGION } from '../constants/index';
import { IconTrash, IconInfo, IconPencil, IconChevronUp, IconChevronDown } from './IconComponents';
// FIX: Changed import path to be more explicit.
import { TranslationKey } from '../translations/index';
import { exportFactorsToCSV, downloadCSV } from '../utils/factorExport';
import { parseFactorsCSV, convertToInternalFormat } from '../utils/factorImport';

type FactorCategoryKey = 'stationary' | 'mobile' | 'process' | 'fugitive' | 'waste' | 'scope2' | 'purchasedGoods' | 'capitalGoods' | 'fuelEnergy' | 'upstreamTransport' | 'downstreamTransport' | 'scope3Waste' | 'businessTravel' | 'employeeCommuting' | 'upstreamLeased' | 'downstreamLeased' | 'processingSold' | 'useSold' | 'endOfLife' | 'franchises' | 'investments';

const categoryKeyMap: { [key in EmissionCategory]?: FactorCategoryKey } = {
    [EmissionCategory.StationaryCombustion]: 'stationary',
    [EmissionCategory.MobileCombustion]: 'mobile',
    [EmissionCategory.ProcessEmissions]: 'process',
    [EmissionCategory.FugitiveEmissions]: 'fugitive',
    [EmissionCategory.Waste]: 'waste',
    [EmissionCategory.PurchasedEnergy]: 'scope2',
    [EmissionCategory.PurchasedGoodsAndServices]: 'purchasedGoods',
    [EmissionCategory.CapitalGoods]: 'capitalGoods',
    [EmissionCategory.FuelAndEnergyRelatedActivities]: 'fuelEnergy',
    [EmissionCategory.UpstreamTransportationAndDistribution]: 'upstreamTransport',
    [EmissionCategory.DownstreamTransportationAndDistribution]: 'downstreamTransport',
    [EmissionCategory.WasteGeneratedInOperations]: 'scope3Waste',
    [EmissionCategory.BusinessTravel]: 'businessTravel',
    [EmissionCategory.EmployeeCommuting]: 'employeeCommuting',
    [EmissionCategory.UpstreamLeasedAssets]: 'upstreamLeased',
    [EmissionCategory.DownstreamLeasedAssets]: 'downstreamLeased',
    [EmissionCategory.ProcessingOfSoldProducts]: 'processingSold',
    [EmissionCategory.UseOfSoldProducts]: 'useSold',
    [EmissionCategory.EndOfLifeTreatmentOfSoldProducts]: 'endOfLife',
    [EmissionCategory.Franchises]: 'franchises',
    [EmissionCategory.Investments]: 'investments',
};


const AddEditForm: React.FC<{
    onSave: (item: any) => void,
    onCancel: () => void,
    isEditing: boolean,
    initialData?: any,
    isFugitive: boolean
}> = ({ onSave, onCancel, isEditing, initialData, isFugitive }) => {
    const { t } = useTranslation();
    const [name, setName] = useState(initialData?.name || '');
    const [unitsStr, setUnitsStr] = useState(initialData?.units?.join(', ') || '');
    const [factors, setFactors] = useState(initialData?.factors || {});
    const [source, setSource] = useState(initialData?.source || '');
    const [gwp, setGwp] = useState(initialData?.gwp || 0);

    const handleUnitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const str = e.target.value;
        setUnitsStr(str);
        const units = str.split(',').map(u => u.trim()).filter(Boolean);
        const newFactors: { [key: string]: number } = {};
        units.forEach(unit => {
            newFactors[unit] = factors[unit] || 0;
        });
        setFactors(newFactors);
    };

    const handleFactorChange = (unit: string, value: string) => {
        setFactors((prev: any) => ({ ...prev, [unit]: parseFloat(value) || 0 }));
    };

    const handleSave = () => {
        if (!name) return;
        let itemData: any;
        if (isFugitive) {
            itemData = { name, gwp };
        } else {
            const units = unitsStr.split(',').map((u: string) => u.trim()).filter(Boolean);
            if (units.length === 0) return;
            itemData = { name, units, factors, source };
        }

        if (isEditing) {
            onSave({ ...initialData, ...itemData });
        } else {
            onSave(itemData);
        }
    };

    return (
        <div className="p-4 mt-4 border-t border-dashed dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
            <h4 className="font-semibold text-ghg-dark dark:text-gray-100 mb-2">{isEditing ? t('edit') : t('addNewSource')}</h4>
            <div className="space-y-3">
                <input type="text" placeholder={t('sourceName')} value={name} onChange={e => setName(e.target.value)} className="w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green" />
                <input type="text" placeholder={t('source') + " (Optional)"} value={source} onChange={e => setSource(e.target.value)} className="w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green mt-2" />
                {isFugitive ? (
                    <div className="flex items-center gap-2">
                        <label className="text-sm w-1/3">{t('gwp')}</label>
                        <input type="number" step="any" value={gwp} onChange={e => setGwp(parseFloat(e.target.value) || 0)} className="w-2/3 bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100 rounded-md shadow-sm py-1 px-2 text-sm" />
                    </div>
                ) : (
                    <>
                        <input type="text" placeholder={t('unitsCommaSeparated')} value={unitsStr} onChange={handleUnitsChange} className="w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100 rounded-md shadow-sm py-1 px-2 text-sm" />
                        {Object.keys(factors).map(unit => (
                            <div key={unit} className="p-2 border rounded dark:border-gray-600">
                                <label className="text-sm font-medium mb-1 block">{unit}</label>
                                <div className="flex items-center gap-2">
                                    <input type="number" step="any" value={factors[unit]} onChange={e => handleFactorChange(unit, e.target.value)} className="w-full bg-white text-gray-900 border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100 rounded-md shadow-sm py-1 px-2 text-sm" />
                                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                        {t('kgCO2ePer')} {unit}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><IconInfo className="w-3 h-3" />{t('customSourceNote')}</p>
            <div className="flex justify-end gap-2 mt-4">
                <button onClick={onCancel} className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500">{t('cancel')}</button>
                <button onClick={handleSave} className="px-3 py-1 text-sm font-medium text-white bg-ghg-green rounded-md shadow-sm hover:bg-ghg-dark">{isEditing ? t('saveChanges') : t('add')}</button>
            </div>
        </div>
    );
};

interface FactorManagerProps {
    allFactors: { [key in FactorCategoryKey]?: any };
    onProportionalFactorChange: (categoryKey: FactorCategoryKey, itemIndex: number, unit: string, value: string) => void;
    onFactorValueChange: (categoryKey: FactorCategoryKey, path: (string | number)[], value: string) => void;
    onGWPChange: (itemIndex: number, value: string) => void;
    onRegionChange: (region: string) => void;
    onAddFactor: (categoryKey: FactorCategoryKey, itemData: any) => void;
    onEditFactor: (categoryKey: FactorCategoryKey, itemData: any) => void;
    onDeleteFactor: (categoryKey: FactorCategoryKey, idToDelete: string) => void;
    onBulkUpdateFactors?: (updatedFactors: Record<string, any[]>) => void;
    enabledScope3Categories: EmissionCategory[];
    onRequireAuth?: () => boolean;
}

type ActiveTab = 'Scope 1 - Stationary' | 'Scope 1 - Mobile' | 'Scope 1 - Process' | 'Scope 1 - Fugitive' | 'Scope 1 - Waste' | 'Scope 2' | 'Scope 3';

const commonInputClass = "w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100 rounded-md shadow-sm py-1 px-2 text-sm";
const commonLabelClass = (isSub: boolean = false) => `block text-xs font-medium text-gray-500 dark:text-gray-400 ${isSub ? 'mt-2' : ''}`;

// Component to edit transportation factors (Category 4 & 9)
const TransportationFactors: React.FC<{
    data: any,
    categoryKey: FactorCategoryKey,
    onFactorChange: (categoryKey: FactorCategoryKey, path: string[], value: string) => void
}> = ({ data, categoryKey, onFactorChange }) => {
    const { t } = useTranslation();
    return (
        <div className="space-y-4">
            {Object.entries(data).map(([mode, vehicles]) => (
                <div key={mode} className="p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600">
                    <h3 className="font-semibold text-ghg-dark dark:text-gray-100">{t(mode as TranslationKey)}</h3>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                        {Object.entries(vehicles as object).map(([vehicle, details]) => (
                            <div key={vehicle}>
                                {/* FIX: Cast 'details' to 'any' to access properties on the unknown type. */}
                                <label className={commonLabelClass()}>{t((details as any).translationKey)}</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        step="any"
                                        value={(details as any).factor}
                                        onChange={(e) => onFactorChange(categoryKey, [mode, vehicle, 'factor'], e.target.value)}
                                        className={commonInputClass}
                                    />
                                    <span className="mt-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                        {t('kgCO2ePer')} {t('tonne-km')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// Component to edit business travel factors (Category 6)
const BusinessTravelFactors: React.FC<{
    data: any,
    categoryKey: FactorCategoryKey,
    onFactorChange: (categoryKey: FactorCategoryKey, path: (string | number)[], value: string) => void
}> = ({ data, categoryKey, onFactorChange }) => {
    const { t } = useTranslation();
    return (
        <div className="space-y-6">
            {/* Activity Based Factors */}
            <div>
                <h3 className="text-lg font-semibold text-ghg-dark dark:text-gray-100 border-b pb-2 mb-3">{t('activityBasedFactors')}</h3>
                <div className="space-y-4">
                    {Object.entries(data.activity).map(([mode, modeData]) => (
                        <div key={mode} className="p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600">
                            <h4 className="font-semibold text-ghg-dark dark:text-gray-100">{t(mode as TranslationKey)}</h4>
                            {mode === 'Air' ? (
                                Object.entries(modeData as object).map(([haul, classes]) => (
                                    <div key={haul} className="mt-2 pl-2 border-l-2 dark:border-gray-600">
                                        <p className="font-medium text-sm text-gray-600 dark:text-gray-300">{haul}</p>
                                        <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 pl-2">
                                            {Object.entries(classes as object).map(([flightClass, details]) => (
                                                <div key={flightClass}>
                                                    {/* FIX: Cast 'details' to 'any' to access properties on the unknown type. */}
                                                    <label className={commonLabelClass()}>{t((details as any).translationKey)}</label>
                                                    <div className="flex items-center gap-2">
                                                        <input type="number" step="any" value={(details as any).factor} onChange={(e) => onFactorChange(categoryKey, ['activity', mode, haul, flightClass, 'factor'], e.target.value)} className={commonInputClass} />
                                                        <span className="mt-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{t('kgCO2ePer')} {t((details as any).unit as TranslationKey)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                                    {Object.entries(modeData as object).map(([vehicle, details]) => (
                                        <div key={vehicle}>
                                            {/* FIX: Cast 'details' to 'any' to access properties on the unknown type. */}
                                            <label className={commonLabelClass()}>{t((details as any).translationKey)}</label>
                                            <div className="flex items-center gap-2">
                                                <input type="number" step="any" value={(details as any).factor} onChange={(e) => onFactorChange(categoryKey, ['activity', mode, vehicle, 'factor'], e.target.value)} className={commonInputClass} />
                                                <span className="mt-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{t('kgCO2ePer')} {t((details as any).unit as TranslationKey)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            {/* Spend Based Factors */}
            <div>
                <h3 className="text-lg font-semibold text-ghg-dark dark:text-gray-100 border-b pb-2 mb-3">{t('spendBasedFactors')}</h3>
                <div className="p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600 space-y-3">
                    {data.spend.map((item: any, index: number) => (
                        <div key={item.name} className="border-b pb-2 last:border-b-0 last:pb-0 dark:border-gray-600">
                            <p className="font-semibold text-sm text-ghg-dark dark:text-gray-100">{t(item.translationKey)}</p>
                            <div className="mt-1 grid grid-cols-2 gap-x-4">
                                {Object.entries(item.factors).map(([unit, factor]) => (
                                    <div key={unit}>
                                        <label className={commonLabelClass()}>{unit}</label>
                                        <div className="flex items-center gap-2">
                                            <input type="number" step="any" value={factor as number} onChange={(e) => onFactorChange(categoryKey, ['spend', index, 'factors', unit], e.target.value)} className={commonInputClass} />
                                            <span className="mt-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{t('kgCO2ePer')} {t(unit as TranslationKey)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Component to edit waste factors (Category 5)
const WasteFactors: React.FC<{
    data: any,
    categoryKey: FactorCategoryKey,
    onFactorChange: (categoryKey: FactorCategoryKey, path: (string | number)[], value: string) => void
}> = ({ data, categoryKey, onFactorChange }) => {
    const { t } = useTranslation();

    return (
        <div className="space-y-6">
            {/* Activity Based Factors */}
            <div>
                <h3 className="text-lg font-semibold text-ghg-dark dark:text-gray-100 border-b pb-2 mb-3">{t('activityBasedFactors')}</h3>
                <div className="space-y-4">
                    {Object.entries(data.activity).map(([wasteType, treatments]) => (
                        <div key={wasteType} className="p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600">
                            <h4 className="font-semibold text-ghg-dark dark:text-gray-100">{t(`waste${wasteType}` as TranslationKey)}</h4>
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                                {Object.entries(treatments as object).map(([treatment, details]) => (
                                    <div key={treatment}>
                                        {/* FIX: Cast 'details' to 'any' to access properties on the unknown type. */}
                                        <label className={commonLabelClass()}>{t((details as any).translationKey)}</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                step="any"
                                                value={(details as any).factor}
                                                onChange={(e) => onFactorChange(categoryKey, ['activity', wasteType, treatment, 'factor'], e.target.value)}
                                                className={commonInputClass}
                                            />
                                            <span className="mt-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                {t('kgCO2ePer')} {t('tonnes')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* Spend Based Factors */}
            <div>
                <h3 className="text-lg font-semibold text-ghg-dark dark:text-gray-100 border-b pb-2 mb-3">{t('spendBasedFactors')}</h3>
                <div className="p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600 space-y-3">
                    {data.spend.map((item: any, index: number) => (
                        <div key={item.name} className="border-b pb-2 last:border-b-0 last:pb-0 dark:border-gray-600">
                            <p className="font-semibold text-sm text-ghg-dark dark:text-gray-100">{t(item.translationKey)}</p>
                            <div className="mt-1 grid grid-cols-2 gap-x-4">
                                {Object.entries(item.factors).map(([unit, factor]) => (
                                    <div key={unit}>
                                        <label className={commonLabelClass()}>{unit}</label>
                                        <div className="flex items-center gap-2">
                                            <input type="number" step="any" value={factor as number} onChange={(e) => onFactorChange(categoryKey, ['spend', index, 'factors', unit], e.target.value)} className={commonInputClass} />
                                            <span className="mt-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{t('kgCO2ePer')} {t(unit as TranslationKey)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Component to edit employee commuting factors (Category 7)
const EmployeeCommutingFactors: React.FC<{
    data: any,
    categoryKey: FactorCategoryKey,
    onFactorChange: (categoryKey: FactorCategoryKey, path: (string | number)[], value: string) => void
}> = ({ data, categoryKey, onFactorChange }) => {
    const { t } = useTranslation();
    return (
        <div className="space-y-6">
            {/* Activity Based Factors */}
            <div>
                <h3 className="text-lg font-semibold text-ghg-dark dark:text-gray-100 border-b pb-2 mb-3">{t('activityBasedFactors')}</h3>
                <div className="space-y-4">
                    {Object.entries(data.activity).map(([mode, modeData]) => (
                        <div key={mode} className="p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600">
                            <h4 className="font-semibold text-ghg-dark dark:text-gray-100">{t(mode as TranslationKey)}</h4>
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                                {Object.entries(modeData as object).map(([type, details]) => (
                                    <div key={type}>
                                        {/* FIX: Cast 'details' to 'any' to access properties on the unknown type. */}
                                        <label className={commonLabelClass()}>{t((details as any).translationKey)}</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                step="any"
                                                value={(details as any).factor}
                                                onChange={(e) => onFactorChange(categoryKey, ['activity', mode, type, 'factor'], e.target.value)}
                                                className={commonInputClass}
                                                disabled={(details as any).factor === 0}
                                            />
                                            <span className="mt-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                {t('kgCO2ePer')} {t((details as any).unit as TranslationKey)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* Spend Based Factors */}
            <div>
                <h3 className="text-lg font-semibold text-ghg-dark dark:text-gray-100 border-b pb-2 mb-3">{t('spendBasedFactors')}</h3>
                <div className="p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600 space-y-3">
                    {data.spend.map((item: any, index: number) => (
                        <div key={item.name} className="border-b pb-2 last:border-b-0 last:pb-0 dark:border-gray-600">
                            <p className="font-semibold text-sm text-ghg-dark dark:text-gray-100">{t(item.translationKey)}</p>
                            <div className="mt-1 grid grid-cols-2 gap-x-4">
                                {Object.entries(item.factors).map(([unit, factor]) => (
                                    <div key={unit}>
                                        <label className={commonLabelClass()}>{unit}</label>
                                        <div className="flex items-center gap-2">
                                            <input type="number" step="any" value={factor as number} onChange={(e) => onFactorChange(categoryKey, ['spend', index, 'factors', unit], e.target.value)} className={commonInputClass} />
                                            <span className="mt-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{t('kgCO2ePer')} {t(unit as TranslationKey)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Component to edit leased assets factors (Category 8 & 13)
const LeasedAssetsFactors: React.FC<{
    data: any,
    categoryKey: FactorCategoryKey,
    onFactorChange: (categoryKey: FactorCategoryKey, path: (string | number)[], value: string) => void
}> = ({ data, categoryKey, onFactorChange }) => {
    const { t } = useTranslation();

    return (
        <div className="space-y-6">
            {/* Area Based Factors (using 'activity-based' title for consistency) */}
            <div>
                <h3 className="text-lg font-semibold text-ghg-dark dark:text-gray-100 border-b pb-2 mb-3">{t('activityBasedFactors')}</h3>
                <div className="p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600 space-y-3">
                    {Object.entries(data.area_based).map(([buildingType, details]: [string, any]) => (
                        <div key={buildingType}>
                            <label className={commonLabelClass()}>{t(details.translationKey)}</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    step="any"
                                    value={details.factor}
                                    onChange={(e) => onFactorChange(categoryKey, ['area_based', buildingType, 'factor'], e.target.value)}
                                    className={commonInputClass}
                                />
                                <span className="mt-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                    {t('kWhPerM2PerYear')}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Spend Based Factors */}
            <div>
                <h3 className="text-lg font-semibold text-ghg-dark dark:text-gray-100 border-b pb-2 mb-3">{t('spendBasedFactors')}</h3>
                <div className="p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600 space-y-3">
                    {data.spend_based.map((item: any, index: number) => (
                        <div key={item.name} className="border-b pb-2 last:border-b-0 last:pb-0 dark:border-gray-600">
                            <p className="font-semibold text-sm text-ghg-dark dark:text-gray-100">{t(item.translationKey)}</p>
                            <div className="mt-1 grid grid-cols-2 gap-x-4">
                                {Object.entries(item.factors).map(([unit, factor]) => (
                                    <div key={unit}>
                                        <label className={commonLabelClass()}>{unit}</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                step="any"
                                                value={factor as number}
                                                onChange={(e) => onFactorChange(categoryKey, ['spend_based', index, 'factors', unit], e.target.value)}
                                                className={commonInputClass}
                                            />
                                            <span className="mt-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                {t('kgCO2ePer')} {t(unit as TranslationKey)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


export const FactorManager: React.FC<FactorManagerProps> = ({
    allFactors,
    onProportionalFactorChange,
    onFactorValueChange,
    onGWPChange,
    onRegionChange,
    onAddFactor,
    onEditFactor,
    onDeleteFactor,
    onBulkUpdateFactors,
    enabledScope3Categories,
    onRequireAuth
}) => {
    const { t, language } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<ActiveTab>('Scope 1 - Stationary');
    const [activeScope3Category, setActiveScope3Category] = useState<EmissionCategory>(ALL_SCOPE3_CATEGORIES[0]);

    const [formState, setFormState] = useState<{ mode: 'hidden' | 'add' | 'edit', item?: any, categoryKey?: FactorCategoryKey }>({ mode: 'hidden' });

    // State for tracking which items have their detail panel expanded
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    // State for search and filter functionality
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'custom'>('all');

    const toggleExpand = (itemId: string) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };


    const [selectedRegion, setSelectedRegion] = useState<string>(() => {
        const electricitySource = allFactors.scope2?.find((s: any) => s.name === 'Grid Electricity');
        if (electricitySource && 'factors' in electricitySource) {
            const currentFactors = electricitySource.factors;
            for (const [region, data] of Object.entries(SCOPE2_FACTORS_BY_REGION)) {
                if (JSON.stringify(data.factors) === JSON.stringify(currentFactors)) {
                    return region;
                }
            }
        }
        return 'Custom';
    });

    const handleRegionChange = (region: string) => {
        setSelectedRegion(region);
        onRegionChange(region);
    };

    const handleSaveForm = (item: any) => {
        const categoryKey = formState.categoryKey;
        if (!categoryKey) return;

        if (formState.mode === 'add') {
            onAddFactor(categoryKey, item);
        } else if (formState.mode === 'edit') {
            onEditFactor(categoryKey, item);
        }
        setFormState({ mode: 'hidden' });
    };

    const tabClasses = (tab: ActiveTab) =>
        `px-3 py-2 text-sm font-medium rounded-t-lg transition-colors focus:outline-none ${activeTab === tab
            ? 'border-b-2 border-ghg-accent text-ghg-dark dark:text-white'
            : 'text-gray-500 hover:text-ghg-dark dark:hover:text-gray-300'
        }`;

    // CSV Management
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | 'none'; message: string }>({ type: 'none', message: '' });

    // Pending Changes Management - for confirmation before applying
    const [pendingChanges, setPendingChanges] = useState<Map<string, { categoryKey: FactorCategoryKey; index: number; unit: string; value: number; originalValue: number }>>(new Map());
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const hasPendingChanges = pendingChanges.size > 0;

    const handlePendingFactorChange = (categoryKey: FactorCategoryKey, index: number, unit: string, value: string, originalValue: number) => {
        const key = `${categoryKey}-${index}-${unit}`;
        const numValue = parseFloat(value) || 0;

        if (numValue === originalValue) {
            // Remove from pending if restored to original
            setPendingChanges(prev => {
                const newMap = new Map(prev);
                newMap.delete(key);
                return newMap;
            });
        } else {
            setPendingChanges(prev => new Map(prev).set(key, { categoryKey, index, unit, value: numValue, originalValue }));
        }
    };

    const handlePendingGWPChange = (index: number, value: string, originalValue: number) => {
        const key = `fugitive-${index}-gwp`;
        const numValue = parseFloat(value) || 0;

        if (numValue === originalValue) {
            setPendingChanges(prev => {
                const newMap = new Map(prev);
                newMap.delete(key);
                return newMap;
            });
        } else {
            setPendingChanges(prev => new Map(prev).set(key, { categoryKey: 'fugitive', index, unit: 'gwp', value: numValue, originalValue }));
        }
    };

    const applyPendingChanges = () => {
        if (onRequireAuth && !onRequireAuth()) return;

        pendingChanges.forEach((change) => {
            if (change.unit === 'gwp') {
                onGWPChange(change.index, String(change.value));
            } else {
                onProportionalFactorChange(change.categoryKey, change.index, change.unit, String(change.value));
            }
        });

        setPendingChanges(new Map());
        setShowConfirmDialog(false);
    };

    const discardPendingChanges = () => {
        setPendingChanges(new Map());
        setShowConfirmDialog(false);
    };

    const getPendingValue = (categoryKey: FactorCategoryKey, index: number, unit: string): number | undefined => {
        const key = `${categoryKey}-${index}-${unit}`;
        return pendingChanges.get(key)?.value;
    };

    const handleDownloadCSV = () => {
        if (onRequireAuth && !onRequireAuth()) return;
        const csvContent = exportFactorsToCSV(allFactors);
        const timestamp = new Date().toISOString().slice(0, 10);
        downloadCSV(csvContent, `emission_factors_${timestamp}.csv`);
    };

    const handleUploadCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (onRequireAuth && !onRequireAuth()) return;
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            const result = parseFactorsCSV(content);

            if (result.errors.length > 0) {
                setUploadStatus({ type: 'error', message: result.errors.join('; ') });
            } else {
                setUploadStatus({ type: 'success', message: `${result.data.length} ${t('items') || 'items'} parsed. ${result.warnings.length} warnings.` });

                if (onBulkUpdateFactors) {
                    const internalData = convertToInternalFormat(result.data);
                    onBulkUpdateFactors(internalData);
                }
            }
        };
        reader.readAsText(file);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const renderFactorList = (categoryKey: FactorCategoryKey) => {
        const data = allFactors[categoryKey];
        const isFugitive = categoryKey === 'fugitive';

        if (!data) return null; // Return null if data is not available

        if (categoryKey === 'upstreamTransport' || categoryKey === 'downstreamTransport') {
            return <TransportationFactors data={data} categoryKey={categoryKey} onFactorChange={onFactorValueChange as any} />;
        }
        if (categoryKey === 'businessTravel') {
            return <BusinessTravelFactors data={data} categoryKey={categoryKey} onFactorChange={onFactorValueChange} />;
        }
        if (categoryKey === 'scope3Waste') {
            return <WasteFactors data={data} categoryKey={categoryKey} onFactorChange={onFactorValueChange} />;
        }
        if (categoryKey === 'employeeCommuting') {
            return <EmployeeCommutingFactors data={data} categoryKey={categoryKey} onFactorChange={onFactorValueChange} />;
        }
        if (categoryKey === 'upstreamLeased' || categoryKey === 'downstreamLeased') {
            return <LeasedAssetsFactors data={data} categoryKey={categoryKey} onFactorChange={onFactorValueChange} />;
        }


        if (!Array.isArray(data)) {
            return (
                <div className="p-4 text-center text-gray-500 bg-gray-50 dark:bg-gray-800 dark:border-gray-600 rounded-lg">
                    <p className="font-semibold text-ghg-dark dark:text-gray-200">{t('complexFactorsNotEditableTitle')}</p>
                    <p className="text-sm mt-1">{t('complexFactorsNotEditableBody')}</p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {categoryKey === 'scope2' && (
                    <div className="p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600">
                        <label htmlFor="region-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('selectRegion')}</label>
                        <select id="region-select" value={selectedRegion} onChange={e => handleRegionChange(e.target.value)} className="w-full mt-1 bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green">
                            {Object.keys(SCOPE2_FACTORS_BY_REGION).map(region => (
                                <option key={region} value={region}>{t(SCOPE2_FACTORS_BY_REGION[region].translationKey as TranslationKey)}</option>
                            ))}
                            <option value="Custom">{t('custom')}</option>
                        </select>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('regionNote')}</p>
                        {selectedRegion !== 'Custom' && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('source')}: {SCOPE2_FACTORS_BY_REGION[selectedRegion].source} <a href={SCOPE2_FACTORS_BY_REGION[selectedRegion].sourceUrl} target="_blank" rel="noopener noreferrer" className="text-ghg-green hover:underline">({t('viewSource')})</a></p>
                        )}
                    </div>
                )}

                {/* Search and Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                    <div className="flex gap-2 flex-1">
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder') || '검색...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 max-w-xs bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100 rounded-md shadow-sm py-1.5 px-3 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green"
                        />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'verified' | 'custom')}
                            className="bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100 rounded-md shadow-sm py-1.5 px-2 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green"
                        >
                            <option value="all">{t('filterAll') || '전체'}</option>
                            <option value="verified">{t('filterVerified') || '검증됨'}</option>
                            <option value="custom">{t('filterCustom') || '사용자 정의'}</option>
                        </select>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(() => {
                            const filtered = data.filter((item: any) => {
                                const itemName = language === 'ko' && item.translationKey ? t(item.translationKey as TranslationKey) : item.name;
                                const matchesSearch = itemName.toLowerCase().includes(searchQuery.toLowerCase()) || item.name.toLowerCase().includes(searchQuery.toLowerCase());
                                const matchesFilter = filterStatus === 'all' || (filterStatus === 'verified' && item.isVerified) || (filterStatus === 'custom' && item.isCustom);
                                return matchesSearch && matchesFilter;
                            });
                            return `${filtered.length} / ${data.length} ${t('items') || '항목'}`;
                        })()}
                    </p>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-left">
                            <tr>
                                <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200">{t('sourceName') || '이름'}</th>
                                <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 hidden sm:table-cell">{isFugitive ? 'GWP' : t('unit') || '단위'}</th>
                                <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200">{isFugitive ? '' : t('factor') || '배출계수'}</th>
                                <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 hidden md:table-cell">{t('status') || '상태'}</th>
                                <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 text-right">{t('actions') || '관리'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {data
                                .map((item: any, index: number) => ({ item, index }))
                                .filter(({ item }: { item: any }) => {
                                    const itemName = language === 'ko' && item.translationKey ? t(item.translationKey as TranslationKey) : item.name;
                                    const matchesSearch = itemName.toLowerCase().includes(searchQuery.toLowerCase()) || item.name.toLowerCase().includes(searchQuery.toLowerCase());
                                    const matchesFilter = filterStatus === 'all' || (filterStatus === 'verified' && item.isVerified) || (filterStatus === 'custom' && item.isCustom);
                                    return matchesSearch && matchesFilter;
                                })
                                .map(({ item, index }: { item: any; index: number }) => {
                                    const itemId = item.id || item.name;
                                    const isExpanded = expandedItems.has(itemId);
                                    const hasDetailedData = item.netHeatingValue || item.co2EF || item.ch4EF || item.n2oEF;
                                    const displayName = language === 'ko' && item.translationKey ? t(item.translationKey as TranslationKey) : item.name;
                                    const primaryUnit = item.units?.[0] || Object.keys(item.factors || {})[0] || '';
                                    const primaryFactor = item.factors?.[primaryUnit];

                                    return (
                                        <React.Fragment key={itemId}>
                                            {/* Main Row */}
                                            <tr
                                                className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${isExpanded ? 'bg-gray-50 dark:bg-gray-700/30' : ''}`}
                                                onClick={() => hasDetailedData && !isFugitive && toggleExpand(itemId)}
                                            >
                                                <td className="px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        {hasDetailedData && !isFugitive && (
                                                            <span className="text-gray-400">
                                                                {isExpanded ? <IconChevronUp className="w-4 h-4" /> : <IconChevronDown className="w-4 h-4" />}
                                                            </span>
                                                        )}
                                                        <span className="font-medium text-gray-900 dark:text-gray-100">{displayName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                                                    {isFugitive ? (() => {
                                                        const pendingGWP = getPendingValue('fugitive', index, 'gwp');
                                                        const displayValue = pendingGWP !== undefined ? pendingGWP : item.gwp;
                                                        const hasChange = pendingGWP !== undefined;
                                                        return (
                                                            <input
                                                                type="number"
                                                                step="any"
                                                                value={displayValue}
                                                                onChange={(e) => { e.stopPropagation(); handlePendingGWPChange(index, e.target.value, item.gwp); }}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className={`w-20 bg-white text-gray-900 border dark:bg-gray-600 dark:text-gray-100 rounded py-0.5 px-1 text-sm ${hasChange ? 'border-yellow-400 ring-1 ring-yellow-400' : 'border-gray-300 dark:border-gray-500'}`}
                                                            />
                                                        );
                                                    })() : (
                                                        <span className="text-xs">{primaryUnit}</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                                                    {!isFugitive && primaryFactor !== undefined && (() => {
                                                        const pendingFactor = getPendingValue(categoryKey, index, primaryUnit);
                                                        const displayValue = pendingFactor !== undefined ? pendingFactor : primaryFactor;
                                                        const hasChange = pendingFactor !== undefined;
                                                        return (
                                                            <div className="flex items-center gap-1">
                                                                <input
                                                                    type="number"
                                                                    step="any"
                                                                    value={displayValue}
                                                                    onChange={(e) => { e.stopPropagation(); handlePendingFactorChange(categoryKey, index, primaryUnit, e.target.value, primaryFactor); }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className={`w-24 bg-white text-gray-900 border dark:bg-gray-600 dark:text-gray-100 rounded py-0.5 px-1 text-sm ${hasChange ? 'border-yellow-400 ring-1 ring-yellow-400' : 'border-gray-300 dark:border-gray-500'}`}
                                                                />
                                                                <span className="text-xs text-gray-400 hidden lg:inline">kg CO₂e/{primaryUnit}</span>
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-3 py-2 hidden md:table-cell">
                                                    {item.isVerified && (
                                                        <span className="text-xs font-medium bg-green-100 text-green-800 px-1.5 py-0.5 rounded dark:bg-green-900 dark:text-green-200">✓</span>
                                                    )}
                                                    {item.isCustom && (
                                                        <span className="text-xs font-medium bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-200">{t('custom')}</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                        {item.isCustom && (
                                                            <>
                                                                <button onClick={() => { if (onRequireAuth && !onRequireAuth()) return; setFormState({ mode: 'edit', item, categoryKey }) }} className="p-1 text-gray-500 hover:text-ghg-green"><IconPencil className="w-4 h-4" /></button>
                                                                <button onClick={() => { if (onRequireAuth && !onRequireAuth()) return; onDeleteFactor(categoryKey, item.id) }} className="p-1 text-gray-400 hover:text-red-500"><IconTrash className="w-4 h-4" /></button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Expanded Detail Row */}
                                            {isExpanded && hasDetailedData && !isFugitive && (
                                                <tr className="bg-gray-50 dark:bg-gray-800/50">
                                                    <td colSpan={5} className="px-3 py-3">
                                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                                                            {item.netHeatingValue !== undefined && (
                                                                <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded">
                                                                    <p className="text-gray-500 dark:text-gray-400">{t('netHeatingValue')}</p>
                                                                    <p className="font-semibold text-blue-700 dark:text-blue-300">{item.netHeatingValue} {item.heatingValueUnit || ''}</p>
                                                                </div>
                                                            )}
                                                            {item.co2EF !== undefined && (
                                                                <div className="bg-gray-100 dark:bg-gray-600 p-2 rounded">
                                                                    <p className="text-gray-500 dark:text-gray-400">{t('co2EF')}</p>
                                                                    <p className="font-semibold text-gray-800 dark:text-gray-100">{item.co2EF.toLocaleString()} {t('kgPerTJ')}</p>
                                                                </div>
                                                            )}
                                                            {item.ch4EF !== undefined && (
                                                                <div className="bg-orange-50 dark:bg-orange-900/30 p-2 rounded">
                                                                    <p className="text-gray-500 dark:text-gray-400">{t('ch4EF')}</p>
                                                                    <p className="font-semibold text-orange-700 dark:text-orange-300">{item.ch4EF} {t('kgPerTJ')}</p>
                                                                    {item.gwpCH4 && <p className="text-gray-400 dark:text-gray-500">GWP: {item.gwpCH4}</p>}
                                                                </div>
                                                            )}
                                                            {item.n2oEF !== undefined && (
                                                                <div className="bg-purple-50 dark:bg-purple-900/30 p-2 rounded">
                                                                    <p className="text-gray-500 dark:text-gray-400">{t('n2oEF')}</p>
                                                                    <p className="font-semibold text-purple-700 dark:text-purple-300">{item.n2oEF} {t('kgPerTJ')}</p>
                                                                    {item.gwpN2O && <p className="text-gray-400 dark:text-gray-500">GWP: {item.gwpN2O}</p>}
                                                                </div>
                                                            )}
                                                            {item.csvLineRef && (
                                                                <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                                                    <p className="text-gray-500 dark:text-gray-400">{t('csvRef')}</p>
                                                                    <p className="font-mono text-gray-600 dark:text-gray-300">{item.csvLineRef}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {/* Additional units if more than one */}
                                                        {Object.keys(item.factors || {}).length > 1 && (
                                                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('allUnits') || '모든 단위'}</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {Object.entries(item.factors).map(([unit, factor]) => (
                                                                        <div key={unit} className="flex items-center gap-1">
                                                                            <input
                                                                                type="number"
                                                                                step="any"
                                                                                value={factor as number}
                                                                                onChange={(e) => onProportionalFactorChange(categoryKey, index, unit, e.target.value)}
                                                                                className="w-20 bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100 rounded py-0.5 px-1 text-xs"
                                                                            />
                                                                            <span className="text-xs text-gray-500">kg CO₂e/{unit}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {item.source && (
                                                            <p className="mt-2 text-xs text-ghg-green dark:text-ghg-light-green">
                                                                {t('source')}: {item.source}
                                                                {item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="ml-1 underline">({t('link')})</a>}
                                                            </p>
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>

                {formState.mode === 'hidden' && <button onClick={() => { if (onRequireAuth && !onRequireAuth()) return; setFormState({ mode: 'add', categoryKey }) }} className="mt-4 w-full text-sm bg-ghg-light-green text-white font-semibold py-2 px-4 rounded-lg hover:bg-ghg-green transition-colors">{t('addNewSource')}</button>}
                {formState.mode !== 'hidden' && formState.categoryKey === categoryKey && (
                    <AddEditForm
                        isEditing={formState.mode === 'edit'}
                        initialData={formState.item}
                        onSave={handleSaveForm}
                        onCancel={() => setFormState({ mode: 'hidden' })}
                        isFugitive={isFugitive}
                    />
                )}
            </div>
        );
    };

    const activeContent = useMemo(() => {
        switch (activeTab) {
            case 'Scope 1 - Stationary': return renderFactorList('stationary');
            case 'Scope 1 - Mobile': return renderFactorList('mobile');
            case 'Scope 1 - Process': return renderFactorList('process');
            case 'Scope 1 - Fugitive': return renderFactorList('fugitive');
            case 'Scope 1 - Waste': return renderFactorList('waste');
            case 'Scope 2': return renderFactorList('scope2');
            case 'Scope 3':
                const categoryKey = categoryKeyMap[activeScope3Category];
                return (
                    <div>
                        <div className="mb-4">
                            <label htmlFor="scope3-cat-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('selectScope3Category')}</label>
                            <select id="scope3-cat-select" value={activeScope3Category} onChange={e => setActiveScope3Category(e.target.value as EmissionCategory)} className="w-full mt-1 bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100 rounded-md shadow-sm py-2 px-3 text-sm">
                                {ALL_SCOPE3_CATEGORIES.filter(c => enabledScope3Categories.includes(c)).map(category => (
                                    <option key={category} value={category}>{t(category)}</option>
                                ))}
                            </select>
                        </div>
                        {categoryKey ? renderFactorList(categoryKey) : <p>{t('categoryNotSupported')}</p>}
                    </div>
                );
            default: return null;
        }
    }, [activeTab, activeScope3Category, allFactors, formState, enabledScope3Categories, language, expandedItems, searchQuery, filterStatus]);

    if (!isOpen) {
        return (
            <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-ghg-dark dark:text-gray-100">{t('manageFactors')}</h2>
                    <p className="mt-2 max-w-2xl mx-auto text-md text-gray-500 dark:text-gray-400">{t('manageFactorsSubtitle')}</p>
                    <button onClick={() => setIsOpen(true)} className="mt-6 inline-flex items-center gap-2 bg-white dark:bg-gray-700 text-ghg-dark dark:text-gray-100 font-semibold py-2 px-6 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800/50 focus:ring-ghg-green border dark:border-gray-500 shadow-sm">
                        {t('manageFactors')}
                        <IconChevronDown className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-200 mt-8 dark:bg-gray-700 dark:border-gray-600">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-xl font-semibold text-ghg-dark dark:text-gray-100">{t('manageFactors')}</h2>
                <div className="flex items-center gap-2">
                    {/* CSV Download Button */}
                    <button
                        onClick={handleDownloadCSV}
                        className="text-sm px-3 py-1.5 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors flex items-center gap-1"
                    >
                        📥 {t('downloadCSV')}
                    </button>
                    {/* CSV Upload Button */}
                    <label className="text-sm px-3 py-1.5 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors flex items-center gap-1 cursor-pointer">
                        📤 {t('uploadCSV')}
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept=".csv"
                            onChange={handleUploadCSV}
                            className="hidden"
                        />
                    </label>
                    {/* Close Button */}
                    <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600">
                        <IconChevronUp className="w-6 h-6" />
                    </button>
                </div>
            </div>
            {/* Upload Status Message */}
            {uploadStatus.type !== 'none' && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${uploadStatus.type === 'success' ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                    {uploadStatus.message}
                    <button onClick={() => setUploadStatus({ type: 'none', message: '' })} className="ml-2 underline">✕</button>
                </div>
            )}
            {/* Pending Changes Confirmation Bar */}
            {hasPendingChanges && (
                <div className="mb-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-yellow-600 dark:text-yellow-400 text-lg">⚠️</span>
                        <span className="text-sm text-yellow-800 dark:text-yellow-200">
                            {t('pendingChanges') || '수정 대기 중'}: <strong>{pendingChanges.size}</strong> {t('items') || '항목'}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={discardPendingChanges}
                            className="px-3 py-1 text-sm rounded-md bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        >
                            {t('discardChanges') || '취소'}
                        </button>
                        <button
                            onClick={applyPendingChanges}
                            className="px-3 py-1 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors font-medium"
                        >
                            {t('applyChanges') || '변경 적용'}
                        </button>
                    </div>
                </div>
            )}
            <div className="border-b border-gray-200 dark:border-gray-600 mb-6">
                <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
                    <button className={tabClasses('Scope 1 - Stationary')} onClick={() => { setActiveTab('Scope 1 - Stationary'); setFormState({ mode: 'hidden' }); }}>{t('Stationary Combustion')}</button>
                    <button className={tabClasses('Scope 1 - Mobile')} onClick={() => { setActiveTab('Scope 1 - Mobile'); setFormState({ mode: 'hidden' }); }}>{t('Mobile Combustion')}</button>
                    <button className={tabClasses('Scope 1 - Process')} onClick={() => { setActiveTab('Scope 1 - Process'); setFormState({ mode: 'hidden' }); }}>{t('Process Emissions')}</button>
                    <button className={tabClasses('Scope 1 - Fugitive')} onClick={() => { setActiveTab('Scope 1 - Fugitive'); setFormState({ mode: 'hidden' }); }}>{t('Fugitive Emissions')}</button>
                    <button className={tabClasses('Scope 1 - Waste')} onClick={() => { setActiveTab('Scope 1 - Waste'); setFormState({ mode: 'hidden' }); }}>{t('Waste')}</button>
                    <button className={tabClasses('Scope 2')} onClick={() => { setActiveTab('Scope 2'); setFormState({ mode: 'hidden' }); }}>{t('Purchased Energy')}</button>
                    <button className={tabClasses('Scope 3')} onClick={() => { setActiveTab('Scope 3'); setFormState({ mode: 'hidden' }); }}>{t('scope3')}</button>
                </nav>
            </div>
            <div className="max-h-[60vh] overflow-y-auto pr-4 -mr-4">
                {activeContent}
            </div>
        </div>
    );
};