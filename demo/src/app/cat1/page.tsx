"use client";

import React, { useState, useMemo } from 'react';
import {
  CO2eFactorFuel,
  CalculationMethod,
  Category1FactorType,
  DemoEmissionSource,
  DataQualityIndicator,
  HybridCalculationData,
  HybridMaterialInput,
  HybridTransportInput,
  HybridWasteInput,
  TransportMode,
  WasteType,
  TreatmentMethod,
  calculateDQIScore,
  getDQIRating
} from '@/types';
import {
  ALL_CATEGORY1_FACTORS,
  getFactorsByType,
} from '@/constants/category1';

// ============================================================================
// Constants
// ============================================================================
const generateId = () => Math.random().toString(36).substr(2, 9);

const TRANSPORT_MODES: { value: TransportMode; label: string; defaultFactor: number }[] = [
  { value: 'Road', label: '도로 운송', defaultFactor: 0.062 },
  { value: 'Rail', label: '철도 운송', defaultFactor: 0.022 },
  { value: 'Sea', label: '해상 운송', defaultFactor: 0.016 },
  { value: 'Air', label: '항공 운송', defaultFactor: 0.602 },
];

const WASTE_TYPES: { value: WasteType; label: string }[] = [
  { value: 'MSW', label: '일반 폐기물' },
  { value: 'Paper', label: '종이류' },
  { value: 'Plastics', label: '플라스틱' },
  { value: 'Food', label: '음식물' },
  { value: 'Metal', label: '금속류' },
  { value: 'Hazardous', label: '유해 폐기물' },
];

const TREATMENT_METHODS: { value: TreatmentMethod; label: string; defaultFactor: number }[] = [
  { value: 'Landfill', label: '매립', defaultFactor: 0.587 },
  { value: 'Incineration', label: '소각', defaultFactor: 0.989 },
  { value: 'Recycling', label: '재활용', defaultFactor: 0.021 },
  { value: 'Composting', label: '퇴비화', defaultFactor: 0.023 },
  { value: 'AnaerobicDigestion', label: '혐기성 소화', defaultFactor: 0.018 },
];

const CATEGORY_OPTIONS: { value: Category1FactorType; label: string }[] = [
  { value: 'rawMaterials_metals', label: '금속 원자재' },
  { value: 'rawMaterials_plastics', label: '플라스틱' },
  { value: 'rawMaterials_chemicals', label: '화학제품' },
  { value: 'rawMaterials_construction', label: '건설자재' },
  { value: 'packaging', label: '포장재' },
  { value: 'electronics', label: '전자부품' },
  { value: 'officeSupplies', label: '사무용품' },
  { value: 'ppeSafety', label: 'PPE/안전장비' },
  { value: 'services', label: '서비스 (지출기반)' },
  { value: 'foodAgricultural', label: '식품/농산물' },
  { value: 'textiles', label: '섬유/가죽' },
  { value: 'custom', label: '직접 입력' },
];

const METHOD_OPTIONS: { value: CalculationMethod; label: string; description: string }[] = [
  { value: 'supplier_co2e', label: '공급업체 제공', description: '공급업체로부터 직접 CO₂e 값을 제공받은 경우' },
  { value: 'hybrid', label: '하이브리드', description: '물질투입 + 운송 + 폐기물을 종합 계산' },
  { value: 'activity', label: '활동 기반', description: '구매량 × 배출계수 (kg, tonnes 등)' },
  { value: 'spend', label: '지출 기반', description: '지출금액 × 배출계수 (KRW, USD)' },
];

// ============================================================================
// Styles
// ============================================================================
const inputClass = "block w-full rounded-md border border-gray-600 shadow-sm py-2 px-3 text-sm bg-gray-900 text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder:text-gray-500";
const selectClass = "block w-full rounded-md border border-gray-600 shadow-sm py-2 px-3 text-sm bg-gray-900 text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500";
const labelClass = "block text-xs font-medium text-gray-400 mb-1";
const cardClass = "p-4 rounded-xl border border-gray-700 bg-gray-800";

// ============================================================================
// Helper Functions
// ============================================================================
const createEmptySource = (): DemoEmissionSource => ({
  id: generateId(),
  itemName: '',
  calculationMethod: 'activity',
  quantity: 0,
  unit: 'kg',
  emissionFactor: 0,
  cat1FactorType: undefined,
  selectedFactorName: undefined,
  isFactorFromDatabase: false,
  hybridData: undefined,
});

// ============================================================================
// Hybrid Method UI Component
// ============================================================================
interface HybridMethodUIProps {
  hybridData: HybridCalculationData;
  onUpdate: (updates: Partial<HybridCalculationData>) => void;
}

const HybridMethodUI: React.FC<HybridMethodUIProps> = ({ hybridData, onUpdate }) => {
  const addMaterial = () => {
    const newMaterial: HybridMaterialInput = {
      id: generateId(),
      materialName: '',
      quantity: 0,
      unit: 'kg',
      emissionFactor: 0,
    };
    onUpdate({ materialInputs: [...(hybridData.materialInputs || []), newMaterial] });
  };

  const updateMaterial = (id: string, updates: Partial<HybridMaterialInput>) => {
    onUpdate({
      materialInputs: hybridData.materialInputs?.map(m => m.id === id ? { ...m, ...updates } : m) || []
    });
  };

  const removeMaterial = (id: string) => {
    onUpdate({ materialInputs: hybridData.materialInputs?.filter(m => m.id !== id) || [] });
  };

  const addTransport = () => {
    const newTransport: HybridTransportInput = {
      id: generateId(),
      transportMode: 'Road',
      weightTonnes: 0,
      distanceKm: 0,
    };
    onUpdate({ transportInputs: [...(hybridData.transportInputs || []), newTransport] });
  };

  const updateTransport = (id: string, updates: Partial<HybridTransportInput>) => {
    onUpdate({
      transportInputs: hybridData.transportInputs?.map(t => t.id === id ? { ...t, ...updates } : t) || []
    });
  };

  const removeTransport = (id: string) => {
    onUpdate({ transportInputs: hybridData.transportInputs?.filter(t => t.id !== id) || [] });
  };

  const addWaste = () => {
    const newWaste: HybridWasteInput = {
      id: generateId(),
      wasteType: 'MSW',
      treatmentMethod: 'Landfill',
      quantity: 0,
      unit: 'kg',
    };
    onUpdate({ wasteInputs: [...(hybridData.wasteInputs || []), newWaste] });
  };

  const updateWaste = (id: string, updates: Partial<HybridWasteInput>) => {
    onUpdate({
      wasteInputs: hybridData.wasteInputs?.map(w => w.id === id ? { ...w, ...updates } : w) || []
    });
  };

  const removeWaste = (id: string) => {
    onUpdate({ wasteInputs: hybridData.wasteInputs?.filter(w => w.id !== id) || [] });
  };

  // Calculate totals
  const materialTotal = (hybridData.materialInputs || []).reduce((sum, m) => {
    const qty = m.unit === 'tonnes' ? m.quantity * 1000 : m.quantity;
    return sum + qty * m.emissionFactor;
  }, 0);

  const transportTotal = (hybridData.transportInputs || []).reduce((sum, t) => {
    const factor = t.emissionFactor || TRANSPORT_MODES.find(tm => tm.value === t.transportMode)?.defaultFactor || 0;
    return sum + t.weightTonnes * t.distanceKm * factor;
  }, 0);

  const wasteTotal = (hybridData.wasteInputs || []).reduce((sum, w) => {
    const factor = w.emissionFactor || TREATMENT_METHODS.find(tm => tm.value === w.treatmentMethod)?.defaultFactor || 0;
    const qty = w.unit === 'tonnes' ? w.quantity * 1000 : w.quantity;
    return sum + qty * factor;
  }, 0);

  const supplierTotal = hybridData.supplierScope12
    ? (hybridData.supplierScope12.totalEmissions * hybridData.supplierScope12.allocationPercentage / 100)
    : 0;

  const grandTotal = supplierTotal + materialTotal + transportTotal + wasteTotal;

  return (
    <div className="space-y-4 border-2 border-purple-500/50 rounded-lg p-4 bg-purple-900/20">
      <div className="flex items-center gap-2 text-purple-400 font-semibold">
        <span className="text-lg">🔀</span>
        <span>하이브리드 산정법 입력</span>
      </div>

      {/* 1. Supplier Scope 1,2 */}
      <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
        <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-3">
          <span className="w-5 h-5 flex items-center justify-center rounded-full bg-purple-900 text-purple-400 text-xs">1</span>
          공급업체 Scope 1, 2 할당 배출량
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>공급업체 총 Scope 1,2 배출량 (kgCO₂e)</label>
            <input
              type="number"
              value={hybridData.supplierScope12?.totalEmissions ?? ''}
              onChange={(e) => onUpdate({
                supplierScope12: {
                  ...(hybridData.supplierScope12 || { allocationBasis: 'quantity', allocationPercentage: 0 }),
                  totalEmissions: parseFloat(e.target.value) || 0,
                  allocationBasis: hybridData.supplierScope12?.allocationBasis || 'quantity',
                  allocationPercentage: hybridData.supplierScope12?.allocationPercentage ?? 0,
                }
              })}
              className={inputClass}
              placeholder="0"
            />
          </div>
          <div>
            <label className={labelClass}>할당 기준</label>
            <select
              value={hybridData.supplierScope12?.allocationBasis || 'quantity'}
              onChange={(e) => onUpdate({
                supplierScope12: {
                  ...(hybridData.supplierScope12 || { totalEmissions: 0, allocationPercentage: 0 }),
                  allocationBasis: e.target.value as 'revenue' | 'quantity' | 'custom',
                }
              })}
              className={selectClass}
            >
              <option value="quantity">물량 기준</option>
              <option value="revenue">매출 기준</option>
              <option value="custom">사용자 정의</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>할당 비율 (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={hybridData.supplierScope12?.allocationPercentage ?? ''}
              onChange={(e) => onUpdate({
                supplierScope12: {
                  ...(hybridData.supplierScope12 || { totalEmissions: 0, allocationBasis: 'quantity' }),
                  allocationPercentage: parseFloat(e.target.value) || 0,
                }
              })}
              className={inputClass}
              placeholder="0"
            />
          </div>
        </div>
        {supplierTotal > 0 && (
          <div className="text-xs text-purple-400 mt-2">
            → 할당 배출량: {supplierTotal.toLocaleString()} kgCO₂e
          </div>
        )}
      </div>

      {/* 2. Material Inputs */}
      <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-900 text-blue-400 text-xs">2</span>
            투입 물질별 배출량 (Cradle-to-Gate)
          </h4>
          <button
            onClick={addMaterial}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-900/50 text-blue-400 hover:bg-blue-900"
          >
            + 물질 추가
          </button>
        </div>

        {(hybridData.materialInputs || []).length === 0 && (
          <p className="text-xs text-gray-500 italic py-2">투입 물질을 추가하세요</p>
        )}

        {(hybridData.materialInputs || []).map((m) => (
          <div key={m.id} className="grid grid-cols-12 gap-2 items-end p-2 bg-gray-900/50 rounded mb-2">
            <div className="col-span-3">
              <label className={labelClass}>물질명</label>
              <input
                type="text"
                value={m.materialName}
                onChange={(e) => updateMaterial(m.id, { materialName: e.target.value })}
                className={inputClass}
                placeholder="예: 철강"
              />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>투입량</label>
              <input
                type="number"
                value={m.quantity || ''}
                onChange={(e) => updateMaterial(m.id, { quantity: parseFloat(e.target.value) || 0 })}
                className={inputClass}
                placeholder="0"
              />
            </div>
            <div className="col-span-1">
              <label className={labelClass}>단위</label>
              <select
                value={m.unit}
                onChange={(e) => updateMaterial(m.id, { unit: e.target.value })}
                className={selectClass}
              >
                <option value="kg">kg</option>
                <option value="tonnes">t</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelClass}>배출계수</label>
              <input
                type="number"
                step="0.001"
                value={m.emissionFactor || ''}
                onChange={(e) => updateMaterial(m.id, { emissionFactor: parseFloat(e.target.value) || 0 })}
                className={inputClass}
                placeholder="kgCO₂e/unit"
              />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>출처</label>
              <input
                type="text"
                value={m.factorSource || ''}
                onChange={(e) => updateMaterial(m.id, { factorSource: e.target.value })}
                className={inputClass}
                placeholder="Ecoinvent"
              />
            </div>
            <div className="col-span-1">
              <label className={labelClass}>배출량</label>
              <div className="text-sm font-medium text-gray-300 py-2">
                {((m.unit === 'tonnes' ? m.quantity * 1000 : m.quantity) * m.emissionFactor).toLocaleString()}
              </div>
            </div>
            <div className="col-span-1 flex justify-end">
              <button
                onClick={() => removeMaterial(m.id)}
                className="p-1 text-red-500 hover:bg-red-900/30 rounded"
              >
                ✕
              </button>
            </div>
          </div>
        ))}

        {materialTotal > 0 && (
          <div className="text-xs text-blue-400 mt-2">
            → 물질 소계: {materialTotal.toLocaleString()} kgCO₂e
          </div>
        )}
      </div>

      {/* 3. Transport Inputs */}
      <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-orange-900 text-orange-400 text-xs">3</span>
            운송 배출량 (Upstream Transport)
          </h4>
          <button
            onClick={addTransport}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-orange-900/50 text-orange-400 hover:bg-orange-900"
          >
            + 운송 추가
          </button>
        </div>

        {(hybridData.transportInputs || []).length === 0 && (
          <p className="text-xs text-gray-500 italic py-2">운송 정보를 추가하세요</p>
        )}

        {(hybridData.transportInputs || []).map((t) => {
          const defaultFactor = TRANSPORT_MODES.find(tm => tm.value === t.transportMode)?.defaultFactor || 0;
          const factor = t.emissionFactor || defaultFactor;
          const emissions = t.weightTonnes * t.distanceKm * factor;

          return (
            <div key={t.id} className="grid grid-cols-12 gap-2 items-end p-2 bg-gray-900/50 rounded mb-2">
              <div className="col-span-2">
                <label className={labelClass}>운송수단</label>
                <select
                  value={t.transportMode}
                  onChange={(e) => updateTransport(t.id, { transportMode: e.target.value as TransportMode })}
                  className={selectClass}
                >
                  {TRANSPORT_MODES.map(mode => (
                    <option key={mode.value} value={mode.value}>{mode.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelClass}>운송량 (t)</label>
                <input
                  type="number"
                  step="0.01"
                  value={t.weightTonnes || ''}
                  onChange={(e) => updateTransport(t.id, { weightTonnes: parseFloat(e.target.value) || 0 })}
                  className={inputClass}
                  placeholder="0"
                />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>거리 (km)</label>
                <input
                  type="number"
                  value={t.distanceKm || ''}
                  onChange={(e) => updateTransport(t.id, { distanceKm: parseFloat(e.target.value) || 0 })}
                  className={inputClass}
                  placeholder="0"
                />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>배출계수</label>
                <input
                  type="number"
                  step="0.001"
                  value={t.emissionFactor ?? defaultFactor}
                  onChange={(e) => updateTransport(t.id, { emissionFactor: parseFloat(e.target.value) || undefined })}
                  className={inputClass}
                  placeholder={`${defaultFactor}`}
                />
                <span className="text-[10px] text-gray-500">kgCO₂e/t·km</span>
              </div>
              <div className="col-span-3">
                <label className={labelClass}>설명</label>
                <input
                  type="text"
                  value={t.description || ''}
                  onChange={(e) => updateTransport(t.id, { description: e.target.value })}
                  className={inputClass}
                  placeholder="원자재 운송"
                />
              </div>
              <div className="col-span-1 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-300">{emissions.toLocaleString()}</span>
                <button
                  onClick={() => removeTransport(t.id)}
                  className="p-1 text-red-500 hover:bg-red-900/30 rounded"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}

        {transportTotal > 0 && (
          <div className="text-xs text-orange-400 mt-2">
            → 운송 소계: {transportTotal.toLocaleString()} kgCO₂e
          </div>
        )}
      </div>

      {/* 4. Waste Inputs */}
      <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-green-900 text-green-400 text-xs">4</span>
            폐기물 처리 배출량
          </h4>
          <button
            onClick={addWaste}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-green-900/50 text-green-400 hover:bg-green-900"
          >
            + 폐기물 추가
          </button>
        </div>

        {(hybridData.wasteInputs || []).length === 0 && (
          <p className="text-xs text-gray-500 italic py-2">폐기물 정보를 추가하세요</p>
        )}

        {(hybridData.wasteInputs || []).map((w) => {
          const defaultFactor = TREATMENT_METHODS.find(tm => tm.value === w.treatmentMethod)?.defaultFactor || 0;
          const factor = w.emissionFactor || defaultFactor;
          const qty = w.unit === 'tonnes' ? w.quantity * 1000 : w.quantity;
          const emissions = qty * factor;

          return (
            <div key={w.id} className="grid grid-cols-12 gap-2 items-end p-2 bg-gray-900/50 rounded mb-2">
              <div className="col-span-2">
                <label className={labelClass}>폐기물 종류</label>
                <select
                  value={w.wasteType}
                  onChange={(e) => updateWaste(w.id, { wasteType: e.target.value as WasteType })}
                  className={selectClass}
                >
                  {WASTE_TYPES.map(wt => (
                    <option key={wt.value} value={wt.value}>{wt.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelClass}>처리 방법</label>
                <select
                  value={w.treatmentMethod}
                  onChange={(e) => updateWaste(w.id, { treatmentMethod: e.target.value as TreatmentMethod })}
                  className={selectClass}
                >
                  {TREATMENT_METHODS.map(tm => (
                    <option key={tm.value} value={tm.value}>{tm.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelClass}>폐기량</label>
                <input
                  type="number"
                  step="0.01"
                  value={w.quantity || ''}
                  onChange={(e) => updateWaste(w.id, { quantity: parseFloat(e.target.value) || 0 })}
                  className={inputClass}
                  placeholder="0"
                />
              </div>
              <div className="col-span-1">
                <label className={labelClass}>단위</label>
                <select
                  value={w.unit}
                  onChange={(e) => updateWaste(w.id, { unit: e.target.value })}
                  className={selectClass}
                >
                  <option value="kg">kg</option>
                  <option value="tonnes">t</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelClass}>배출계수</label>
                <input
                  type="number"
                  step="0.001"
                  value={w.emissionFactor ?? defaultFactor}
                  onChange={(e) => updateWaste(w.id, { emissionFactor: parseFloat(e.target.value) || undefined })}
                  className={inputClass}
                  placeholder={`${defaultFactor}`}
                />
                <span className="text-[10px] text-gray-500">kgCO₂e/kg</span>
              </div>
              <div className="col-span-2">
                <label className={labelClass}>배출량</label>
                <div className="text-sm font-medium text-gray-300 py-2">
                  {emissions.toLocaleString()} kgCO₂e
                </div>
              </div>
              <div className="col-span-1 flex justify-end">
                <button
                  onClick={() => removeWaste(w.id)}
                  className="p-1 text-red-500 hover:bg-red-900/30 rounded"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}

        {wasteTotal > 0 && (
          <div className="text-xs text-green-400 mt-2">
            → 폐기물 소계: {wasteTotal.toLocaleString()} kgCO₂e
          </div>
        )}
      </div>

      {/* Total */}
      <div className="p-4 bg-purple-900/30 rounded-lg border-2 border-purple-500/50">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-purple-300">🔢 하이브리드 총 배출량</span>
          <span className="text-xl font-bold text-purple-100">
            {grandTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })} kgCO₂e
          </span>
        </div>
        <div className="mt-2 text-xs text-purple-400">
          = 공급업체 Scope 1,2 할당 + 투입물질 Cradle-to-Gate + 운송 + 폐기물 처리
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Main Page Component
// ============================================================================
export default function Home() {
  const [sources, setSources] = useState<DemoEmissionSource[]>([createEmptySource()]);

  // Calculate total emissions
  const totalEmissions = useMemo(() => {
    return sources.reduce((sum, source) => {
      if (source.calculationMethod === 'supplier_co2e') {
        return sum + (source.supplierProvidedCO2e || 0);
      }
      if (source.calculationMethod === 'hybrid' && source.hybridData) {
        const hd = source.hybridData;
        let total = 0;
        if (hd.supplierScope12) {
          total += (hd.supplierScope12.totalEmissions * hd.supplierScope12.allocationPercentage) / 100;
        }
        (hd.materialInputs || []).forEach(m => {
          const qty = m.unit === 'tonnes' ? m.quantity * 1000 : m.quantity;
          total += qty * m.emissionFactor;
        });
        (hd.transportInputs || []).forEach(t => {
          const factor = t.emissionFactor || TRANSPORT_MODES.find(tm => tm.value === t.transportMode)?.defaultFactor || 0;
          total += t.weightTonnes * t.distanceKm * factor;
        });
        (hd.wasteInputs || []).forEach(w => {
          const factor = w.emissionFactor || TREATMENT_METHODS.find(tm => tm.value === w.treatmentMethod)?.defaultFactor || 0;
          const qty = w.unit === 'tonnes' ? w.quantity * 1000 : w.quantity;
          total += qty * factor;
        });
        return sum + total;
      }
      return sum + (source.quantity * source.emissionFactor);
    }, 0);
  }, [sources]);

  const addSource = () => {
    setSources([...sources, createEmptySource()]);
  };

  const removeSource = (id: string) => {
    if (sources.length > 1) {
      setSources(sources.filter(s => s.id !== id));
    }
  };

  const updateSource = (id: string, updates: Partial<DemoEmissionSource>) => {
    setSources(sources.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleMethodChange = (id: string, method: CalculationMethod) => {
    const updates: Partial<DemoEmissionSource> = {
      calculationMethod: method,
      isFactorFromDatabase: false,
      selectedFactorName: undefined,
    };

    if (method === 'spend') {
      updates.unit = 'KRW';
      updates.emissionFactor = 0;
    } else if (method === 'activity') {
      updates.unit = 'kg';
      updates.emissionFactor = 0;
    } else if (method === 'supplier_co2e') {
      updates.supplierProvidedCO2e = 0;
    } else if (method === 'hybrid') {
      updates.hybridData = {
        materialInputs: [],
        transportInputs: [],
        wasteInputs: [],
      };
    }

    updateSource(id, updates);
  };

  const handleFactorSelect = (id: string, factor: CO2eFactorFuel, source: DemoEmissionSource) => {
    const primaryUnit = source.calculationMethod === 'spend'
      ? (factor.units.includes('KRW') ? 'KRW' : 'USD')
      : factor.units[0];

    updateSource(id, {
      selectedFactorName: factor.name,
      emissionFactor: factor.factors[primaryUnit] || 0,
      unit: primaryUnit,
      isFactorFromDatabase: true,
      factorSource: factor.source || 'Database',
    });
  };

  const resetAll = () => {
    setSources([createEmptySource()]);
  };

  const copyResult = () => {
    const text = sources.map(s =>
      `${s.itemName || s.selectedFactorName || '항목'}: ${s.calculationMethod === 'supplier_co2e'
        ? (s.supplierProvidedCO2e || 0).toFixed(2)
        : (s.quantity * s.emissionFactor).toFixed(2)
      } kg CO₂e`
    ).join('\n') + `\n\n총 배출량: ${totalEmissions.toFixed(2)} kg CO₂e`;
    navigator.clipboard.writeText(text);
    alert('결과가 복사되었습니다!');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Data Security Banner */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-3 text-sm">
          <span className="text-xl">🔒</span>
          <p className="font-medium">
            <strong>데이터 보안 안내:</strong> 이 데모에서 입력하신 모든 데이터는 <u>서버에 저장되지 않습니다</u>.
            브라우저를 새로고침하면 모든 데이터가 초기화됩니다. 기업 기밀 정보 유출 걱정 없이 테스트하세요!
          </p>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-gray-900/90 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                <span className="text-white text-xl">🌱</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  GHG Scope 3 계산기
                </h1>
                <p className="text-sm text-teal-400">
                  Category 1: 구매한 제품 및 서비스
                  <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs font-bold">
                    DEMO
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Info Box */}
        <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700/50 rounded-lg text-blue-200 text-sm">
          <h4 className="font-semibold text-blue-100 flex items-center gap-2 mb-2">
            ℹ️ Category 1 (구매한 제품 및 서비스) 안내
          </h4>
          <ul className="list-disc pl-5 space-y-1 text-blue-300">
            <li>구매한 원자재, 부품, 제품 및 외부 서비스의 <b>Cradle-to-Gate 배출량</b>을 계산합니다.</li>
            <li><b>Cradle-to-Gate</b>: 원료 추출 → 제조 → 납품까지의 전 과정 배출량 (사용/폐기 제외)</li>
            <li>운송이 별도 분리되는 경우 Category 4에 포함되므로 <b>이중계상에 주의</b>하세요.</li>
          </ul>
        </div>

        {/* Calculator Card */}
        <div className="bg-gray-900 rounded-2xl shadow-xl border border-gray-800 overflow-hidden">
          {/* Sources */}
          <div className="p-6 space-y-6">
            {sources.map((source, index) => (
              <div
                key={source.id}
                className="p-4 rounded-xl border border-gray-700 bg-gray-800"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-400">
                    배출원 #{index + 1}
                  </span>
                  {sources.length > 1 && (
                    <button
                      onClick={() => removeSource(source.id)}
                      className="text-red-500 hover:text-red-400 text-sm"
                    >
                      삭제
                    </button>
                  )}
                </div>

                {/* Method Selection */}
                <div className="mb-4">
                  <label className={labelClass}>계산 방법 선택</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
                    {METHOD_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => handleMethodChange(source.id, opt.value)}
                        className={`p-2 rounded-lg border text-left transition-all ${source.calculationMethod === opt.value
                            ? 'border-teal-500 bg-teal-500/20 text-teal-400'
                            : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                          }`}
                      >
                        <div className="font-medium text-sm">{opt.label}</div>
                        <div className="text-xs opacity-70">{opt.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Supplier Method */}
                {source.calculationMethod === 'supplier_co2e' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>품목명</label>
                      <input
                        type="text"
                        value={source.itemName}
                        onChange={(e) => updateSource(source.id, { itemName: e.target.value })}
                        placeholder="예: 철강 원자재"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>공급업체 제공 CO₂e (kg)</label>
                      <input
                        type="number"
                        value={source.supplierProvidedCO2e || ''}
                        onChange={(e) => updateSource(source.id, { supplierProvidedCO2e: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                        className={inputClass}
                      />
                    </div>
                  </div>
                )}

                {/* Hybrid Method */}
                {source.calculationMethod === 'hybrid' && source.hybridData && (
                  <HybridMethodUI
                    hybridData={source.hybridData}
                    onUpdate={(updates) => updateSource(source.id, {
                      hybridData: { ...source.hybridData!, ...updates }
                    })}
                  />
                )}

                {/* Activity / Spend Method */}
                {(source.calculationMethod === 'activity' || source.calculationMethod === 'spend') && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>품목명</label>
                        <input
                          type="text"
                          value={source.itemName}
                          onChange={(e) => updateSource(source.id, { itemName: e.target.value })}
                          placeholder="예: 철강 원자재"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>카테고리</label>
                        <select
                          value={source.cat1FactorType || ''}
                          onChange={(e) => updateSource(source.id, {
                            cat1FactorType: e.target.value as Category1FactorType,
                            selectedFactorName: undefined,
                            emissionFactor: 0,
                          })}
                          className={selectClass}
                        >
                          <option value="">선택...</option>
                          {CATEGORY_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {source.cat1FactorType && source.cat1FactorType !== 'custom' && (
                      <div>
                        <label className={labelClass}>배출계수 선택</label>
                        <select
                          value={source.selectedFactorName || ''}
                          onChange={(e) => {
                            const factors = getFactorsByType(source.cat1FactorType!);
                            const factor = factors.find(f => f.name === e.target.value);
                            if (factor) {
                              handleFactorSelect(source.id, factor, source);
                            }
                          }}
                          className={selectClass}
                        >
                          <option value="">선택...</option>
                          {getFactorsByType(source.cat1FactorType)
                            .filter(f => {
                              if (source.calculationMethod === 'spend') {
                                return f.units.includes('KRW') || f.units.includes('USD');
                              }
                              return f.units.includes('kg') || f.units.includes('tonnes');
                            })
                            .map(factor => (
                              <option key={factor.name} value={factor.name}>
                                {factor.name} ({Object.entries(factor.factors).map(([u, v]) => `${v} kgCO₂e/${u}`).join(', ')})
                              </option>
                            ))}
                        </select>
                      </div>
                    )}

                    {source.cat1FactorType === 'custom' && (
                      <div>
                        <label className={labelClass}>직접 입력 배출계수 (kgCO₂e/{source.unit})</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={source.emissionFactor || ''}
                          onChange={(e) => updateSource(source.id, { emissionFactor: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          className={inputClass}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>
                          {source.calculationMethod === 'spend' ? '지출금액' : '구매량'}
                        </label>
                        <input
                          type="number"
                          value={source.quantity || ''}
                          onChange={(e) => updateSource(source.id, { quantity: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>단위</label>
                        {source.selectedFactorName && source.cat1FactorType !== 'custom' ? (
                          <select
                            value={source.unit}
                            onChange={(e) => {
                              const factors = getFactorsByType(source.cat1FactorType!);
                              const factor = factors.find(f => f.name === source.selectedFactorName);
                              if (factor && factor.factors[e.target.value]) {
                                updateSource(source.id, {
                                  unit: e.target.value,
                                  emissionFactor: factor.factors[e.target.value]
                                });
                              }
                            }}
                            className={selectClass}
                          >
                            {getFactorsByType(source.cat1FactorType!)
                              .find(f => f.name === source.selectedFactorName)?.units
                              .map(u => <option key={u} value={u}>{u}</option>)
                            }
                          </select>
                        ) : (
                          <select
                            value={source.unit}
                            onChange={(e) => updateSource(source.id, { unit: e.target.value })}
                            className={selectClass}
                          >
                            {source.calculationMethod === 'spend' ? (
                              <>
                                <option value="KRW">KRW (원)</option>
                                <option value="USD">USD ($)</option>
                              </>
                            ) : (
                              <>
                                <option value="kg">kg</option>
                                <option value="tonnes">tonnes</option>
                                <option value="pcs">개</option>
                                <option value="L">L</option>
                                <option value="m²">m²</option>
                              </>
                            )}
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Emission Result */}
                {((source.calculationMethod === 'activity' || source.calculationMethod === 'spend') && source.quantity > 0 && source.emissionFactor > 0) ||
                  (source.calculationMethod === 'supplier_co2e' && (source.supplierProvidedCO2e || 0) > 0) ? (
                  <div className="mt-4 p-3 rounded-lg bg-teal-500/20 border border-teal-500/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-teal-300">배출량:</span>
                      <span className="font-bold text-teal-200">
                        {source.calculationMethod === 'supplier_co2e'
                          ? (source.supplierProvidedCO2e || 0).toLocaleString()
                          : (source.quantity * source.emissionFactor).toLocaleString()
                        } kg CO₂e
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}

            {/* Add Item Button */}
            <button
              onClick={addSource}
              className="w-full py-3 border-2 border-dashed border-teal-600/50 rounded-xl text-teal-400 hover:bg-teal-900/20 transition-colors font-medium"
            >
              + 배출원 추가
            </button>
          </div>

          {/* Total Results */}
          <div className="px-6 py-5 bg-gradient-to-r from-teal-600 to-emerald-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm">총 배출량</p>
                <p className="text-3xl font-bold text-white">
                  {totalEmissions.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  <span className="text-lg ml-2">kg CO₂e</span>
                </p>
                {totalEmissions >= 1000 && (
                  <p className="text-teal-200 text-sm mt-1">
                    = {(totalEmissions / 1000).toLocaleString(undefined, { maximumFractionDigits: 3 })} t CO₂e
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={resetAll}
                  className="px-4 py-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
                >
                  초기화
                </button>
                <button
                  onClick={copyResult}
                  className="px-4 py-2 rounded-lg bg-white text-teal-700 font-medium hover:bg-teal-50 transition-colors"
                >
                  결과 복사
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Data Security Reminder */}
        <div className="mt-6 p-4 bg-gray-800 border border-gray-700 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <h4 className="font-semibold text-gray-200 mb-1">데이터 보안</h4>
              <p className="text-sm text-gray-400">
                이 데모 버전에서는 입력하신 모든 데이터가 <strong className="text-amber-400">로컬 브라우저에서만 처리</strong>됩니다.
                서버로 전송되거나 저장되지 않으므로, 기업의 민감한 데이터를 안심하고 테스트해 보실 수 있습니다.
                페이지를 새로고침하면 모든 데이터가 완전히 초기화됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-8 p-8 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">전체 버전이 필요하신가요?</h3>
          <p className="text-indigo-100 mb-6">
            Scope 1, 2, 3 전체 + GHG Protocol 준수 보고서 생성 + AI 분석 + 데이터 저장
          </p>
          <a
            href="mailto:openbrain.main@gmail.com?subject=[GHG Calculator] 전체 버전 문의&body=안녕하세요,%0A%0AGHG Scope 3 계산기 전체 버전에 대해 문의드립니다.%0A%0A회사명:%0A담당자명:%0A연락처:%0A%0A문의 내용:%0A%0A"
            className="inline-block px-8 py-3 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg hover:shadow-xl"
          >
            전체 버전 문의하기
          </a>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>배출계수 출처: Ecoinvent, DEFRA, EPA EEIO, KR-LCI</p>
        </div>
      </main>
    </div>
  );
}
