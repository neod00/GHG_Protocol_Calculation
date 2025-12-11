
import React, { useState, useEffect, useMemo } from 'react';
import { EmissionSource, Facility, CO2eFactorFuel, EmissionCategory } from '../../types';
import { useTranslation } from '../../context/LanguageContext';
import { TranslationKey } from '../../translations/index';
import { IconTrash, IconInfo, IconCheck, IconAlertTriangle } from '../IconComponents';

interface SourceInputRowProps {
    source: EmissionSource;
    onUpdate: (updatedSource: Partial<EmissionSource>) => void;
    onRemove: () => void;
    onFuelTypeChange: (newFuelType: string) => void;
    fuels: any;
    facilities: Facility[];
    calculateEmissions: (source: EmissionSource) => { scope1: number, scope2Location: number, scope2Market: number, scope3: number };
}

export const Scope2Row: React.FC<SourceInputRowProps> = ({ source, onUpdate, onRemove, onFuelTypeChange, fuels, facilities, calculateEmissions }) => {
    const { t, language } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [editedQuantities, setEditedQuantities] = useState([...source.monthlyQuantities]);

    useEffect(() => {
        if (!isEditing) {
            setEditedQuantities([...source.monthlyQuantities]);
        }
    }, [source.monthlyQuantities, isEditing]);

    const renderUnit = (unit: string) => {
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

    // --- Helper to update specific Power Mix fields ---
    const updatePowerMix = (type: 'ppa' | 'rec' | 'greenPremium' | 'conventional', field: string, value: any) => {
        const currentMix = source.powerMix || {};
        const currentSection = currentMix[type] || { quantity: Array(12).fill(0), factor: 0 }; // Default structure

        // Deep merge for nested updates
        const updatedSection = { ...currentSection, [field]: value };

        onUpdate({
            powerMix: {
                ...currentMix,
                [type]: updatedSection
            }
        });
    };

    const handleMixQuantityChange = (type: 'ppa' | 'rec' | 'greenPremium' | 'conventional', index: number, value: string) => {
        const currentMix = source.powerMix || {};
        const currentSection = currentMix[type] || { quantity: Array(12).fill(0), factor: 0 };
        const newQuantities = [...(currentSection.quantity || Array(12).fill(0))];
        newQuantities[index] = parseFloat(value) || 0;
        updatePowerMix(type, 'quantity', newQuantities);
    };


    const totalQuantity = source.monthlyQuantities.reduce((sum, q) => sum + q, 0);
    const emissionResults = calculateEmissions(source);

    // Explicitly calculate MB total for display from calculator results
    const totalEmissionsLocation = emissionResults.scope2Location;
    const totalEmissionsMarket = emissionResults.scope2Market;

    const monthKeys: TranslationKey[] = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const commonSelectClass = "w-full bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
    const commonInputClass = "w-full bg-white text-gray-900 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-ghg-green focus:border-ghg-green";
    const commonLabelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400";

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
                if (!groups[groupKey]) groups[groupKey] = [];
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

    // Validation: Check if Mix Total matches Total Consumption
    const formatTotal = (arr?: number[]) => {
        const sum = arr?.reduce((a, b) => a + b, 0) || 0;
        return parseFloat(sum.toFixed(6)); // Round to 6 decimals to fix floating point issues (e.g. 400/12 * 12)
    };

    const ppaTotal = formatTotal(source.powerMix?.ppa?.quantity);
    const recTotal = formatTotal(source.powerMix?.rec?.quantity);
    const gpTotal = formatTotal(source.powerMix?.greenPremium?.quantity);
    // If "conventional" is explicitly entered (not just residual fallback logic), counting it helps validation, 
    // but usually conventional = residual = Total - (PPA+REC+GP) in simple UX.
    // Here we assume strict entry if user opts in.
    const mixTotal = ppaTotal + recTotal + gpTotal;
    const isMixMismatch = mixTotal > totalQuantity;


    return (
        <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 shadow-sm">

            {/* 1. Header: Facility & Description (Same as Standard) */}
            <div className="flex items-start gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
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
                        placeholder={t('energyDescriptionPlaceholder')}
                    />
                </div>
                <div className="pt-6">
                    <button onClick={onRemove} className="text-gray-400 hover:text-red-600 p-1 transition-colors" aria-label={t('removeSourceAria')}>
                        <IconTrash className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* 2. Location-Based Data (The Foundation) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Left Column: Location-based Inputs (Total Consumption & Grid) */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded dark:bg-blue-900 dark:text-blue-200">위치 기반 (Location-based)</div>
                        <span className="text-xs text-gray-500">지역 전력망 평균 배출계수 사용</span>
                    </div>

                    {/* Total Consumption Input */}
                    <div>
                        <div className={`flex justify-between items-center bg-white dark:bg-gray-700 p-3 border border-blue-200 dark:border-blue-800 rounded-lg ${isEditing ? 'ring-2 ring-ghg-green' : ''}`}>
                            <div>
                                <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">{t('totalYear')}</span>
                                <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                                    {totalQuantity.toLocaleString()} <span className="text-sm font-normal text-gray-500">kWh</span>
                                </div>
                            </div>
                            {!isEditing && (
                                <button onClick={handleEdit} className="text-sm text-ghg-green font-semibold hover:underline">
                                    {t('editMonthly')}
                                </button>
                            )}
                        </div>

                        {/* Edit Monthly Modal/Expanse */}
                        {isEditing && (
                            <div className="p-4 mt-2 bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    {monthKeys.map((monthKey, index) => (
                                        <div key={monthKey}>
                                            <label className="block text-xs text-gray-500 mb-1">{t(monthKey)}</label>
                                            <input
                                                type="number"
                                                onKeyDown={preventNonNumericKeys}
                                                value={editedQuantities[index] === 0 ? '' : editedQuantities[index]}
                                                onChange={(e) => handleMonthlyChange(index, e.target.value)}
                                                className={commonInputClass}
                                                placeholder="0"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button onClick={handleCancel} className="px-3 py-1 text-xs font-medium border border-gray-300 rounded hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700">{t('cancel')}</button>
                                    <button onClick={handleSave} className="px-3 py-1 text-xs font-medium bg-ghg-green text-white rounded hover:bg-ghg-dark">{t('save')}</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Grid Region Selector */}
                    <div>
                        <label className={commonLabelClass}>Grid Region</label>
                        <select value={source.fuelType} onChange={(e) => onFuelTypeChange(e.target.value)} className={commonSelectClass}>
                            {Array.isArray(fuels) && fuels.map((fuel: CO2eFactorFuel) => (
                                <option key={fuel.name} value={fuel.name}>
                                    {fuel.name}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Applies to all consumption for Location-based calculation. (모든 전력 소비에 적용됨)
                        </p>
                    </div>

                    {/* Result Display for LB */}
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">위치 기반 배출량</span>
                            <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                                {(totalEmissionsLocation / 1000).toLocaleString('en-US', { minimumFractionDigits: 3 })} tCO₂e
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Market-based Inputs (Power Mix) */}
                <div className="space-y-4 border-l border-gray-200 dark:border-gray-700 pl-0 md:pl-6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded dark:bg-green-900 dark:text-green-200">시장 기반 (Market-based)</div>
                        <span className="text-xs text-gray-500">계약별 배출계수 적용</span>
                    </div>

                    {/* Warning if Mix > Total */}
                    {isMixMismatch && (
                        <div className="flex items-start gap-2 p-2 bg-red-50 text-red-700 text-xs rounded border border-red-200 mb-2">
                            <IconAlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                            <p>계약 전력 합계({mixTotal.toLocaleString()} kWh)가 총 사용량({totalQuantity.toLocaleString()} kWh)을 초과합니다. 입력값을 확인해주세요.</p>
                        </div>
                    )}

                    {/* Power Mix Sections */}
                    <div className="space-y-6">

                        {/* 1. PPA */}
                        <div className="relative">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex justify-between">
                                <span>PPA (직접 계약)</span>
                                <span className="text-xs font-normal bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-500">EF = 공급사 지정 계수</span>
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className={commonLabelClass}>연간 계약량 (kWh)</label>
                                    <input type="number"
                                        value={ppaTotal || ''}
                                        onChange={(e) => {
                                            // Distribute annual total to monthly average for simplicity in this MVP view, 
                                            // or just store in first month if not using monthly granularity for PPA yet.
                                            // Better: store as annual total but UI implies monthly needed. 
                                            // For now: uniform distribution logic or single month bucket? 
                                            // Let's keep it simple: Use 12 inputs if "Detailed" clicked, else Year Total distributes / 12 (Simplified)
                                            // Implementation: Just updating index 0 for now effectively means "Total" if we don't care about monthly seasonality of PPA factor.
                                            // But strict calc needs monthly? Let's assume constant PPA generation for MVP simple input.
                                            const val = parseFloat(e.target.value) || 0;
                                            const monthly = val / 12;
                                            updatePowerMix('ppa', 'quantity', Array(12).fill(monthly));
                                        }}
                                        className={commonInputClass}
                                        placeholder="0" />
                                </div>
                                <div>
                                    <label className={commonLabelClass}>공급사 배출계수 (kgCO₂e/kWh)</label>
                                    <input type="number"
                                        step="any"
                                        value={source.powerMix?.ppa?.factor ?? 0}
                                        onChange={(e) => updatePowerMix('ppa', 'factor', parseFloat(e.target.value) || 0)}
                                        className={commonInputClass} />
                                </div>
                            </div>
                        </div>

                        {/* 2. REC */}
                        <div className="relative">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex justify-between">
                                <span>REC (인증서 구매)</span>
                                <span className="text-xs font-normal bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-500">EF = 0 (요건 충족 시)</span>
                            </h4>
                            <div className="flex gap-2 items-end">
                                <div className="w-1/2">
                                    <label className={commonLabelClass}>연간 구매량 (kWh)</label>
                                    <input type="number"
                                        value={recTotal || ''}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value) || 0;
                                            updatePowerMix('rec', 'quantity', Array(12).fill(val / 12));
                                        }}
                                        className={commonInputClass} placeholder="0" />
                                </div>
                                <div className="w-1/2 mb-1">
                                    <label className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                                        <input type="checkbox"
                                            checked={source.powerMix?.rec?.meetsRequirements ?? true}
                                            onChange={(e) => updatePowerMix('rec', 'meetsRequirements', e.target.checked)}
                                            className="rounded text-ghg-green" />
                                        <span>품질 기준 충족?</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* 3. Green Premium */}
                        <div className="relative p-3 bg-green-50 dark:bg-green-900/10 rounded border border-green-100 dark:border-green-800">
                            <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">녹색프리미엄 (주의)</h4>

                            <div className="mb-3">
                                <label className="flex items-center space-x-2 text-xs font-bold text-green-900 dark:text-green-100 mb-2">
                                    <input type="checkbox"
                                        checked={source.powerMix?.greenPremium?.treatAsRenewable ?? false}
                                        onChange={(e) => updatePowerMix('greenPremium', 'treatAsRenewable', e.target.checked)}
                                        className="rounded text-ghg-green" />
                                    <span>재생에너지 계약으로 간주하시겠습니까?</span>
                                </label>
                                <p className="text-[10px] text-green-700 dark:text-green-400 leading-tight">
                                    {source.powerMix?.greenPremium?.treatAsRenewable
                                        ? "보고서 표기: '재생에너지 간주 (배출계수 0 또는 제공 값)'. 주의: K-ETS 등에서는 인정되지 않을 수 있음."
                                        : "보고서 표기: '재생에너지 미인정 (잔여/전력망 배출계수 사용)'."}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-green-800 dark:text-green-200">연간 구매량 (kWh)</label>
                                    <input type="number"
                                        value={gpTotal || ''}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value) || 0;
                                            updatePowerMix('greenPremium', 'quantity', Array(12).fill(val / 12));
                                        }}
                                        className={commonInputClass} placeholder="0" />
                                </div>
                                {source.powerMix?.greenPremium?.treatAsRenewable && (
                                    <div>
                                        <label className="block text-xs font-medium text-green-800 dark:text-green-200" title="0 입력 시 배출계수 0 적용">공급사 배출계수 (선택)</label>
                                        <input type="number"
                                            step="any"
                                            value={source.powerMix?.greenPremium?.supplierFactor ?? 0}
                                            onChange={(e) => {
                                                updatePowerMix('greenPremium', 'supplierFactor', parseFloat(e.target.value) || 0);
                                                updatePowerMix('greenPremium', 'supplierFactorProvided', true);
                                            }}
                                            className={commonInputClass}
                                            placeholder="0" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 4. Residual Mix (Auto-calculated) */}
                        <div className="relative pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 dark:text-gray-400">잔여 전력 (Residual Mix)</span>
                                <span className="font-bold text-gray-900 dark:text-white">
                                    {Math.max(0, totalQuantity - mixTotal).toLocaleString()} kWh
                                </span>
                            </div>
                            <div className="mt-2 text-xs text-gray-500 text-right">
                                EF = 전력망 평균 * 0.8 (기본값)
                            </div>
                        </div>

                    </div>

                    {/* Result Display for MB */}
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-100 dark:border-green-800">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-green-900 dark:text-green-100">시장 기반 배출량</span>
                            <span className="text-lg font-bold text-green-700 dark:text-green-300">
                                {(totalEmissionsMarket / 1000).toLocaleString('en-US', { minimumFractionDigits: 3 })} tCO₂e
                            </span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
