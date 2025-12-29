import { CO2eFactorFuel } from '../../types';

// ============================================================================
// Category 1: Purchased Goods and Services - Emission Factors Database
// ============================================================================
// Data Sources:
// - Ecoinvent 3.x (Global LCI Database)
// - DEFRA UK GHG Conversion Factors 2023
// - EPA EEIO (US Environmental Protection Agency)
// - KR-LCI (Korea Environmental Industry & Technology Institute)
// - IPCC 2006/2019 Guidelines
// ============================================================================

// ----------------------------------------------------------------------------
// 1. RAW MATERIALS (원자재) - Activity-based (kg CO2e per unit)
// ----------------------------------------------------------------------------

// 1.1 Metals (금속)
export const RAW_MATERIALS_METALS: CO2eFactorFuel[] = [
  // Steel (철강)
  { name: 'Steel - Primary (BOF)', translationKey: 'steelPrimaryBOF', units: ['kg', 'tonnes'], factors: { 'kg': 2.33, 'tonnes': 2330 }, isCustom: false },
  { name: 'Steel - Secondary (EAF)', translationKey: 'steelSecondaryEAF', units: ['kg', 'tonnes'], factors: { 'kg': 0.42, 'tonnes': 420 }, isCustom: false },
  { name: 'Steel - Average', translationKey: 'steelAverage', units: ['kg', 'tonnes'], factors: { 'kg': 1.85, 'tonnes': 1850 }, isCustom: false },
  { name: 'Stainless Steel', translationKey: 'stainlessSteel', units: ['kg', 'tonnes'], factors: { 'kg': 6.15, 'tonnes': 6150 }, isCustom: false },
  
  // Aluminum (알루미늄)
  { name: 'Aluminum - Primary', translationKey: 'aluminumPrimary', units: ['kg', 'tonnes'], factors: { 'kg': 11.89, 'tonnes': 11890 }, isCustom: false },
  { name: 'Aluminum - Secondary (Recycled)', translationKey: 'aluminumSecondary', units: ['kg', 'tonnes'], factors: { 'kg': 0.52, 'tonnes': 520 }, isCustom: false },
  { name: 'Aluminum - Average', translationKey: 'aluminumAverage', units: ['kg', 'tonnes'], factors: { 'kg': 8.24, 'tonnes': 8240 }, isCustom: false },
  
  // Copper (구리)
  { name: 'Copper - Primary', translationKey: 'copperPrimary', units: ['kg', 'tonnes'], factors: { 'kg': 3.81, 'tonnes': 3810 }, isCustom: false },
  { name: 'Copper - Secondary (Recycled)', translationKey: 'copperSecondary', units: ['kg', 'tonnes'], factors: { 'kg': 0.84, 'tonnes': 840 }, isCustom: false },
  
  // Other Metals (기타 금속)
  { name: 'Zinc', translationKey: 'zinc', units: ['kg', 'tonnes'], factors: { 'kg': 3.09, 'tonnes': 3090 }, isCustom: false },
  { name: 'Lead', translationKey: 'lead', units: ['kg', 'tonnes'], factors: { 'kg': 1.91, 'tonnes': 1910 }, isCustom: false },
  { name: 'Nickel', translationKey: 'nickel', units: ['kg', 'tonnes'], factors: { 'kg': 12.4, 'tonnes': 12400 }, isCustom: false },
  { name: 'Titanium', translationKey: 'titanium', units: ['kg', 'tonnes'], factors: { 'kg': 35.7, 'tonnes': 35700 }, isCustom: false },
];

// 1.2 Plastics (플라스틱)
export const RAW_MATERIALS_PLASTICS: CO2eFactorFuel[] = [
  { name: 'PE - Polyethylene (HDPE)', translationKey: 'peHDPE', units: ['kg', 'tonnes'], factors: { 'kg': 1.93, 'tonnes': 1930 }, isCustom: false },
  { name: 'PE - Polyethylene (LDPE)', translationKey: 'peLDPE', units: ['kg', 'tonnes'], factors: { 'kg': 2.08, 'tonnes': 2080 }, isCustom: false },
  { name: 'PP - Polypropylene', translationKey: 'ppPolypropylene', units: ['kg', 'tonnes'], factors: { 'kg': 1.98, 'tonnes': 1980 }, isCustom: false },
  { name: 'PVC - Polyvinyl Chloride', translationKey: 'pvcPolyvinyl', units: ['kg', 'tonnes'], factors: { 'kg': 2.41, 'tonnes': 2410 }, isCustom: false },
  { name: 'PET - Polyethylene Terephthalate', translationKey: 'petPolyethylene', units: ['kg', 'tonnes'], factors: { 'kg': 2.73, 'tonnes': 2730 }, isCustom: false },
  { name: 'PS - Polystyrene', translationKey: 'psPolystyrene', units: ['kg', 'tonnes'], factors: { 'kg': 3.29, 'tonnes': 3290 }, isCustom: false },
  { name: 'ABS - Acrylonitrile Butadiene Styrene', translationKey: 'absPlastic', units: ['kg', 'tonnes'], factors: { 'kg': 3.55, 'tonnes': 3550 }, isCustom: false },
  { name: 'PC - Polycarbonate', translationKey: 'pcPolycarbonate', units: ['kg', 'tonnes'], factors: { 'kg': 5.85, 'tonnes': 5850 }, isCustom: false },
  { name: 'Nylon (PA6)', translationKey: 'nylonPA6', units: ['kg', 'tonnes'], factors: { 'kg': 7.92, 'tonnes': 7920 }, isCustom: false },
  { name: 'Recycled Plastic - Average', translationKey: 'recycledPlasticAvg', units: ['kg', 'tonnes'], factors: { 'kg': 0.45, 'tonnes': 450 }, isCustom: false },
];

// 1.3 Chemicals (화학제품)
export const RAW_MATERIALS_CHEMICALS: CO2eFactorFuel[] = [
  { name: 'Industrial Solvents - Average', translationKey: 'industrialSolvents', units: ['kg', 'L'], factors: { 'kg': 1.52, 'L': 1.22 }, isCustom: false },
  { name: 'Adhesives - Average', translationKey: 'adhesivesAverage', units: ['kg', 'L'], factors: { 'kg': 2.14, 'L': 2.35 }, isCustom: false },
  { name: 'Paints & Coatings - Solvent-based', translationKey: 'paintsSolventBased', units: ['kg', 'L'], factors: { 'kg': 3.56, 'L': 4.27 }, isCustom: false },
  { name: 'Paints & Coatings - Water-based', translationKey: 'paintsWaterBased', units: ['kg', 'L'], factors: { 'kg': 1.89, 'L': 2.08 }, isCustom: false },
  { name: 'Cleaning Agents - Industrial', translationKey: 'cleaningAgentsIndustrial', units: ['kg', 'L'], factors: { 'kg': 0.98, 'L': 1.08 }, isCustom: false },
  { name: 'Lubricants', translationKey: 'lubricants', units: ['kg', 'L'], factors: { 'kg': 1.15, 'L': 0.98 }, isCustom: false },
  { name: 'Sulfuric Acid', translationKey: 'sulfuricAcid', units: ['kg', 'tonnes'], factors: { 'kg': 0.09, 'tonnes': 90 }, isCustom: false },
  { name: 'Sodium Hydroxide (Caustic Soda)', translationKey: 'sodiumHydroxide', units: ['kg', 'tonnes'], factors: { 'kg': 1.07, 'tonnes': 1070 }, isCustom: false },
  { name: 'Ammonia', translationKey: 'ammonia', units: ['kg', 'tonnes'], factors: { 'kg': 2.87, 'tonnes': 2870 }, isCustom: false },
];

// 1.4 Construction Materials (건설자재)
export const RAW_MATERIALS_CONSTRUCTION: CO2eFactorFuel[] = [
  { name: 'Cement - Portland', translationKey: 'cementPortland', units: ['kg', 'tonnes'], factors: { 'kg': 0.91, 'tonnes': 910 }, isCustom: false },
  { name: 'Concrete - Ready-mix', translationKey: 'concreteReadyMix', units: ['kg', 'tonnes', 'm³'], factors: { 'kg': 0.13, 'tonnes': 130, 'm³': 312 }, isCustom: false },
  { name: 'Glass - Float', translationKey: 'glassFloat', units: ['kg', 'tonnes'], factors: { 'kg': 0.86, 'tonnes': 860 }, isCustom: false },
  { name: 'Timber - Softwood', translationKey: 'timberSoftwood', units: ['kg', 'tonnes', 'm³'], factors: { 'kg': 0.31, 'tonnes': 310, 'm³': 155 }, isCustom: false },
  { name: 'Timber - Hardwood', translationKey: 'timberHardwood', units: ['kg', 'tonnes', 'm³'], factors: { 'kg': 0.42, 'tonnes': 420, 'm³': 336 }, isCustom: false },
  { name: 'Plywood', translationKey: 'plywood', units: ['kg', 'tonnes', 'm²'], factors: { 'kg': 0.68, 'tonnes': 680, 'm²': 8.16 }, isCustom: false },
  { name: 'Insulation - Glass Wool', translationKey: 'insulationGlassWool', units: ['kg', 'tonnes'], factors: { 'kg': 1.35, 'tonnes': 1350 }, isCustom: false },
  { name: 'Insulation - EPS', translationKey: 'insulationEPS', units: ['kg', 'tonnes'], factors: { 'kg': 3.29, 'tonnes': 3290 }, isCustom: false },
  { name: 'Bricks', translationKey: 'bricks', units: ['kg', 'tonnes', 'pcs'], factors: { 'kg': 0.24, 'tonnes': 240, 'pcs': 0.48 }, isCustom: false },
];

// ----------------------------------------------------------------------------
// 2. PACKAGING MATERIALS (포장재) - Activity-based
// ----------------------------------------------------------------------------

export const PACKAGING_MATERIALS: CO2eFactorFuel[] = [
  { name: 'Corrugated Cardboard', translationKey: 'corrugatedCardboard', units: ['kg', 'tonnes'], factors: { 'kg': 0.94, 'tonnes': 940 }, isCustom: false },
  { name: 'Paper - Virgin', translationKey: 'paperVirgin', units: ['kg', 'tonnes'], factors: { 'kg': 1.29, 'tonnes': 1290 }, isCustom: false },
  { name: 'Paper - Recycled', translationKey: 'paperRecycled', units: ['kg', 'tonnes'], factors: { 'kg': 0.67, 'tonnes': 670 }, isCustom: false },
  { name: 'Plastic Film - PE', translationKey: 'plasticFilmPE', units: ['kg', 'tonnes'], factors: { 'kg': 2.08, 'tonnes': 2080 }, isCustom: false },
  { name: 'Glass Bottles', translationKey: 'glassBottles', units: ['kg', 'tonnes', 'pcs'], factors: { 'kg': 0.85, 'tonnes': 850, 'pcs': 0.34 }, isCustom: false },
  { name: 'Aluminum Cans', translationKey: 'aluminumCans', units: ['kg', 'tonnes', 'pcs'], factors: { 'kg': 8.14, 'tonnes': 8140, 'pcs': 0.12 }, isCustom: false },
  { name: 'Steel Cans', translationKey: 'steelCans', units: ['kg', 'tonnes', 'pcs'], factors: { 'kg': 1.54, 'tonnes': 1540, 'pcs': 0.08 }, isCustom: false },
  { name: 'Wooden Pallets', translationKey: 'woodenPallets', units: ['kg', 'pcs'], factors: { 'kg': 0.33, 'pcs': 8.25 }, isCustom: false },
  { name: 'Plastic Pallets', translationKey: 'plasticPallets', units: ['kg', 'pcs'], factors: { 'kg': 2.15, 'pcs': 43.0 }, isCustom: false },
];

// ----------------------------------------------------------------------------
// 3. ELECTRONIC COMPONENTS (전자부품) - Activity-based
// ----------------------------------------------------------------------------

export const ELECTRONIC_COMPONENTS: CO2eFactorFuel[] = [
  { name: 'Semiconductor - IC Chips (average)', translationKey: 'semiconductorIC', units: ['kg', 'pcs'], factors: { 'kg': 45.2, 'pcs': 0.045 }, isCustom: false },
  { name: 'PCB - Printed Circuit Board', translationKey: 'pcbBoard', units: ['kg', 'm²'], factors: { 'kg': 25.8, 'm²': 38.7 }, isCustom: false },
  { name: 'Li-ion Battery Cells', translationKey: 'liIonBatteryCells', units: ['kg', 'kWh'], factors: { 'kg': 12.5, 'kWh': 61.3 }, isCustom: false },
  { name: 'Display - LCD Panel', translationKey: 'displayLCD', units: ['kg', 'm²'], factors: { 'kg': 18.4, 'm²': 147.2 }, isCustom: false },
  { name: 'Display - OLED Panel', translationKey: 'displayOLED', units: ['kg', 'm²'], factors: { 'kg': 24.6, 'm²': 196.8 }, isCustom: false },
  { name: 'Electric Motors (small)', translationKey: 'electricMotorsSmall', units: ['kg', 'pcs'], factors: { 'kg': 4.82, 'pcs': 9.64 }, isCustom: false },
  { name: 'Cables & Wiring', translationKey: 'cablesWiring', units: ['kg', 'm'], factors: { 'kg': 3.45, 'm': 0.17 }, isCustom: false },
  { name: 'Connectors', translationKey: 'connectors', units: ['kg', 'pcs'], factors: { 'kg': 8.92, 'pcs': 0.089 }, isCustom: false },
];

// ----------------------------------------------------------------------------
// 4. OFFICE & NON-PRODUCTION (사무용품/비생산) - Activity-based
// ----------------------------------------------------------------------------

export const OFFICE_SUPPLIES: CO2eFactorFuel[] = [
  { name: 'Office Paper (A4)', translationKey: 'officePaperA4', units: ['kg', 'ream'], factors: { 'kg': 1.29, 'ream': 3.23 }, isCustom: false },
  { name: 'Printer Cartridges - Inkjet', translationKey: 'printerCartridgesInkjet', units: ['pcs'], factors: { 'pcs': 3.8 }, isCustom: false },
  { name: 'Printer Cartridges - Laser', translationKey: 'printerCartridgesLaser', units: ['pcs'], factors: { 'pcs': 5.2 }, isCustom: false },
  { name: 'Office Furniture - Desk', translationKey: 'officeFurnitureDesk', units: ['pcs'], factors: { 'pcs': 72.5 }, isCustom: false },
  { name: 'Office Furniture - Chair', translationKey: 'officeFurnitureChair', units: ['pcs'], factors: { 'pcs': 45.8 }, isCustom: false },
  { name: 'Computer - Desktop', translationKey: 'computerDesktop', units: ['pcs'], factors: { 'pcs': 350.0 }, isCustom: false },
  { name: 'Computer - Laptop', translationKey: 'computerLaptop', units: ['pcs'], factors: { 'pcs': 280.0 }, isCustom: false },
  { name: 'Monitor', translationKey: 'monitor', units: ['pcs'], factors: { 'pcs': 185.0 }, isCustom: false },
  { name: 'Mobile Phone', translationKey: 'mobilePhone', units: ['pcs'], factors: { 'pcs': 55.0 }, isCustom: false },
  { name: 'Tablet', translationKey: 'tablet', units: ['pcs'], factors: { 'pcs': 95.0 }, isCustom: false },
];

// PPE & Safety Equipment
export const PPE_SAFETY: CO2eFactorFuel[] = [
  { name: 'Safety Helmet', translationKey: 'safetyHelmet', units: ['pcs'], factors: { 'pcs': 2.8 }, isCustom: false },
  { name: 'Safety Shoes', translationKey: 'safetyShoes', units: ['pcs'], factors: { 'pcs': 12.5 }, isCustom: false },
  { name: 'Work Gloves - Leather', translationKey: 'workGlovesLeather', units: ['pcs'], factors: { 'pcs': 1.85 }, isCustom: false },
  { name: 'Work Gloves - Rubber', translationKey: 'workGlovesRubber', units: ['pcs'], factors: { 'pcs': 0.92 }, isCustom: false },
  { name: 'Safety Glasses', translationKey: 'safetyGlasses', units: ['pcs'], factors: { 'pcs': 0.75 }, isCustom: false },
  { name: 'Disposable Masks (N95)', translationKey: 'disposableMasksN95', units: ['pcs', 'box'], factors: { 'pcs': 0.045, 'box': 0.9 }, isCustom: false },
  { name: 'Coveralls - Disposable', translationKey: 'coverallsDisposable', units: ['pcs'], factors: { 'pcs': 0.65 }, isCustom: false },
  { name: 'High-Vis Vest', translationKey: 'highVisVest', units: ['pcs'], factors: { 'pcs': 1.92 }, isCustom: false },
];

// ----------------------------------------------------------------------------
// 5. SERVICES (서비스) - Spend-based (kg CO2e per currency unit)
// ----------------------------------------------------------------------------
// Based on EEIO models and industry averages

export const SERVICES_SPEND_BASED: CO2eFactorFuel[] = [
  // IT Services
  { name: 'Cloud Computing Services', translationKey: 'cloudComputingServices', units: ['USD', 'KRW'], factors: { 'USD': 0.12, 'KRW': 0.000092 }, isCustom: false },
  { name: 'Software as a Service (SaaS)', translationKey: 'softwareSaaS', units: ['USD', 'KRW'], factors: { 'USD': 0.08, 'KRW': 0.000061 }, isCustom: false },
  { name: 'IT Support & Maintenance', translationKey: 'itSupportMaintenance', units: ['USD', 'KRW'], factors: { 'USD': 0.10, 'KRW': 0.000077 }, isCustom: false },
  { name: 'Data Center Services', translationKey: 'dataCenterServices', units: ['USD', 'KRW'], factors: { 'USD': 0.18, 'KRW': 0.000138 }, isCustom: false },
  { name: 'Telecommunications', translationKey: 'telecommunications', units: ['USD', 'KRW'], factors: { 'USD': 0.09, 'KRW': 0.000069 }, isCustom: false },
  
  // Professional Services
  { name: 'Management Consulting', translationKey: 'managementConsulting', units: ['USD', 'KRW'], factors: { 'USD': 0.05, 'KRW': 0.000038 }, isCustom: false },
  { name: 'Legal Services', translationKey: 'legalServices', units: ['USD', 'KRW'], factors: { 'USD': 0.04, 'KRW': 0.000031 }, isCustom: false },
  { name: 'Accounting & Audit', translationKey: 'accountingAudit', units: ['USD', 'KRW'], factors: { 'USD': 0.04, 'KRW': 0.000031 }, isCustom: false },
  { name: 'Engineering Services', translationKey: 'engineeringServices', units: ['USD', 'KRW'], factors: { 'USD': 0.07, 'KRW': 0.000054 }, isCustom: false },
  { name: 'Marketing & Advertising', translationKey: 'marketingAdvertising', units: ['USD', 'KRW'], factors: { 'USD': 0.06, 'KRW': 0.000046 }, isCustom: false },
  { name: 'Training & Education', translationKey: 'trainingEducation', units: ['USD', 'KRW'], factors: { 'USD': 0.05, 'KRW': 0.000038 }, isCustom: false },
  { name: 'HR & Recruitment Services', translationKey: 'hrRecruitmentServices', units: ['USD', 'KRW'], factors: { 'USD': 0.05, 'KRW': 0.000038 }, isCustom: false },
  
  // Facility Services
  { name: 'Cleaning Services', translationKey: 'cleaningServices', units: ['USD', 'KRW'], factors: { 'USD': 0.11, 'KRW': 0.000085 }, isCustom: false },
  { name: 'Security Services', translationKey: 'securityServices', units: ['USD', 'KRW'], factors: { 'USD': 0.08, 'KRW': 0.000061 }, isCustom: false },
  { name: 'Catering & Food Services', translationKey: 'cateringFoodServices', units: ['USD', 'KRW'], factors: { 'USD': 0.25, 'KRW': 0.000192 }, isCustom: false },
  { name: 'Maintenance & Repair Services', translationKey: 'maintenanceRepairServices', units: ['USD', 'KRW'], factors: { 'USD': 0.15, 'KRW': 0.000115 }, isCustom: false },
  { name: 'Waste Management Services', translationKey: 'wasteManagementServices', units: ['USD', 'KRW'], factors: { 'USD': 0.35, 'KRW': 0.000269 }, isCustom: false },
  
  // Financial Services
  { name: 'Banking Services', translationKey: 'bankingServices', units: ['USD', 'KRW'], factors: { 'USD': 0.03, 'KRW': 0.000023 }, isCustom: false },
  { name: 'Insurance Services', translationKey: 'insuranceServices', units: ['USD', 'KRW'], factors: { 'USD': 0.03, 'KRW': 0.000023 }, isCustom: false },
  
  // Other Services
  { name: 'Printing Services', translationKey: 'printingServices', units: ['USD', 'KRW'], factors: { 'USD': 0.22, 'KRW': 0.000169 }, isCustom: false },
  { name: 'Courier & Postal Services', translationKey: 'courierPostalServices', units: ['USD', 'KRW'], factors: { 'USD': 0.28, 'KRW': 0.000215 }, isCustom: false },
  { name: 'Travel Agency Services', translationKey: 'travelAgencyServices', units: ['USD', 'KRW'], factors: { 'USD': 0.15, 'KRW': 0.000115 }, isCustom: false },
];

// ----------------------------------------------------------------------------
// 6. FOOD & AGRICULTURAL PRODUCTS (식품/농산물) - Activity-based
// ----------------------------------------------------------------------------

export const FOOD_AGRICULTURAL: CO2eFactorFuel[] = [
  // Grains
  { name: 'Rice', translationKey: 'rice', units: ['kg', 'tonnes'], factors: { 'kg': 2.55, 'tonnes': 2550 }, isCustom: false },
  { name: 'Wheat', translationKey: 'wheat', units: ['kg', 'tonnes'], factors: { 'kg': 0.72, 'tonnes': 720 }, isCustom: false },
  { name: 'Corn/Maize', translationKey: 'cornMaize', units: ['kg', 'tonnes'], factors: { 'kg': 0.65, 'tonnes': 650 }, isCustom: false },
  { name: 'Soybeans', translationKey: 'soybeans', units: ['kg', 'tonnes'], factors: { 'kg': 0.58, 'tonnes': 580 }, isCustom: false },
  
  // Meat & Dairy
  { name: 'Beef', translationKey: 'beef', units: ['kg'], factors: { 'kg': 27.0 }, isCustom: false },
  { name: 'Pork', translationKey: 'pork', units: ['kg'], factors: { 'kg': 7.2 }, isCustom: false },
  { name: 'Chicken', translationKey: 'chicken', units: ['kg'], factors: { 'kg': 6.1 }, isCustom: false },
  { name: 'Fish & Seafood', translationKey: 'fishSeafood', units: ['kg'], factors: { 'kg': 5.4 }, isCustom: false },
  { name: 'Milk', translationKey: 'milk', units: ['kg', 'L'], factors: { 'kg': 1.39, 'L': 1.43 }, isCustom: false },
  { name: 'Cheese', translationKey: 'cheese', units: ['kg'], factors: { 'kg': 8.55 }, isCustom: false },
  { name: 'Eggs', translationKey: 'eggs', units: ['kg', 'pcs'], factors: { 'kg': 3.46, 'pcs': 0.21 }, isCustom: false },
  
  // Other
  { name: 'Sugar', translationKey: 'sugar', units: ['kg', 'tonnes'], factors: { 'kg': 0.68, 'tonnes': 680 }, isCustom: false },
  { name: 'Coffee (roasted)', translationKey: 'coffeeRoasted', units: ['kg'], factors: { 'kg': 8.3 }, isCustom: false },
  { name: 'Palm Oil', translationKey: 'palmOil', units: ['kg', 'L'], factors: { 'kg': 3.8, 'L': 3.42 }, isCustom: false },
];

// ----------------------------------------------------------------------------
// 7. TEXTILES & LEATHER (섬유/가죽) - Activity-based
// ----------------------------------------------------------------------------

export const TEXTILES_LEATHER: CO2eFactorFuel[] = [
  { name: 'Cotton Fabric', translationKey: 'cottonFabric', units: ['kg', 'm²'], factors: { 'kg': 8.3, 'm²': 1.66 }, isCustom: false },
  { name: 'Polyester Fabric', translationKey: 'polyesterFabric', units: ['kg', 'm²'], factors: { 'kg': 5.5, 'm²': 1.1 }, isCustom: false },
  { name: 'Nylon Fabric', translationKey: 'nylonFabric', units: ['kg', 'm²'], factors: { 'kg': 7.9, 'm²': 1.58 }, isCustom: false },
  { name: 'Wool Fabric', translationKey: 'woolFabric', units: ['kg', 'm²'], factors: { 'kg': 12.5, 'm²': 2.5 }, isCustom: false },
  { name: 'Leather - Bovine', translationKey: 'leatherBovine', units: ['kg', 'm²'], factors: { 'kg': 17.0, 'm²': 13.6 }, isCustom: false },
  { name: 'Synthetic Leather', translationKey: 'syntheticLeather', units: ['kg', 'm²'], factors: { 'kg': 4.2, 'm²': 3.36 }, isCustom: false },
];

// ----------------------------------------------------------------------------
// AGGREGATED EXPORT - Combine all factors
// ----------------------------------------------------------------------------

export const PURCHASED_GOODS_SERVICES_FACTORS: CO2eFactorFuel[] = [
  // Legacy support for existing data
  { name: 'Professional Services (spend)', translationKey: 'profServicesSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.05, 'KRW': 0.00004 } },
  { name: 'IT Services (spend)', translationKey: 'itServicesSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.1, 'KRW': 0.00008 } },
];

// Full categorized factors for new UI
export const CATEGORY1_FACTORS_BY_TYPE = {
  rawMaterials: {
    metals: RAW_MATERIALS_METALS,
    plastics: RAW_MATERIALS_PLASTICS,
    chemicals: RAW_MATERIALS_CHEMICALS,
    construction: RAW_MATERIALS_CONSTRUCTION,
  },
  packaging: PACKAGING_MATERIALS,
  electronics: ELECTRONIC_COMPONENTS,
  officeSupplies: OFFICE_SUPPLIES,
  ppeSafety: PPE_SAFETY,
  services: SERVICES_SPEND_BASED,
  foodAgricultural: FOOD_AGRICULTURAL,
  textiles: TEXTILES_LEATHER,
};

// Flat array of all factors for search/autocomplete
export const ALL_CATEGORY1_FACTORS: CO2eFactorFuel[] = [
  ...RAW_MATERIALS_METALS,
  ...RAW_MATERIALS_PLASTICS,
  ...RAW_MATERIALS_CHEMICALS,
  ...RAW_MATERIALS_CONSTRUCTION,
  ...PACKAGING_MATERIALS,
  ...ELECTRONIC_COMPONENTS,
  ...OFFICE_SUPPLIES,
  ...PPE_SAFETY,
  ...SERVICES_SPEND_BASED,
  ...FOOD_AGRICULTURAL,
  ...TEXTILES_LEATHER,
];

// Category type definitions for UI grouping
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

// Helper to get factors by category type
export const getFactorsByType = (type: Category1FactorType): CO2eFactorFuel[] => {
  switch (type) {
    case 'rawMaterials_metals': return RAW_MATERIALS_METALS;
    case 'rawMaterials_plastics': return RAW_MATERIALS_PLASTICS;
    case 'rawMaterials_chemicals': return RAW_MATERIALS_CHEMICALS;
    case 'rawMaterials_construction': return RAW_MATERIALS_CONSTRUCTION;
    case 'packaging': return PACKAGING_MATERIALS;
    case 'electronics': return ELECTRONIC_COMPONENTS;
    case 'officeSupplies': return OFFICE_SUPPLIES;
    case 'ppeSafety': return PPE_SAFETY;
    case 'services': return SERVICES_SPEND_BASED;
    case 'foodAgricultural': return FOOD_AGRICULTURAL;
    case 'textiles': return TEXTILES_LEATHER;
    case 'custom': return [];
    default: return [];
  }
};
