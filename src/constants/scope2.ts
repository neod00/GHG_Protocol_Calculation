import { CO2eFactorFuel } from '../types';

// Regional electricity grid emission factors (kg CO2e) - These are LOCATION-BASED factors
export const SCOPE2_FACTORS_BY_REGION: { [key: string]: { factors: { [key: string]: number }; source: string; sourceUrl: string; translationKey: string; } } = {
  'South Korea': { 
    factors: { 'kWh': 0.4541, 'MWh': 454.1 }, 
    source: '온실가스 종합정보센터 (2024)',
    sourceUrl: 'https://www.gir.go.kr/home/board/read.do;jsessionid=jkFWdTQjZXDp3PANidbqSmgacV2XrC1VTMBN6KkUisFjTI24vCVn8FPNOLCeWAGM.og_was2_servlet_engine1?pagerOffset=0&maxPageItems=10&maxIndexPages=10&searchKey=&searchValue=&menuId=36&boardId=82&boardMasterId=2&boardCategoryId=',
    translationKey: 'countrySouthKorea' 
  },
  'USA': { 
    factors: { 'kWh': 0.38, 'MWh': 380 }, 
    source: 'IEA (2023 Data)',
    sourceUrl: 'https://www.iea.org/countries/united-states/data-and-statistics',
    translationKey: 'countryUSA' 
  },
  'Japan': { 
    factors: { 'kWh': 0.46, 'MWh': 460 }, 
    source: 'IEA (2023 Data)',
    sourceUrl: 'https://www.iea.org/countries/japan/data-and-statistics',
    translationKey: 'countryJapan' 
  },
  'EU': { 
    factors: { 'kWh': 0.25, 'MWh': 250 }, 
    source: 'IEA (2023 Data)',
    sourceUrl: 'https://www.iea.org/countries/european-union/data-and-statistics',
    translationKey: 'countryEU' 
  },
};

// Default factors for Scope 2 Purchased Energy sources
export const SCOPE2_ENERGY_SOURCES: CO2eFactorFuel[] = [
    {
        name: 'Grid Electricity',
        translationKey: 'gridElectricity',
        units: ['kWh', 'MWh'],
        factors: SCOPE2_FACTORS_BY_REGION['South Korea'].factors, // Default to South Korea for location-based
    },
    {
        name: 'Purchased Steam',
        translationKey: 'purchasedSteam',
        units: ['tonnes', 'MMBtu'],
        factors: { 'tonnes': 65, 'MMBtu': 54.3 }, // Source: EPA GHG Emission Factors Hub
    },
    {
        name: 'Purchased Heating',
        translationKey: 'purchasedHeating',
        units: ['MWh', 'MMBtu'],
        factors: { 'MWh': 200, 'MMBtu': 58.6 }, // Example factors, based on district heating
    },
    {
        name: 'Purchased Cooling',
        translationKey: 'purchasedCooling',
        units: ['MWh', 'ton-hour'],
        factors: { 'MWh': 70, 'ton-hour': 0.06 }, // Example factors, based on district cooling
    },
];
