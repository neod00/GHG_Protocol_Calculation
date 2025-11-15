import React, { useMemo } from 'react';
import { useTranslation } from '../LanguageContext';
import { EmissionCategory, Facility, BoundaryApproach, EmissionSource } from '../types';
import { IconX } from './IconComponents';
import { TranslationKey } from '../translations';
import { SCOPE2_FACTORS_BY_REGION } from '../constants';

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
    facilityBreakdown: { [facilityId: string]: { scope1: number; scope2Location: number, scope2Market: number, scope3: number } };
    scope3CategoryBreakdown: { [key: string]: number };
  };
  facilities: Facility[];
  boundaryApproach: BoundaryApproach;
  sources: { [key in EmissionCategory]: EmissionSource[] };
  allFactors: { [key: string]: any };
  scope3Settings: { isEnabled: boolean; enabledCategories: EmissionCategory[] };
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
  sources,
  allFactors,
  scope3Settings,
}) => {
  const { t, language } = useTranslation();

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatNumber = (num: number, digits = 2) => (num / 1000).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const currentDate = new Date().toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US');

  const getScopeForCategory = (category: EmissionCategory): 'scope1' | 'scope2' | 'scope3' => {
      const scope1Categories = [
        EmissionCategory.StationaryCombustion,
        EmissionCategory.MobileCombustion,
        EmissionCategory.ProcessEmissions,
        EmissionCategory.FugitiveEmissions,
        EmissionCategory.Waste,
      ];
      if (scope1Categories.includes(category)) return 'scope1';
      if (category === EmissionCategory.PurchasedEnergy) return 'scope2';
      return 'scope3';
  };

  const methodologyByCat = useMemo(() => {
    const grouped: { [key: string]: { [key: string]: EmissionSource[] } } = { scope1: {}, scope2: {}, scope3: {} };
    for (const [category, sourcesList] of Object.entries(sources)) {
        if ((sourcesList as EmissionSource[]).length === 0) continue;
        const scope = getScopeForCategory(category as EmissionCategory);
        
        if (scope === 'scope3' && (!scope3Settings.isEnabled || !scope3Settings.enabledCategories.includes(category as EmissionCategory))) {
            continue;
        }

        if (!grouped[scope][category as EmissionCategory]) {
            grouped[scope][category as EmissionCategory] = [];
        }
        grouped[scope][category as EmissionCategory].push(...(sourcesList as EmissionSource[]));
    }
    return grouped;
  }, [sources, scope3Settings]);
  
  const getFactorSource = (source: EmissionSource) => {
    if (source.factorSource) return source.factorSource;
    if (source.category === EmissionCategory.PurchasedEnergy && source.fuelType === 'Grid Electricity') {
        for (const regionData of Object.values(SCOPE2_FACTORS_BY_REGION)) {
            const fuel = allFactors.scope2.find((f: any) => f.name === 'Grid Electricity');
            if(fuel && fuel.factors.kWh === regionData.factors.kWh) {
                return regionData.source;
            }
        }
    }
    return t('defaultFactor');
  };

  const hasMarketBasedValues = results.scope2MarketTotal !== results.scope2LocationTotal;

  const getTocLink = (section: number) => {
    const titleKey = `reportSection${section}Title` as TranslationKey;
    const title = t(titleKey);
    // Remove the leading number and period for the link text
    const linkText = title.substring(title.indexOf('.') + 1).trim();
    return <a href={`#section${section}`} className="hover:underline">{`${section}. ${linkText}`}</a>;
  };
  

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm no-print">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col transition-all duration-300">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-ghg-dark dark:text-gray-100">{t('ghgReportTitle')}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" aria-label={t('close')}>
            <IconX className="w-5 h-5" />
          </button>
        </div>

        <div id="printable-report" className="p-6 md:p-8 flex-grow overflow-y-auto bg-white text-gray-800 text-sm print-bg-white print-text-black">
          <header className="text-center mb-10">
            <h1 className="text-3xl font-bold text-ghg-dark print-text-black">{t('ghgReportTitle')}</h1>
            <p className="text-lg text-gray-600 print-text-black">{companyName}</p>
            <p className="text-md text-gray-500 print-text-black">{t('reportingYear')}: {reportingYear}</p>
          </header>

          <main className="space-y-8 report-body">
            {/* Table of Contents */}
            <section>
              <h2 className="text-xl font-bold mb-3 border-b pb-2 print-text-black">{t('tocTitle')}</h2>
              <ol className="list-decimal list-inside space-y-1 text-ghg-green">
                <li>{getTocLink(1)}</li>
                <li>{getTocLink(2)}</li>
                <li>{getTocLink(3)}</li>
                <li>{getTocLink(4)}</li>
                <li>{getTocLink(5)}</li>
                <li>{getTocLink(6)}</li>
                <li>{getTocLink(7)}</li>
                <li>{getTocLink(8)}</li>
                <li>{getTocLink(9)}</li>
                <li>{getTocLink(10)}</li>
              </ol>
            </section>

            <section id="section1">
              <h2 className="text-xl font-bold mb-3 border-b pb-2 print-text-black">{t('reportSection1Title')}</h2>
              <div className="space-y-2">
                <p><strong>{t('reportPurpose')}:</strong> {t('reportPurposeText')}</p>
                <p><strong>{t('reportingPeriod')}:</strong> {`${reportingYear}-01-01 ~ ${reportingYear}-12-31`}</p>
                <p><strong>{t('reportIntendedUse')}:</strong> {t('reportIntendedUseText')}</p>
                <p><strong>{t('reportingCycle')}:</strong> {t('reportingCycleText')}</p>
                <p><strong>{t('ghgStandard')}:</strong> {t('ghgStandardText')}</p>
              </div>
            </section>

            <section id="section2">
              <h2 className="text-xl font-bold mb-3 border-b pb-2 print-text-black">{t('reportSection2Title')}</h2>
              <div className="space-y-2">
                <p><strong>{t('organizationOverview')}:</strong> {companyName} {t('organizationOverviewText')}</p>
                <p><strong>{t('orgBoundaryDef')}:</strong> {t('orgBoundaryDefText')} <strong>{boundaryApproachText}</strong>.</p>
                <p><strong>{t('operationalBoundary')}:</strong> {t('operationalBoundaryText')}
                  {scope3Settings.isEnabled ? ` Scope 1, Scope 2, ${t('and')} Scope 3.` : ` Scope 1 ${t("and")} Scope 2.`}
                </p>
              </div>
            </section>

             <section id="section3">
              <h2 className="text-xl font-bold mb-3 border-b pb-2 print-text-black">{t('reportSection3Title')}</h2>
              <p>{t('baseYearText').replace('{year}', reportingYear)}</p>
            </section>

            <section id="section4">
                <h2 className="text-xl font-bold mb-3 border-b pb-2 print-text-black">{t('reportSection4Title')}</h2>
                {Object.entries(methodologyByCat).map(([scope, categories]) => (
                    Object.entries(categories).length > 0 && (
                        <div key={scope} className="mb-4">
                            <h3 className="text-lg font-semibold mb-2 print-text-black">{t(scope.charAt(0).toUpperCase() + scope.slice(1) as TranslationKey)}</h3>
                            {Object.entries(categories).map(([category, sourcesList]) => (
                                <div key={category} className="pl-4 mb-3">
                                    <h4 className="font-semibold print-text-black">{t(category as TranslationKey)}</h4>
                                    {(sourcesList as EmissionSource[]).map(source => (
                                      <div key={source.id} className="mt-2 p-3 border rounded-md text-xs print-shadow-none">
                                        <p className='font-medium'>{source.description || source.fuelType || t(source.category as TranslationKey)}</p>
                                        <ul className="list-disc pl-5 mt-1 space-y-1">
                                            <li><strong>{t('activityDataSource')}:</strong> {source.activityDataSource || t('notSpecified')}</li>
                                            <li><strong>{t('emissionFactorSource')}:</strong> {getFactorSource(source)}</li>
                                            <li><strong>{t('calculationFormula')}:</strong> {t('calculationFormulaText')}</li>
                                            <li><strong>{t('assumptionsAndLimitations')}:</strong> {source.assumptions || t('none')}</li>
                                        </ul>
                                      </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )
                ))}
            </section>
            
            <section id="section5">
                <h2 className="text-xl font-bold mb-3 border-b pb-2 print-text-black">{t('reportSection5Title')}</h2>
                <p>{t('dataQualityText')}</p>
            </section>

             <section id="section6">
              <h2 className="text-xl font-bold mb-3 border-b pb-2 print-text-black">{t('reportSection6Title')}</h2>
              <div className="p-4 border rounded-lg print-shadow-none mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-1 sm:col-span-2 text-center p-3 bg-gray-100 rounded-lg">
                        <p className="font-semibold print-text-black">{t('totalGHGEmissions')} ({t('marketBasedTotal')})</p>
                        <p className="text-3xl font-bold text-ghg-dark print-text-black">{formatNumber(results.totalEmissionsMarket)}</p>
                        <p className="text-xs text-gray-500 print-text-black">{t('tonnesCO2e')}</p>
                    </div>
                    <div className="p-3 bg-ghg-green/10 rounded-lg text-center">
                        <p className="font-semibold text-ghg-green print-text-black">{t('scope1')}</p>
                        <p className="text-2xl font-bold text-ghg-dark print-text-black">{formatNumber(results.scope1Total)}</p>
                    </div>
                     <div className="p-3 bg-ghg-accent/10 rounded-lg text-center">
                        <p className="font-semibold text-ghg-accent print-text-black">{t('scope2')}</p>
                        <p className="text-xl font-bold text-ghg-dark print-text-black">{formatNumber(results.scope2MarketTotal)} <span className="text-sm font-medium">({t('marketBasedTotal')})</span></p>
                        <p className="text-lg font-medium text-gray-700 print-text-black">{formatNumber(results.scope2LocationTotal)} <span className="text-sm font-medium">({t('locationBasedTotal')})</span></p>
                    </div>
                    {scope3Settings.isEnabled && <div className="col-span-2 p-3 bg-purple-600/10 rounded-lg text-center">
                        <p className="font-semibold text-purple-800 print-text-black">{t('scope3')}</p>
                        <p className="text-2xl font-bold text-ghg-dark print-text-black">{formatNumber(results.scope3Total)}</p>
                    </div>}
                </div>
              </div>
              
              {scope3Settings.isEnabled && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 print-text-black">6.3 {t('scope3')}</h3>
                   <table className="min-w-full divide-y border">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">{t('category')}</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase">{t('emissionsTonnes')}</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase">% {t('of')} Scope 3</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y">
                            {Object.entries(results.scope3CategoryBreakdown).sort(([,a],[,b]) => (b as number) - (a as number)).map(([category, emissions]) => (
                                <tr key={category}>
                                    <td className="px-4 py-2 whitespace-nowrap">{t(category as TranslationKey)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-right">{formatNumber(emissions as number, 3)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-right">{results.scope3Total > 0 ? (((emissions as number) / results.scope3Total) * 100).toFixed(1) : 0}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              )}
            </section>

             <section id="section7">
                <h2 className="text-xl font-bold mb-3 border-b pb-2 print-text-black">{t('reportSection7Title')}</h2>
                <p>{t('reductionActivitiesText')}</p>
            </section>

            <section id="section8">
                <h2 className="text-xl font-bold mb-3 border-b pb-2 print-text-black">{t('reportSection8Title')}</h2>
                <p>{t('comparabilityText')}</p>
            </section>

            <section id="section9">
                <h2 className="text-xl font-bold mb-3 border-b pb-2 print-text-black">{t('reportSection9Title')}</h2>
                <p><strong>{t('reportResponsible')}:</strong> {t('reportResponsibleText')}</p>
                <p><strong>{t('confidentiality')}:</strong> {t('confidentialityText')}</p>
            </section>

             <section id="section10">
                <h2 className="text-xl font-bold mb-3 border-b pb-2 print-text-black">{t('reportSection10Title')}</h2>
                <p>{t('appendixText')}</p>
            </section>

          </main>
          <footer className="mt-8 pt-4 border-t text-center text-xs text-gray-400">
            <p>{t('dataGeneratedOn')} {currentDate}</p>
          </footer>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500">
            {t('close')}
          </button>
          <button onClick={handlePrint} className="px-4 py-2 text-sm font-medium text-white bg-ghg-green rounded-md shadow-sm hover:bg-ghg-dark">
            {t('downloadPDF')}
          </button>
        </div>
      </div>
    </div>
  );
};
