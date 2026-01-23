import React from 'react';
import { EmissionSourceCard } from './EmissionSourceCard';
import { EmissionCategory, EmissionSource, Refrigerant, Facility, BoundaryApproach, CO2eFactorFuel, CalculationResult } from '../types';
// FIX: Changed import path to be more explicit.
import { ALL_SCOPE3_CATEGORIES } from '../constants/index';
import { useTranslation } from '../context/LanguageContext';


interface Scope3CalculatorProps {
  sources: { [key in EmissionCategory]?: EmissionSource[] };
  onAddSource: (category: EmissionCategory) => void;
  onUpdateSource: (id: string, category: EmissionCategory, update: Partial<EmissionSource>) => void;
  onRemoveSource: (id: string, category: EmissionCategory) => void;
  onFuelTypeChange: (id: string, newFuelType: string, category: EmissionCategory) => void;
  fuelsMap: { [key in EmissionCategory]?: (CO2eFactorFuel | Refrigerant)[] };
  calculateEmissions: (source: EmissionSource) => CalculationResult;
  categoryDescriptions: Record<EmissionCategory, string>;
  facilities: Facility[];
  openCategory: EmissionCategory | null;
  onToggleCategory: (category: EmissionCategory) => void;
  boundaryApproach: BoundaryApproach;
  enabledScope3Categories: EmissionCategory[];
  onManageScope3: () => void;
  isAuditModeEnabled?: boolean;
  reportingYear: string;
}

export const Scope3Calculator: React.FC<Scope3CalculatorProps> = (props) => {
  const { t } = useTranslation();

  return (
    <>
      {ALL_SCOPE3_CATEGORIES
        .filter(category => props.enabledScope3Categories.includes(category))
        .map((category) => {
          const fuels = (category === EmissionCategory.UpstreamLeasedAssets || category === EmissionCategory.DownstreamLeasedAssets)
            ? {
              ...(props.fuelsMap[category] as any),
              asset_specific_fuels: [
                ...(props.fuelsMap[EmissionCategory.StationaryCombustion] || []),
                ...(props.fuelsMap[EmissionCategory.MobileCombustion] || []),
                ...(props.fuelsMap[EmissionCategory.PurchasedEnergy] || [])
              ]
            }
            : props.fuelsMap[category] || [];

          return (
            <EmissionSourceCard
              key={category}
              category={category}
              sources={props.sources[category] || []}
              onAddSource={() => props.onAddSource(category)}
              onUpdateSource={(id, update) => props.onUpdateSource(id, category, update)}
              onRemoveSource={(id) => props.onRemoveSource(id, category)}
              onFuelTypeChange={(id, newFuel) => props.onFuelTypeChange(id, newFuel, category)}
              fuels={fuels}
              calculateEmissions={props.calculateEmissions}
              description={props.categoryDescriptions[category]}
              facilities={props.facilities}
              isOpen={props.openCategory === category}
              onToggle={() => props.onToggleCategory(category)}
              boundaryApproach={props.boundaryApproach}
              isDisabled={!props.fuelsMap[category]}
              isAuditModeEnabled={props.isAuditModeEnabled}
              reportingYear={props.reportingYear}
            />
          )
        })}
      <div className="md:col-span-2 flex justify-center items-center p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
        <button onClick={props.onManageScope3} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 border border-gray-200 dark:border-gray-600 shadow-sm">
          {t('manageScope3Categories')}
        </button>
      </div>
    </>
  );
};