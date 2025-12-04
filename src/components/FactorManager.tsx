import React, { useState, useMemo } from 'react';
import { EditableRefrigerant, EditableCO2eFactorFuel, EmissionCategory } from '../types';
import { useTranslation } from '../context/LanguageContext';
// FIX: Changed import path to be more explicit.
import { ALL_SCOPE3_CATEGORIES, SCOPE2_FACTORS_BY_REGION } from '../constants/index';
import { IconTrash, IconInfo, IconPencil, IconChevronUp, IconChevronDown } from './IconComponents';
// FIX: Changed import path to be more explicit.
import { TranslationKey } from '../translations/index';

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
            itemData = { name, units, factors };
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
    enabledScope3Categories: EmissionCategory[];
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
    enabledScope3Categories
}) => {
    const { t, language } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<ActiveTab>('Scope 1 - Stationary');
    const [activeScope3Category, setActiveScope3Category] = useState<EmissionCategory>(ALL_SCOPE3_CATEGORIES[0]);

    const [formState, setFormState] = useState<{ mode: 'hidden' | 'add' | 'edit', item?: any, categoryKey?: FactorCategoryKey }>({ mode: 'hidden' });

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
                {data.map((item: any, index) => (
                    <div key={item.id || item.name} className="p-3 bg-gray-50 rounded-lg border dark:bg-gray-800 dark:border-gray-600">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-ghg-dark dark:text-gray-100">
                                {language === 'ko' && item.translationKey ? t(item.translationKey as TranslationKey) : item.name}
                                {item.isCustom && <span className="ml-2 text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-200">{t('custom')}</span>}
                            </h3>
                            {item.isCustom && (
                                <div className="flex gap-2">
                                    <button onClick={() => setFormState({ mode: 'edit', item, categoryKey })} className="text-gray-500 hover:text-ghg-green"><IconPencil className="w-4 h-4" /></button>
                                    <button onClick={() => onDeleteFactor(categoryKey, item.id)} className="text-gray-400 hover:text-red-500"><IconTrash className="w-4 h-4" /></button>
                                </div>
                            )}
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
                            {isFugitive ? (
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{t('gwpColumnHeader')}</label>
                                    <input type="number" step="any" value={item.gwp} onChange={(e) => onGWPChange(index, e.target.value)} className="w-full mt-1 bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100 rounded-md shadow-sm py-1 px-2 text-sm" />
                                </div>
                            ) : (
                                Object.entries(item.factors).map(([unit, factor]) => (
                                    <div key={unit}>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{t(unit as TranslationKey) || unit}</label>
                                        <div className="flex items-center gap-2">
                                            <input type="number" step="any" value={factor as number} onChange={(e) => onProportionalFactorChange(categoryKey, index, unit, e.target.value)} className="w-full mt-1 bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100 rounded-md shadow-sm py-1 px-2 text-sm" />
                                            <span className="mt-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                {t('kgCO2ePer')} {t(unit as TranslationKey) || unit}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ))}
                {formState.mode === 'hidden' && <button onClick={() => setFormState({ mode: 'add', categoryKey })} className="mt-4 w-full text-sm bg-ghg-light-green text-white font-semibold py-2 px-4 rounded-lg hover:bg-ghg-green transition-colors">{t('addNewSource')}</button>}
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
    }, [activeTab, activeScope3Category, allFactors, formState, enabledScope3Categories, language]);

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
            <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-semibold text-ghg-dark dark:text-gray-100">{t('manageFactors')}</h2>
                <button onClick={() => setIsOpen(false)} className="p-2 -mt-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600">
                    <IconChevronUp className="w-6 h-6" />
                </button>
            </div>
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