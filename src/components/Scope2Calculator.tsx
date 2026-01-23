import React from 'react';
import { EmissionSourceCard } from './EmissionSourceCard';
import { EmissionCategory, EmissionSource, Refrigerant, Facility, BoundaryApproach, CO2eFactorFuel, CalculationResult } from '../types';

interface ScopeCalculatorProps {
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
  isAuditModeEnabled?: boolean;
  reportingYear: string;
}

const scope2Categories = [EmissionCategory.PurchasedEnergy];

export const Scope2Calculator: React.FC<ScopeCalculatorProps> = (props) => {
  return (
    <>
      {scope2Categories.map((category) => (
        <EmissionSourceCard
          key={category}
          category={category}
          sources={props.sources[category] || []}
          onAddSource={() => props.onAddSource(category)}
          onUpdateSource={(id, update) => props.onUpdateSource(id, category, update)}
          onRemoveSource={(id) => props.onRemoveSource(id, category)}
          onFuelTypeChange={(id, newFuel) => props.onFuelTypeChange(id, newFuel, category)}
          fuels={props.fuelsMap[category] || []}
          calculateEmissions={props.calculateEmissions}
          description={props.categoryDescriptions[category]}
          facilities={props.facilities}
          isOpen={props.openCategory === category}
          onToggle={() => props.onToggleCategory(category)}
          boundaryApproach={props.boundaryApproach}
          isAuditModeEnabled={props.isAuditModeEnabled}
          reportingYear={props.reportingYear}
        />
      ))}
    </>
  );
};
