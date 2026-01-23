import React, { useMemo } from 'react';
// Fix: Removed non-existent 'Fuel' type from import.
import { EmissionCategory, EmissionSource, Refrigerant, Facility, BoundaryApproach, CO2eFactorFuel, CalculationResult } from '../types';
import { SourceInputRow } from './SourceInputRow';
import { IconFactory, IconCar, IconFugitive, IconChevronDown, IconProcess, IconSteam, IconInfo, IconWaste, IconBriefcase, IconUsers, IconRecycle, IconValueChain } from './IconComponents';
import { useTranslation } from '../context/LanguageContext';

interface EmissionSourceCardProps {
  category: EmissionCategory;
  sources: EmissionSource[];
  onAddSource: () => void;
  onUpdateSource: (id: string, updatedSource: Partial<EmissionSource>) => void;
  onRemoveSource: (id: string) => void;
  onFuelTypeChange: (id: string, newFuelType: string, category: EmissionCategory) => void;
  // Fix: Removed non-existent 'Fuel' type.
  fuels: any;
  // Fix: Updated calculateEmissions prop type to align with implementation and remove unused 'biogenic' property.
  calculateEmissions: (source: EmissionSource) => CalculationResult;
  description: string;
  facilities: Facility[];
  isOpen: boolean;
  onToggle: () => void;
  boundaryApproach: BoundaryApproach;
  isDisabled?: boolean;
  isAuditModeEnabled?: boolean;
  reportingYear: string;
}

const ICONS: Record<EmissionCategory, React.ReactNode> = {
  [EmissionCategory.StationaryCombustion]: <IconFactory className="h-8 w-8 text-ghg-green" />,
  [EmissionCategory.MobileCombustion]: <IconCar className="h-8 w-8 text-ghg-green" />,
  [EmissionCategory.ProcessEmissions]: <IconProcess className="h-8 w-8 text-ghg-green" />,
  [EmissionCategory.FugitiveEmissions]: <IconFugitive className="h-8 w-8 text-ghg-green" />,
  [EmissionCategory.PurchasedEnergy]: <IconSteam className="h-8 w-8 text-ghg-green" />,
  [EmissionCategory.Waste]: <IconWaste className="h-8 w-8 text-ghg-green" />,
  [EmissionCategory.BusinessTravel]: <IconBriefcase className="h-8 w-8 text-purple-700" />,
  [EmissionCategory.EmployeeCommuting]: <IconUsers className="h-8 w-8 text-purple-700" />,
  [EmissionCategory.WasteGeneratedInOperations]: <IconRecycle className="h-8 w-8 text-purple-700" />,
  // Default icons for other Scope 3
  [EmissionCategory.PurchasedGoodsAndServices]: <IconValueChain className="h-8 w-8 text-purple-700" />,
  [EmissionCategory.CapitalGoods]: <IconValueChain className="h-8 w-8 text-purple-700" />,
  [EmissionCategory.FuelAndEnergyRelatedActivities]: <IconValueChain className="h-8 w-8 text-purple-700" />,
  [EmissionCategory.UpstreamTransportationAndDistribution]: <IconValueChain className="h-8 w-8 text-purple-700" />,
  [EmissionCategory.UpstreamLeasedAssets]: <IconValueChain className="h-8 w-8 text-purple-700" />,
  [EmissionCategory.DownstreamTransportationAndDistribution]: <IconValueChain className="h-8 w-8 text-purple-700" />,
  [EmissionCategory.ProcessingOfSoldProducts]: <IconValueChain className="h-8 w-8 text-purple-700" />,
  [EmissionCategory.UseOfSoldProducts]: <IconValueChain className="h-8 w-8 text-purple-700" />,
  [EmissionCategory.EndOfLifeTreatmentOfSoldProducts]: <IconValueChain className="h-8 w-8 text-purple-700" />,
  [EmissionCategory.DownstreamLeasedAssets]: <IconValueChain className="h-8 w-8 text-purple-700" />,
  [EmissionCategory.Franchises]: <IconValueChain className="h-8 w-8 text-purple-700" />,
  [EmissionCategory.Investments]: <IconValueChain className="h-8 w-8 text-purple-700" />,
};


export const EmissionSourceCard: React.FC<EmissionSourceCardProps> = ({
  category,
  sources,
  onAddSource,
  onUpdateSource,
  onRemoveSource,
  onFuelTypeChange,
  fuels,
  calculateEmissions,
  description,
  facilities,
  isOpen,
  onToggle,
  boundaryApproach,
  isDisabled = false,
  isAuditModeEnabled = false,
  reportingYear,
}) => {
  const { t } = useTranslation();

  const subtotal = useMemo(() => sources.reduce((sum, source) => {
    const facility = facilities.find(f => f.id === source.facilityId);
    const ownershipFactor = boundaryApproach === 'equity' && facility ? facility.equityShare / 100 : 1;
    const emissions = calculateEmissions(source);
    // For subtotal, use market-based if available for S2, plus S1 and S3
    const relevantEmissions = emissions.scope1 + emissions.scope2Market + emissions.scope3;
    return sum + (relevantEmissions * ownershipFactor);
  }, 0), [sources, facilities, boundaryApproach, calculateEmissions]);

  const cardClasses = isDisabled
    ? "bg-gray-50 rounded-xl shadow-sm border border-gray-200 flex flex-col dark:bg-gray-800/50 dark:border-gray-700 opacity-60 cursor-not-allowed"
    : "bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col dark:bg-gray-800 dark:border-gray-700 transition-colors";

  return (
    <div className={cardClasses}>
      <button onClick={!isDisabled ? onToggle : undefined} className="flex items-start justify-between p-6 text-left w-full relative">
        {isDisabled && <span className="absolute top-2 right-2 text-xs font-semibold bg-gray-500 text-white px-2 py-0.5 rounded-full">{t('comingSoon')}</span>}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t(category)}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 pr-4">{description}</p>
        </div>
        <div className="flex items-center space-x-4">
          {ICONS[category]}
          {!isDisabled && <IconChevronDown className={`h-5 w-5 text-gray-500 dark:text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
        </div>
      </button>

      {isOpen && !isDisabled && (
        <div className="px-6 pb-6 flex flex-col flex-grow">
          {(category === EmissionCategory.ProcessEmissions || category === EmissionCategory.PurchasedEnergy || category === EmissionCategory.FuelAndEnergyRelatedActivities || category === EmissionCategory.PurchasedGoodsAndServices || category === EmissionCategory.CapitalGoods || category === EmissionCategory.BusinessTravel || category === EmissionCategory.EmployeeCommuting || category === EmissionCategory.UpstreamLeasedAssets || category === EmissionCategory.DownstreamTransportationAndDistribution || category === EmissionCategory.ProcessingOfSoldProducts) && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200 flex items-start gap-3">
              <IconInfo className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                {category === EmissionCategory.ProcessEmissions && <>
                  <p className="font-semibold">{t('processEmissionsInfoTitle')}</p>
                  <p className="text-sm">{t('processEmissionsInfoText')}</p>
                </>}
                {category === EmissionCategory.PurchasedEnergy && <>
                  <p className="font-semibold">{t('scope2DualReportingInfoTitle')}</p>
                  <p className="text-sm">{t('scope2DualReportingInfoText')}</p>
                </>}
                {category === EmissionCategory.FuelAndEnergyRelatedActivities && <>
                  <p className="font-semibold">{t('cat3GuidanceTitle')}</p>
                  <p className="text-sm">{t('cat3GuidanceText')}</p>
                </>}
                {/* Category 4 guidance is now shown in Category4_9Row component to avoid duplication */}
                {category === EmissionCategory.DownstreamTransportationAndDistribution && <>
                  <p className="font-semibold">{t('cat9GuidanceTitle')}</p>
                  <p className="text-sm" dangerouslySetInnerHTML={{ __html: t('cat9GuidanceText') }} />
                </>}
                {/* Category 10 guidance is now shown in Category10Row component to avoid duplication */}
                {category === EmissionCategory.PurchasedGoodsAndServices && <>
                  <p className="font-semibold">{t('cat1GuidanceTitle')}</p>
                  <p className="text-sm">{t('cat1GuidanceText')}</p>
                </>}
                {category === EmissionCategory.CapitalGoods && <>
                  <p className="font-semibold">{t('cat2GuidanceTitle')}</p>
                  <p className="text-sm">{t('cat2GuidanceText')}</p>
                </>}
                {/* Category 5 guidance is now shown in Category5Row component to avoid duplication */}
                {category === EmissionCategory.BusinessTravel && <>
                  <p className="font-semibold">{t('cat6GuidanceTitle')}</p>
                  <p className="text-sm" dangerouslySetInnerHTML={{ __html: t('cat6GuidanceText') }} />
                </>}
                {category === EmissionCategory.EmployeeCommuting && <>
                  <p className="font-semibold">{t('cat7GuidanceTitle')}</p>
                  <p className="text-sm" dangerouslySetInnerHTML={{ __html: t('cat7GuidanceText') }} />
                </>}
                {category === EmissionCategory.UpstreamLeasedAssets && <>
                  <p className="font-semibold">{t('cat8GuidanceTitle')}</p>
                  <p className="text-sm" dangerouslySetInnerHTML={{ __html: t('cat8GuidanceText') }} />
                </>}
              </div>
            </div>
          )}
          <div className="flex-grow space-y-3 overflow-y-auto pr-2 -mr-2 py-2 border-t border-gray-100 dark:border-gray-700">
            {sources.length > 0 ? (
              sources.map((source) => (
                <SourceInputRow
                  key={source.id}
                  source={source}
                  onUpdate={(update) => onUpdateSource(source.id, update)}
                  onRemove={() => onRemoveSource(source.id)}
                  onFuelTypeChange={(newFuel) => onFuelTypeChange(source.id, newFuel, category)}
                  fuels={fuels}
                  facilities={facilities}
                  calculateEmissions={calculateEmissions}
                  isAuditModeEnabled={isAuditModeEnabled}
                  reportingYear={reportingYear}
                />
              ))
            ) : (
              <div className="text-center text-gray-400 dark:text-gray-500 text-sm py-4">
                <p>{t('noSources')}</p>
                <p className="text-xs mt-1">{t('noSourcesHelp')}</p>
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold">{t('subtotal')}:</span>
              <span className="font-bold text-gray-900 dark:text-white text-lg">{(subtotal / 1000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} t CO₂e</span>
            </div>
            <button
              onClick={onAddSource}
              className="w-full bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-sm"
            >
              {t('addSource')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};