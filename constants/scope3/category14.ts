
import { CO2eFactorFuel } from '../../types';

// Category 14: Franchises
// Source: CIBSE Guide F (Energy efficiency in buildings), US EIA CBECS.
export const FRANCHISES_FACTORS_DETAILED = {
    // Energy Intensity (kWh/m2/year) - similar to leased assets but specific to franchise types
    area_based: {
        Restaurant: { factor: 600, translationKey: 'franchiseRestaurant' }, // High intensity due to cooking/refrigeration
        Retail: { factor: 300, translationKey: 'franchiseRetail' },
        Service: { factor: 200, translationKey: 'franchiseService' }, // e.g. Salon, Agency
        ConvenienceStore: { factor: 800, translationKey: 'franchiseConvenience' }, // 24/7 operation, refrigeration
        CoffeeShop: { factor: 500, translationKey: 'franchiseCoffee' },
    },
    // Average emissions per store per year (kg CO2e) - Highly generalized, for estimation
    average_data: {
        Restaurant: { factor: 150000, translationKey: 'franchiseRestaurant' },
        Retail: { factor: 50000, translationKey: 'franchiseRetail' },
        Service: { factor: 20000, translationKey: 'franchiseService' },
        ConvenienceStore: { factor: 80000, translationKey: 'franchiseConvenience' },
        CoffeeShop: { factor: 40000, translationKey: 'franchiseCoffee' },
    },
    // Spend based factors
    spend_based: [
        { name: 'Franchise Operations (spend)', translationKey: 'franchiseSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.2, 'KRW': 0.00016 } },
    ]
};

// Legacy support
export const FRANCHISES_FACTORS: CO2eFactorFuel[] = [
  { name: 'Retail Franchise', translationKey: 'retailFranchise', units: ['location-year'], factors: { 'location-year': 50000 } },
  { name: 'Restaurant Franchise', translationKey: 'restaurantFranchise', units: ['location-year'], factors: { 'location-year': 150000 } },
];
