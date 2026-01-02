/**
 * Factor Import Utility
 * Parses CSV files and validates emission factor data for import
 */

interface ParsedFactor {
    category: string;
    name: string;
    translationKey: string;
    primaryUnit: string;
    primaryFactor: number;
    co2EF: number | null;
    ch4EF: number | null;
    n2oEF: number | null;
    gwpCH4: number | null;
    gwpN2O: number | null;
    netHeatingValue: number | null;
    heatingValueUnit: string;
    source: string;
    csvRef: string;
    isVerified: boolean;
    isCustom: boolean;
}

interface ParseResult {
    success: boolean;
    data: ParsedFactor[];
    errors: string[];
    warnings: string[];
}

/**
 * Parse CSV content into factor objects
 */
export function parseFactorsCSV(csvContent: string): ParseResult {
    const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    if (lines.length < 2) {
        return {
            success: false,
            data: [],
            errors: ['CSV file is empty or has no data rows'],
            warnings: []
        };
    }

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
    const requiredHeaders = ['category', 'name'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

    if (missingHeaders.length > 0) {
        return {
            success: false,
            data: [],
            errors: [`Missing required headers: ${missingHeaders.join(', ')}`],
            warnings: []
        };
    }

    const data: ParsedFactor[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (let i = 1; i < lines.length; i++) {
        try {
            const values = parseCSVLine(lines[i]);
            const row: { [key: string]: string } = {};

            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });

            const factor: ParsedFactor = {
                category: row['category'] || '',
                name: row['name'] || '',
                translationKey: row['translationkey'] || '',
                primaryUnit: row['primaryunit'] || '',
                primaryFactor: parseFloat(row['primaryfactor']) || 0,
                co2EF: row['co2ef'] ? parseFloat(row['co2ef']) : null,
                ch4EF: row['ch4ef'] ? parseFloat(row['ch4ef']) : null,
                n2oEF: row['n2oef'] ? parseFloat(row['n2oef']) : null,
                gwpCH4: row['gwp_ch4'] ? parseFloat(row['gwp_ch4']) : null,
                gwpN2O: row['gwp_n2o'] ? parseFloat(row['gwp_n2o']) : null,
                netHeatingValue: row['netheatingvalue'] ? parseFloat(row['netheatingvalue']) : null,
                heatingValueUnit: row['heatingvalueunit'] || '',
                source: row['source'] || '',
                csvRef: row['csvref'] || '',
                isVerified: row['isverified']?.toUpperCase() === 'TRUE',
                isCustom: row['iscustom']?.toUpperCase() === 'TRUE'
            };

            // Validation
            if (!factor.name) {
                errors.push(`Row ${i + 1}: Name is required`);
                continue;
            }

            if (!factor.category) {
                warnings.push(`Row ${i + 1}: No category specified for "${factor.name}"`);
            }

            data.push(factor);
        } catch (e) {
            errors.push(`Row ${i + 1}: Failed to parse - ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
    }

    return {
        success: errors.length === 0,
        data,
        errors,
        warnings
    };
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                i++; // Skip next quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
}

/**
 * Convert parsed factors back to the internal format
 */
export function convertToInternalFormat(parsedFactors: ParsedFactor[]): { [category: string]: any[] } {
    const result: { [category: string]: any[] } = {};

    for (const pf of parsedFactors) {
        if (!result[pf.category]) {
            result[pf.category] = [];
        }

        const factor: any = {
            name: pf.name,
            translationKey: pf.translationKey || undefined,
            units: pf.primaryUnit ? [pf.primaryUnit] : [],
            factors: pf.primaryUnit && pf.primaryFactor ? { [pf.primaryUnit]: pf.primaryFactor } : {},
            source: pf.source || undefined,
            csvLineRef: pf.csvRef || undefined,
            isVerified: pf.isVerified,
            isCustom: pf.isCustom
        };

        if (pf.co2EF !== null) factor.co2EF = pf.co2EF;
        if (pf.ch4EF !== null) factor.ch4EF = pf.ch4EF;
        if (pf.n2oEF !== null) factor.n2oEF = pf.n2oEF;
        if (pf.gwpCH4 !== null) factor.gwpCH4 = pf.gwpCH4;
        if (pf.gwpN2O !== null) factor.gwpN2O = pf.gwpN2O;
        if (pf.netHeatingValue !== null) {
            factor.netHeatingValue = pf.netHeatingValue;
            factor.heatingValueUnit = pf.heatingValueUnit;
        }

        result[pf.category].push(factor);
    }

    return result;
}
