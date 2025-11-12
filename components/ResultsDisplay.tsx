import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { EmissionCategory, Facility, BoundaryApproach } from '../types';
import { useTranslation } from '../LanguageContext';
import { useTheme } from '../ThemeContext';
import { IconProcess } from './IconComponents';

interface ResultsDisplayProps {
  totalEmissionsMarket: number;
  totalEmissionsLocation: number;
  scope1Total: number;
  scope2LocationTotal: number;
  scope2MarketTotal: number;
  scope3Total: number;
  facilityBreakdown: { [facility: string]: { scope1: number, scope2Location: number, scope2Market: number, scope3: number } };
  scope3CategoryBreakdown: { [key: string]: number };
  facilities: Facility[];
  boundaryApproach: BoundaryApproach;
  companyName: string;
  reportingYear: string;
  boundaryApproachText: string;
  onGenerateReport: () => void;
}

const COLORS = {
    scope1: '#4A6B4C', // ghg-green
    scope2Location: '#8DB08C', // ghg-light-green
    scope2Market: '#F2A900', // ghg-accent
    scope3: '#6B4C6B', // A deep purple
};

const SCOPE3_CATEGORY_COLORS = ['#6B4C6B', '#8E44AD', '#9B59B6', '#AF7AC5', '#C39BD3', '#D7BDE2', '#E8DAEF', '#34495E', '#5D6D7E', '#85929E', '#AEB6BF', '#D6DBDF'];


export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ 
    totalEmissionsMarket,
    totalEmissionsLocation,
    scope1Total,
    scope2LocationTotal,
    scope2MarketTotal,
    scope3Total,
    facilityBreakdown, 
    scope3CategoryBreakdown,
    facilities, 
    boundaryApproach,
    companyName,
    reportingYear,
    boundaryApproachText,
    onGenerateReport
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const tickColor = theme === 'dark' ? '#E5E7EB' : '#6B7280';
  const gridColor = theme === 'dark' ? '#4B5563' : '#E5E7EB';
  const tooltipBg = theme === 'dark' ? '#1F2937' : '#FFFFFF';
  const tooltipText = theme === 'dark' ? '#F9FAFB' : '#374151';
    
  const hasMarketBasedValues = scope2MarketTotal !== scope2LocationTotal;

  const chartData = hasMarketBasedValues
    ? [
        {
          name: t('marketBasedTotal'),
          [t('scope1')]: parseFloat((scope1Total / 1000).toFixed(2)),
          [t('scope2Market')]: parseFloat((scope2MarketTotal / 1000).toFixed(2)),
          [t('scope3')]: parseFloat((scope3Total / 1000).toFixed(2)),
        },
        {
          name: t('locationBasedTotal'),
          [t('scope1')]: parseFloat((scope1Total / 1000).toFixed(2)),
          [t('scope2Location')]: parseFloat((scope2LocationTotal / 1000).toFixed(2)),
          [t('scope3')]: parseFloat((scope3Total / 1000).toFixed(2)),
        },
      ]
    : [
        {
          name: t('emissions'),
          [t('scope1')]: parseFloat((scope1Total / 1000).toFixed(2)),
          [t('scope2Market')]: parseFloat((scope2MarketTotal / 1000).toFixed(2)),
          [t('scope3')]: parseFloat((scope3Total / 1000).toFixed(2)),
        },
      ];

  const formatNumber = (num: number) => (num / 1000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const getFacilityBasisText = (facility: Facility | undefined) => {
    if (!facility) return '-';
    if (boundaryApproach === 'equity') {
      return `${t('equityShare')} (${facility.equityShare}%)`;
    }
    if (boundaryApproach === 'operational') {
      return `${t('operationalControl')} (100%)`;
    }
    if (boundaryApproach === 'financial') {
        return `${t('financialControl')} (100%)`;
    }
    return '100%';
  }
  
  const scope3ChartData = useMemo(() => {
    if (!scope3CategoryBreakdown || scope3Total === 0) return [];
    return Object.entries(scope3CategoryBreakdown)
      .map(([category, emissions]) => ({
        name: t(category),
        value: parseFloat((emissions / 1000).toFixed(2)),
      }))
      .filter(item => item.value > 0.005) // Filter out negligible values to avoid clutter
      .sort((a, b) => b.value - a.value);
  }, [scope3CategoryBreakdown, scope3Total, t]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      // FIX: Use Number() to safely convert `data.value` from an `any` type to a number for arithmetic operations.
      // The previous type assertion `as number` was not sufficient to resolve the TypeScript error.
      // `data.value` is in tonnes, while `scope3Total` is in kg, so we convert tonnes to kg for correct percentage calculation.
      // FIX: Explicitly cast `data.value` to a number to resolve arithmetic operation error.
      const percentage = scope3Total > 0 ? ((Number(data.value) * 1000 / scope3Total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-300 dark:border-gray-600 rounded shadow-lg text-sm">
          <p className="font-semibold text-ghg-dark dark:text-gray-100">{data.name}</p>
          <p className="text-gray-600 dark:text-gray-300">{`${Number(data.value).toLocaleString()} t CO₂e (${percentage}%)`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-6">
            <div>
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold text-ghg-dark dark:text-gray-100">{t('emissionsSummary')}</h2>
                    <button 
                        onClick={onGenerateReport}
                        className="flex items-center gap-2 text-sm bg-white border border-ghg-green text-ghg-green font-semibold py-1 px-3 rounded-lg hover:bg-ghg-green hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ghg-green dark:bg-gray-700 dark:border-ghg-light-green dark:text-ghg-light-green dark:hover:bg-ghg-light-green dark:hover:text-ghg-dark"
                    >
                        <IconProcess className="h-4 w-4" />
                        {t('generateReport')}
                    </button>
                </div>
              {(companyName || reportingYear) && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('reportGeneratedFor')}: <span className="font-medium">{companyName || 'N/A'}</span> ({reportingYear || 'N/A'})
                </p>
              )}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-600/50 rounded-lg px-3 py-1 mt-2 sm:mt-0">
                {t('basedOn')}: <span className="font-semibold">{boundaryApproachText}</span>
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="flex-shrink-0">
                <p className="text-gray-500 dark:text-gray-400">{t('totalGHGEmissions')}</p>
                <p className="text-5xl font-bold text-ghg-dark dark:text-white">
                {formatNumber(totalEmissionsMarket)}
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">{t('tonnesCO2e')} ({t('marketBasedTotal')})</p>
                {hasMarketBasedValues && (
                    <p className="text-md text-gray-500 dark:text-gray-400 -mt-3 mb-4">
                        {formatNumber(totalEmissionsLocation)} {t('tonnesCO2e')} ({t('locationBasedTotal')})
                    </p>
                )}
                <div className="flex gap-4 text-left flex-wrap">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS.scope1}}></div>
                            <span className="text-sm font-semibold">{t('scope1')}</span>
                        </div>
                        <p className="font-bold text-ghg-dark dark:text-gray-100 text-xl">{formatNumber(scope1Total)}</p>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS.scope2Market}}></div>
                            <span className="text-sm font-semibold">{t('scope2Market')}</span>
                        </div>
                        <p className="font-bold text-ghg-dark dark:text-gray-100 text-xl">{formatNumber(scope2MarketTotal)}</p>
                    </div>
                     <div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS.scope3}}></div>
                            <span className="text-sm font-semibold">{t('scope3')}</span>
                        </div>
                        <p className="font-bold text-ghg-dark dark:text-gray-100 text-xl">{formatNumber(scope3Total)}</p>
                    </div>
                    <div className="opacity-70">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS.scope2Location}}></div>
                            <span className="text-sm font-semibold">{t('scope2Location')}</span>
                        </div>
                        <p className="font-bold text-ghg-dark dark:text-gray-100 text-xl">{formatNumber(scope2LocationTotal)}</p>
                    </div>
                </div>
            </div>
            <div className="w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                        <XAxis type="number" unit=" t" tick={{ fill: tickColor }} />
                        <YAxis dataKey="name" type="category" width={hasMarketBasedValues ? 130 : 80} tick={{ fill: tickColor, fontSize: 12 }} />
                        <Tooltip 
                            formatter={(value: number, name: string) => [`${value.toLocaleString()} t`, name]}
                            contentStyle={{ backgroundColor: tooltipBg, border: 'none', borderRadius: '0.5rem', color: tooltipText }}
                            cursor={{fill: 'transparent'}}
                        />
                        <Legend wrapperStyle={{ color: tickColor, bottom: -10 }}/>
                        <Bar dataKey={t('scope1')} stackId="a" fill={COLORS.scope1} />
                        <Bar dataKey={t('scope2Market')} stackId="a" fill={COLORS.scope2Market} name={t('scope2Market')} />
                        <Bar dataKey={t('scope2Location')} stackId="a" fill={COLORS.scope2Location} name={t('scope2Location')} />
                        <Bar dataKey={t('scope3')} stackId="a" fill={COLORS.scope3} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {scope3Total > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-200 mt-8 dark:bg-gray-700 dark:border-gray-600">
          <h3 className="text-xl font-semibold text-ghg-dark dark:text-gray-100 mb-4">{t('scope3Breakdown')}</h3>
          {scope3ChartData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={scope3ChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={110}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                    >
                      {scope3ChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SCOPE3_CATEGORY_COLORS[index % SCOPE3_CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                {scope3ChartData.map((entry, index) => {
                   const percentage = scope3Total > 0 ? ((entry.value * 1000 / scope3Total) * 100) : 0;
                   return (
                      <div key={entry.name} className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                        <div className="flex items-center gap-2 truncate">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: SCOPE3_CATEGORY_COLORS[index % SCOPE3_CATEGORY_COLORS.length] }}
                          />
                          <span className="text-gray-700 dark:text-gray-300 truncate" title={entry.name}>{entry.name}</span>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <span className="font-semibold text-ghg-dark dark:text-gray-100">{entry.value.toLocaleString()} t</span>
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                   );
                })}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {Object.keys(facilityBreakdown).length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-200 mt-8 dark:bg-gray-700 dark:border-gray-600">
            <h3 className="text-xl font-semibold text-ghg-dark dark:text-gray-100 mb-4">{t('emissionsByFacility')}</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wider">{t('facility')}</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wider">{t('appliedBasis')}</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wider">{t('scope1')}</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wider">{t('scope2Market')}</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wider">{t('scope3')}</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('total')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-700 dark:divide-gray-600">
                        {Object.entries(facilityBreakdown).map(([facilityName, emissions]) => {
                            const typedEmissions = emissions as { scope1: number; scope2Location: number, scope2Market: number, scope3: number };
                            const facility = facilities.find(f => f.name === facilityName);
                            const facilityTotal = typedEmissions.scope1 + typedEmissions.scope2Market + typedEmissions.scope3;
                            return (
                                <tr key={facilityName}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{facilityName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-left">{getFacilityBasisText(facility)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">{formatNumber(typedEmissions.scope1)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">{formatNumber(typedEmissions.scope2Market)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">{formatNumber(typedEmissions.scope3)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-ghg-dark dark:text-gray-50 text-right">{formatNumber(facilityTotal)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
      )}
    </>
  );
};