import React, { useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Facility, BoundaryApproach } from '../types';
import { useTranslation } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { IconProcess } from './IconComponents';

interface ResultsDisplayProps {
  totalEmissionsMarket: number;
  totalEmissionsLocation: number;
  scope1Total: number;
  scope2LocationTotal: number;
  scope2MarketTotal: number;
  scope3Total: number;
  facilityBreakdown: { [facilityId: string]: { scope1: number, scope2Location: number, scope2Market: number, scope3: number } };
  scope3CategoryBreakdown: { [key: string]: number };
  facilities: Facility[];
  boundaryApproach: BoundaryApproach;
  companyName: string;
  reportingYear: string;
  boundaryApproachText: string;
  onGenerateReport: () => void;
}

const COLORS = {
  scope1: '#059669', // Emerald 600
  scope2Location: '#34D399', // Emerald 400
  scope2Market: '#F59E0B', // Amber 500
  scope3: '#0F172A', // Slate 900
};

const SCOPE3_CATEGORY_COLORS = [
  '#0F172A', '#1E293B', '#334155', '#475569', '#64748B', '#94A3B8',
  '#059669', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'
];

const CustomTooltip = ({ active, payload, scope3Total, t }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const valueAsNumber = Number(data.value);
    const percentage = scope3Total > 0 ? ((valueAsNumber * 1000 / scope3Total) * 100).toFixed(1) : 0;
    return (
      <div className="bg-white dark:bg-slate-800 p-4 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl text-sm">
        <p className="font-bold text-slate-900 dark:text-white mb-1">{data.name}</p>
        <p className="text-emerald-600 dark:text-emerald-400 font-medium">{`${valueAsNumber.toLocaleString()} t CO₂e`}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{percentage}{t('percentageOfScope3')}</p>
      </div>
    );
  }
  return null;
};

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

  const tickColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';
  const tooltipBg = theme === 'dark' ? '#1e293b' : '#ffffff';
  const tooltipText = theme === 'dark' ? '#f1f5f9' : '#1e293b';

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

  const StatCard = ({ title, value, subValue, icon, colorClass }: any) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        {subValue && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            {subValue}
          </span>
        )}
      </div>
      <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
        {value} <span className="text-sm font-normal text-slate-400">t CO₂e</span>
      </p>
    </div>
  );

  const scope3Data = Object.entries(scope3CategoryBreakdown)
    .map(([name, value]) => ({ name: t(name), value: (value as number) / 1000 }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 md:p-8 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('resultsTitle')}</h2>
          <p className="text-gray-600 dark:text-gray-400">{t('resultsSubtitle')}</p>
        </div>
        <button
          onClick={onGenerateReport}
          className="flex items-center gap-2 text-sm font-medium bg-ghg-green text-white py-2 px-4 rounded-lg hover:bg-emerald-600 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
        >
          <IconProcess className="w-4 h-4" />
          {t('generateReport')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        <StatCard
          title={t('totalEmissionsLocation')}
          value={formatNumber(totalEmissionsLocation)}
          subValue={t('locationBased')}
          icon={<div className="w-6 h-6 bg-emerald-600 rounded-full" />}
          colorClass="bg-emerald-600"
        />
        <StatCard
          title={t('totalEmissionsMarket')}
          value={formatNumber(totalEmissionsMarket)}
          subValue={t('marketBased')}
          icon={<div className="w-6 h-6 bg-emerald-700 rounded-full" />}
          colorClass="bg-emerald-700"
        />
        <StatCard
          title={t('scope1')}
          value={formatNumber(scope1Total)}
          icon={<div className="w-6 h-6 bg-emerald-500 rounded-full" />}
          colorClass="bg-emerald-500"
        />
        <StatCard
          title={t('scope2Location')}
          value={formatNumber(scope2LocationTotal)}
          subValue={t('locationBased')}
          icon={<div className="w-6 h-6 bg-emerald-400 rounded-full" />}
          colorClass="bg-emerald-400"
        />
        <StatCard
          title={t('scope2Market')}
          value={formatNumber(scope2MarketTotal)}
          subValue={t('marketBased')}
          icon={<div className="w-6 h-6 bg-amber-500 rounded-full" />}
          colorClass="bg-amber-500"
        />
        <StatCard
          title={t('scope3')}
          value={formatNumber(scope3Total)}
          icon={<div className="w-6 h-6 bg-slate-800 rounded-full" />}
          colorClass="bg-slate-800"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="h-80">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">{t('emissionsByScope')}</h3>
          <ResponsiveContainer width="100%" height="100%" minHeight={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="name" stroke={tickColor} axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke={tickColor} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  color: tooltipText
                }}
                cursor={{ fill: theme === 'dark' ? '#334155' : '#f1f5f9', opacity: 0.4 }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey={t('scope1')} name={t('scope1')} stackId="a" fill={COLORS.scope1} radius={[0, 0, 4, 4]} maxBarSize={60} />
              <Bar dataKey={t('scope2Location')} name={t('scope2Location')} stackId="a" fill={COLORS.scope2Location} radius={[4, 4, 0, 0]} maxBarSize={60} />
              <Bar dataKey={t('scope2Market')} name={t('scope2Market')} stackId="a" fill={COLORS.scope2Market} radius={[4, 4, 0, 0]} maxBarSize={60} />
              <Bar dataKey={t('scope3')} name={t('scope3')} stackId="a" fill={COLORS.scope3} radius={[4, 4, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {scope3Total > 0 && (
          <div className="h-80">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">{t('scope3Breakdown')}</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={scope3Data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {scope3Data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SCOPE3_CATEGORY_COLORS[index % SCOPE3_CATEGORY_COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip scope3Total={scope3Total / 1000} t={t} />} />
                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  wrapperStyle={{ fontSize: '12px', color: tickColor }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">{t('facilityBreakdown')}</h3>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('facility')}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('scope1')}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('scope2Location')}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('scope2Market')}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('scope3')}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('totalLocation')}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('totalMarket')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {facilities.map((facility) => {
              const data = facilityBreakdown[facility.id] || { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: 0 };
              const totalLocation = data.scope1 + data.scope2Location + data.scope3;
              const totalMarket = data.scope1 + data.scope2Market + data.scope3;

              return (
                <tr key={facility.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{facility.name}</td>
                  <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-300">{formatNumber(data.scope1)}</td>
                  <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-300">{formatNumber(data.scope2Location)}</td>
                  <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-300">{formatNumber(data.scope2Market)}</td>
                  <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-300">{formatNumber(data.scope3)}</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">{formatNumber(totalLocation)}</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">{formatNumber(totalMarket)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};