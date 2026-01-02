/**
 * Factor Export Utility
 * Exports emission factors to CSV format for backup and bulk editing
 */

interface FactorData {
    name: string;
    translationKey?: string;
    units?: string[];
    factors?: { [key: string]: number };
    gwp?: number;
    co2EF?: number;
    ch4EF?: number;
    n2oEF?: number;
    gwpCH4?: number;
    gwpN2O?: number;
    netHeatingValue?: number;
    heatingValueUnit?: string;
    source?: string;
    csvLineRef?: string;
    isVerified?: boolean;
    isCustom?: boolean;
}

type FactorCategoryKey = 'stationary' | 'mobile' | 'process' | 'fugitive' | 'waste' | 'scope2' | 'purchasedGoods' | 'capitalGoods' | 'fuelEnergy' | 'upstreamTransport' | 'downstreamTransport' | 'scope3Waste' | 'businessTravel' | 'employeeCommuting' | 'upstreamLeased' | 'downstreamLeased' | 'processingSold' | 'useSold' | 'endOfLife' | 'franchises' | 'investments';

interface AllFactors {
    [key: string]: FactorData[] | any;
}

/**
 * Export emission factors to CSV format
 */
export function exportFactorsToCSV(allFactors: AllFactors, categoryFilter?: FactorCategoryKey): string {
    const headers = [
        'Category',
        'Name',
        'TranslationKey',
        'PrimaryUnit',
        'PrimaryFactor',
        'CO2EF',
        'CH4EF',
        'N2OEF',
        'GWP_CH4',
        'GWP_N2O',
        'NetHeatingValue',
        'HeatingValueUnit',
        'Source',
        'CSVRef',
        'IsVerified',
        'IsCustom'
    ];

    const rows: string[][] = [];

    const categoriesToExport: FactorCategoryKey[] = categoryFilter
        ? [categoryFilter]
        : ['stationary', 'mobile', 'process', 'fugitive', 'waste', 'scope2'];

    for (const categoryKey of categoriesToExport) {
        const data = allFactors[categoryKey];

        if (!Array.isArray(data)) continue;

        for (const item of data) {
            const primaryUnit = item.units?.[0] || Object.keys(item.factors || {})[0] || '';
            const primaryFactor = item.factors?.[primaryUnit] ?? item.gwp ?? '';

            const row = [
                categoryKey,
                escapeCSV(item.name || ''),
                escapeCSV(item.translationKey || ''),
                escapeCSV(primaryUnit),
                String(primaryFactor),
                String(item.co2EF ?? ''),
                String(item.ch4EF ?? ''),
                String(item.n2oEF ?? ''),
                String(item.gwpCH4 ?? ''),
                String(item.gwpN2O ?? ''),
                String(item.netHeatingValue ?? ''),
                escapeCSV(item.heatingValueUnit || ''),
                escapeCSV(item.source || ''),
                escapeCSV(item.csvLineRef || ''),
                item.isVerified ? 'TRUE' : 'FALSE',
                item.isCustom ? 'TRUE' : 'FALSE'
            ];

            rows.push(row);
        }
    }

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
}

/**
 * Escape a value for CSV format
 */
function escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

/**
 * Trigger download of CSV file
 */
export function downloadCSV(csvContent: string, filename: string = 'emission_factors.csv'): void {
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}
