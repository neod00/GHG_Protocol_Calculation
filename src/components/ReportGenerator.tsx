
import React, { useMemo } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { EmissionCategory, Facility, BoundaryApproach, EmissionSource, Cat15CalculationMethod } from '../types';
import { IconX, IconCheck, IconAlertTriangle } from './IconComponents';
import { TranslationKey } from '../translations/index';

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
    scope3Settings,
    allFactors,
}) => {
    const { t, language } = useTranslation();

    // --- CSS Styles for Print & Preview ---
    const printStyles = `
    @media print {
      @page { 
        size: A4; 
        margin: 20mm; 
      }
      body { 
        print-color-adjust: exact; 
        -webkit-print-color-adjust: exact; 
      }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
      .keep-together { page-break-inside: avoid; }
      
      /* Reset colors for print */
      .text-gray-600, .text-gray-500 { color: #333 !important; }
      .bg-gray-50 { background-color: #f9fafb !important; }
      .border { border-color: #e5e7eb !important; }
    }
    .report-container { font-family: 'Inter', sans-serif; color: #111; line-height: 1.6; }
    .report-header { border-bottom: 2px solid #4A6B4C; padding-bottom: 10px; margin-bottom: 20px; }
    .report-h1 { font-size: 24px; font-weight: 800; color: #1F2937; margin-top: 0; margin-bottom: 16px; }
    .report-h2 { font-size: 18px; font-weight: 700; color: #4A6B4C; margin-top: 32px; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 6px; }
    .report-h3 { font-size: 15px; font-weight: 600; color: #374151; margin-top: 20px; margin-bottom: 8px; }
    .report-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px; }
    .report-table th { background-color: #F3F4F6; text-align: left; padding: 8px; font-weight: 600; border-bottom: 1px solid #E5E7EB; }
    .report-table td { padding: 8px; border-bottom: 1px solid #F3F4F6; }
    .report-table tr:last-child td { border-bottom: none; }
    .metric-box { background: #F9FAFB; border: 1px solid #E5E7EB; padding: 16px; border-radius: 8px; margin-bottom: 20px; }
  `;

    if (!isOpen) return null;

    const currentDate = new Date().toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const formatNumber = (num: number, digits = 2) => (num / 1000).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

    // Calculate Data Quality (Proxy)
    const totalSources = Object.values(sources).flat().length;
    const activityBasedSources = Object.values(sources).flat().filter((s: EmissionSource) =>
        s.calculationMethod === 'activity' ||
        s.calculationMethod === 'fuel' ||
        s.calculationMethod === 'energy_consumption' ||
        s.calculationMethod === 'asset_specific'
    ).length;

    const dataQualityPercent = totalSources > 0 ? (activityBasedSources / totalSources) * 100 : 0;
    let dataQualityLevel = 'Low';
    if (dataQualityPercent > 80) dataQualityLevel = 'High';
    else if (dataQualityPercent > 40) dataQualityLevel = 'Medium';

    // Helper to get scope 3 methodology description
    const getBoundaryDesc = () => {
        if (boundaryApproach === 'operational') return t('opControlDef');
        if (boundaryApproach === 'financial') return t('finControlDef');
        return t('equityShareDef');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm no-print">
            <style>{printStyles}</style>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col">
                {/* Modal Header */}
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center flex-shrink-0 bg-white dark:bg-gray-800 rounded-t-xl">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('ghgReportTitle')}</h2>
                    <div className="flex gap-2">
                        <button onClick={() => window.print()} className="px-4 py-2 text-sm font-medium text-white bg-ghg-green rounded-md hover:bg-ghg-dark transition-colors flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            {t('downloadPDF')}
                        </button>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                            <IconX className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Report Content (Scrollable) */}
                <div id="printable-report" className="flex-grow overflow-y-auto p-8 md:p-12 bg-white text-gray-900 report-container">

                    {/* --- COVER PAGE --- */}
                    <div className="flex flex-col justify-center min-h-[260mm] text-center mb-8">
                        <div className="mb-12">
                            {/* Placeholder for Logo */}
                            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-ghg-green text-white font-bold text-2xl mb-4">
                                GHG
                            </div>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-4">{t('ghgReportTitle')}</h1>
                        <p className="text-xl text-gray-600 mb-12">{t('reportSubtitle')}</p>

                        <div className="max-w-md mx-auto border-t border-b border-gray-200 py-8 text-left w-full">
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <span className="text-gray-500 font-medium col-span-1">{t('preparedFor')}</span>
                                <span className="text-gray-900 font-bold col-span-2 text-lg">{companyName}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <span className="text-gray-500 font-medium col-span-1">{t('reportingPeriod')}</span>
                                <span className="text-gray-900 col-span-2">{reportingYear}-01-01 ~ {reportingYear}-12-31</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <span className="text-gray-500 font-medium col-span-1">{t('publicationDate')}</span>
                                <span className="text-gray-900 col-span-2">{currentDate}</span>
                            </div>
                        </div>
                    </div>

                    <div className="page-break"></div>

                    {/* --- TABLE OF CONTENTS --- */}
                    <div className="mb-12">
                        <h2 className="report-h2 mt-0">{t('tocTitle')}</h2>
                        <ul className="space-y-2 text-sm pl-0">
                            <li className="flex justify-between border-b border-dotted border-gray-300 pb-1"><span>{t('execSummaryTitle')}</span> <span>3</span></li>
                            <li className="flex justify-between border-b border-dotted border-gray-300 pb-1"><span>{t('ch1Title')}</span> <span>4</span></li>
                            <li className="flex justify-between border-b border-dotted border-gray-300 pb-1"><span>{t('ch2Title')}</span> <span>5</span></li>
                            <li className="flex justify-between border-b border-dotted border-gray-300 pb-1"><span>{t('ch3Title')}</span> <span>6</span></li>
                            <li className="flex justify-between border-b border-dotted border-gray-300 pb-1"><span>{t('ch4Title')}</span> <span>7</span></li>
                            <li className="flex justify-between border-b border-dotted border-gray-300 pb-1"><span>{t('ch5Title')}</span> <span>8</span></li>
                            <li className="flex justify-between border-b border-dotted border-gray-300 pb-1"><span>{t('ch6Title')}</span> <span>10</span></li>
                            <li className="flex justify-between border-b border-dotted border-gray-300 pb-1"><span>{t('ch7Title')}</span> <span>11</span></li>
                        </ul>
                    </div>

                    <div className="page-break"></div>

                    {/* --- EXECUTIVE SUMMARY --- */}
                    <section className="mb-12">
                        <h2 className="report-h1 border-b-4 border-ghg-green pb-2 mb-6">{t('execSummaryTitle')}</h2>
                        <p className="mb-6 text-gray-700">
                            {t('execSummaryText').replace('{company}', companyName).replace('{year}', reportingYear)}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="p-4 bg-ghg-green/10 rounded-lg text-center border border-ghg-green/20">
                                <div className="text-xs text-gray-500 uppercase font-semibold mb-1">{t('totalEmissions')}</div>
                                <div className="text-2xl font-bold text-ghg-dark">{formatNumber(results.totalEmissionsMarket)}</div>
                                <div className="text-xs text-gray-500">tCO₂e (Market)</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg text-center border border-gray-200">
                                <div className="text-xs text-gray-500 uppercase font-semibold mb-1">{t('scope1Total')}</div>
                                <div className="text-xl font-bold text-gray-800">{formatNumber(results.scope1Total)}</div>
                                <div className="text-xs text-gray-500">tCO₂e</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg text-center border border-gray-200">
                                <div className="text-xs text-gray-500 uppercase font-semibold mb-1">{t('scope2MktTotal')}</div>
                                <div className="text-xl font-bold text-gray-800">{formatNumber(results.scope2MarketTotal)}</div>
                                <div className="text-xs text-gray-500">tCO₂e</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg text-center border border-gray-200">
                                <div className="text-xs text-gray-500 uppercase font-semibold mb-1">{t('scope3Total')}</div>
                                <div className="text-xl font-bold text-gray-800">{formatNumber(results.scope3Total)}</div>
                                <div className="text-xs text-gray-500">tCO₂e</div>
                            </div>
                        </div>
                    </section>

                    {/* --- CHAPTER 1: INTRODUCTION --- */}
                    <section className="mb-8">
                        <h2 className="report-h2">{t('ch1Title')}</h2>

                        <h3 className="report-h3">{t('ch1Purpose')}</h3>
                        <p className="text-sm text-gray-700 mb-4">{t('ch1PurposeText').replace('{company}', companyName)}</p>

                        <h3 className="report-h3">{t('ch1Standards')}</h3>
                        <p className="text-sm text-gray-700 mb-2">{t('ch1StandardsText')}</p>
                        <ul className="list-disc pl-5 text-sm text-gray-700 mb-4 space-y-1">
                            <li>{t('std1')}</li>
                            <li>{t('std2')}</li>
                        </ul>

                        <h3 className="report-h3">{t('ch1Principles')}</h3>
                        <p className="text-sm text-gray-700 mb-2">{t('ch1PrinciplesText')}</p>
                        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                            <li><strong>Relevance:</strong> {t('principle1')}</li>
                            <li><strong>Completeness:</strong> {t('principle2')}</li>
                            <li><strong>Consistency:</strong> {t('principle3')}</li>
                            <li><strong>Transparency:</strong> {t('principle4')}</li>
                            <li><strong>Accuracy:</strong> {t('principle5')}</li>
                        </ul>
                    </section>

                    <div className="page-break"></div>

                    {/* --- CHAPTER 2: ORGANIZATIONAL BOUNDARIES --- */}
                    <section className="mb-8">
                        <h2 className="report-h2">{t('ch2Title')}</h2>

                        <h3 className="report-h3">{t('ch2Approach')}</h3>
                        <p className="text-sm text-gray-700 mb-3" dangerouslySetInnerHTML={{ __html: t('ch2ApproachText').replace('{company}', companyName).replace('{approach}', boundaryApproachText) }}></p>
                        <div className="bg-gray-50 p-3 rounded text-sm text-gray-600 border-l-4 border-ghg-green italic">
                            {getBoundaryDesc()}
                        </div>

                        <h3 className="report-h3">{t('ch2Facilities')}</h3>
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>{t('facilityName')}</th>
                                    <th>{t('facilityRole')}</th>
                                    <th>{t('equityShare')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {facilities.map(f => (
                                    <tr key={f.id}>
                                        <td>{f.name}</td>
                                        <td>{f.group || (f.isCorporate ? 'Corporate' : '-')}</td>
                                        <td>{f.equityShare}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    {/* --- CHAPTER 3: OPERATIONAL BOUNDARIES --- */}
                    <section className="mb-8 keep-together">
                        <h2 className="report-h2">{t('ch3Title')}</h2>
                        <p className="text-sm text-gray-700 mb-4">{t('ch3Intro')}</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="p-3 border rounded bg-white">
                                <h4 className="font-bold text-sm mb-1">Scope 1</h4>
                                <p className="text-xs text-gray-600">{t('scope1Def')}</p>
                            </div>
                            <div className="p-3 border rounded bg-white">
                                <h4 className="font-bold text-sm mb-1">Scope 2</h4>
                                <p className="text-xs text-gray-600">{t('scope2Def')}</p>
                            </div>
                            <div className="p-3 border rounded bg-white">
                                <h4 className="font-bold text-sm mb-1">Scope 3</h4>
                                <p className="text-xs text-gray-600">{t('scope3Def')}</p>
                            </div>
                        </div>

                        <h3 className="report-h3">{t('ch3Inclusions')}</h3>
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th className="w-24">Scope</th>
                                    <th>{t('category')}</th>
                                    <th className="w-24">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="font-semibold">Scope 1</td>
                                    <td>Stationary, Mobile, Process, Fugitive, Waste (On-site)</td>
                                    <td className="text-green-600 font-medium">Included</td>
                                </tr>
                                <tr>
                                    <td className="font-semibold">Scope 2</td>
                                    <td>Purchased Electricity, Steam, Heat, Cooling</td>
                                    <td className="text-green-600 font-medium">Included</td>
                                </tr>
                                {scope3Settings.isEnabled && scope3Settings.enabledCategories.map(cat => (
                                    <tr key={cat}>
                                        <td className="font-semibold">Scope 3</td>
                                        <td>{t(cat)}</td>
                                        <td className="text-green-600 font-medium">Included</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    <div className="page-break"></div>

                    {/* --- CHAPTER 4: METHODOLOGY --- */}
                    <section className="mb-8">
                        <h2 className="report-h2">{t('ch4Title')}</h2>

                        <h3 className="report-h3">{t('ch4Method')}</h3>
                        <p className="text-sm text-gray-700 mb-2" dangerouslySetInnerHTML={{ __html: t('ch4MethodText') }}></p>

                        <h3 className="report-h3">{t('ch4GWP')}</h3>
                        <p className="text-sm text-gray-700 mb-2">{t('ch4GWPText')}</p>

                        <h3 className="report-h3">{t('ch4Sources')}</h3>
                        <p className="text-sm text-gray-700 mb-2">{t('ch4SourcesText')}</p>
                    </section>

                    {/* --- CHAPTER 5: RESULTS --- */}
                    <section className="mb-8">
                        <h2 className="report-h2">{t('ch5Title')}</h2>

                        <h3 className="report-h3">{t('ch5Summary')}</h3>
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>Scope</th>
                                    <th className="text-right">{t('emissions')}</th>
                                    <th className="text-right">{t('share')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>Scope 1</strong></td>
                                    <td className="text-right font-mono">{formatNumber(results.scope1Total)}</td>
                                    <td className="text-right text-gray-500">{results.totalEmissionsMarket > 0 ? ((results.scope1Total / results.totalEmissionsMarket) * 100).toFixed(1) : 0}%</td>
                                </tr>
                                <tr>
                                    <td><strong>Scope 2 (Market-based)</strong></td>
                                    <td className="text-right font-mono">{formatNumber(results.scope2MarketTotal)}</td>
                                    <td className="text-right text-gray-500">{results.totalEmissionsMarket > 0 ? ((results.scope2MarketTotal / results.totalEmissionsMarket) * 100).toFixed(1) : 0}%</td>
                                </tr>
                                <tr>
                                    <td>Scope 2 (Location-based)</td>
                                    <td className="text-right font-mono italic text-gray-600">{formatNumber(results.scope2LocationTotal)}</td>
                                    <td className="text-right text-gray-400">-</td>
                                </tr>
                                <tr>
                                    <td><strong>Scope 3</strong></td>
                                    <td className="text-right font-mono">{formatNumber(results.scope3Total)}</td>
                                    <td className="text-right text-gray-500">{results.totalEmissionsMarket > 0 ? ((results.scope3Total / results.totalEmissionsMarket) * 100).toFixed(1) : 0}%</td>
                                </tr>
                                <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                                    <td>Total (Market-based)</td>
                                    <td className="text-right">{formatNumber(results.totalEmissionsMarket)}</td>
                                    <td className="text-right">100%</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Scope 2 Detailed Reporting (Dual Reporting & Power Mix) */}
                        <h3 className="report-h3 mt-6">{t('scope2Title') || 'Scope 2 Detailed Reporting'}</h3>

                        {/* 1. Dual Reporting Table */}
                        <p className="text-sm text-gray-700 mb-2 font-semibold">Dual Reporting (Location-based vs Market-based)</p>
                        <table className="report-table mb-6">
                            <thead>
                                <tr>
                                    <th>Method</th>
                                    <th className="text-right">Emissions (tCO₂e)</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="font-bold">Location-based</td>
                                    <td className="text-right font-mono">{formatNumber(results.scope2LocationTotal)}</td>
                                    <td className="text-xs text-gray-500">Reflects average emissions intensity of grids on which energy consumption occurs (using mostly grid-average emission factor data).</td>
                                </tr>
                                <tr>
                                    <td className="font-bold">Market-based</td>
                                    <td className="text-right font-mono">{formatNumber(results.scope2MarketTotal)}</td>
                                    <td className="text-xs text-gray-500">Reflects emissions from electricity that electricity consumers have purposefully chosen (or their lack of choice).</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* 2. Power Mix Breakdown */}
                        <p className="text-sm text-gray-700 mb-2 font-semibold">Power Mix (Market-based Attribution)</p>
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>Instrument Type</th>
                                    <th className="text-right">Energy (kWh)</th>
                                    <th className="text-right">Applied EF (kgCO₂e/kWh)</th>
                                    <th className="text-right">Emissions (tCO₂e)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    // Aggregate Scope 2 Power Mix data for report
                                    let ppaKwh = 0, ppaEmissions = 0;
                                    let recKwh = 0, recEmissions = 0;
                                    let gpKwh = 0, gpEmissions = 0;
                                    let convKwh = 0, convEmissions = 0;
                                    let residualKwh = 0, residualEmissions = 0;
                                    let totalKwh = 0;

                                    const s2Sources = sources[EmissionCategory.PurchasedEnergy] || [];

                                    s2Sources.forEach(s => {
                                        // Need to replicate calculation logic slightly to aggregate for display
                                        // or ideally logic should store breakdown. For now, re-calc aggregates.
                                        const mix = s.powerMix || {};
                                        const qTotal = s.monthlyQuantities.reduce((a, b) => a + b, 0);
                                        totalKwh += qTotal;

                                        const gridFactor = allFactors.scope2?.find((f: any) => f.name === s.fuelType)?.factors[s.unit] || 0;
                                        // Residual proxy
                                        const residualFactor = gridFactor; // Using grid as residual per MainCalculator logic

                                        let allocated = 0;

                                        // PPA
                                        if (mix.ppa) {
                                            const q = mix.ppa.quantity.reduce((a: number, b: number) => a + b, 0);
                                            ppaKwh += q;
                                            ppaEmissions += q * (mix.ppa.factor || 0);
                                            allocated += q;
                                        }
                                        // REC
                                        if (mix.rec) {
                                            const q = mix.rec.quantity.reduce((a: number, b: number) => a + b, 0);
                                            recKwh += q;
                                            // Logic check
                                            if (mix.rec.meetsRequirements ?? true) {
                                                recEmissions += 0;
                                            } else {
                                                recEmissions += q * residualFactor;
                                            }
                                            allocated += q;
                                        }
                                        // GP
                                        if (mix.greenPremium) {
                                            const q = mix.greenPremium.quantity.reduce((a: number, b: number) => a + b, 0);
                                            gpKwh += q;
                                            if (mix.greenPremium.treatAsRenewable) {
                                                const ef = mix.greenPremium.supplierFactorProvided ? (mix.greenPremium.supplierFactor || 0) : 0;
                                                gpEmissions += q * ef;
                                            } else {
                                                gpEmissions += q * residualFactor;
                                            }
                                            allocated += q;
                                        }
                                        // Conventional
                                        if (mix.conventional) {
                                            const q = mix.conventional.quantity.reduce((a: number, b: number) => a + b, 0);
                                            convKwh += q;
                                            convEmissions += q * (mix.conventional.factor || residualFactor);
                                            allocated += q;
                                        }

                                        // Residual
                                        if (qTotal > allocated) {
                                            const rem = qTotal - allocated;
                                            residualKwh += rem;
                                            residualEmissions += rem * residualFactor;
                                        }
                                    });

                                    return (
                                        <>
                                            {/* PPA Row */}
                                            <tr>
                                                <td>PPA (Direct Contracts)</td>
                                                <td className="text-right">{ppaKwh.toLocaleString()}</td>
                                                <td className="text-right">-</td>
                                                <td className="text-right">{(ppaEmissions / 1000).toLocaleString(undefined, { maximumFractionDigits: 3 })}</td>
                                            </tr>
                                            {/* REC Row */}
                                            <tr>
                                                <td>REC (Certificates)</td>
                                                <td className="text-right">{recKwh.toLocaleString()}</td>
                                                <td className="text-right">0 (if valid)</td>
                                                <td className="text-right">{(recEmissions / 1000).toLocaleString(undefined, { maximumFractionDigits: 3 })}</td>
                                            </tr>
                                            {/* GP Row */}
                                            <tr>
                                                <td>Green Premium</td>
                                                <td className="text-right">{gpKwh.toLocaleString()}</td>
                                                <td className="text-right">Var</td>
                                                <td className="text-right">{(gpEmissions / 1000).toLocaleString(undefined, { maximumFractionDigits: 3 })}</td>
                                            </tr>
                                            {/* Residual Row (Includes Conventional + Unallocated) */}
                                            <tr>
                                                <td>Residual Mix (Grid/Unknown)</td>
                                                <td className="text-right">{(residualKwh + convKwh).toLocaleString()}</td>
                                                <td className="text-right">Grid Avg (Proxy)</td>
                                                <td className="text-right">{((residualEmissions + convEmissions) / 1000).toLocaleString(undefined, { maximumFractionDigits: 3 })}</td>
                                            </tr>
                                            <tr className="bg-gray-50 font-bold border-t">
                                                <td>Total Scope 2</td>
                                                <td className="text-right">{totalKwh.toLocaleString()}</td>
                                                <td className="text-right">-</td>
                                                <td className="text-right">{formatNumber(results.scope2MarketTotal)}</td>
                                            </tr>
                                        </>
                                    );
                                })()}
                            </tbody>
                        </table>

                        {/* 3. Green Premium Strict Disclaimer */}
                        {(() => {
                            const s2Sources = sources[EmissionCategory.PurchasedEnergy] || [];
                            const gpSources = s2Sources.filter(s => s.powerMix?.greenPremium && s.powerMix.greenPremium.quantity.reduce((a, b) => a + b, 0) > 0);

                            if (gpSources.some(s => s.powerMix?.greenPremium?.treatAsRenewable)) {
                                return (
                                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                                        <strong>Green Premium Treatment:</strong> 本 보고서의 market-based Scope 2 산정에는 녹색프리미엄을 재생에너지 계약수단으로 간주하여 0배출(또는 공급사 배출계수)을 적용하였음. 이 처리는 GHG Protocol Scope 2 품질 기준 해석에 의존하며, 일부 이해관계자 및 제도(K-ETS 등)는 이를 감축 실적으로 인정하지 않을 수 있음.
                                    </div>
                                );
                            } else if (gpSources.length > 0) {
                                // GP used but NOT treated as renewable
                                return (
                                    <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
                                        <strong>Green Premium Treatment:</strong> 녹색프리미엄은 MB 감축으로 반영하지 않음 (Applied Residual/Grid Mix).
                                    </div>
                                );
                            }
                        })()}

                        <h3 className="report-h3 mt-6">{t('ch5Scope3')}</h3>
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>{t('category')}</th>
                                    <th className="text-right">{t('emissions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(results.scope3CategoryBreakdown)
                                    .sort(([, a], [, b]) => (b as number) - (a as number))
                                    .map(([cat, val]) => (
                                        <tr key={cat}>
                                            <td>{t(cat as TranslationKey)}</td>
                                            <td className="text-right font-mono">{formatNumber(val as number)}</td>
                                        </tr>
                                    ))}
                                {Object.keys(results.scope3CategoryBreakdown).length === 0 && (
                                    <tr><td colSpan={2} className="text-center text-gray-500 italic py-4">No Scope 3 emissions calculated.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </section>

                    <div className="page-break"></div>

                    {/* --- CHAPTER 6: DATA QUALITY --- */}
                    <section className="mb-8">
                        <h2 className="report-h2">{t('ch6Title')}</h2>
                        <h3 className="report-h3">{t('ch6Assessment')}</h3>
                        <p className="text-sm text-gray-700 mb-4">{t('ch6Text')}</p>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="p-4 bg-blue-50 rounded border border-blue-100 text-center">
                                <div className="text-2xl font-bold text-blue-800">{dataQualityPercent.toFixed(0)}%</div>
                                <div className="text-xs text-blue-600 font-medium uppercase mt-1">{t('primaryData')}</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded border border-gray-200 text-center">
                                <div className="text-2xl font-bold text-gray-700">{(100 - dataQualityPercent).toFixed(0)}%</div>
                                <div className="text-xs text-gray-500 font-medium uppercase mt-1">{t('secondaryData')}</div>
                            </div>
                        </div>

                        <div className="p-4 border rounded-lg text-sm">
                            <p className="font-semibold mb-2">Overall Data Quality Rating: <span className={dataQualityLevel === 'High' ? 'text-green-600' : dataQualityLevel === 'Medium' ? 'text-yellow-600' : 'text-red-500'}>{dataQualityLevel}</span></p>
                            <ul className="list-disc pl-5 text-gray-600 space-y-1 text-xs">
                                <li>{t('dataQualityHigh')}</li>
                                <li>{t('dataQualityMed')}</li>
                                <li>{t('dataQualityLow')}</li>
                            </ul>
                        </div>
                    </section>

                    {/* --- CHAPTER 7: BASE YEAR --- */}
                    <section className="mb-12">
                        <h2 className="report-h2">{t('ch7Title')}</h2>
                        <h3 className="report-h3">{t('ch7BaseYear')}</h3>
                        <p className="text-sm text-gray-700 mb-4" dangerouslySetInnerHTML={{ __html: t('ch7BaseYearText').replace('{year}', reportingYear) }}></p>

                        <h3 className="report-h3">{t('ch7Policy')}</h3>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border-l-4 border-gray-400">
                            {t('ch7PolicyText')}
                        </p>
                    </section>

                    {/* --- FOOTER --- */}
                    <footer className="mt-12 pt-6 border-t text-center text-xs text-gray-400">
                        <p>{t('generatedBy')} • {currentDate}</p>
                    </footer>
                </div>
            </div>
        </div>
    );
};
