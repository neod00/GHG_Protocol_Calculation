import React from 'react';
import { useTranslation } from '../LanguageContext';
import { EmissionCategory, Facility, BoundaryApproach } from '../types';
import { IconX } from './IconComponents';

interface ReportGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  reportingYear: string;
  boundaryApproachText: string;
  results: {
    totalEmissionsMarket: number;
    totalEmissionsLocation: number;
    scope1Total: number;
    scope2LocationTotal: number;
    scope2MarketTotal: number;
    scope3Total: number;
    facilityBreakdown: { [facilityName: string]: { scope1: number; scope2Location: number, scope2Market: number, scope3: number } };
  };
  facilities: Facility[];
  boundaryApproach: BoundaryApproach;
}

const ReportTable: React.FC<{title: string, data: {[key: string]: number}, col1Header: string, col2Header: string, keyPrefix?: string}> = ({title, data, col1Header, col2Header, keyPrefix}) => {
    const { t } = useTranslation();
    const formatNumber = (num: number) => (num / 1000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const { language } = useTranslation();

    const getFuelTranslation = (key: string): string => {
        const keyMap = {
            "Grid Electricity": "gridElectricity",
            "Purchased Steam": "purchasedSteam",
            "Purchased Heating": "purchasedHeating",
            "Purchased Cooling": "purchasedCooling"
        };
        const translationKey = keyMap[key as keyof typeof keyMap];
        return translationKey ? `${t(translationKey)}` : key;
    }


    return (
        <div className="print-text-black">
            <h3 className="text-lg font-semibold mb-2 print-text-black">{title}</h3>
            <div className="overflow-x-auto border rounded-lg print-shadow-none">
                <table className="min-w-full divide-y">
                    <thead className="bg-gray-50 print-bg-white">
                        <tr>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print-text-black">{col1Header}</th>
                            <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print-text-black">{col2Header}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y">
                        {Object.entries(data).map(([key, value]) => (
                            <tr key={`${keyPrefix}-${key}`}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium print-text-black">
                                    {keyPrefix === 'scope2' && language === 'ko' ? getFuelTranslation(key) : t(key)}
                                </td>
                                {/* Fix: Cast value to number to resolve type error from Object.entries. */}
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-right print-text-black">{formatNumber(value as number)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  isOpen,
  onClose,
  companyName,
  reportingYear,
  boundaryApproachText,
  results,
  facilities,
  boundaryApproach,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatNumber = (num: number) => (num / 1000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const currentDate = new Date().toLocaleDateString();

  const getFacilityBasisText = (facility: Facility | undefined) => {
    if (!facility) return '-';
    if (boundaryApproach === 'equity') return `${t('equityShare')} (${facility.equityShare}%)`;
    return `100%`;
  }
  
  const hasMarketBasedValues = results.scope2MarketTotal !== results.scope2LocationTotal;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm no-print">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col transition-all duration-300">
        {/* Header */}
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-ghg-dark dark:text-gray-100">{t('ghgReportTitle')}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" aria-label={t('close')}>
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Report Content */}
        <div id="printable-report" className="p-6 md:p-8 flex-grow overflow-y-auto bg-white text-gray-800">
          <header className="text-center mb-8">
            <h1 className="text-3xl font-bold text-ghg-dark print-text-black">{t('ghgReportTitle')}</h1>
            <p className="text-lg text-gray-600 print-text-black">{companyName}</p>
            <p className="text-md text-gray-500 print-text-black">{t('reportingYear')}: {reportingYear}</p>
          </header>

          <section className="space-y-6">
            {/* Methodology */}
            <div className="p-4 border rounded-lg bg-gray-50 print-bg-white print-shadow-none">
              <h2 className="text-xl font-semibold mb-2 print-text-black">{t('methodology')}</h2>
              <p className="text-sm print-text-black">
                {t('consolidationApproachUsed')}: <span className="font-semibold">{boundaryApproachText}</span>.
              </p>
               <p className="text-xs text-gray-500 mt-1 print-text-black">{t('footerBasedOn')}</p>
            </div>
            
            {/* Summary */}
            <div className="p-4 border rounded-lg print-shadow-none">
                <h2 className="text-xl font-semibold mb-3 print-text-black">{t('executiveSummary')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="col-span-1 sm:col-span-3 text-center p-3 bg-gray-800/10 rounded-lg">
                        <p className="text-sm font-semibold text-gray-800 print-text-black">{t('totalGHGEmissions')} ({t('marketBasedTotal')})</p>
                        <p className="text-3xl font-bold text-ghg-dark print-text-black">{formatNumber(results.totalEmissionsMarket)}</p>
                        <p className="text-xs text-gray-500 print-text-black">{t('tonnesCO2e')}</p>
                        {hasMarketBasedValues && <p className="text-sm text-gray-600 print-text-black mt-1">({formatNumber(results.totalEmissionsLocation)} {t('tonnesCO2e')} {t('locationBasedTotal')})</p>}
                    </div>
                    <div className="p-3 bg-ghg-green/10 rounded-lg text-center">
                        <p className="text-sm font-semibold text-ghg-green print-text-black">{t('scope1')}</p>
                        <p className="text-2xl font-bold text-ghg-dark print-text-black">{formatNumber(results.scope1Total)}</p>
                    </div>
                     <div className="p-3 bg-ghg-accent/10 rounded-lg text-center">
                        <p className="text-sm font-semibold text-ghg-accent print-text-black">{t('scope2')}</p>
                        <p className="text-xl font-bold text-ghg-dark print-text-black">{formatNumber(results.scope2MarketTotal)} <span className="text-sm font-medium text-gray-600">({t('marketBasedTotal')})</span></p>
                        <p className="text-lg font-medium text-gray-700 print-text-black">{formatNumber(results.scope2LocationTotal)} <span className="text-sm font-medium text-gray-600">({t('locationBasedTotal')})</span></p>
                    </div>
                    <div className="p-3 bg-purple-600/10 rounded-lg text-center">
                        <p className="text-sm font-semibold text-purple-800 print-text-black">{t('scope3')}</p>
                        <p className="text-2xl font-bold text-ghg-dark print-text-black">{formatNumber(results.scope3Total)}</p>
                    </div>
                </div>
            </div>

            {/* Breakdowns - This part can be simplified or expanded as needed */}
            
            {/* Facility Breakdown */}
             <div>
                <h3 className="text-lg font-semibold mb-2 print-text-black">{t('emissionsByFacility')}</h3>
                <div className="overflow-x-auto border rounded-lg print-shadow-none">
                    <table className="min-w-full divide-y">
                        <thead className="bg-gray-50 print-bg-white">
                            <tr>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print-text-black">{t('facility')}</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print-text-black">{t('appliedBasis')}</th>
                                <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print-text-black">{t('scope1')}</th>
                                <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print-text-black">{t('scope2Market')}</th>
                                <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print-text-black">{t('scope3')}</th>
                                <th scope="col" className="px-4 py-2 text-right text-xs font-bold text-gray-600 uppercase tracking-wider print-text-black">{t('total')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y">
                            {Object.entries(results.facilityBreakdown).map(([facilityName, emissions]) => {
                                const typedEmissions = emissions as { scope1: number; scope2Location: number, scope2Market: number, scope3: number };
                                const facility = facilities.find(f => f.name === facilityName);
                                const total = typedEmissions.scope1 + typedEmissions.scope2Market + typedEmissions.scope3;
                                return (
                                    <tr key={facilityName}>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium print-text-black">{facilityName}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-left print-text-black">{getFacilityBasisText(facility)}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right print-text-black">{formatNumber(typedEmissions.scope1)}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right print-text-black">{formatNumber(typedEmissions.scope2Market)}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right print-text-black">{formatNumber(typedEmissions.scope3)}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-right print-text-black">{formatNumber(total)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

          </section>

          <footer className="mt-8 pt-4 border-t text-center text-xs text-gray-400">
            <p>{t('dataGeneratedOn')} {currentDate}</p>
          </footer>
        </div>

        {/* Actions */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500">
            {t('close')}
          </button>
          <button onClick={handlePrint} className="px-4 py-2 text-sm font-medium text-white bg-ghg-green rounded-md shadow-sm hover:bg-ghg-dark">
            {t('printReport')}
          </button>
        </div>
      </div>
    </div>
  );
};