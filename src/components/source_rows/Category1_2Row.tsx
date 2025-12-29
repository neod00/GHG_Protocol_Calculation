import React, { useState, useEffect, useMemo } from 'react';
import { EmissionSource, CalculationMethod, EmissionCategory, DataQualityIndicator, Category1FactorType, calculateDQIScore, getDQIRating, CO2eFactorFuel, HybridCalculationData, HybridMaterialInput, HybridTransportInput, HybridWasteInput, TransportMode, WasteType, TreatmentMethod } from '../../types';
import { useTranslation } from '../../context/LanguageContext';
// FIX: Changed import path to be more explicit.
import { TranslationKey } from '../../translations/index';
import { IconInfo, IconTrash, IconSparkles, IconChevronDown, IconChevronUp, IconPlus, IconX } from '../IconComponents';
import { GoogleGenAI, Type } from '@google/genai';
import { ALL_CATEGORY1_FACTORS, CATEGORY1_FACTORS_BY_TYPE, getFactorsByType } from '../../constants/scope3/category1';
import { MethodologyWizard } from '../MethodologyWizard';

interface SourceInputRowProps {
    source: EmissionSource;
    onUpdate: (updatedSource: Partial<EmissionSource>) => void;
    onRemove: () => void;
    onFuelTypeChange: (newFuelType: string) => void;
    fuels: any;
    facilities: any[];
    calculateEmissions: (source: EmissionSource) => { scope1: number, scope2Location: number, scope2Market: number, scope3: number };
}

// DQI Score descriptions for tooltips
const DQI_DESCRIPTIONS = {
    technologicalRep: {
        1: 'Data from same technology/process',
        2: 'Data from similar technology',
        3: 'Data from related technology',
        4: 'Data from different technology',
        5: 'Unknown technology basis',
    },
    temporalRep: {
        1: 'Same year (< 1 year old)',
        2: '1-3 years old',
        3: '3-5 years old',
        4: '5-10 years old',
        5: '> 10 years old',
    },
    geographicalRep: {
        1: 'Same country/region',
        2: 'Similar region',
        3: 'Continent average',
        4: 'Global average',
        5: 'Unknown geography',
    },
    completeness: {
        1: 'Full cradle-to-gate',
        2: 'Most upstream included',
        3: 'Main processes only',
        4: 'Limited processes',
        5: 'Single process only',
    },
    reliability: {
        1: '3rd party verified EPD/PCF',
        2: 'Supplier-provided data',
        3: 'Industry LCI database',
        4: 'EEIO/Spend-based',
        5: 'Estimate/Assumption',
    },
};

// Transport mode options
const TRANSPORT_MODES: { value: TransportMode; labelKo: string; labelEn: string; defaultFactor: number }[] = [
    { value: 'Road', labelKo: '도로 운송', labelEn: 'Road', defaultFactor: 0.062 },
    { value: 'Rail', labelKo: '철도 운송', labelEn: 'Rail', defaultFactor: 0.022 },
    { value: 'Sea', labelKo: '해상 운송', labelEn: 'Sea', defaultFactor: 0.016 },
    { value: 'Air', labelKo: '항공 운송', labelEn: 'Air', defaultFactor: 0.602 },
];

// Waste type options
const WASTE_TYPES: { value: WasteType; labelKo: string; labelEn: string }[] = [
    { value: 'MSW', labelKo: '일반 폐기물', labelEn: 'MSW (General)' },
    { value: 'Paper', labelKo: '종이류', labelEn: 'Paper' },
    { value: 'Plastics', labelKo: '플라스틱', labelEn: 'Plastics' },
    { value: 'Food', labelKo: '음식물', labelEn: 'Food Waste' },
    { value: 'Metal', labelKo: '금속류', labelEn: 'Metal' },
    { value: 'Hazardous', labelKo: '유해 폐기물', labelEn: 'Hazardous' },
];

// Treatment method options with default emission factors (kgCO2e/kg)
const TREATMENT_METHODS: { value: TreatmentMethod; labelKo: string; labelEn: string; defaultFactor: number }[] = [
    { value: 'Landfill', labelKo: '매립', labelEn: 'Landfill', defaultFactor: 0.587 },
    { value: 'Incineration', labelKo: '소각', labelEn: 'Incineration', defaultFactor: 0.989 },
    { value: 'Recycling', labelKo: '재활용', labelEn: 'Recycling', defaultFactor: 0.021 },
    { value: 'Composting', labelKo: '퇴비화', labelEn: 'Composting', defaultFactor: 0.023 },
    { value: 'AnaerobicDigestion', labelKo: '혐기성 소화', labelEn: 'Anaerobic Digestion', defaultFactor: 0.018 },
];

// ============================================================================
// HYBRID METHOD UI COMPONENT
// ============================================================================
interface HybridMethodUIProps {
    source: EmissionSource;
    onUpdate: (updatedSource: Partial<EmissionSource>) => void;
    language: 'ko' | 'en';
    t: (key: TranslationKey) => string;
}

const HybridMethodUI: React.FC<HybridMethodUIProps> = ({ source, onUpdate, language, t }) => {
    const hybridData = source.hybridData || {
        materialInputs: [],
        transportInputs: [],
        wasteInputs: [],
    };

    const commonInputClass = "block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-1.5 px-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-emerald-500";
    const commonSelectClass = "block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-1.5 px-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-emerald-500";

    // Helper to generate unique ID
    const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Calculate total emissions from hybrid components
    const calculateHybridEmissions = () => {
        let total = 0;
        
        // 1. Supplier Scope 1,2 allocation
        if (hybridData.supplierScope12) {
            total += (hybridData.supplierScope12.totalEmissions * hybridData.supplierScope12.allocationPercentage) / 100;
        }
        
        // 2. Material inputs
        hybridData.materialInputs.forEach(m => {
            total += m.quantity * m.emissionFactor;
        });
        
        // 3. Transport inputs
        hybridData.transportInputs.forEach(tr => {
            const factor = tr.emissionFactor || TRANSPORT_MODES.find(tm => tm.value === tr.transportMode)?.defaultFactor || 0;
            total += tr.weightTonnes * tr.distanceKm * factor;
        });
        
        // 4. Waste inputs
        hybridData.wasteInputs.forEach(w => {
            const factor = w.emissionFactor || TREATMENT_METHODS.find(tm => tm.value === w.treatmentMethod)?.defaultFactor || 0;
            const quantityKg = w.unit === 'tonnes' ? w.quantity * 1000 : w.quantity;
            total += quantityKg * factor;
        });
        
        return total;
    };

    const updateHybridData = (updates: Partial<HybridCalculationData>) => {
        const newData = { ...hybridData, ...updates };
        onUpdate({ hybridData: newData });
    };

    // Material handlers
    const addMaterial = () => {
        const newMaterial: HybridMaterialInput = {
            id: generateId(),
            materialName: '',
            quantity: 0,
            unit: 'kg',
            emissionFactor: 0,
        };
        updateHybridData({ materialInputs: [...hybridData.materialInputs, newMaterial] });
    };

    const updateMaterial = (id: string, updates: Partial<HybridMaterialInput>) => {
        const newMaterials = hybridData.materialInputs.map(m => 
            m.id === id ? { ...m, ...updates } : m
        );
        updateHybridData({ materialInputs: newMaterials });
    };

    const removeMaterial = (id: string) => {
        updateHybridData({ materialInputs: hybridData.materialInputs.filter(m => m.id !== id) });
    };

    // Transport handlers
    const addTransport = () => {
        const newTransport: HybridTransportInput = {
            id: generateId(),
            transportMode: 'Road',
            weightTonnes: 0,
            distanceKm: 0,
        };
        updateHybridData({ transportInputs: [...hybridData.transportInputs, newTransport] });
    };

    const updateTransport = (id: string, updates: Partial<HybridTransportInput>) => {
        const newTransports = hybridData.transportInputs.map(tr => 
            tr.id === id ? { ...tr, ...updates } : tr
        );
        updateHybridData({ transportInputs: newTransports });
    };

    const removeTransport = (id: string) => {
        updateHybridData({ transportInputs: hybridData.transportInputs.filter(tr => tr.id !== id) });
    };

    // Waste handlers
    const addWaste = () => {
        const newWaste: HybridWasteInput = {
            id: generateId(),
            wasteType: 'MSW',
            treatmentMethod: 'Landfill',
            quantity: 0,
            unit: 'kg',
        };
        updateHybridData({ wasteInputs: [...hybridData.wasteInputs, newWaste] });
    };

    const updateWaste = (id: string, updates: Partial<HybridWasteInput>) => {
        const newWastes = hybridData.wasteInputs.map(w => 
            w.id === id ? { ...w, ...updates } : w
        );
        updateHybridData({ wasteInputs: newWastes });
    };

    const removeWaste = (id: string) => {
        updateHybridData({ wasteInputs: hybridData.wasteInputs.filter(w => w.id !== id) });
    };

    const totalHybridEmissions = calculateHybridEmissions();

    return (
        <div className="space-y-4 border-2 border-purple-200 dark:border-purple-800 rounded-lg p-4 bg-purple-50/30 dark:bg-purple-900/10">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-semibold">
                <span className="text-lg">🔀</span>
                <span>{language === 'ko' ? '하이브리드 산정법 입력' : 'Hybrid Method Input'}</span>
            </div>
            
            {/* 1. Supplier Scope 1,2 Allocation */}
            <div className="space-y-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 text-xs">1</span>
                    {language === 'ko' ? '공급업체 Scope 1, 2 할당 배출량' : 'Supplier Scope 1, 2 Allocated Emissions'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            {language === 'ko' ? '공급업체 총 Scope 1,2 배출량 (kgCO₂e)' : 'Supplier Total S1,2 (kgCO₂e)'}
                        </label>
                        <input
                            type="number"
                            value={hybridData.supplierScope12?.totalEmissions ?? ''}
                            onChange={(e) => updateHybridData({
                                supplierScope12: {
                                    ...hybridData.supplierScope12,
                                    totalEmissions: parseFloat(e.target.value) || 0,
                                    allocationBasis: hybridData.supplierScope12?.allocationBasis || 'quantity',
                                    allocationPercentage: hybridData.supplierScope12?.allocationPercentage ?? 0,
                                }
                            })}
                            className={commonInputClass}
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            {language === 'ko' ? '할당 기준' : 'Allocation Basis'}
                        </label>
                        <select
                            value={hybridData.supplierScope12?.allocationBasis || 'quantity'}
                            onChange={(e) => updateHybridData({
                                supplierScope12: {
                                    ...hybridData.supplierScope12,
                                    totalEmissions: hybridData.supplierScope12?.totalEmissions ?? 0,
                                    allocationBasis: e.target.value as 'revenue' | 'quantity' | 'custom',
                                    allocationPercentage: hybridData.supplierScope12?.allocationPercentage ?? 0,
                                }
                            })}
                            className={commonSelectClass}
                        >
                            <option value="quantity">{language === 'ko' ? '물량 기준' : 'Quantity-based'}</option>
                            <option value="revenue">{language === 'ko' ? '매출 기준' : 'Revenue-based'}</option>
                            <option value="custom">{language === 'ko' ? '사용자 정의' : 'Custom'}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            {language === 'ko' ? '할당 비율 (%)' : 'Allocation %'}
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={hybridData.supplierScope12?.allocationPercentage ?? ''}
                            onChange={(e) => updateHybridData({
                                supplierScope12: {
                                    ...hybridData.supplierScope12,
                                    totalEmissions: hybridData.supplierScope12?.totalEmissions ?? 0,
                                    allocationBasis: hybridData.supplierScope12?.allocationBasis || 'quantity',
                                    allocationPercentage: parseFloat(e.target.value) || 0,
                                }
                            })}
                            className={commonInputClass}
                            placeholder="0"
                        />
                    </div>
                </div>
                {hybridData.supplierScope12 && hybridData.supplierScope12.totalEmissions > 0 && (
                    <div className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                        → {language === 'ko' ? '할당 배출량' : 'Allocated'}: {((hybridData.supplierScope12.totalEmissions * hybridData.supplierScope12.allocationPercentage) / 100).toLocaleString()} kgCO₂e
                    </div>
                )}
            </div>

            {/* 2. Material Inputs (Cradle-to-Gate) */}
            <div className="space-y-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <span className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs">2</span>
                        {language === 'ko' ? '투입 물질별 배출량 (Cradle-to-Gate)' : 'Material Inputs (Cradle-to-Gate)'}
                    </h4>
                    <button
                        onClick={addMaterial}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900"
                    >
                        <IconPlus className="w-3 h-3" />
                        {language === 'ko' ? '물질 추가' : 'Add Material'}
                    </button>
                </div>
                
                {hybridData.materialInputs.length === 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic py-2">
                        {language === 'ko' ? '투입 물질을 추가하세요' : 'Add input materials'}
                    </p>
                )}
                
                {hybridData.materialInputs.map((material, idx) => (
                    <div key={material.id} className="grid grid-cols-12 gap-2 items-end p-2 bg-gray-50 dark:bg-gray-900/50 rounded">
                        <div className="col-span-3">
                            <label className="block text-xs text-gray-500 mb-1">{language === 'ko' ? '물질명' : 'Material'}</label>
                            <input
                                type="text"
                                value={material.materialName}
                                onChange={(e) => updateMaterial(material.id, { materialName: e.target.value })}
                                className={commonInputClass}
                                placeholder={language === 'ko' ? '예: 철강' : 'e.g., Steel'}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">{language === 'ko' ? '투입량' : 'Quantity'}</label>
                            <input
                                type="number"
                                value={material.quantity || ''}
                                onChange={(e) => updateMaterial(material.id, { quantity: parseFloat(e.target.value) || 0 })}
                                className={commonInputClass}
                                placeholder="0"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs text-gray-500 mb-1">{language === 'ko' ? '단위' : 'Unit'}</label>
                            <select
                                value={material.unit}
                                onChange={(e) => updateMaterial(material.id, { unit: e.target.value })}
                                className={commonSelectClass}
                            >
                                <option value="kg">kg</option>
                                <option value="tonnes">t</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">{language === 'ko' ? '배출계수' : 'EF'}</label>
                            <input
                                type="number"
                                step="0.001"
                                value={material.emissionFactor || ''}
                                onChange={(e) => updateMaterial(material.id, { emissionFactor: parseFloat(e.target.value) || 0 })}
                                className={commonInputClass}
                                placeholder="kgCO₂e/unit"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">{language === 'ko' ? '출처' : 'Source'}</label>
                            <input
                                type="text"
                                value={material.factorSource || ''}
                                onChange={(e) => updateMaterial(material.id, { factorSource: e.target.value })}
                                className={commonInputClass}
                                placeholder={language === 'ko' ? '예: Ecoinvent' : 'e.g., Ecoinvent'}
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs text-gray-500 mb-1">{language === 'ko' ? '배출량' : 'Emit.'}</label>
                            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 py-1.5">
                                {(material.quantity * material.emissionFactor * (material.unit === 'tonnes' ? 1000 : 1)).toLocaleString()}
                            </div>
                        </div>
                        <div className="col-span-1 flex justify-end">
                            <button
                                onClick={() => removeMaterial(material.id)}
                                className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                            >
                                <IconX className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
                
                {hybridData.materialInputs.length > 0 && (
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        → {language === 'ko' ? '물질 소계' : 'Materials Subtotal'}: {hybridData.materialInputs.reduce((sum, m) => sum + m.quantity * m.emissionFactor * (m.unit === 'tonnes' ? 1000 : 1), 0).toLocaleString()} kgCO₂e
                    </div>
                )}
            </div>

            {/* 3. Transport Inputs */}
            <div className="space-y-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <span className="w-5 h-5 flex items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 text-xs">3</span>
                        {language === 'ko' ? '운송 배출량 (Upstream Transport)' : 'Transport Emissions (Upstream)'}
                    </h4>
                    <button
                        onClick={addTransport}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900"
                    >
                        <IconPlus className="w-3 h-3" />
                        {language === 'ko' ? '운송 추가' : 'Add Transport'}
                    </button>
                </div>
                
                {hybridData.transportInputs.length === 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic py-2">
                        {language === 'ko' ? '운송 정보를 추가하세요' : 'Add transport info'}
                    </p>
                )}
                
                {hybridData.transportInputs.map((transport) => {
                    const defaultFactor = TRANSPORT_MODES.find(tm => tm.value === transport.transportMode)?.defaultFactor || 0;
                    const factor = transport.emissionFactor || defaultFactor;
                    const emissions = transport.weightTonnes * transport.distanceKm * factor;
                    
                    return (
                        <div key={transport.id} className="grid grid-cols-12 gap-2 items-end p-2 bg-gray-50 dark:bg-gray-900/50 rounded">
                            <div className="col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">{language === 'ko' ? '운송수단' : 'Mode'}</label>
                                <select
                                    value={transport.transportMode}
                                    onChange={(e) => updateTransport(transport.id, { transportMode: e.target.value as TransportMode })}
                                    className={commonSelectClass}
                                >
                                    {TRANSPORT_MODES.map(mode => (
                                        <option key={mode.value} value={mode.value}>
                                            {language === 'ko' ? mode.labelKo : mode.labelEn}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">{language === 'ko' ? '운송량 (t)' : 'Weight (t)'}</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={transport.weightTonnes || ''}
                                    onChange={(e) => updateTransport(transport.id, { weightTonnes: parseFloat(e.target.value) || 0 })}
                                    className={commonInputClass}
                                    placeholder="0"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">{language === 'ko' ? '거리 (km)' : 'Distance (km)'}</label>
                                <input
                                    type="number"
                                    value={transport.distanceKm || ''}
                                    onChange={(e) => updateTransport(transport.id, { distanceKm: parseFloat(e.target.value) || 0 })}
                                    className={commonInputClass}
                                    placeholder="0"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">{language === 'ko' ? '배출계수' : 'EF'}</label>
                                <input
                                    type="number"
                                    step="0.001"
                                    value={transport.emissionFactor ?? defaultFactor}
                                    onChange={(e) => updateTransport(transport.id, { emissionFactor: parseFloat(e.target.value) || undefined })}
                                    className={commonInputClass}
                                    placeholder={`${defaultFactor}`}
                                />
                                <span className="text-[10px] text-gray-400">kgCO₂e/t·km</span>
                            </div>
                            <div className="col-span-3">
                                <label className="block text-xs text-gray-500 mb-1">{language === 'ko' ? '설명' : 'Description'}</label>
                                <input
                                    type="text"
                                    value={transport.description || ''}
                                    onChange={(e) => updateTransport(transport.id, { description: e.target.value })}
                                    className={commonInputClass}
                                    placeholder={language === 'ko' ? '예: 원자재 운송' : 'e.g., Raw material transport'}
                                />
                            </div>
                            <div className="col-span-1 flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    {emissions.toLocaleString()}
                                </span>
                                <button
                                    onClick={() => removeTransport(transport.id)}
                                    className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                >
                                    <IconX className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
                
                {hybridData.transportInputs.length > 0 && (
                    <div className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                        → {language === 'ko' ? '운송 소계' : 'Transport Subtotal'}: {hybridData.transportInputs.reduce((sum, tr) => {
                            const factor = tr.emissionFactor || TRANSPORT_MODES.find(tm => tm.value === tr.transportMode)?.defaultFactor || 0;
                            return sum + tr.weightTonnes * tr.distanceKm * factor;
                        }, 0).toLocaleString()} kgCO₂e
                    </div>
                )}
            </div>

            {/* 4. Waste Inputs */}
            <div className="space-y-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <span className="w-5 h-5 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 text-xs">4</span>
                        {language === 'ko' ? '폐기물 처리 배출량' : 'Waste Treatment Emissions'}
                    </h4>
                    <button
                        onClick={addWaste}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900"
                    >
                        <IconPlus className="w-3 h-3" />
                        {language === 'ko' ? '폐기물 추가' : 'Add Waste'}
                    </button>
                </div>
                
                {hybridData.wasteInputs.length === 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic py-2">
                        {language === 'ko' ? '폐기물 정보를 추가하세요' : 'Add waste info'}
                    </p>
                )}
                
                {hybridData.wasteInputs.map((waste) => {
                    const defaultFactor = TREATMENT_METHODS.find(tm => tm.value === waste.treatmentMethod)?.defaultFactor || 0;
                    const factor = waste.emissionFactor || defaultFactor;
                    const quantityKg = waste.unit === 'tonnes' ? waste.quantity * 1000 : waste.quantity;
                    const emissions = quantityKg * factor;
                    
                    return (
                        <div key={waste.id} className="grid grid-cols-12 gap-2 items-end p-2 bg-gray-50 dark:bg-gray-900/50 rounded">
                            <div className="col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">{language === 'ko' ? '폐기물 종류' : 'Waste Type'}</label>
                                <select
                                    value={waste.wasteType}
                                    onChange={(e) => updateWaste(waste.id, { wasteType: e.target.value as WasteType })}
                                    className={commonSelectClass}
                                >
                                    {WASTE_TYPES.map(wt => (
                                        <option key={wt.value} value={wt.value}>
                                            {language === 'ko' ? wt.labelKo : wt.labelEn}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">{language === 'ko' ? '처리 방법' : 'Treatment'}</label>
                                <select
                                    value={waste.treatmentMethod}
                                    onChange={(e) => updateWaste(waste.id, { treatmentMethod: e.target.value as TreatmentMethod })}
                                    className={commonSelectClass}
                                >
                                    {TREATMENT_METHODS.map(tm => (
                                        <option key={tm.value} value={tm.value}>
                                            {language === 'ko' ? tm.labelKo : tm.labelEn}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">{language === 'ko' ? '폐기량' : 'Quantity'}</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={waste.quantity || ''}
                                    onChange={(e) => updateWaste(waste.id, { quantity: parseFloat(e.target.value) || 0 })}
                                    className={commonInputClass}
                                    placeholder="0"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs text-gray-500 mb-1">{language === 'ko' ? '단위' : 'Unit'}</label>
                                <select
                                    value={waste.unit}
                                    onChange={(e) => updateWaste(waste.id, { unit: e.target.value })}
                                    className={commonSelectClass}
                                >
                                    <option value="kg">kg</option>
                                    <option value="tonnes">t</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">{language === 'ko' ? '배출계수' : 'EF'}</label>
                                <input
                                    type="number"
                                    step="0.001"
                                    value={waste.emissionFactor ?? defaultFactor}
                                    onChange={(e) => updateWaste(waste.id, { emissionFactor: parseFloat(e.target.value) || undefined })}
                                    className={commonInputClass}
                                    placeholder={`${defaultFactor}`}
                                />
                                <span className="text-[10px] text-gray-400">kgCO₂e/kg</span>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">{language === 'ko' ? '배출량' : 'Emissions'}</label>
                                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 py-1.5">
                                    {emissions.toLocaleString()} kgCO₂e
                                </div>
                            </div>
                            <div className="col-span-1 flex justify-end">
                                <button
                                    onClick={() => removeWaste(waste.id)}
                                    className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                >
                                    <IconX className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
                
                {hybridData.wasteInputs.length > 0 && (
                    <div className="text-xs text-green-600 dark:text-green-400 mt-2">
                        → {language === 'ko' ? '폐기물 소계' : 'Waste Subtotal'}: {hybridData.wasteInputs.reduce((sum, w) => {
                            const factor = w.emissionFactor || TREATMENT_METHODS.find(tm => tm.value === w.treatmentMethod)?.defaultFactor || 0;
                            const quantityKg = w.unit === 'tonnes' ? w.quantity * 1000 : w.quantity;
                            return sum + quantityKg * factor;
                        }, 0).toLocaleString()} kgCO₂e
                    </div>
                )}
            </div>

            {/* Total Hybrid Emissions */}
            <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-lg border-2 border-purple-300 dark:border-purple-700">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                        {language === 'ko' ? '🔢 하이브리드 총 배출량' : '🔢 Total Hybrid Emissions'}
                    </span>
                    <span className="text-xl font-bold text-purple-900 dark:text-purple-100">
                        {totalHybridEmissions.toLocaleString(undefined, { maximumFractionDigits: 2 })} kgCO₂e
                    </span>
                </div>
                <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                    {language === 'ko' 
                        ? '= 공급업체 Scope 1,2 할당 + 투입물질 Cradle-to-Gate + 운송 + 폐기물 처리'
                        : '= Supplier S1,2 Allocation + Material Cradle-to-Gate + Transport + Waste Treatment'}
                </div>
            </div>
        </div>
    );
};

export const Category1_2Row: React.FC<SourceInputRowProps> = ({ source, onUpdate, onRemove, calculateEmissions }) => {
    const { t, language } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [editedQuantities, setEditedQuantities] = useState([...source.monthlyQuantities]);

    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
    
    // New state for factor selection
    const [showFactorSelector, setShowFactorSelector] = useState(false);
    const [factorSearchQuery, setFactorSearchQuery] = useState('');
    const [selectedFactorCategory, setSelectedFactorCategory] = useState<Category1FactorType | 'all'>('all');
    
    // New state for DQI panel
    const [showDQIPanel, setShowDQIPanel] = useState(false);
    
    // New state for methodology wizard
    const [showMethodologyWizard, setShowMethodologyWizard] = useState(false);

    useEffect(() => {
        if ((source.category === EmissionCategory.PurchasedGoodsAndServices || source.category === EmissionCategory.CapitalGoods) && !source.calculationMethod) {
            onUpdate({
                calculationMethod: 'spend',
                unit: 'KRW',
                factor: source.factor ?? 0,
                factorUnit: 'kg CO₂e / KRW'
            });
        }
    }, [source.category, source.calculationMethod, source.factor, onUpdate]);

    useEffect(() => {
        if (!isEditing) {
            setEditedQuantities([...source.monthlyQuantities]);
        }
    }, [source.monthlyQuantities, isEditing]);

    // Filter factors based on search and category
    const filteredFactors = useMemo(() => {
        let factors: CO2eFactorFuel[] = [];
        
        if (selectedFactorCategory === 'all') {
            factors = ALL_CATEGORY1_FACTORS;
        } else {
            factors = getFactorsByType(selectedFactorCategory);
        }
        
        // Filter by calculation method (spend vs activity)
        if (source.calculationMethod === 'spend') {
            factors = factors.filter(f => f.units.includes('KRW') || f.units.includes('USD'));
        } else if (source.calculationMethod === 'activity') {
            factors = factors.filter(f => f.units.includes('kg') || f.units.includes('tonnes') || f.units.includes('pcs') || f.units.includes('m²') || f.units.includes('L'));
        }
        
        // Filter by search query
        if (factorSearchQuery.trim()) {
            const query = factorSearchQuery.toLowerCase();
            factors = factors.filter(f => 
                f.name.toLowerCase().includes(query) || 
                (f.translationKey && t(f.translationKey as TranslationKey).toLowerCase().includes(query))
            );
        }
        
        return factors;
    }, [selectedFactorCategory, factorSearchQuery, source.calculationMethod, t]);

    const renderUnit = (unit: string) => {
        return t(unit as TranslationKey) || unit;
    };

    const handleMonthlyChange = (monthIndex: number, value: string) => {
        const newQuantities = [...editedQuantities];
        newQuantities[monthIndex] = parseFloat(value) || 0;
        setEditedQuantities(newQuantities);
    };

    const handleEdit = () => setIsEditing(true);
    const handleCancel = () => setIsEditing(false);
    const handleSave = () => {
        onUpdate({ monthlyQuantities: editedQuantities });
        setIsEditing(false);
    };

    const handleAnalyze = async () => {
        if (!source.fuelType) return;
        setIsLoadingAI(true);
        setAiAnalysisResult(null);

        try {
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
            if (!apiKey) {
                alert(t('apiKeyMissing'));
                setIsLoadingAI(false);
                return;
            }
            const ai = new GoogleGenAI({ apiKey: apiKey as string });
            const promptText = `You are a GHG accounting expert specializing in Scope 3 emissions according to the GHG Protocol. Analyze the following purchased item description and provide a structured JSON response. Item Description: "${source.fuelType}"
        
        IMPORTANT: Respond in ${language === 'ko' ? 'Korean' : 'English'}.`;
            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    suggested_category: { type: Type.STRING, description: 'The most likely Scope 3 category (e.g., "1. Purchased Goods and Services", "2. Capital Goods", "4. Upstream Transportation and Distribution").' },
                    justification: { type: Type.STRING, description: "A brief explanation for your choice." },
                }
            };
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: promptText,
                config: { responseMimeType: "application/json", responseSchema },
            });
            const result = JSON.parse(response.text || '{}');
            setAiAnalysisResult(result);
        } catch (error) {
            console.error("AI analysis failed:", error);
            let errorDetails = error instanceof Error ? error.message : String(error);

            try {
                // @ts-ignore
                const response = await ai.models.list();
                // @ts-ignore
                const modelNames = response?.models?.map((m: any) => m.name)?.join(', ') || 'No models found';
                errorDetails += `\n\nAvailable models: ${modelNames}`;
            } catch (listError) {
                console.error("Failed to list models:", listError);
                errorDetails += `\n\nFailed to list models: ${listError instanceof Error ? listError.message : String(listError)}`;
            }

            setAiAnalysisResult({ error: "Failed to analyze.", details: errorDetails });
        } finally {
            setIsLoadingAI(false);
        }
    };

    // Handle factor selection from database
    const handleFactorSelect = (factor: CO2eFactorFuel) => {
        const primaryUnit = source.calculationMethod === 'spend' 
            ? (factor.units.includes('KRW') ? 'KRW' : 'USD')
            : factor.units[0];
        
        const factorValue = factor.factors[primaryUnit] || 0;
        
        onUpdate({
            selectedFactorName: factor.name,
            factor: factorValue,
            factorUnit: `kg CO₂e / ${primaryUnit}`,
            unit: primaryUnit,
            factorSource: 'GHG Protocol Category 1 Database (Ecoinvent/DEFRA/EEIO)',
            isFactorFromDatabase: true,
        });
        
        setShowFactorSelector(false);
        setFactorSearchQuery('');
    };

    // Handle DQI update
    const handleDQIUpdate = (dimension: keyof DataQualityIndicator, value: number) => {
        const currentDQI: DataQualityIndicator = source.dataQualityIndicator || {
            technologicalRep: 3,
            temporalRep: 3,
            geographicalRep: 3,
            completeness: 3,
            reliability: 3,
        };
        
        const newDQI: DataQualityIndicator = {
            ...currentDQI,
            [dimension]: value as 1 | 2 | 3 | 4 | 5,
        };
        
        const score = calculateDQIScore(newDQI);
        const rating = getDQIRating(score);
        
        onUpdate({
            dataQualityIndicator: newDQI,
            dataQualityRating: rating,
        });
    };

    // Calculate current DQI score
    const currentDQI = source.dataQualityIndicator || {
        technologicalRep: 3,
        temporalRep: 3,
        geographicalRep: 3,
        completeness: 3,
        reliability: 3,
    };
    const dqiScore = calculateDQIScore(currentDQI);
    const dqiRating = getDQIRating(dqiScore);

    const totalQuantity = source.monthlyQuantities.reduce((sum, q) => sum + q, 0);
    const totalEmissions = calculateEmissions(source).scope3;
    const monthKeys: TranslationKey[] = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const commonSelectClass = "w-full bg-white text-gray-900 dark:bg-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500";
    const commonLabelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400";

    const preventNonNumericKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (['e', 'E', '+', '-'].includes(e.key)) {
            e.preventDefault();
        }
    };

    const placeholderText = source.category === EmissionCategory.PurchasedGoodsAndServices
        ? t('purchasedGoodsServicesPlaceholder')
        : t('capitalGoodsPlaceholder');

    const handleMethodChange = (method: CalculationMethod) => {
        let updates: Partial<EmissionSource> = { 
            calculationMethod: method,
            isFactorFromDatabase: false,
            selectedFactorName: undefined,
        };
        if (method === 'spend') {
            updates.unit = 'KRW';
            updates.factorUnit = 'kg CO₂e / KRW';
            updates.factor = 0;
        } else if (method === 'activity') {
            updates.unit = 'kg';
            updates.factorUnit = 'kg CO₂e / kg';
            updates.factor = 0;
        } else if (method === 'supplier_co2e') {
            updates.monthlyQuantities = Array(12).fill(0);
        } else if (method === 'hybrid') {
            updates.hybridData = {
                materialInputs: [],
                transportInputs: [],
                wasteInputs: [],
            };
        }
        onUpdate(updates);
    };

    const activityTotal = source.calculationMethod === 'supplier_co2e'
        ? (source.supplierProvidedCO2e ?? 0)
        : source.monthlyQuantities.reduce((sum, q) => sum + q, 0);

    const activityUnit = source.calculationMethod === 'supplier_co2e' ? 'kg CO₂e' : source.unit;

    // Factor category options for dropdown
    const factorCategoryOptions: { value: Category1FactorType | 'all', label: string }[] = [
        { value: 'all', label: language === 'ko' ? '전체' : 'All Categories' },
        { value: 'rawMaterials_metals', label: language === 'ko' ? '금속 원자재' : 'Metals' },
        { value: 'rawMaterials_plastics', label: language === 'ko' ? '플라스틱' : 'Plastics' },
        { value: 'rawMaterials_chemicals', label: language === 'ko' ? '화학제품' : 'Chemicals' },
        { value: 'rawMaterials_construction', label: language === 'ko' ? '건설자재' : 'Construction' },
        { value: 'packaging', label: language === 'ko' ? '포장재' : 'Packaging' },
        { value: 'electronics', label: language === 'ko' ? '전자부품' : 'Electronics' },
        { value: 'officeSupplies', label: language === 'ko' ? '사무용품' : 'Office Supplies' },
        { value: 'ppeSafety', label: language === 'ko' ? 'PPE/안전장비' : 'PPE & Safety' },
        { value: 'services', label: language === 'ko' ? '서비스 (지출기반)' : 'Services (Spend)' },
        { value: 'foodAgricultural', label: language === 'ko' ? '식품/농산물' : 'Food & Agricultural' },
        { value: 'textiles', label: language === 'ko' ? '섬유/가죽' : 'Textiles & Leather' },
    ];

    // DQI color based on score
    const getDQIColor = (score: number) => {
        if (score <= 1.5) return 'text-emerald-600 dark:text-emerald-400';
        if (score <= 2.5) return 'text-blue-600 dark:text-blue-400';
        if (score <= 3.5) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getDQIBgColor = (score: number) => {
        if (score <= 1.5) return 'bg-emerald-100 dark:bg-emerald-900/30';
        if (score <= 2.5) return 'bg-blue-100 dark:bg-blue-900/30';
        if (score <= 3.5) return 'bg-yellow-100 dark:bg-yellow-900/30';
        return 'bg-red-100 dark:bg-red-900/30';
    };

    return (
        <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex justify-between items-center">
                <div className='truncate pr-2'>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{source.fuelType || placeholderText}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('total')}: {activityTotal.toLocaleString()}&nbsp;
                        {renderUnit(activityUnit)} • {(totalEmissions / 1000).toLocaleString('en-US', { minimumFractionDigits: 3 })} t CO₂e
                        {source.dataQualityIndicator && (
                            <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium ${getDQIBgColor(dqiScore)} ${getDQIColor(dqiScore)}`}>
                                DQI: {dqiScore.toFixed(1)}
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => setIsExpanded(!isExpanded)} className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                        {isExpanded ? t('cancel') : t('editDetails')}
                    </button>
                    <button onClick={onRemove} className="text-gray-400 hover:text-red-600 p-1 dark:text-gray-500 dark:hover:text-red-500" aria-label={t('removeSourceAria')}>
                        <IconTrash className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {isExpanded && <div className="flex flex-col gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                {source.category === EmissionCategory.PurchasedGoodsAndServices && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 dark:bg-blue-900/30 dark:border-blue-700/50 dark:text-blue-200 text-xs space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2"><IconInfo className="w-4 h-4" /> {t('cat1GuidanceTitle')}</h4>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>{t('cat1GuidanceText')}</li>
                            <li dangerouslySetInnerHTML={{ __html: t('cat1BoundaryNote') }}></li>
                            <li dangerouslySetInnerHTML={{ __html: t('cat1CalculationMethods') }}></li>
                        </ul>
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200">
                            <p className="flex items-start gap-2">
                                <IconInfo className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span dangerouslySetInnerHTML={{ __html: t('cat1TransportWarning') }}></span>
                            </p>
                        </div>
                    </div>
                )}
                {source.category === EmissionCategory.CapitalGoods && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700/50 dark:text-yellow-200 text-xs space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2"><IconInfo className="w-4 h-4" /> {t('cat2GuidanceTitle')}</h4>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>{t('cat2GuidanceText')}</li>
                            <li dangerouslySetInnerHTML={{ __html: t('capitalGoodsInfoDepreciation') }}></li>
                            <li dangerouslySetInnerHTML={{ __html: t('capitalGoodsInfoCategorization') }}></li>
                            <li>{t('capitalGoodsInfoScope')}</li>
                            <li dangerouslySetInnerHTML={{ __html: t('capitalGoodsInfoDistinction') }}></li>
                        </ul>
                    </div>
                )}

                <div>
                    <label htmlFor={`description-${source.id}`} className={commonLabelClass}>{t('emissionSourceDescription')}</label>
                    <div className="flex gap-2">
                        <input
                            id={`description-${source.id}`}
                            type="text"
                            value={source.fuelType}
                            onChange={(e) => onUpdate({ fuelType: e.target.value })}
                            className={commonSelectClass}
                            placeholder={placeholderText}
                        />
                        <button onClick={handleAnalyze} disabled={isLoadingAI || !source.fuelType} className="px-3 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-gray-400 flex items-center gap-2 shadow-sm">
                            <IconSparkles className="w-4 h-4" />
                            <span className="text-sm font-semibold">{isLoadingAI ? '...' : t('analyzeWithAI')}</span>
                        </button>
                    </div>
                </div>
                {aiAnalysisResult && (
                    <div className={`p-3 border rounded-lg text-xs ${(aiAnalysisResult.suggested_category?.includes('2.') && source.category === EmissionCategory.PurchasedGoodsAndServices) ||
                        (aiAnalysisResult.suggested_category?.includes('1.') && source.category === EmissionCategory.CapitalGoods) ||
                        (aiAnalysisResult.suggested_category?.includes('4.') && source.category === EmissionCategory.PurchasedGoodsAndServices)
                        ? 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200'
                        : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200'
                        }`}>
                        {((aiAnalysisResult.suggested_category?.includes('2.') && source.category === EmissionCategory.PurchasedGoodsAndServices) ||
                            (aiAnalysisResult.suggested_category?.includes('1.') && source.category === EmissionCategory.CapitalGoods)) && (
                                <div className="flex items-center gap-2 font-bold mb-2">
                                    <IconInfo className="w-4 h-4" />
                                    {t('categoryMismatch')}: {aiAnalysisResult.suggested_category}
                                </div>
                            )}
                        {aiAnalysisResult.suggested_category?.includes('4.') && source.category === EmissionCategory.PurchasedGoodsAndServices && (
                            <div className="flex items-start gap-2 font-bold mb-2 text-yellow-800 dark:text-yellow-200">
                                <IconInfo className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p>{t('categoryMismatch')}: {aiAnalysisResult.suggested_category}</p>
                                    <p className="text-xs font-normal mt-1" dangerouslySetInnerHTML={{ __html: t('cat1TransportWarning') }}></p>
                                </div>
                            </div>
                        )}
                        <p className="text-xs mb-1"><span className="font-semibold">{t('suggestedCategory')}:</span> {aiAnalysisResult.suggested_category}</p>
                        <p className="text-xs"><span className="font-semibold">{t('justification')}:</span> {aiAnalysisResult.justification}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-300 mt-2 italic">{t('aiDisclaimer')}</p>
                    </div>
                )}
                {aiAnalysisResult?.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs whitespace-pre-wrap">
                        <strong>Error:</strong> {aiAnalysisResult.error}
                        <br />
                        <div className="mt-1 font-mono text-[10px] opacity-80">
                            {aiAnalysisResult.details}
                        </div>
                    </div>
                )}

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className={commonLabelClass}>{t('calculationMethod')}</label>
                        <button
                            onClick={() => setShowMethodologyWizard(true)}
                            className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium flex items-center gap-1"
                        >
                            <span>📊</span>
                            {language === 'ko' ? '방법론 선택 가이드' : 'Methodology Guide'}
                        </button>
                    </div>
                    <div className="flex gap-2 rounded-md bg-gray-100 dark:bg-gray-900 p-1">
                        {(['supplier_co2e', 'activity', 'spend', 'hybrid'] as CalculationMethod[]).map(method => (
                            <button
                                key={method}
                                onClick={() => handleMethodChange(method)}
                                className={`flex-1 text-xs py-1.5 px-1 rounded-md transition-colors ${source.calculationMethod === method ? 'bg-white dark:bg-gray-700 shadow font-semibold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'}`}>
                                {t(`${method.startsWith('supplier') ? 'supplier' : method}Method` as TranslationKey)}
                            </button>
                        ))}
                    </div>
                    {source.calculationMethod && (
                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                            {source.calculationMethod === 'supplier_co2e' && (
                                <p className="flex items-start gap-2">
                                    <IconInfo className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    <span>{source.category === EmissionCategory.PurchasedGoodsAndServices ? t('cat1MethodSupplier') : t('cat2MethodSupplier')}</span>
                                </p>
                            )}
                            {source.calculationMethod === 'activity' && (
                                <p className="flex items-start gap-2">
                                    <IconInfo className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    <span>{source.category === EmissionCategory.PurchasedGoodsAndServices ? t('cat1MethodActivity') : t('cat2MethodActivity')}</span>
                                </p>
                            )}
                            {source.calculationMethod === 'spend' && (
                                <p className="flex items-start gap-2">
                                    <IconInfo className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    <span>{source.category === EmissionCategory.PurchasedGoodsAndServices ? t('cat1MethodSpend') : t('cat2MethodSpend')}</span>
                                </p>
                            )}
                            {source.calculationMethod === 'hybrid' && (
                                <p className="flex items-start gap-2">
                                    <IconInfo className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    <span>{t('cat1MethodHybrid')}</span>
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {source.category === EmissionCategory.CapitalGoods && (
                    <>
                        <div>
                            <label htmlFor={`capital-goods-type-${source.id}`} className={commonLabelClass}>{t('capitalGoodsType')}</label>
                            <select
                                id={`capital-goods-type-${source.id}`}
                                value={source.capitalGoodsType || ''}
                                onChange={(e) => onUpdate({ capitalGoodsType: e.target.value as any || undefined })}
                                className={commonSelectClass}
                            >
                                <option value="">Select...</option>
                                <option value="Building">{t('capitalGoodsTypeBuilding')}</option>
                                <option value="Vehicle">{t('capitalGoodsTypeVehicle')}</option>
                                <option value="ManufacturingEquipment">{t('capitalGoodsTypeManufacturingEquipment')}</option>
                                <option value="ITEquipment">{t('capitalGoodsTypeITEquipment')}</option>
                                <option value="OfficeEquipment">{t('capitalGoodsTypeOfficeEquipment')}</option>
                                <option value="Other">{t('capitalGoodsTypeOther')}</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor={`acquisition-year-${source.id}`} className={commonLabelClass}>{t('acquisitionYear')}</label>
                            <input
                                id={`acquisition-year-${source.id}`}
                                type="text"
                                value={source.acquisitionYear || ''}
                                onChange={(e) => onUpdate({ acquisitionYear: e.target.value })}
                                className={commonSelectClass}
                                placeholder={t('acquisitionYearPlaceholder')}
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('acquisitionYearNote')}</p>
                        </div>
                    </>
                )}
                {source.calculationMethod === 'supplier_co2e' && (
                    <div>
                        <label htmlFor={`supplier-co2e-${source.id}`} className={commonLabelClass}>{t('supplierProvidedCO2e')}</label>
                        <input
                            id={`supplier-co2e-${source.id}`}
                            type="number" step="any"
                            value={source.supplierProvidedCO2e ?? ''}
                            onChange={(e) => onUpdate({ supplierProvidedCO2e: parseFloat(e.target.value) || 0 })}
                            className={commonSelectClass} placeholder="0"
                        />
                    </div>
                )}

                {/* ========== HYBRID METHOD UI ========== */}
                {source.calculationMethod === 'hybrid' && (
                    <HybridMethodUI
                        source={source}
                        onUpdate={onUpdate}
                        language={language}
                        t={t}
                    />
                )}
                
                {/* Emission Factor Section - Enhanced with Factor Selector */}
                {(source.calculationMethod === 'activity' || source.calculationMethod === 'spend') && (<>
                    {/* Factor Selector Button and Panel */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setShowFactorSelector(!showFactorSelector)}
                            className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {language === 'ko' ? '📊 배출계수 데이터베이스에서 선택' : '📊 Select from Emission Factor Database'}
                                </span>
                                {source.isFactorFromDatabase && source.selectedFactorName && (
                                    <span className="text-xs px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full">
                                        {source.selectedFactorName}
                                    </span>
                                )}
                            </div>
                            {showFactorSelector ? <IconChevronUp className="w-4 h-4 text-gray-500" /> : <IconChevronDown className="w-4 h-4 text-gray-500" />}
                        </button>
                        
                        {showFactorSelector && (
                            <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                                {/* Category Filter & Search */}
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <select
                                        value={selectedFactorCategory}
                                        onChange={(e) => setSelectedFactorCategory(e.target.value as Category1FactorType | 'all')}
                                        className={commonSelectClass}
                                    >
                                        {factorCategoryOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        value={factorSearchQuery}
                                        onChange={(e) => setFactorSearchQuery(e.target.value)}
                                        placeholder={language === 'ko' ? '배출계수 검색...' : 'Search factors...'}
                                        className={commonSelectClass}
                                    />
                                </div>
                                
                                {/* Factor List */}
                                <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                                    {filteredFactors.length === 0 ? (
                                        <p className="p-3 text-sm text-gray-500 text-center">
                                            {language === 'ko' ? '해당하는 배출계수가 없습니다' : 'No factors found'}
                                        </p>
                                    ) : (
                                        filteredFactors.map((factor, idx) => (
                                            <button
                                                key={`${factor.name}-${idx}`}
                                                onClick={() => handleFactorSelect(factor)}
                                                className={`w-full flex items-center justify-between p-2 text-left text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border-b border-gray-100 dark:border-gray-800 last:border-b-0 ${source.selectedFactorName === factor.name ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}
                                            >
                                                <div>
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {factor.translationKey ? t(factor.translationKey as TranslationKey) : factor.name}
                                                    </span>
                                                    <span className="ml-2 text-xs text-gray-500">
                                                        ({factor.units.join(', ')})
                                                    </span>
                                                </div>
                                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                                                    {Object.entries(factor.factors).map(([unit, val]) => `${val} kg/${unit}`).join(' | ')}
                                                </span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Manual Factor Input */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label htmlFor={`factor-${source.id}`} className={commonLabelClass}>{t('emissionFactor')}</label>
                            <input
                                id={`factor-${source.id}`}
                                type="number" step="any"
                                value={source.factor ?? ''}
                                onChange={(e) => onUpdate({ factor: parseFloat(e.target.value) || 0, isFactorFromDatabase: false })}
                                className={commonSelectClass} placeholder="0"
                            />
                        </div>
                        <div>
                            <label htmlFor={`factor-unit-${source.id}`} className={commonLabelClass}>{t('factorUnit')}</label>
                            <input
                                id={`factor-unit-${source.id}`}
                                type="text"
                                value={source.factorUnit ?? ''}
                                onChange={(e) => onUpdate({ factorUnit: e.target.value })}
                                className={commonSelectClass} placeholder="kg CO₂e / unit"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor={`factor-source-${source.id}`} className={commonLabelClass}>{t('factorSource')}</label>
                        <input
                            id={`factor-source-${source.id}`}
                            type="text"
                            value={source.factorSource ?? ''}
                            onChange={(e) => onUpdate({ factorSource: e.target.value })}
                            className={commonSelectClass} placeholder={t('factorSourcePlaceholder')}
                        />
                    </div>
                    {source.category === EmissionCategory.PurchasedGoodsAndServices && (
                        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200 text-xs">
                            <p className="flex items-start gap-2">
                                <IconInfo className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span dangerouslySetInnerHTML={{ __html: t('cat1TransportWarning') }}></span>
                            </p>
                        </div>
                    )}
                </>)}

                <div>
                    <label htmlFor={`activityDataSource-${source.id}`} className={commonLabelClass}>{t('activityDataSource')}</label>
                    <input
                        id={`activityDataSource-${source.id}`}
                        type="text"
                        value={source.activityDataSource ?? ''}
                        onChange={(e) => onUpdate({ activityDataSource: e.target.value })}
                        className={commonSelectClass} placeholder={t('activityDataSourcePlaceholder')}
                    />
                </div>
                
                {/* Enhanced DQI Section */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <button
                        onClick={() => setShowDQIPanel(!showDQIPanel)}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {language === 'ko' ? '📋 데이터 품질 지표 (DQI)' : '📋 Data Quality Indicator (DQI)'}
                            </span>
                            <div className={`flex items-center gap-2 px-2 py-1 rounded-full ${getDQIBgColor(dqiScore)}`}>
                                <span className={`text-sm font-bold ${getDQIColor(dqiScore)}`}>
                                    {dqiScore.toFixed(2)}
                                </span>
                                <span className={`text-xs ${getDQIColor(dqiScore)}`}>
                                    ({language === 'ko' ? 
                                        (dqiRating === 'high' ? '높음' : dqiRating === 'medium' ? '중간' : dqiRating === 'low' ? '낮음' : '추정')
                                        : dqiRating.charAt(0).toUpperCase() + dqiRating.slice(1)
                                    })
                                </span>
                            </div>
                        </div>
                        {showDQIPanel ? <IconChevronUp className="w-4 h-4 text-gray-500" /> : <IconChevronDown className="w-4 h-4 text-gray-500" />}
                    </button>
                    
                    {showDQIPanel && (
                        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 space-y-4">
                            {/* DQI Score Visualization */}
                            <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex-1">
                                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-300 ${
                                                dqiScore <= 1.5 ? 'bg-emerald-500' :
                                                dqiScore <= 2.5 ? 'bg-blue-500' :
                                                dqiScore <= 3.5 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                            style={{ width: `${(5 - dqiScore) / 4 * 100}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-1 text-[10px] text-gray-500">
                                        <span>{language === 'ko' ? '매우 좋음' : 'Very Good'}</span>
                                        <span>{language === 'ko' ? '매우 나쁨' : 'Very Poor'}</span>
                                    </div>
                                </div>
                                <div className={`text-2xl font-bold ${getDQIColor(dqiScore)}`}>
                                    {dqiScore.toFixed(2)}
                                </div>
                            </div>
                            
                            {/* DQI Dimension Inputs */}
                            {([
                                { key: 'technologicalRep', label: language === 'ko' ? '기술적 대표성' : 'Technological Rep.' },
                                { key: 'temporalRep', label: language === 'ko' ? '시간적 대표성' : 'Temporal Rep.' },
                                { key: 'geographicalRep', label: language === 'ko' ? '지리적 대표성' : 'Geographical Rep.' },
                                { key: 'completeness', label: language === 'ko' ? '완결성' : 'Completeness' },
                                { key: 'reliability', label: language === 'ko' ? '신뢰성' : 'Reliability' },
                            ] as { key: keyof DataQualityIndicator; label: string }[]).map(({ key, label }) => (
                                <div key={key} className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</label>
                                        <span className="text-xs text-gray-500">
                                            {DQI_DESCRIPTIONS[key][currentDQI[key] as 1 | 2 | 3 | 4 | 5]}
                                        </span>
                                    </div>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((val) => (
                                            <button
                                                key={val}
                                                onClick={() => handleDQIUpdate(key, val)}
                                                className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                                                    currentDQI[key] === val
                                                        ? val <= 2 ? 'bg-emerald-500 text-white' :
                                                          val <= 3 ? 'bg-yellow-500 text-white' :
                                                          'bg-red-500 text-white'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                }`}
                                            >
                                                {val}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            
                            {/* DQI Legend */}
                            <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs text-gray-500 dark:text-gray-400">
                                <p className="font-medium mb-1">{language === 'ko' ? '점수 기준:' : 'Score Guide:'}</p>
                                <p>1 = {language === 'ko' ? '매우 좋음' : 'Very Good'}, 5 = {language === 'ko' ? '매우 나쁨' : 'Very Poor'}</p>
                                <p className="mt-1">{language === 'ko' ? '가중 평균 점수가 낮을수록 데이터 품질이 높습니다.' : 'Lower weighted average = Higher quality data'}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <label htmlFor={`assumptions-${source.id}`} className={commonLabelClass}>{t('assumptionsNotes')}</label>
                    <textarea
                        id={`assumptions-${source.id}`}
                        value={source.assumptions ?? ''}
                        onChange={(e) => onUpdate({ assumptions: e.target.value })}
                        className={`${commonSelectClass} min-h-[60px]`}
                        placeholder={t('assumptionsNotesPlaceholder')}
                    />
                </div>

                <div className="mt-2">
                    <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-900/50 p-2 rounded-md">
                        <div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('totalYear')}: </span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{totalQuantity.toLocaleString()}&nbsp;{renderUnit(source.unit)}</span>
                        </div>
                        {!isEditing && (
                            <button onClick={handleEdit} disabled={source.calculationMethod === 'supplier_co2e'} className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed">
                                {t('editMonthly')}
                            </button>
                        )}
                    </div>
                    {isEditing && (
                        <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-900/50 rounded-b-lg">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {monthKeys.map((monthKey, index) => (
                                    <div key={monthKey}>
                                        <label className={commonLabelClass} htmlFor={`quantity-${source.id}-${index}`}>{t(monthKey)}</label>
                                        <div className={`flex items-center rounded-md shadow-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus-within:ring-1 focus-within:ring-emerald-500 focus-within:border-emerald-500 overflow-hidden`}>
                                            <input
                                                id={`quantity-${source.id}-${index}`}
                                                type="number"
                                                onKeyDown={preventNonNumericKeys}
                                                value={editedQuantities[index] === 0 ? '' : editedQuantities[index]}
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
                                <button onClick={handleCancel} className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600">{t('cancel')}</button>
                                <button onClick={handleSave} className="px-3 py-1 text-sm font-medium text-white bg-emerald-600 rounded-md shadow-sm hover:bg-emerald-700">{t('save')}</button>
                            </div>
                        </div>
                    )}
                </div>

            </div>}
            
            {/* Methodology Selection Wizard */}
            <MethodologyWizard
                isOpen={showMethodologyWizard}
                onClose={() => setShowMethodologyWizard(false)}
                onSelectMethod={(method) => handleMethodChange(method)}
                currentMethod={source.calculationMethod as CalculationMethod}
            />
        </div>
    );
};
