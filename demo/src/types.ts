// Demo app types - Category 1 only (Purchased Goods and Services)

export interface CO2eFactorFuel {
    id?: string;
    name: string;
    translationKey?: string;
    units: string[];
    factors: { [key: string]: number };
    isCustom?: boolean;
    source?: string;
    sourceUrl?: string;
    year?: number;
    region?: string;
}

export type CalculationMethod = 'supplier_co2e' | 'activity' | 'spend' | 'hybrid';

export type Category1FactorType =
    | 'rawMaterials_metals'
    | 'rawMaterials_plastics'
    | 'rawMaterials_chemicals'
    | 'rawMaterials_construction'
    | 'packaging'
    | 'electronics'
    | 'officeSupplies'
    | 'ppeSafety'
    | 'services'
    | 'foodAgricultural'
    | 'textiles'
    | 'custom';

export type TransportMode = 'Road' | 'Sea' | 'Air' | 'Rail';
export type WasteType = 'MSW' | 'Paper' | 'Plastics' | 'Food' | 'Metal' | 'Hazardous' | 'Wood' | 'Glass' | 'Concrete' | 'Textile';
export type TreatmentMethod = 'Landfill' | 'Incineration' | 'Recycling' | 'Composting' | 'AnaerobicDigestion';

// Data Quality Indicator
export interface DataQualityIndicator {
    technologicalRep: 1 | 2 | 3 | 4 | 5;
    temporalRep: 1 | 2 | 3 | 4 | 5;
    geographicalRep: 1 | 2 | 3 | 4 | 5;
    completeness: 1 | 2 | 3 | 4 | 5;
    reliability: 1 | 2 | 3 | 4 | 5;
}

export const calculateDQIScore = (dqi: DataQualityIndicator): number => {
    const weights = {
        technologicalRep: 0.25,
        temporalRep: 0.20,
        geographicalRep: 0.20,
        completeness: 0.20,
        reliability: 0.15,
    };
    const weightedSum =
        dqi.technologicalRep * weights.technologicalRep +
        dqi.temporalRep * weights.temporalRep +
        dqi.geographicalRep * weights.geographicalRep +
        dqi.completeness * weights.completeness +
        dqi.reliability * weights.reliability;
    return Math.round(weightedSum * 100) / 100;
};

export const getDQIRating = (score: number): 'high' | 'medium' | 'low' | 'estimated' => {
    if (score <= 1.5) return 'high';
    if (score <= 2.5) return 'medium';
    if (score <= 3.5) return 'low';
    return 'estimated';
};

// Hybrid Method Types
export interface HybridMaterialInput {
    id: string;
    materialName: string;
    quantity: number;
    unit: string;
    emissionFactor: number;
    factorSource?: string;
}

export interface HybridTransportInput {
    id: string;
    description?: string;
    transportMode: TransportMode;
    vehicleType?: string;
    weightTonnes: number;
    distanceKm: number;
    emissionFactor?: number;
}

export interface HybridWasteInput {
    id: string;
    wasteType: WasteType;
    treatmentMethod: TreatmentMethod;
    quantity: number;
    unit: string;
    emissionFactor?: number;
}

export interface HybridCalculationData {
    supplierScope12?: {
        totalEmissions: number;
        allocationBasis: 'revenue' | 'quantity' | 'custom';
        allocationPercentage: number;
    };
    materialInputs: HybridMaterialInput[];
    transportInputs: HybridTransportInput[];
    wasteInputs: HybridWasteInput[];
}

// Demo emission source (simplified)
export interface DemoEmissionSource {
    id: string;
    itemName: string;
    calculationMethod: CalculationMethod;
    quantity: number;
    unit: string;
    emissionFactor: number;
    factorSource?: string;
    cat1FactorType?: Category1FactorType;
    selectedFactorName?: string;
    isFactorFromDatabase?: boolean;
    dataQualityIndicator?: DataQualityIndicator;
    dataQualityRating?: 'high' | 'medium' | 'low' | 'estimated';
    hybridData?: HybridCalculationData;
    supplierProvidedCO2e?: number;
}
