import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Label
} from 'recharts';
import { Facility, BoundaryApproach } from '../types';
import { useTranslation } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { IconProcess, IconFactory, IconBuilding, IconCar, IconLeaf, IconBriefcase, IconZap, IconFire } from './IconComponents';

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
  isAuthenticated?: boolean;
}

const COLORS = {
  scope1: '#10B981', // Emerald 500
  scope2Location: '#34D399', // Emerald 400
  scope2Market: '#f59e0b', // Amber 500
  scope3: '#3B82F6', // Blue 500
};

// Pastel/Gradient Palette for Scope 3 Categories
const SCOPE3_CATEGORY_COLORS = [
  '#3B82F6', '#60A5FA', '#93C5FD', // Blues
  '#8B5CF6', '#A78BFA', '#C4B5FD', // Violets
  '#EC4899', '#F472B6', '#FBCFE8', // Pinks
  '#10B981', '#34D399', '#6EE7B7', // Emeralds
];

// Helper to format numbers (t CO2e)
const formatNumber = (num: number) =>
  (num / 1000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
  onGenerateReport,
  isAuthenticated = false,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  // Theme-aware styles
  const isDark = theme === 'dark';
  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const subTextColor = isDark ? 'text-slate-400' : 'text-slate-500';
  const cardBg = isDark
    ? 'bg-slate-900/50 backdrop-blur-md border border-slate-700/50'
    : 'bg-white border border-slate-100 shadow-sm';
  const chartGridColor = isDark ? '#334155' : '#e2e8f0'; // slate-700 / slate-200
  const chartTickColor = isDark ? '#94a3b8' : '#64748b'; // slate-400 / slate-500

  // Calculation for Chart Data - Two separate bars: Location-based and Market-based totals
  const chartData = useMemo(() => {
    return [
      {
        name: t('locationBasedTotal'),
        [t('scope1')]: parseFloat((scope1Total / 1000).toFixed(2)),
        [t('scope2Location')]: parseFloat((scope2LocationTotal / 1000).toFixed(2)),
        [t('scope3')]: parseFloat((scope3Total / 1000).toFixed(2)),
      },
      {
        name: t('marketBasedTotal'),
        [t('scope1')]: parseFloat((scope1Total / 1000).toFixed(2)),
        [t('scope2Market')]: parseFloat((scope2MarketTotal / 1000).toFixed(2)),
        [t('scope3')]: parseFloat((scope3Total / 1000).toFixed(2)),
      },
    ];
  }, [scope1Total, scope2MarketTotal, scope2LocationTotal, scope3Total, t]);

  const scope3Data = useMemo(() => {
    return Object.entries(scope3CategoryBreakdown)
      .map(([name, value]) => ({ name: t(name), value: (value as number) / 1000 }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [scope3CategoryBreakdown, t]);

  // --- Render Components ---

  const HeroCard = ({ title, value, sub, type }: { title: string, value: string, sub: string, type: 'market' | 'location' }) => {
    const isLocation = type === 'location';

    // Improved Contrast Logic
    const gradient = type === 'market'
      ? isDark
        ? 'from-emerald-900/30 to-teal-900/30 text-emerald-400' // Dark Mode: Deep/Rich
        : 'from-emerald-50 to-teal-50 text-emerald-900 border-emerald-200' // Light Mode: Light/Clean with Dark Text
      : isDark
        ? 'from-slate-800 to-slate-900 text-slate-300'
        : 'from-white to-slate-50 text-slate-900 border-slate-200';

    const border = type === 'market'
      ? isDark ? 'border-emerald-500/30' : 'border-emerald-200'
      : isDark ? 'border-slate-700' : 'border-slate-200';

    const iconColor = type === 'market'
      ? isDark ? 'text-emerald-400' : 'text-emerald-600'
      : isDark ? 'text-slate-400' : 'text-slate-500';

    // Tweaked colors for light mode contrast
    const titleColor = type === 'market' && !isDark ? 'text-emerald-800' : (isLocation && !isDark ? 'text-slate-600' : 'text-slate-200');
    const valueColor = type === 'market' && !isDark ? 'text-emerald-900' : (isLocation && !isDark ? 'text-slate-900' : 'text-white');
    const subColor = type === 'market' && !isDark ? 'text-emerald-700/80' : (isLocation && !isDark ? 'text-slate-500' : 'opacity-60');

    return (
      <div className={`relative overflow-hidden rounded-2xl border ${border} p-6 flex flex-col justify-between h-full bg-gradient-to-br ${gradient} shadow-sm`}>
        <div className="flex justify-between items-start">
          <div>
            <p className={`text-sm font-medium mb-1 ${titleColor}`}>{title}</p>
            <div className="flex items-baseline gap-2">
              <h2 className={`text-4xl font-bold tracking-tight ${valueColor}`}>
                {value}
              </h2>
              <span className={`text-sm font-medium ${subColor}`}>t CO₂e</span>
            </div>
            <p className={`text-xs mt-2 max-w-[200px] ${subColor}`}>{sub}</p>
          </div>
          <div className={`p-3 rounded-xl bg-white/5 backdrop-blur-sm ${iconColor}`}>
            {type === 'market' ? <IconZap className="w-6 h-6" /> : <IconLeaf className="w-6 h-6" />}
          </div>
        </div>
      </div>
    );
  };

  const ScopeCard = ({ title, value, color, iconColor, icon: Icon, percentage }: any) => (
    <div className={`${cardBg} rounded-2xl p-5 flex flex-col justify-between h-full hover:shadow-md transition-all duration-300 group`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <span className={`text-sm font-medium ${subTextColor}`}>{title}</span>
        </div>
        {percentage && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            {percentage}%
          </span>
        )}
      </div>
      <div>
        <div className={`text-2xl font-bold ${textColor} tracking-tight`}>
          {value}
        </div>
        <div className="text-xs text-slate-400 mt-1">t CO₂e</div>
      </div>
    </div>
  );

  const totalEmissionsForPercent = totalEmissionsLocation > 0 ? totalEmissionsLocation : 1; // avoid /0

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className={`text-2xl font-bold tracking-tight ${textColor}`}>{t('resultsTitle')}</h2>
          <p className={`text-sm mt-1 ${subTextColor}`}>
            {companyName} • {reportingYear} • {t(boundaryApproach)} ({boundaryApproachText})
          </p>
          {/* Removed locked message as per feedback */}
        </div>
        <button
          onClick={onGenerateReport}
          className="flex items-center gap-2 text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-2.5 px-5 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
        >
          <IconProcess className="w-4 h-4" />
          {t('generateReport')}
        </button>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Top Row: Hero Stats (Span 6 each for equal prominence) */}
        <div className="md:col-span-6 lg:col-span-6 h-40">
          <HeroCard
            title={t('locationBasedTotal')}
            value={formatNumber(totalEmissionsLocation)}
            sub="Grid average emission factors applied."
            type="location"
          />
        </div>
        <div className="md:col-span-6 lg:col-span-6 h-40">
          <HeroCard
            title={t('marketBasedTotal')}
            value={formatNumber(totalEmissionsMarket)}
            sub="Specific contracts (RECs, PPA) reflected."
            type="market"
          />
        </div>

        {/* Middle Row: Scopes Breakdown (Span 3 each = 12 total) */}
        <div className="md:col-span-3 h-32">
          <ScopeCard
            title={t('scope1')}
            value={formatNumber(scope1Total)}
            color="bg-emerald-500"
            iconColor="text-emerald-600 dark:text-emerald-400"
            icon={IconFire}
            percentage={((scope1Total / totalEmissionsForPercent) * 100).toFixed(1)}
          />
        </div>
        <div className="md:col-span-3 h-32">
          <ScopeCard
            title={t('scope2Location')}
            value={formatNumber(scope2LocationTotal)}
            color="bg-cyan-500"
            iconColor="text-cyan-600 dark:text-cyan-400"
            icon={IconBuilding}
            percentage={((scope2LocationTotal / totalEmissionsForPercent) * 100).toFixed(1)}
          />
        </div>
        <div className="md:col-span-3 h-32">
          <ScopeCard
            title={t('scope2Market')}
            value={formatNumber(scope2MarketTotal)}
            color="bg-amber-500"
            iconColor="text-amber-600 dark:text-amber-400"
            icon={IconZap}
            percentage={((scope2MarketTotal / totalEmissionsForPercent) * 100).toFixed(1)}
          />
        </div>
        <div className="md:col-span-3 h-32">
          <ScopeCard
            title={t('scope3')}
            value={formatNumber(scope3Total)}
            color="bg-purple-500"
            iconColor="text-purple-600 dark:text-purple-400"
            icon={IconCar} // Or IconUsers/IconBriefcase
            percentage={((scope3Total / totalEmissionsForPercent) * 100).toFixed(1)}
          />
        </div>

        {/* Bottom Row: Charts Area */}
        {/* Left: Bar Chart (Span 7) */}
        <div className={`md:col-span-7 ${cardBg} p-6 rounded-2xl min-h-[400px]`}>
          <h3 className={`text-lg font-semibold mb-6 ${textColor}`}>{t('emissionsByScope')}</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} opacity={0.5} />
              <XAxis
                dataKey="name"
                stroke={chartTickColor}
                axisLine={false}
                tickLine={false}
                dy={10}
                fontSize={12}
              />
              <YAxis
                stroke={chartTickColor}
                axisLine={false}
                tickLine={false}
                dx={-10}
                fontSize={12}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                cursor={{ fill: isDark ? '#334155' : '#f1f5f9', opacity: 0.2 }}
                contentStyle={{
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  color: isDark ? '#f1f5f9' : '#1e293b'
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} iconType="circle" />
              <Bar dataKey={t('scope1')} stackId="a" fill={COLORS.scope1} radius={[0, 0, 0, 0]} barSize={40} />
              <Bar dataKey={t('scope2Location')} stackId="a" fill={COLORS.scope2Location} radius={[0, 0, 0, 0]} barSize={40} />
              <Bar dataKey={t('scope2Market')} stackId="a" fill={COLORS.scope2Market} radius={[0, 0, 0, 0]} barSize={40} />
              <Bar dataKey={t('scope3')} stackId="a" fill={COLORS.scope3} radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Right: Donut Chart for Scope 3 (Span 5) */}
        <div className={`md:col-span-5 ${cardBg} p-6 rounded-2xl min-h-[400px] flex flex-col`}>
          <h3 className={`text-lg font-semibold mb-2 ${textColor}`}>{t('scope3Breakdown')}</h3>
          {scope3Total > 0 ? (
            <div className="flex-1 min-h-[300px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={scope3Data}
                    cx="50%"
                    cy="50%"
                    innerRadius={80} // Donut style
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    cornerRadius={4}
                    stroke="none"
                  >
                    {scope3Data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SCOPE3_CATEGORY_COLORS[index % SCOPE3_CATEGORY_COLORS.length]} />
                    ))}
                    {/* Center Label */}
                    <Label
                      value={((scope3Total / totalEmissionsForPercent) * 100).toFixed(1) + '%'}
                      position="center"
                      className={`text-2xl font-bold ${isDark ? 'fill-white' : 'fill-slate-900'}`}
                      dy={-5}
                    />
                    <Label
                      value="of Total"
                      position="center"
                      className="text-xs fill-slate-500"
                      dy={15}
                    />
                  </Pie>
                  <Tooltip
                    itemStyle={{ color: isDark ? '#fff' : '#000' }}
                    contentStyle={{
                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                      borderRadius: '8px',
                    }}
                    formatter={(val: number) => [`${val.toFixed(2)} t`, '']}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: chartTickColor }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
                <IconLeaf className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-sm">No Scope 3 data calculated yet.</p>
            </div>
          )}
        </div>

        {/* Bottom: Facility Breakdown Table */}
        <div className={`md:col-span-12 ${cardBg} rounded-2xl overflow-hidden`}>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700/50">
            <h3 className={`text-lg font-semibold ${textColor}`}>{t('facilityBreakdown')}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700/50">
              <thead className="bg-gray-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('facility')}</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('scope1')}</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('scope2Location')}</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('scope2Market')}</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('scope3')}</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">{t('totalLocation')}</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">{t('totalMarket')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50">
                {facilities.map((facility) => {
                  const data = facilityBreakdown[facility.id] || { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: 0 };
                  const totalLocation = data.scope1 + data.scope2Location + data.scope3;
                  const totalMarket = data.scope1 + data.scope2Market + data.scope3;

                  return (
                    <tr key={facility.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${textColor}`}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          {facility.name}
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-right text-sm ${data.scope1 === 0 ? 'text-slate-300 dark:text-slate-600' : subTextColor}`}>
                        {formatNumber(data.scope1)}
                      </td>
                      <td className={`px-6 py-4 text-right text-sm ${data.scope2Location === 0 ? 'text-slate-300 dark:text-slate-600' : subTextColor}`}>
                        {formatNumber(data.scope2Location)}
                      </td>
                      <td className={`px-6 py-4 text-right text-sm ${data.scope2Market === 0 ? 'text-slate-300 dark:text-slate-600' : 'text-amber-500'}`}>
                        {formatNumber(data.scope2Market)}
                      </td>
                      <td className={`px-6 py-4 text-right text-sm ${data.scope3 === 0 ? 'text-slate-300 dark:text-slate-600' : subTextColor}`}>
                        {formatNumber(data.scope3)}
                      </td>
                      <td className={`px-6 py-4 text-right text-sm font-bold ${textColor}`}>
                        {formatNumber(totalLocation)}
                      </td>
                      <td className={`px-6 py-4 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400`}>
                        {formatNumber(totalMarket)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};