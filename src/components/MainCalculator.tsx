"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from '../context/LanguageContext';
// Fix: Import 'EditableCO2eFactorFuel' to resolve type error.
import { EmissionCategory, EmissionSource, Refrigerant, Facility, BoundaryApproach, EditableRefrigerant, EditableCO2eFactorFuel, CO2eFactorFuel, TransportMode, Cat5CalculationMethod, WasteType, TreatmentMethod, Cat6CalculationMethod, BusinessTravelMode, EmployeeCommutingMode, PersonalCarType, PublicTransportType, Cat7CalculationMethod, Cat8CalculationMethod, BuildingType, LeasedAssetType, Cat4CalculationMethod, Cat10CalculationMethod, Cat11CalculationMethod, Cat12CalculationMethod, Cat14CalculationMethod, Cat15CalculationMethod } from '../types';
import { IconBuilding } from './IconComponents';
import {
    STATIONARY_FUELS, MOBILE_FUELS, PROCESS_MATERIALS, FUGITIVE_GASES, WASTE_SOURCES,
    SCOPE2_ENERGY_SOURCES, SCOPE2_FACTORS_BY_REGION,
    PURCHASED_GOODS_SERVICES_FACTORS, CAPITAL_GOODS_FACTORS, FUEL_ENERGY_ACTIVITIES_FACTORS, PURCHASED_ENERGY_UPSTREAM_FACTORS,
    TRANSPORTATION_FACTORS_BY_MODE, TRANSPORTATION_SPEND_FACTORS,
    WASTE_FACTORS_DETAILED,
    BUSINESS_TRAVEL_FACTORS_DETAILED,
    EMPLOYEE_COMMUTING_FACTORS_DETAILED,
    LEASED_ASSETS_FACTORS_DETAILED,
    PROCESSING_SOLD_PRODUCTS_FACTORS_DETAILED,
    USE_SOLD_PRODUCTS_FACTORS, END_OF_LIFE_TREATMENT_OF_SOLD_PRODUCTS, FRANCHISES_FACTORS, INVESTMENTS_FACTORS,
    FRANCHISES_FACTORS_DETAILED,
} from '../constants';
import { ResultsDisplay } from './ResultsDisplay';

import { FactorManager } from './FactorManager';
import { BoundarySetupWizard } from './BoundarySetupWizard';
import { ReportGenerator } from './ReportGenerator';
import { Scope1Calculator } from './Scope1Calculator';
import { Scope2Calculator } from './Scope2Calculator';
import { Scope3Calculator } from './Scope3Calculator';
import { createProject, saveProjectData } from '../app/actions/project';
import { createOrganization, requestScope3Access } from '../app/actions/organization';

const allCategories = Object.values(EmissionCategory);

const CORPORATE_FACILITY_ID = 'corporate-level-facility';

const initialSources: { [key in EmissionCategory]: EmissionSource[] } = allCategories.reduce((acc, cat) => {
    acc[cat] = [];
    return acc;
}, {} as { [key in EmissionCategory]: EmissionSource[] });

interface Scope3Settings {
    isEnabled: boolean;
    enabledCategories: EmissionCategory[];
}

type ActiveTab = 'scope1' | 'scope2' | 'scope3';

export type FactorCategoryKey = 'stationary' | 'mobile' | 'process' | 'fugitive' | 'waste' | 'scope2' | 'purchasedGoods' | 'capitalGoods' | 'fuelEnergy' | 'upstreamTransport' | 'downstreamTransport' | 'scope3Waste' | 'businessTravel' | 'employeeCommuting' | 'upstreamLeased' | 'downstreamLeased' | 'processingSold' | 'useSold' | 'endOfLife' | 'franchises' | 'investments';

// Fix: Add a data migration function to ensure all custom factors loaded from localStorage have a unique ID.
// This retroactively fixes old data that was saved without an ID, resolving the bug where they couldn't be deleted.
const ensureIdsForCustomFactors = <T extends { id?: string; isCustom?: boolean; name: string }>(factors: T[]): T[] => {
    if (!Array.isArray(factors)) {
        // Handle cases where localStorage might contain invalid data
        console.error("Invalid factor data detected. Expected an array.", factors);
        return [];
    }
    return factors.map(factor => {
        // Check if it's a custom factor that lacks an ID
        if (factor.isCustom && !factor.id) {
            // Generate a reasonably unique ID
            const newId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            return { ...factor, id: newId };
        }
        return factor;
    });
};

const factorConfig = {
    stationary: { key: 'ghg-calc-stationaryFuels', default: STATIONARY_FUELS },
    mobile: { key: 'ghg-calc-mobileFuels', default: MOBILE_FUELS },
    process: { key: 'ghg-calc-processMaterials', default: PROCESS_MATERIALS },
    fugitive: { key: 'ghg-calc-fugitiveGases', default: FUGITIVE_GASES },
    waste: { key: 'ghg-calc-wasteSources', default: WASTE_SOURCES },
    scope2: { key: 'ghg-calc-scope2EnergySources', default: SCOPE2_ENERGY_SOURCES },
    purchasedGoods: { key: 'ghg-calc-purchasedGoodsFactors', default: PURCHASED_GOODS_SERVICES_FACTORS },
    capitalGoods: { key: 'ghg-calc-capitalGoodsFactors', default: CAPITAL_GOODS_FACTORS },
    fuelEnergy: { key: 'ghg-calc-fuelEnergyActivitiesFactors', default: FUEL_ENERGY_ACTIVITIES_FACTORS },
    upstreamTransport: { key: 'ghg-calc-upstreamTransportationDistributionFactors', default: TRANSPORTATION_FACTORS_BY_MODE },
    downstreamTransport: { key: 'ghg-calc-downstreamTransportationDistributionFactors', default: TRANSPORTATION_FACTORS_BY_MODE },
    scope3Waste: { key: 'ghg-calc-scope3WasteFactors', default: WASTE_FACTORS_DETAILED },
    businessTravel: { key: 'ghg-calc-businessTravelFactors', default: BUSINESS_TRAVEL_FACTORS_DETAILED },
    employeeCommuting: { key: 'ghg-calc-employeeCommutingFactors', default: EMPLOYEE_COMMUTING_FACTORS_DETAILED },
    upstreamLeased: { key: 'ghg-calc-upstreamLeasedAssetsFactors', default: LEASED_ASSETS_FACTORS_DETAILED },
    downstreamLeased: { key: 'ghg-calc-downstreamLeasedAssetsFactors', default: LEASED_ASSETS_FACTORS_DETAILED },
    processingSold: { key: 'ghg-calc-processingSoldProductsFactors', default: PROCESSING_SOLD_PRODUCTS_FACTORS_DETAILED },
    useSold: { key: 'ghg-calc-useSoldProductsFactors', default: USE_SOLD_PRODUCTS_FACTORS },
    endOfLife: { key: 'ghg-calc-endOfLifeTreatmentFactors', default: END_OF_LIFE_TREATMENT_OF_SOLD_PRODUCTS },
    franchises: { key: 'ghg-calc-franchisesFactors', default: FRANCHISES_FACTORS_DETAILED },
    investments: { key: 'ghg-calc-investmentsFactors', default: INVESTMENTS_FACTORS },
};

const getInitialFactors = () => {
    const loadedFactors: { [key in FactorCategoryKey]?: any } = {};
    for (const [categoryKey, config] of Object.entries(factorConfig)) {
        loadedFactors[categoryKey as FactorCategoryKey] = structuredClone(config.default);
    }
    return loadedFactors as { [key in FactorCategoryKey]: any };
};

interface MainCalculatorProps {
    projectId?: string;
    initialProjectData?: any;
    organizationId?: string;
    hasScope3Access?: boolean;
    scope3Requested?: boolean;
    isAuthenticated?: boolean;
}

export const MainCalculator: React.FC<MainCalculatorProps> = ({
    projectId,
    initialProjectData,
    organizationId,
    hasScope3Access = false,
    scope3Requested = false,
    isAuthenticated = false
}) => {
    const { t } = useTranslation();

    const [isScope3Requested, setIsScope3Requested] = useState(scope3Requested);

    const handleRequestScope3Access = async () => {
        if (!organizationId) {
            alert("Organization ID is missing. Cannot request access.");
            return;
        }

        const result = await requestScope3Access(organizationId);
        if (result.success) {
            setIsScope3Requested(true);
            alert("Scope 3 access requested. Please wait for admin approval.");
        } else {
            alert("Failed to request access: " + result.error);
        }
    };

    // State for data
    const [sources, setSources] = useState<{ [key in EmissionCategory]: EmissionSource[] }>(initialSources);

    // Initialize from props or localStorage on mount
    useEffect(() => {
        if (initialProjectData && initialProjectData.emissionSources) {
            // Transform flat list of emission sources back to category-keyed object
            const sourcesByCategory: { [key in EmissionCategory]: EmissionSource[] } = { ...initialSources };

            initialProjectData.emissionSources.forEach((source: any) => {
                if (sourcesByCategory[source.category as EmissionCategory]) {
                    sourcesByCategory[source.category as EmissionCategory].push(source);
                }
            });
            setSources(sourcesByCategory);
        } else {
            try {
                const saved = localStorage.getItem('ghg-calc-sources');
                if (saved) {
                    const loadedSources = JSON.parse(saved);
                    // Sanitize loaded data
                    for (const category in loadedSources) {
                        if (Object.prototype.hasOwnProperty.call(loadedSources, category) && Array.isArray(loadedSources[category])) {
                            loadedSources[category] = loadedSources[category].map((source: any) => ({
                                ...source,
                                monthlyQuantities: Array.isArray(source.monthlyQuantities) ? source.monthlyQuantities : [],
                            }));
                        }
                    }
                    setSources({ ...initialSources, ...loadedSources });
                }
            } catch (error) {
                console.error("Failed to parse 'sources' from localStorage.", error);
            }
        }
    }, [initialProjectData]);

    const [companyName, setCompanyName] = useState<string>('My Company');

    useEffect(() => {
        try {
            const saved = localStorage.getItem('ghg-calc-companyName');
            if (saved) setCompanyName(saved);
        } catch (error) {
            // ignore
        }
    }, []);

    const [reportingYear, setReportingYear] = useState<string>(new Date().getFullYear().toString());

    useEffect(() => {
        try {
            const saved = localStorage.getItem('ghg-calc-reportingYear');
            if (saved) setReportingYear(saved);
        } catch (error) {
            // ignore
        }
    }, []);

    const [facilities, setFacilities] = useState<Facility[]>([
        { id: CORPORATE_FACILITY_ID, name: 'Corporate Level', equityShare: 100, isCorporate: true },
        { id: 'default', name: 'Default Facility', equityShare: 100 }
    ]);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('ghg-calc-facilities');
            if (saved) {
                let loadedFacilities: Facility[] = JSON.parse(saved);
                if (!Array.isArray(loadedFacilities)) loadedFacilities = [];

                if (!loadedFacilities.find(f => f.id === CORPORATE_FACILITY_ID)) {
                    loadedFacilities.unshift({
                        id: CORPORATE_FACILITY_ID,
                        name: 'Corporate Level',
                        equityShare: 100,
                        isCorporate: true
                    });
                }
                setFacilities(loadedFacilities);
            }
        } catch (error) {
            console.error("Failed to parse 'facilities' from localStorage.", error);
        }
    }, []);

    const [boundaryApproach, setBoundaryApproach] = useState<BoundaryApproach>('operational');

    useEffect(() => {
        try {
            const saved = localStorage.getItem('ghg-calc-boundaryApproach');
            if (saved) setBoundaryApproach(saved as BoundaryApproach);
        } catch (error) {
            // ignore
        }
    }, []);
    const [scope3Settings, setScope3Settings] = useState<Scope3Settings>({ isEnabled: true, enabledCategories: [EmissionCategory.BusinessTravel, EmissionCategory.EmployeeCommuting, EmissionCategory.WasteGeneratedInOperations] });

    useEffect(() => {
        try {
            const saved = localStorage.getItem('ghg-calc-scope3Settings');
            if (saved) setScope3Settings(JSON.parse(saved));
        } catch (error) {
            console.error("Failed to parse 'scope3Settings' from localStorage.", error);
        }
    }, []);

    // Centralized state for all emission factors, loaded without migration
    const [allFactors, setAllFactors] = useState(getInitialFactors);

    useEffect(() => {
        const loadedFactors: { [key in FactorCategoryKey]?: any } = {};
        let hasUpdates = false;

        for (const [categoryKey, config] of Object.entries(factorConfig)) {
            try {
                const saved = localStorage.getItem(config.key);
                if (saved) {
                    loadedFactors[categoryKey as FactorCategoryKey] = JSON.parse(saved);
                    hasUpdates = true;
                }
            } catch (error) {
                console.error(`Failed to load factors for ${config.key}`, error);
            }
        }

        if (hasUpdates) {
            setAllFactors(prev => ({ ...prev, ...loadedFactors }));
        }
    }, []);

    // UI State
    const [openCategory, setOpenCategory] = useState<EmissionCategory | null>(EmissionCategory.StationaryCombustion);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [wizardStartStep, setWizardStartStep] = useState(0);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [isSetupComplete, setIsSetupComplete] = useState<boolean>(false);

    useEffect(() => {
        // If we have initial project data from the server, setup is complete
        if (initialProjectData) {
            setIsSetupComplete(true);
            return;
        }
        
        try {
            const saved = localStorage.getItem('ghg-calc-isSetupComplete');
            if (saved) setIsSetupComplete(JSON.parse(saved));
        } catch (error) {
            // ignore
        }
    }, [initialProjectData]);
    const [activeTab, setActiveTab] = useState<ActiveTab>('scope1');
    const [isSaving, setIsSaving] = useState(false);

    // Auth Check Helper
    const checkAuth = useCallback((actionName?: string) => {
        if (!isAuthenticated) {
            if (confirm(t('signUpRequired'))) {
                window.location.href = '/signup';
            }
            return false;
        }
        return true;
    }, [isAuthenticated, t]);

    const handleSaveToCloud = async () => {
        if (!checkAuth()) return;

        setIsSaving(true);
        try {
            let targetProjectId = projectId;

            if (!targetProjectId) {
                // Legacy / Demo Mode: Create Organization and Project in localStorage/DB on the fly
                // 1. Get or Create Organization (Hardcoded for MVP)
                const orgName = "Demo Organization";
                let orgId = localStorage.getItem('ghg-saas-org-id');

                if (!orgId) {
                    const orgResult = await createOrganization(orgName);
                    if (orgResult.success && orgResult.data) {
                        orgId = orgResult.data.id;
                        localStorage.setItem('ghg-saas-org-id', orgId);
                    } else {
                        throw new Error(orgResult.error || "Failed to create organization");
                    }
                }

                // 2. Get or Create Project
                const projectName = `Report ${new Date().getFullYear()}`;
                let storedProjectId = localStorage.getItem('ghg-saas-project-id');

                if (!storedProjectId) {
                    const projectResult = await createProject(orgId!, projectName, new Date().getFullYear().toString());
                    if (projectResult.success && projectResult.data) {
                        storedProjectId = projectResult.data.id;
                        localStorage.setItem('ghg-saas-project-id', storedProjectId);
                    } else {
                        throw new Error(projectResult.error || "Failed to create project");
                    }
                }
                targetProjectId = storedProjectId;
            }

            // 3. Save Data
            // Flatten sources from all categories
            const allSources: EmissionSource[] = [];
            Object.values(sources).forEach(categorySources => {
                allSources.push(...categorySources);
            });

            if (!targetProjectId) {
                throw new Error("Failed to determine project ID for saving.");
            }

            const saveResult = await saveProjectData(targetProjectId, allSources, facilities);

            if (saveResult.success) {
                alert("Data saved to cloud successfully!");
            } else {
                alert("Failed to save data: " + saveResult.error);
            }

        } catch (error: any) {
            console.error("Save error:", error);
            alert(`An error occurred while saving: ${error.message || error}`);
        } finally {
            setIsSaving(false);
        }
    };

    // This effect runs once on mount to ensure legacy custom factors from localStorage have IDs.
    useEffect(() => {
        let needsMigration = false;
        for (const key of Object.keys(factorConfig)) {
            if (['upstreamTransport', 'downstreamTransport', 'businessTravel', 'scope3Waste', 'employeeCommuting', 'upstreamLeased', 'downstreamLeased', 'processingSold', 'franchises'].includes(key)) continue; // Skip nested objects
            const factors = allFactors[key as FactorCategoryKey];
            if (factors && Array.isArray(factors) && factors.some((f: any) => f.isCustom && !f.id)) {
                needsMigration = true;
                break;
            }
        }

        if (needsMigration) {
            setAllFactors(currentFactors => {
                const migratedFactors = { ...currentFactors };
                for (const key of Object.keys(factorConfig)) {
                    if (['upstreamTransport', 'downstreamTransport', 'businessTravel', 'scope3Waste', 'employeeCommuting', 'upstreamLeased', 'downstreamLeased', 'processingSold', 'franchises'].includes(key)) continue;
                    const categoryKey = key as FactorCategoryKey;
                    migratedFactors[categoryKey] = ensureIdsForCustomFactors(currentFactors[categoryKey] as any[]);
                }
                return migratedFactors;
            });
        }
    }, []); // Empty dependency array ensures this runs only once on mount.

    // Persist all data to localStorage when it changes
    useEffect(() => {
        if (isSetupComplete) {
            localStorage.setItem('ghg-calc-sources', JSON.stringify(sources));
            localStorage.setItem('ghg-calc-companyName', companyName);
            localStorage.setItem('ghg-calc-reportingYear', reportingYear);
            localStorage.setItem('ghg-calc-facilities', JSON.stringify(facilities));
            localStorage.setItem('ghg-calc-boundaryApproach', boundaryApproach);
            localStorage.setItem('ghg-calc-scope3Settings', JSON.stringify(scope3Settings));
            localStorage.setItem('ghg-calc-isSetupComplete', 'true');

            // Persist all factors from the centralized state
            for (const [categoryKey, config] of Object.entries(factorConfig)) {
                localStorage.setItem(config.key, JSON.stringify(allFactors[categoryKey as FactorCategoryKey]));
            }
        }
    }, [
        companyName, reportingYear, facilities, boundaryApproach, scope3Settings, isSetupComplete, sources,
        allFactors
    ]);

    // Auto-calculate Scope 3, Category 3 from Scope 2 data
    useEffect(() => {
        const scope2Sources = sources[EmissionCategory.PurchasedEnergy];
        if (!scope2Sources || !scope3Settings.isEnabled || !scope3Settings.enabledCategories.includes(EmissionCategory.FuelAndEnergyRelatedActivities)) {
            return;
        };

        let totalUpstreamEmissions = 0;
        let calculationDetails: string[] = [];

        const gridElectricityFactorItem = allFactors.scope2.find((f: any) => f.name === 'Grid Electricity') as CO2eFactorFuel | undefined;
        const locationBasedGridFactorKwh = gridElectricityFactorItem?.factors['kWh'] || 0;

        scope2Sources.forEach(source => {
            const totalActivity = source.monthlyQuantities.reduce((a, b) => a + b, 0);
            let upstreamFactor = 0;
            let detail = '';

            if (source.fuelType === 'Grid Electricity') {
                // Upstream emissions calculation for purchased electricity:
                // The 15% assumption represents upstream emissions including:
                // - WTT (Well-to-Tank) emissions from fuels used in power generation
                // - Production emissions from power generation
                // - Transmission and Distribution (T&D) losses
                // This is a simplified approach suitable for most cases. Actual upstream emissions vary by region and grid mix.
                // Future improvements may include region-specific T&D loss rates for more accurate calculations.
                upstreamFactor = locationBasedGridFactorKwh * 0.15;
                detail = `Grid Electricity: ${totalActivity.toLocaleString()} kWh × ${locationBasedGridFactorKwh.toFixed(4)} kg CO₂e/kWh × 15% (Upstream: WTT + Production + T&D) = ${(totalActivity * upstreamFactor).toFixed(2)} kg CO₂e`;
            } else {
                const factorItem = PURCHASED_ENERGY_UPSTREAM_FACTORS[source.fuelType];
                if (factorItem && factorItem.units.includes(source.unit)) {
                    upstreamFactor = factorItem.factor;
                    detail = `${source.fuelType}: ${totalActivity.toLocaleString()} ${source.unit} × ${upstreamFactor} kg CO₂e/${source.unit} = ${(totalActivity * upstreamFactor).toFixed(2)} kg CO₂e`;
                }
            }
            if (upstreamFactor > 0 && totalActivity > 0) {
                totalUpstreamEmissions += totalActivity * upstreamFactor;
                if (detail) calculationDetails.push(detail);
            }
        });

        const autoGeneratedSource: EmissionSource = {
            id: 'auto-generated-s3c3-energy',
            facilityId: CORPORATE_FACILITY_ID,
            category: EmissionCategory.FuelAndEnergyRelatedActivities,
            description: t('s3c3autoGeneratedDescription'),
            fuelType: t('s3c3autoGeneratedFuelType'),
            monthlyQuantities: [],
            unit: 'kg CO₂e',
            isAutoGenerated: true,
            activityType: 'energy_upstream',
            supplierProvidedCO2e: totalUpstreamEmissions,
            assumptions: calculationDetails.length > 0
                ? `<strong>Calculation Details:</strong><br>${calculationDetails.map(d => `• ${d}`).join('<br>')}<br><br>${t('cat3TandDCalculation')}`
                : t('cat3TandDCalculation'),
        };

        setSources(prev => {
            const existingCat3Sources = prev[EmissionCategory.FuelAndEnergyRelatedActivities] || [];
            const userSources = existingCat3Sources.filter(s => !s.isAutoGenerated);
            const newCat3Sources = totalUpstreamEmissions > 0 ? [...userSources, autoGeneratedSource] : userSources;
            return {
                ...prev,
                [EmissionCategory.FuelAndEnergyRelatedActivities]: newCat3Sources,
            };
        });
    }, [sources[EmissionCategory.PurchasedEnergy], allFactors.scope2, t, scope3Settings.isEnabled, scope3Settings.enabledCategories]);


    const FUELS_MAP: { [key in EmissionCategory]?: any } = useMemo(() => ({
        [EmissionCategory.StationaryCombustion]: allFactors.stationary,
        [EmissionCategory.MobileCombustion]: allFactors.mobile,
        [EmissionCategory.ProcessEmissions]: allFactors.process,
        [EmissionCategory.FugitiveEmissions]: allFactors.fugitive,
        [EmissionCategory.PurchasedEnergy]: allFactors.scope2,
        [EmissionCategory.Waste]: allFactors.waste,
        // Scope 3
        [EmissionCategory.PurchasedGoodsAndServices]: allFactors.purchasedGoods,
        [EmissionCategory.CapitalGoods]: allFactors.capitalGoods,
        [EmissionCategory.FuelAndEnergyRelatedActivities]: allFactors.fuelEnergy,
        [EmissionCategory.UpstreamTransportationAndDistribution]: {
            ...allFactors.upstreamTransport,
            ...LEASED_ASSETS_FACTORS_DETAILED // For warehousing part
        },
        [EmissionCategory.DownstreamTransportationAndDistribution]: {
            ...allFactors.downstreamTransport,
            ...LEASED_ASSETS_FACTORS_DETAILED // For warehousing part
        },
        [EmissionCategory.WasteGeneratedInOperations]: allFactors.scope3Waste,
        [EmissionCategory.BusinessTravel]: allFactors.businessTravel,
        [EmissionCategory.EmployeeCommuting]: allFactors.employeeCommuting,
        [EmissionCategory.UpstreamLeasedAssets]: allFactors.upstreamLeased,
        [EmissionCategory.DownstreamLeasedAssets]: allFactors.downstreamLeased,
        [EmissionCategory.ProcessingOfSoldProducts]: allFactors.processingSold,
        [EmissionCategory.UseOfSoldProducts]: allFactors.useSold,
        [EmissionCategory.EndOfLifeTreatmentOfSoldProducts]: allFactors.scope3Waste, // Reuse detailed waste factors
        [EmissionCategory.Franchises]: allFactors.franchises,
        [EmissionCategory.Investments]: allFactors.investments,
    }), [allFactors]);

    const categoryDescriptions: Record<EmissionCategory, string> = useMemo(() => ({
        [EmissionCategory.StationaryCombustion]: t('stationaryDescription'),
        [EmissionCategory.MobileCombustion]: t('mobileDescription'),
        [EmissionCategory.ProcessEmissions]: t('processDescription'),
        [EmissionCategory.FugitiveEmissions]: t('fugitiveDescription'),
        [EmissionCategory.PurchasedEnergy]: t('energyDescription'),
        [EmissionCategory.Waste]: t('wasteDescription'),
        [EmissionCategory.PurchasedGoodsAndServices]: t('purchasedGoodsAndServicesDescription'),
        [EmissionCategory.CapitalGoods]: t('capitalGoodsDescription'),
        [EmissionCategory.FuelAndEnergyRelatedActivities]: t('fuelAndEnergyRelatedActivitiesDescription'),
        [EmissionCategory.UpstreamTransportationAndDistribution]: t('upstreamTransportationAndDistributionDescription'),
        [EmissionCategory.WasteGeneratedInOperations]: t('wasteGeneratedInOperationsDescription'),
        [EmissionCategory.BusinessTravel]: t('businessTravelDescription'),
        [EmissionCategory.EmployeeCommuting]: t('employeeCommutingDescription'),
        [EmissionCategory.UpstreamLeasedAssets]: t('upstreamLeasedAssetsDescription'),
        [EmissionCategory.DownstreamTransportationAndDistribution]: t('downstreamTransportationAndDistributionDescription'),
        [EmissionCategory.ProcessingOfSoldProducts]: t('processingOfSoldProductsDescription'),
        [EmissionCategory.UseOfSoldProducts]: t('useOfSoldProductsDescription'),
        [EmissionCategory.EndOfLifeTreatmentOfSoldProducts]: t('endOfLifeTreatmentOfSoldProductsDescription'),
        [EmissionCategory.DownstreamLeasedAssets]: t('downstreamLeasedAssetsDescription'),
        [EmissionCategory.Franchises]: t('franchisesDescription'),
        [EmissionCategory.Investments]: t('investmentsDescription'),
    }), [t]);

    const getScopeForCategory = useCallback((category: EmissionCategory): 'scope1' | 'scope2' | 'scope3' => {
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
    }, []);

    const handleToggleCategory = useCallback((category: EmissionCategory) => {
        setOpenCategory(openCategory === category ? null : category);
    }, [openCategory]);

    const handleAddSource = useCallback((category: EmissionCategory) => {
        if (!checkAuth()) return;
        const fuelsForCategory = FUELS_MAP[category];
        const scope = getScopeForCategory(category);

        let defaultFacilityId = facilities.find(f => !f.isCorporate)?.id || facilities[0]?.id || 'default';
        if (scope === 'scope3') {
            defaultFacilityId = CORPORATE_FACILITY_ID;
        }

        if (category === EmissionCategory.PurchasedGoodsAndServices || category === EmissionCategory.CapitalGoods) {
            const newSource: EmissionSource = {
                id: `source-${Date.now()}`,
                facilityId: defaultFacilityId,
                category,
                description: '',
                fuelType: '',
                monthlyQuantities: Array(12).fill(0),
                unit: 'KRW',
                calculationMethod: 'spend',
                factor: 0,
                factorUnit: 'kg CO₂e / KRW',
                factorSource: '',
                activityDataSource: '',
            };
            setSources(prev => ({ ...prev, [category]: [...prev[category], newSource] }));
            return;
        }

        if (category === EmissionCategory.FuelAndEnergyRelatedActivities) {
            const defaultFuel = (fuelsForCategory as CO2eFactorFuel[])?.[0];
            const newSource: EmissionSource = {
                id: `source-${Date.now()}`,
                facilityId: CORPORATE_FACILITY_ID,
                category,
                description: '',
                fuelType: defaultFuel?.name || '',
                monthlyQuantities: Array(12).fill(0),
                unit: defaultFuel?.units[0] || '',
                activityType: 'fuel_wtt',
                activityDataSource: '',
            };
            setSources(prev => ({ ...prev, [category]: [...prev[category], newSource] }));
            return;
        }

        if (category === EmissionCategory.UpstreamTransportationAndDistribution || category === EmissionCategory.DownstreamTransportationAndDistribution) {
            const defaultMode: TransportMode = 'Road';
            const defaultVehicle = Object.keys(TRANSPORTATION_FACTORS_BY_MODE[defaultMode])[0];
            const newSource: EmissionSource = {
                id: `source-${Date.now()}`,
                facilityId: CORPORATE_FACILITY_ID,
                category,
                description: '',
                fuelType: '', // Not used for activity method
                monthlyQuantities: [], // Not used for activity method
                unit: 'tonne-km',
                calculationMethod: 'activity',
                transportMode: defaultMode,
                vehicleType: defaultVehicle,
                distanceKm: 0,
                weightTonnes: 0,
                refrigerated: false,
                loadFactor: 100,
                emptyBackhaul: false,
                activityDataSource: '',
                downstreamActivityType: category === EmissionCategory.DownstreamTransportationAndDistribution ? 'transportation' : undefined, // Default to transport
            };
            setSources(prev => ({ ...prev, [category]: [...prev[category], newSource] }));
            return;
        }

        if (category === EmissionCategory.WasteGeneratedInOperations) {
            const newSource: EmissionSource = {
                id: `source-${Date.now()}`,
                facilityId: CORPORATE_FACILITY_ID,
                category,
                description: '',
                fuelType: '', // Not used in activity-based
                monthlyQuantities: Array(12).fill(0),
                unit: 'tonnes',
                calculationMethod: 'activity',
                wasteType: 'MSW',
                treatmentMethod: 'Landfill',
                includeTransport: false,
            };
            setSources(prev => ({ ...prev, [category]: [...prev[category], newSource] }));
            return;
        }

        if (category === EmissionCategory.BusinessTravel) {
            const newSource: EmissionSource = {
                id: `source-${Date.now()}`,
                facilityId: CORPORATE_FACILITY_ID,
                category,
                description: '',
                fuelType: '',
                monthlyQuantities: [],
                unit: 'passenger-km',
                calculationMethod: 'activity',
                businessTravelMode: 'Air',
                flightClass: 'Economy',
                tripType: 'round-trip',
                distanceKm: 0,
                passengers: 1,
                activityDataSource: '',
            };
            setSources(prev => ({ ...prev, [category]: [...prev[category], newSource] }));
            return;
        }

        if (category === EmissionCategory.EmployeeCommuting) {
            const newSource: EmissionSource = {
                id: `source-${Date.now()}`,
                facilityId: CORPORATE_FACILITY_ID,
                category,
                description: '',
                fuelType: '', // Not used directly, determined by sub-types
                monthlyQuantities: [],
                unit: 'km',
                calculationMethod: 'activity',
                commutingMode: 'PersonalCar',
                personalCarType: 'Gasoline',
                distanceKm: 0,
                daysPerYear: 240,
                carpoolOccupancy: 1,
            };
            setSources(prev => ({ ...prev, [category]: [...prev[category], newSource] }));
            return;
        }

        if (category === EmissionCategory.UpstreamLeasedAssets || category === EmissionCategory.DownstreamLeasedAssets) {
            const newSource: EmissionSource = {
                id: `source-${Date.now()}`,
                facilityId: CORPORATE_FACILITY_ID,
                category,
                description: '',
                fuelType: '',
                monthlyQuantities: [],
                unit: '',
                calculationMethod: 'asset_specific',
                leasedAssetType: 'Building',
                buildingType: 'Office',
                areaSqm: 0,
                leaseDurationMonths: 12,
                energyInputs: [],
            };
            setSources(prev => ({ ...prev, [category]: [...prev[category], newSource] }));
            return;
        }

        if (category === EmissionCategory.ProcessingOfSoldProducts) {
            const defaultProcess = allFactors.processingSold.activity[0];
            const newSource: EmissionSource = {
                id: `source-${Date.now()}`,
                facilityId: CORPORATE_FACILITY_ID,
                category,
                description: '',
                fuelType: '', // This will be used for spend-based name
                monthlyQuantities: Array(12).fill(0),
                unit: defaultProcess.units[0],
                calculationMethod: 'process_specific',
                processingMethod: defaultProcess.name,
                supplierDataType: 'total_co2e',
                energyInputs: [],
            };
            setSources(prev => ({ ...prev, [category]: [...prev[category], newSource] }));
            return;
        }

        if (category === EmissionCategory.UseOfSoldProducts) {
            const newSource: EmissionSource = {
                id: `source-${Date.now()}`,
                facilityId: CORPORATE_FACILITY_ID,
                category,
                description: '',
                fuelType: 'Grid Electricity',
                monthlyQuantities: Array(12).fill(0),
                unit: 'kWh',
                calculationMethod: 'energy_consumption',
                productLifetime: 5,
                annualEnergyConsumption: 0,
                energyRegion: 'South Korea'
            };
            setSources(prev => ({ ...prev, [category]: [...prev[category], newSource] }));
            return;
        }

        if (category === EmissionCategory.EndOfLifeTreatmentOfSoldProducts) {
            const newSource: EmissionSource = {
                id: `source-${Date.now()}`,
                facilityId: CORPORATE_FACILITY_ID,
                category,
                description: '',
                fuelType: '',
                monthlyQuantities: Array(12).fill(0),
                unit: 'tonnes',
                calculationMethod: 'waste_stream',
                wasteType: 'Plastics',
                disposalRatios: { landfill: 50, incineration: 20, recycling: 30 },
                soldProductWeight: 0
            };
            setSources(prev => ({ ...prev, [category]: [...prev[category], newSource] }));
            return;
        }

        if (category === EmissionCategory.Franchises) {
            const newSource: EmissionSource = {
                id: `source-${Date.now()}`,
                facilityId: CORPORATE_FACILITY_ID,
                category,
                description: '',
                fuelType: '',
                monthlyQuantities: Array(12).fill(0),
                unit: 'kg CO₂e',
                calculationMethod: 'franchise_specific',
                energyInputs: [],
                franchiseType: 'Restaurant'
            };
            setSources(prev => ({ ...prev, [category]: [...prev[category], newSource] }));
            return;
        }

        if (category === EmissionCategory.Investments) {
            const newSource: EmissionSource = {
                id: `source-${Date.now()}`,
                facilityId: CORPORATE_FACILITY_ID,
                category,
                description: '',
                fuelType: '',
                monthlyQuantities: Array(12).fill(0),
                unit: 'kg CO₂e',
                calculationMethod: 'investment_specific',
                investmentType: 'Equity',
            };
            setSources(prev => ({ ...prev, [category]: [...prev[category], newSource] }));
            return;
        }

        if (!fuelsForCategory || fuelsForCategory.length === 0) return;

        const defaultFuel = fuelsForCategory[0];
        const defaultUnit = 'units' in defaultFuel ? defaultFuel.units[0] : 'kg';

        const newSource: EmissionSource = {
            id: `source-${Date.now()}`,
            facilityId: defaultFacilityId,
            category,
            description: '',
            fuelType: defaultFuel.name,
            monthlyQuantities: Array(12).fill(0),
            unit: defaultUnit,
            activityDataSource: '',
        };
        setSources(prev => ({ ...prev, [category]: [...prev[category], newSource] }));
    }, [facilities, FUELS_MAP, getScopeForCategory, allFactors]);

    const handleUpdateSource = useCallback((id: string, category: EmissionCategory, update: Partial<EmissionSource>) => {
        // Restrict edits if monthlyQuantities are being updated (which implies data entry)
        if (update.monthlyQuantities && !checkAuth()) return;

        setSources(prev => ({
            ...prev,
            [category]: prev[category].map(s => s.id === id ? { ...s, ...update } : s),
        }));
    }, []);

    const handleRemoveSource = useCallback((id: string, category: EmissionCategory) => {
        setSources(prev => ({
            ...prev,
            [category]: prev[category].filter(s => s.id !== id),
        }));
    }, []);

    const handleFuelTypeChange = useCallback((id: string, newFuelType: string, category: EmissionCategory) => {
        // This function handles selection changes in dropdowns, resetting the unit accordingly.
        const fuelsForCategory = FUELS_MAP[category];

        // Find the new fuel/service item from the constants
        let newFuel: any;
        if (category === EmissionCategory.BusinessTravel || category === EmissionCategory.EmployeeCommuting || category === EmissionCategory.UpstreamLeasedAssets || category === EmissionCategory.DownstreamLeasedAssets || category === EmissionCategory.Franchises) {
            newFuel = (fuelsForCategory as any)?.spend_based?.find((f: any) => f.name === newFuelType);
        } else if (category === EmissionCategory.UpstreamTransportationAndDistribution || category === EmissionCategory.DownstreamTransportationAndDistribution) {
            newFuel = [...MOBILE_FUELS, ...TRANSPORTATION_SPEND_FACTORS].find(f => f.name === newFuelType);
        } else if (category === EmissionCategory.ProcessingOfSoldProducts) {
            newFuel = fuelsForCategory.spend.find((f: any) => f.name === newFuelType);
        } else if (category === EmissionCategory.EndOfLifeTreatmentOfSoldProducts) {
            // No single fuel list for activity/spend mixed, handle manually if needed or rely on standard logic
            if ((fuelsForCategory as any)?.spend) newFuel = (fuelsForCategory as any).spend.find((f: any) => f.name === newFuelType);
        } else if (Array.isArray(fuelsForCategory)) {
            newFuel = fuelsForCategory.find((f: any) => f.name === newFuelType);
        }

        if (!newFuel) return;

        // Determine the default unit for the newly selected item
        const newUnit = 'units' in newFuel ? newFuel.units[0] : 'kg';

        handleUpdateSource(id, category, { fuelType: newFuelType, unit: newUnit });
    }, [FUELS_MAP, handleUpdateSource]);


    const calculateSourceEmissions = useCallback((source: EmissionSource): { scope1: number, scope2Location: number, scope2Market: number, scope3: number } => {
        if (source.isAutoGenerated && source.category === EmissionCategory.FuelAndEnergyRelatedActivities) {
            return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: source.supplierProvidedCO2e || 0 };
        }

        if (source.category === EmissionCategory.PurchasedGoodsAndServices || source.category === EmissionCategory.CapitalGoods) {
            if (source.calculationMethod === 'supplier_co2e') {
                return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: source.supplierProvidedCO2e || 0 };
            }
            const totalActivity = source.monthlyQuantities.reduce((sum, q) => sum + q, 0);
            const emissions = totalActivity * (source.factor || 0);
            return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: emissions };
        }

        if (
            source.category === EmissionCategory.UpstreamLeasedAssets ||
            source.category === EmissionCategory.DownstreamLeasedAssets ||
            ((source.category === EmissionCategory.DownstreamTransportationAndDistribution || source.category === EmissionCategory.UpstreamTransportationAndDistribution) && source.downstreamActivityType === 'warehousing')
        ) {
            let scope3 = 0;
            // Treat warehousing essentially like a leased asset or area-based calculation
            const calcMethod = (source.calculationMethod as any) || 'asset_specific'; // Use 'any' casting to handle Cat 4/9 mapped to Cat 8 logic

            // If it's Cat 4/9 Warehousing, we might be using 'spend' or 'supplier_specific' from Cat 4 types, OR borrowing area-based logic.
            // Simplification: For warehousing in Cat 4/9, we support: 'supplier_specific', 'spend' (mapped to spend_based logic), or 'area_based' (mapped to area_based logic if implemented in UI).

            if (source.downstreamActivityType === 'warehousing' && source.category !== EmissionCategory.UpstreamLeasedAssets && source.category !== EmissionCategory.DownstreamLeasedAssets) {
                if (calcMethod === 'supplier_specific') {
                    scope3 = source.supplierProvidedCO2e || 0;
                } else if (calcMethod === 'spend') {
                    const totalSpend = source.monthlyQuantities.reduce((s, q) => s + q, 0);
                    const spendFactorData = allFactors.upstreamLeased.spend_based.find((f: any) => f.name.includes('Building') || f.name === source.fuelType); // Fallback to building spend
                    const spendFactor = spendFactorData?.factors[source.unit] || 0;
                    scope3 = totalSpend * spendFactor;
                } else {
                    // Default fallback for warehousing without specific logic yet
                    scope3 = 0;
                }
                return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3 };
            }


            switch (calcMethod) {
                case 'supplier_specific':
                    scope3 = source.supplierProvidedCO2e || 0; // Assumed annual
                    break;
                case 'spend_based':
                    const totalSpend = source.monthlyQuantities.reduce((s, q) => s + q, 0);
                    const spendFactorData = allFactors.upstreamLeased.spend_based.find((f: any) => f.name === source.fuelType);
                    const spendFactor = spendFactorData?.factors[source.unit] || 0;
                    scope3 = totalSpend * spendFactor;
                    break;
                case 'area_based':
                    const buildingType = source.buildingType || 'Office';
                    const energyIntensityFactor = allFactors.upstreamLeased.area_based[buildingType]?.factor || 0; // kWh/m2/year
                    const area = source.areaSqm || 0;
                    const totalKwh = area * energyIntensityFactor; // Already annual
                    const gridFactor = (allFactors.scope2.find((f: any) => f.name === 'Grid Electricity') as CO2eFactorFuel)?.factors['kWh'] || 0;
                    scope3 = totalKwh * gridFactor;
                    break;
                case 'asset_specific':
                    let totalEmissions = 0;
                    const allEnergyAndFuelFactors = [...allFactors.stationary, ...allFactors.mobile, ...allFactors.scope2];
                    for (const input of source.energyInputs || []) {
                        const factorData = allEnergyAndFuelFactors.find((f: any) => f.name === input.type) as CO2eFactorFuel | undefined;
                        if (factorData) {
                            const factor = factorData.factors[input.unit] || 0;
                            totalEmissions += (input.value || 0) * factor; // Input value is annual
                        }
                    }
                    scope3 = totalEmissions;
                    break;
            }

            // Adjust for lease duration for annual calculation methods
            if (calcMethod !== 'spend_based' && calcMethod !== 'supplier_specific') {
                const leaseDurationFactor = (source.leaseDurationMonths || 12) / 12;
                scope3 *= leaseDurationFactor;
            }

            return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3 };
        }


        if (source.category === EmissionCategory.UpstreamTransportationAndDistribution || (source.category === EmissionCategory.DownstreamTransportationAndDistribution && source.downstreamActivityType !== 'warehousing')) {
            switch (source.calculationMethod as Cat4CalculationMethod) {
                case 'activity':
                    const mode = source.transportMode;
                    const vehicle = source.vehicleType;
                    const factors = source.category === EmissionCategory.UpstreamTransportationAndDistribution ? allFactors.upstreamTransport : allFactors.downstreamTransport;
                    if (!mode || !vehicle || !factors[mode] || !factors[mode][vehicle]) {
                        return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: 0 };
                    }
                    const factor = factors[mode][vehicle].factor;
                    const tonneKm = (source.distanceKm || 0) * (source.weightTonnes || 0);

                    let adjustmentMultiplier = 1.0;
                    if (source.refrigerated) adjustmentMultiplier *= 1.2;
                    if (source.emptyBackhaul) adjustmentMultiplier *= 2.0; // Simplified adjustment
                    if (source.loadFactor && source.loadFactor > 0 && source.loadFactor < 100) {
                        adjustmentMultiplier *= (100 / source.loadFactor);
                    }

                    return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: tonneKm * factor * adjustmentMultiplier };

                case 'fuel':
                    const totalFuel = source.monthlyQuantities.reduce((sum, q) => sum + q, 0);
                    const fuelData = allFactors.mobile.find((f: any) => f.name === source.fuelType) as CO2eFactorFuel | undefined;
                    if (!fuelData) return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: 0 };
                    const fuelFactor = fuelData.factors[source.unit] || 0;
                    return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: totalFuel * fuelFactor };

                case 'spend':
                    const totalSpend = source.monthlyQuantities.reduce((sum, q) => sum + q, 0);
                    const spendData = TRANSPORTATION_SPEND_FACTORS.find((f: any) => f.name === source.fuelType);
                    if (!spendData) return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: 0 };
                    const spendFactor = spendData.factors[source.unit] || 0;
                    return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: totalSpend * spendFactor };

                case 'supplier_specific':
                    return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: source.supplierProvidedCO2e || 0 };
            }
        }


        if (source.category === EmissionCategory.WasteGeneratedInOperations) {
            let scope3 = 0;
            const calcMethod = source.calculationMethod as Cat5CalculationMethod || 'activity';
            switch (calcMethod) {
                case 'supplier_specific':
                    scope3 = source.supplierProvidedCO2e || 0;
                    break;
                case 'spend':
                    const totalSpend = source.monthlyQuantities.reduce((s, q) => s + q, 0);
                    const spendFactorData = allFactors.scope3Waste.spend.find((f: any) => f.name === source.fuelType);
                    const spendFactor = spendFactorData?.factors[source.unit] || 0;
                    scope3 = totalSpend * spendFactor;
                    break;
                case 'activity':
                default:
                    const totalWeightTonnes = source.monthlyQuantities.reduce((s, q) => s + q, 0) * (source.unit === 'kg' ? 0.001 : 1);

                    // Treatment emissions
                    const wasteType = source.wasteType;
                    const treatmentMethod = source.treatmentMethod;
                    if (wasteType && treatmentMethod && allFactors.scope3Waste.activity[wasteType] && allFactors.scope3Waste.activity[wasteType]?.[treatmentMethod]) {
                        const treatmentFactor = allFactors.scope3Waste.activity[wasteType][treatmentMethod]!.factor;
                        scope3 += totalWeightTonnes * treatmentFactor;
                    }

                    // Transport emissions
                    if (source.includeTransport && source.transportMode && source.vehicleType && source.distanceKm) {
                        const transportFactorData = allFactors.upstreamTransport[source.transportMode]?.[source.vehicleType];
                        if (transportFactorData) {
                            const transportFactor = transportFactorData.factor;
                            const tonneKm = totalWeightTonnes * source.distanceKm;
                            scope3 += tonneKm * transportFactor;
                        }
                    }
                    break;
            }
            return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3 };
        }

        if (source.category === EmissionCategory.BusinessTravel) {
            let scope3 = 0;
            const calcMethod = source.calculationMethod as Cat6CalculationMethod || 'activity';

            switch (calcMethod) {
                case 'supplier_specific':
                    scope3 = source.supplierProvidedCO2e || 0;
                    break;
                case 'spend':
                    const totalSpend = source.monthlyQuantities.reduce((s, q) => s + q, 0);
                    const spendFactorData = allFactors.businessTravel.spend.find((f: any) => f.name === source.fuelType);
                    const spendFactor = spendFactorData?.factors[source.unit] || 0;
                    scope3 = totalSpend * spendFactor;
                    break;
                case 'activity':
                default:
                    const mode = source.businessTravelMode || 'Air';
                    const distance = (source.distanceKm || 0) * (source.tripType === 'round-trip' ? 2 : 1);
                    const passengers = source.passengers || 1;

                    if (mode === 'Air') {
                        const flightTypeKey = distance < 463 ? 'Short-haul (<463 km)' : distance <= 1108 ? 'Medium-haul (463-1108 km)' : 'Long-haul (>1108 km)';
                        const flightClass = source.flightClass || 'Economy';
                        const factorData = allFactors.businessTravel.activity.Air[flightTypeKey]?.[flightClass];
                        if (factorData) {
                            scope3 = distance * passengers * factorData.factor;
                        }
                    } else if (mode === 'Hotel') {
                        const nights = source.nights || 0;
                        const hotelType = source.fuelType || 'National'; // fuelType stores hotel type
                        const factorData = allFactors.businessTravel.activity.Hotel[hotelType];
                        if (factorData) {
                            scope3 = nights * passengers * factorData.factor; // Assuming per person per night
                        }
                    } else { // Rail, Bus, Cars
                        const vehicleType = source.fuelType;
                        let factorData;
                        if (mode === 'Rail' || mode === 'Bus' || mode === 'RentalCar' || mode === 'PersonalCar') {
                            factorData = allFactors.businessTravel.activity[mode][vehicleType];
                        }
                        if (factorData) {
                            const activity = factorData.unit === 'passenger-km' ? distance * passengers : distance;
                            scope3 = activity * factorData.factor;
                        }
                    }
                    break;
            }
            return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3 };
        }

        if (source.category === EmissionCategory.EmployeeCommuting) {
            let scope3 = 0;
            const calcMethod = (source.calculationMethod as Cat7CalculationMethod) || 'activity';
            const activityFactors = allFactors.employeeCommuting.activity;
            const spendFactors = allFactors.employeeCommuting.spend;

            switch (calcMethod) {
                case 'spend':
                    const totalSpend = source.monthlyQuantities.reduce((s, q) => s + q, 0);
                    const spendFactorData = spendFactors.find((f: any) => f.name === source.fuelType);
                    const spendFactor = spendFactorData?.factors[source.unit] || 0;
                    scope3 = totalSpend * spendFactor;
                    break;
                case 'average':
                    const effectiveEmployees = (source.totalEmployees || 0) * (1 - (source.percentTeleworking || 0) / 100);
                    const avgDistance = source.distanceKm || 0;
                    const avgDays = source.daysPerYear || 0;
                    let totalEmissions = 0;

                    for (const [modeKey, percentage] of Object.entries(source.modeDistribution || {})) {
                        if (percentage > 0) {
                            const [mode, type] = modeKey.split('_');
                            const factorData = activityFactors[mode]?.[type];
                            if (factorData) {
                                const employeesInMode = effectiveEmployees * (percentage / 100);
                                const totalKm = employeesInMode * avgDistance * 2 * avgDays;
                                totalEmissions += totalKm * factorData.factor;
                            }
                        }
                    }
                    scope3 = totalEmissions;
                    break;
                case 'activity':
                default:
                    const commutingMode = source.commutingMode;
                    let factor = 0;
                    if (commutingMode === 'PersonalCar' || commutingMode === 'Carpool') {
                        factor = activityFactors.PersonalCar[source.personalCarType as PersonalCarType]?.factor || 0;
                    } else if (commutingMode === 'PublicTransport') {
                        factor = activityFactors.PublicTransport[source.publicTransportType as PublicTransportType]?.factor || 0;
                    } else if (commutingMode === 'Motorbike') {
                        factor = activityFactors.Motorbike['Average Motorbike']?.factor || 0;
                    } else if (commutingMode === 'BicycleWalking') {
                        factor = 0;
                    }
                    const totalAnnualKm = (source.distanceKm || 0) * 2 * (source.daysPerYear || 0);
                    const occupancy = (commutingMode === 'Carpool' && (source.carpoolOccupancy || 1) > 1) ? (source.carpoolOccupancy || 1) : 1;
                    scope3 = (totalAnnualKm * factor) / occupancy;
                    break;
            }
            return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3 };
        }

        if (source.category === EmissionCategory.ProcessingOfSoldProducts) {
            let scope3 = 0;
            const calcMethod = (source.calculationMethod as Cat10CalculationMethod) || 'process_specific';

            switch (calcMethod) {
                case 'customer_specific':
                    if (source.supplierDataType === 'total_co2e') {
                        scope3 = source.supplierProvidedCO2e || 0;
                    } else { // energy_data
                        let totalEmissions = 0;
                        for (const input of source.energyInputs || []) {
                            const allEnergyAndFuelFactors = [...allFactors.stationary, ...allFactors.mobile, ...allFactors.scope2];
                            const factorData = allEnergyAndFuelFactors.find((f: any) => f.name === input.type) as CO2eFactorFuel | undefined;
                            if (factorData) {
                                const factor = factorData.factors[input.unit] || 0;
                                totalEmissions += input.value * factor;
                            }
                        }
                        scope3 = totalEmissions;
                    }
                    break;
                case 'spend':
                    const totalSpend = source.monthlyQuantities.reduce((s, q) => s + q, 0);
                    const spendFactorData = allFactors.processingSold.spend.find((f: any) => f.name === source.fuelType);
                    const spendFactor = spendFactorData?.factors[source.unit] || 0;
                    scope3 = totalSpend * spendFactor;
                    break;
                case 'process_specific':
                default:
                    const totalActivity = source.monthlyQuantities.reduce((s, q) => s + q, 0);
                    const processFactorData = allFactors.processingSold.activity.find((f: any) => f.name === source.processingMethod);
                    const processFactor = processFactorData ? processFactorData.factors[source.unit] : 0;
                    scope3 = totalActivity * processFactor;
                    break;
            }
            return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3 };
        }

        if (source.category === EmissionCategory.UseOfSoldProducts) {
            let scope3 = 0;
            const calcMethod = (source.calculationMethod as Cat11CalculationMethod) || 'energy_consumption';
            const unitsSold = source.monthlyQuantities.reduce((a, b) => a + b, 0);
            const lifetime = source.productLifetime || 1;

            switch (calcMethod) {
                case 'ghg_data':
                    scope3 = unitsSold * (source.factor || 0);
                    break;
                case 'fuel_consumption':
                    const annualFuel = source.annualEnergyConsumption || 0;
                    // Find fuel factor
                    const allDirectFuels = [...allFactors.mobile, ...allFactors.stationary];
                    const fuelData = allDirectFuels.find((f: any) => f.name === source.fuelType) as CO2eFactorFuel;
                    if (fuelData) {
                        const factor = fuelData.factors[source.unit] || 0;
                        scope3 = unitsSold * lifetime * annualFuel * factor;
                    }
                    break;
                case 'energy_consumption':
                default:
                    const annualKwh = source.annualEnergyConsumption || 0;
                    // Find grid factor
                    let gridFactor = 0;
                    if (source.energyRegion === 'Custom') {
                        // Fallback or specific handling if custom factor needs to be retrieved differently, using 'South Korea' default for now if custom is weird
                        gridFactor = SCOPE2_FACTORS_BY_REGION['South Korea'].factors['kWh'];
                    } else {
                        gridFactor = SCOPE2_FACTORS_BY_REGION[source.energyRegion || 'South Korea'].factors['kWh'];
                    }

                    scope3 = unitsSold * lifetime * annualKwh * gridFactor;
                    break;
            }
            return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3 };
        }

        if (source.category === EmissionCategory.EndOfLifeTreatmentOfSoldProducts) {
            let scope3 = 0;
            const calcMethod = (source.calculationMethod as Cat12CalculationMethod) || 'waste_stream';

            // Get total weight (tonnes)
            let totalWeight = 0;
            if (calcMethod === 'units_sold') {
                const units = source.monthlyQuantities.reduce((a, b) => a + b, 0);
                const weightPerUnit = (source.soldProductWeight || 0) * 0.001; // convert kg to tonnes
                totalWeight = units * weightPerUnit;
            } else {
                totalWeight = source.monthlyQuantities.reduce((a, b) => a + b, 0) * (source.unit === 'kg' ? 0.001 : 1);
            }

            switch (calcMethod) {
                case 'spend':
                    const totalSpend = source.monthlyQuantities.reduce((a, b) => a + b, 0);
                    // Assuming 'spend' logic uses spend factors from waste constant (reusing Cat 5)
                    // Note: In UI, 'fuelType' holds service name, 'unit' holds currency
                    const spendFactorData = allFactors.scope3Waste.spend.find((f: any) => f.name === source.fuelType); // Reusing Cat 5 spend factors for now
                    const spendFactor = spendFactorData?.factors[source.unit] || 0;
                    scope3 = totalSpend * spendFactor;
                    break;
                case 'waste_stream':
                case 'units_sold':
                default:
                    const ratios = source.disposalRatios || { landfill: 0, incineration: 0, recycling: 0 };
                    const wasteType = source.wasteType || 'MSW';
                    const wasteFactors = allFactors.scope3Waste.activity[wasteType] || {}; // Reusing Cat 5 factors

                    const landfillFactor = wasteFactors['Landfill']?.factor || 0;
                    const incinerationFactor = wasteFactors['Incineration']?.factor || 0;
                    const recyclingFactor = wasteFactors['Recycling']?.factor || 0;

                    const e_landfill = totalWeight * (ratios.landfill / 100) * landfillFactor;
                    const e_incineration = totalWeight * (ratios.incineration / 100) * incinerationFactor;
                    const e_recycling = totalWeight * (ratios.recycling / 100) * recyclingFactor;

                    scope3 = e_landfill + e_incineration + e_recycling;
                    break;
            }
            return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3 };
        }

        if (source.category === EmissionCategory.Franchises) {
            let scope3 = 0;
            const calcMethod = (source.calculationMethod as Cat14CalculationMethod) || 'franchise_specific';

            switch (calcMethod) {
                case 'franchise_specific':
                    let totalEmissions = 0;
                    const allEnergyAndFuelFactors = [...allFactors.stationary, ...allFactors.mobile, ...allFactors.scope2];
                    for (const input of source.energyInputs || []) {
                        const factorData = allEnergyAndFuelFactors.find((f: any) => f.name === input.type) as CO2eFactorFuel | undefined;
                        if (factorData) {
                            const factor = factorData.factors[input.unit] || 0;
                            totalEmissions += (input.value || 0) * factor; // Input value is annual
                        }
                    }
                    scope3 = totalEmissions;
                    break;
                case 'area_based':
                    const area = source.monthlyQuantities.reduce((a, b) => a + b, 0); // Assumed single total or avg
                    const franchiseType = source.franchiseType || 'Restaurant';
                    const intensityFactor = allFactors.franchises.area_based[franchiseType]?.factor || 0; // kWh/m2
                    // Use default grid factor if not customized
                    const gridFactor = (allFactors.scope2.find((f: any) => f.name === 'Grid Electricity') as CO2eFactorFuel)?.factors['kWh'] || 0;
                    scope3 = area * intensityFactor * gridFactor;
                    break;
                case 'average_data':
                    const stores = source.monthlyQuantities.reduce((a, b) => a + b, 0);
                    const fType = source.franchiseType || 'Restaurant';
                    const avgFactor = allFactors.franchises.average_data[fType]?.factor || 0; // kgCO2e per store
                    scope3 = stores * avgFactor;
                    break;
            }
            return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3 };
        }

        if (source.category === EmissionCategory.Investments) {
            let scope3 = 0;
            const calcMethod = (source.calculationMethod as Cat15CalculationMethod) || 'investment_specific';

            switch (calcMethod) {
                case 'investment_specific':
                    // PCAF Method: Emissions x Attribution Factor
                    // Attribution Factor = Outstanding Investment / (EVIC or Total Equity + Debt)
                    const investeeEmissions = source.supplierProvidedCO2e || 0;
                    const investmentValue = source.investmentValue || 0;
                    const companyValue = source.companyValue || 0;

                    if (companyValue > 0) {
                        const attributionFactor = investmentValue / companyValue;
                        scope3 = investeeEmissions * attributionFactor;
                    }
                    break;
                case 'average_data':
                    // EEIO Method: Investment Value * Sector Intensity
                    const investmentVal = source.investmentValue || 0;
                    const sectorFactorData = allFactors.investments.find((f: any) => f.name === source.fuelType); // fuelType holds sector name
                    const sectorFactor = sectorFactorData?.factors[source.unit] || 0;
                    scope3 = investmentVal * sectorFactor;
                    break;
            }
            return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3 };
        }

        const totalQuantity = source.monthlyQuantities.reduce((sum, q) => sum + q, 0);
        const categoryFuels = FUELS_MAP[source.category];
        if (!categoryFuels || (Array.isArray(categoryFuels) && categoryFuels.length === 0)) return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: 0 };

        // Check if categoryFuels is an array before calling .find()
        if (!Array.isArray(categoryFuels)) return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: 0 };

        const fuel = categoryFuels.find((f: any) => f.name === source.fuelType);
        if (!fuel) return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: 0 };

        const scope = getScopeForCategory(source.category);

        if ('gwp' in fuel) {
            return { scope1: totalQuantity * fuel.gwp, scope2Location: 0, scope2Market: 0, scope3: 0 };
        }

        if ('factors' in fuel) {
            const co2eFuel = fuel as CO2eFactorFuel;
            let factor = co2eFuel.factors[source.unit] || 0;

            // Fallback for Grid Electricity if factor is 0 (e.g. stale localStorage data)
            if (factor === 0 && source.fuelType === 'Grid Electricity') {
                factor = SCOPE2_FACTORS_BY_REGION['South Korea'].factors[source.unit] || 0;
            }

            const emissions = totalQuantity * factor;

            if (scope === 'scope2') {
                const marketFactor = source.marketBasedFactor ?? factor;
                const marketEmissions = totalQuantity * marketFactor;

                // Mutually Exclusive Logic (Restored):
                // If market data provided -> Market column only.
                // If NO market data provided -> Location column only.
                const hasMarketData = source.marketBasedFactor !== undefined;

                const locationEmissions = hasMarketData ? 0 : emissions;
                const finalMarketEmissions = hasMarketData ? marketEmissions : 0;

                return { scope1: 0, scope2Location: locationEmissions, scope2Market: finalMarketEmissions, scope3: 0 };
            } else if (scope === 'scope1') {
                return { scope1: emissions, scope2Location: 0, scope2Market: 0, scope3: 0 };
            } else {
                return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: emissions };
            }
        }

        return { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: 0 };
    }, [FUELS_MAP, getScopeForCategory, allFactors]);

    const results = useMemo(() => {
        let scope1Total = 0;
        let scope2LocationTotal = 0;
        let scope2MarketTotal = 0;
        let scope3Total = 0;
        const scope3CategoryBreakdown: { [category: string]: number } = {};

        const facilityBreakdown: { [facilityId: string]: { scope1: number, scope2Location: number, scope2Market: number, scope3: number } } = {};
        facilities.forEach(f => {
            facilityBreakdown[f.id] = { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: 0 };
        });

        for (const category of Object.values(EmissionCategory)) {
            const scope = getScopeForCategory(category);
            if (scope === 'scope3') {
                if (!scope3Settings.isEnabled || !scope3Settings.enabledCategories.includes(category)) {
                    continue;
                }
                if (!scope3CategoryBreakdown[category]) {
                    scope3CategoryBreakdown[category] = 0;
                }
            }

            for (const source of sources[category]) {
                const facility = facilities.find(f => f.id === source.facilityId);
                if (!facility) continue;

                const ownershipFactor = boundaryApproach === 'equity' ? (facility.equityShare / 100) : 1;
                const emissions = calculateSourceEmissions(source);

                const adjScope1 = emissions.scope1 * ownershipFactor;
                const adjScope2L = emissions.scope2Location * ownershipFactor;
                const adjScope2M = emissions.scope2Market * ownershipFactor;
                const adjScope3 = emissions.scope3 * ownershipFactor;

                scope1Total += adjScope1;
                scope2LocationTotal += adjScope2L;
                scope2MarketTotal += adjScope2M;
                scope3Total += adjScope3;

                if (scope === 'scope3') {
                    scope3CategoryBreakdown[source.category] += adjScope3;
                }

                if (facilityBreakdown[facility.id]) {
                    facilityBreakdown[facility.id].scope1 += adjScope1;
                    facilityBreakdown[facility.id].scope2Location += adjScope2L;
                    facilityBreakdown[facility.id].scope2Market += adjScope2M;
                    facilityBreakdown[facility.id].scope3 += adjScope3;
                }
            }
        }

        // Total Emissions for each method
        const totalEmissionsMarket = scope1Total + scope2MarketTotal + scope3Total;
        const totalEmissionsLocation = scope1Total + scope2LocationTotal + scope3Total;

        return { totalEmissionsMarket, totalEmissionsLocation, scope1Total, scope2LocationTotal, scope2MarketTotal, scope3Total, facilityBreakdown, scope3CategoryBreakdown };
    }, [sources, facilities, boundaryApproach, scope3Settings, calculateSourceEmissions, getScopeForCategory]);

    const boundaryApproachText = useMemo(() => {
        return {
            operational: t('operationalControl'),
            financial: t('financialControl'),
            equity: t('equityShare')
        }[boundaryApproach];
    }, [t, boundaryApproach]);

    const handleSaveSetup = useCallback((details: {
        companyName: string;
        reportingYear: string;
        facilities: Facility[];
        boundaryApproach: BoundaryApproach;
        scope3Settings: Scope3Settings;
    }) => {
        setCompanyName(details.companyName);
        setReportingYear(details.reportingYear);
        setFacilities(details.facilities);
        setBoundaryApproach(details.boundaryApproach);
        setScope3Settings(details.scope3Settings);
        setIsSetupComplete(true);
        setIsWizardOpen(false);
    }, []);

    const reconfigureBoundary = () => {
        if (!checkAuth()) return;
        setWizardStartStep(1);
        setIsWizardOpen(true);
    };

    const openScope3Settings = () => {
        if (!checkAuth()) return;
        setWizardStartStep(4);
        setIsWizardOpen(true);
    };

    const handleProportionalFactorChange = (categoryKey: FactorCategoryKey, itemIndex: number, unit: string, value: string) => {
        if (!checkAuth()) return;
        setAllFactors(prev => {
            const categoryFactors = [...(prev[categoryKey] as any[])];
            const item = { ...categoryFactors[itemIndex] };
            item.factors = { ...item.factors, [unit]: parseFloat(value) || 0 };
            categoryFactors[itemIndex] = item;
            return { ...prev, [categoryKey]: categoryFactors };
        });
    };

    const handleFactorValueChange = (categoryKey: FactorCategoryKey, path: (string | number)[], value: string) => {
        if (!checkAuth()) return;
        setAllFactors(prev => {
            const newFactors = JSON.parse(JSON.stringify(prev));
            let current = newFactors[categoryKey];
            for (let i = 0; i < path.length - 1; i++) {
                current = current[path[i]];
            }
            current[path[path.length - 1]] = parseFloat(value) || 0;
            return newFactors;
        });
    };

    const handleGWPChange = (itemIndex: number, value: string) => {
        if (!checkAuth()) return;
        setAllFactors(prev => {
            const fugitiveGases = [...(prev.fugitive as any[])];
            fugitiveGases[itemIndex] = { ...fugitiveGases[itemIndex], gwp: parseFloat(value) || 0 };
            return { ...prev, fugitive: fugitiveGases };
        });
    };

    const handleRegionChange = (region: string) => {
        if (!checkAuth()) return;
        const newFactors = region === 'Custom' ? allFactors.scope2[0].factors : SCOPE2_FACTORS_BY_REGION[region].factors;
        setAllFactors(prev => {
            const scope2Sources = [...(prev.scope2 as any[])];
            const gridIndex = scope2Sources.findIndex(s => s.name === 'Grid Electricity');
            if (gridIndex !== -1) {
                scope2Sources[gridIndex] = { ...scope2Sources[gridIndex], factors: newFactors };
            }
            return { ...prev, scope2: scope2Sources };
        });
    };

    const handleAddFactor = (categoryKey: FactorCategoryKey, itemData: any) => {
        if (!checkAuth()) return;
        const newItem = {
            ...itemData,
            id: `custom-${Date.now()}`,
            isCustom: true,
        };
        setAllFactors(prev => ({
            ...prev,
            [categoryKey]: [...(prev[categoryKey] as any[]), newItem]
        }));
    };

    const handleEditFactor = (categoryKey: FactorCategoryKey, itemData: any) => {
        setAllFactors(prev => ({
            ...prev,
            [categoryKey]: (prev[categoryKey] as any[]).map(item => item.id === itemData.id ? itemData : item)
        }));
    };

    const handleDeleteFactor = (categoryKey: FactorCategoryKey, idToDelete: string) => {
        if (!checkAuth()) return;
        setAllFactors(prev => ({
            ...prev,
            [categoryKey]: (prev[categoryKey] as any[]).filter(item => item.id !== idToDelete)
        }));
    };

    const scopeCalculatorProps = {
        sources,
        onAddSource: handleAddSource,
        onUpdateSource: handleUpdateSource,
        onRemoveSource: handleRemoveSource,
        onFuelTypeChange: handleFuelTypeChange,
        fuelsMap: FUELS_MAP,
        calculateEmissions: calculateSourceEmissions,
        categoryDescriptions,
        facilities,
        openCategory,
        onToggleCategory: handleToggleCategory,
        boundaryApproach,
    };

    if (!isSetupComplete) {
        return (
            <BoundarySetupWizard
                isOpen={true}
                onClose={() => { }}
                onSave={handleSaveSetup}
                initialData={{ companyName, reportingYear, facilities, boundaryApproach, scope3Settings }}
                isCancellable={false}
                isAuthenticated={isAuthenticated}
            />
        )
    }

    return (
        <div className="animate-fade-in pb-20">

            <div className="relative">
                {/* Decorative background elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-gradient-to-b from-teal-50/50 to-transparent dark:from-teal-900/10 pointer-events-none -z-10"></div>

                <div className="flex justify-end mb-4">
                    <button
                        onClick={handleSaveToCloud}
                        disabled={isSaving}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded inline-flex items-center transition-colors shadow-sm"
                    >
                        {isSaving ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {t('saving')}
                            </>
                        ) : (
                            <>
                                <span className="mr-2">☁️</span> {t('saveToCloud')}
                            </>
                        )}
                    </button>
                </div>

                <div className="mb-12 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <ResultsDisplay
                        {...results}
                        facilities={facilities}
                        boundaryApproach={boundaryApproach}
                        companyName={companyName}
                        reportingYear={reportingYear}
                        boundaryApproachText={boundaryApproachText}
                        onGenerateReport={() => checkAuth() && setIsReportOpen(true)}
                    />
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300">
                    <div className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 md:p-10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                                    {t('calculatorTitle')}
                                </h2>
                                <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                                    {t('calculatorDescription')}
                                </p>
                            </div>
                            <button
                                onClick={() => checkAuth() && setIsWizardOpen(true)}
                                className="group flex items-center gap-2.5 px-5 py-2.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-all duration-300"
                            >
                                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                                    <IconBuilding className="w-4 h-4" />
                                </span>
                                {t('reconfigureBoundary')}
                            </button>
                        </div>

                        {/* Modern Segmented Control Tabs */}
                        <div className="mt-10 p-1 bg-gray-100 dark:bg-gray-900/50 rounded-xl inline-flex w-full md:w-auto overflow-x-auto no-scrollbar">
                            {(['scope1', 'scope2', 'scope3'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`
                                        relative flex-1 md:flex-none px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap
                                        ${activeTab === tab
                                            ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-800/50'
                                        }
                                    `}
                                >
                                    {t(tab)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 md:p-10">
                        <div className="animate-slide-up">
                            {activeTab === 'scope1' && (
                                <Scope1Calculator
                                    sources={sources}
                                    onAddSource={handleAddSource}
                                    onUpdateSource={handleUpdateSource}
                                    onRemoveSource={handleRemoveSource}
                                    onFuelTypeChange={handleFuelTypeChange}
                                    fuelsMap={FUELS_MAP}
                                    calculateEmissions={calculateSourceEmissions}
                                    categoryDescriptions={categoryDescriptions}
                                    facilities={facilities}
                                    openCategory={openCategory}
                                    onToggleCategory={handleToggleCategory}
                                    boundaryApproach={boundaryApproach}
                                />
                            )}

                            {activeTab === 'scope2' && (
                                <Scope2Calculator
                                    sources={sources}
                                    onAddSource={handleAddSource}
                                    onUpdateSource={handleUpdateSource}
                                    onRemoveSource={handleRemoveSource}
                                    onFuelTypeChange={handleFuelTypeChange}
                                    fuelsMap={FUELS_MAP}
                                    calculateEmissions={calculateSourceEmissions}
                                    categoryDescriptions={categoryDescriptions}
                                    facilities={facilities}
                                    openCategory={openCategory}
                                    onToggleCategory={handleToggleCategory}
                                    boundaryApproach={boundaryApproach}
                                />
                            )}

                            {activeTab === 'scope3' && (
                                <Scope3Calculator
                                    sources={sources}
                                    onAddSource={handleAddSource}
                                    onUpdateSource={handleUpdateSource}
                                    onRemoveSource={handleRemoveSource}
                                    onFuelTypeChange={handleFuelTypeChange}
                                    fuelsMap={FUELS_MAP}
                                    calculateEmissions={calculateSourceEmissions}
                                    categoryDescriptions={categoryDescriptions}
                                    facilities={facilities}
                                    openCategory={openCategory}
                                    onToggleCategory={handleToggleCategory}
                                    boundaryApproach={boundaryApproach}
                                    enabledScope3Categories={scope3Settings.enabledCategories}
                                    onManageScope3={openScope3Settings}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>



            <div className="mt-12 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <FactorManager
                    allFactors={allFactors}
                    onProportionalFactorChange={handleProportionalFactorChange}
                    onFactorValueChange={handleFactorValueChange}
                    onGWPChange={handleGWPChange}
                    onRegionChange={handleRegionChange}
                    onAddFactor={handleAddFactor}
                    onEditFactor={handleEditFactor}
                    onDeleteFactor={handleDeleteFactor}
                    enabledScope3Categories={scope3Settings.enabledCategories}
                    onRequireAuth={() => checkAuth()}
                />
            </div>

            {/* Modals */}
            <BoundarySetupWizard
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                onSave={handleSaveSetup}
                initialData={{ companyName, reportingYear, facilities, boundaryApproach, scope3Settings }}
                initialStep={wizardStartStep}
                isAuthenticated={isAuthenticated}
            />

            <ReportGenerator
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                companyName={companyName}
                reportingYear={reportingYear}
                boundaryApproachText={boundaryApproachText}
                results={results}
                facilities={facilities}
                boundaryApproach={boundaryApproach}
                sources={sources}
                allFactors={allFactors}
                scope3Settings={scope3Settings}
            />
        </div>
    );
};