// Category 6: Detailed factors
// Factors include radiative forcing multipliers where applicable (e.g., air travel)
// Source: DEFRA, ICAO, EPA. Units are kg CO2e.
export const BUSINESS_TRAVEL_FACTORS_DETAILED = {
  activity: {
    Air: {
      'Short-haul (<463 km)': {
        Economy: { factor: 0.255, unit: 'passenger-km', translationKey: 'Economy' },
        Business: { factor: 0.383, unit: 'passenger-km', translationKey: 'Business' },
        First: { factor: 0.510, unit: 'passenger-km', translationKey: 'First' },
      },
      'Medium-haul (463-1108 km)': {
        Economy: { factor: 0.156, unit: 'passenger-km', translationKey: 'Economy' },
        Business: { factor: 0.296, unit: 'passenger-km', translationKey: 'Business' },
        First: { factor: 0.468, unit: 'passenger-km', translationKey: 'First' },
      },
      'Long-haul (>1108 km)': {
        Economy: { factor: 0.150, unit: 'passenger-km', translationKey: 'Economy' },
        Business: { factor: 0.435, unit: 'passenger-km', translationKey: 'Business' },
        First: { factor: 0.600, unit: 'passenger-km', translationKey: 'First' },
      },
    },
    Rail: {
      'National Rail': { factor: 0.035, unit: 'passenger-km', translationKey: 'railNational' },
      'High-speed Rail': { factor: 0.015, unit: 'passenger-km', translationKey: 'railHighSpeed' },
    },
    Bus: {
      'Average Bus': { factor: 0.103, unit: 'passenger-km', translationKey: 'bus' },
    },
    RentalCar: {
      'Average Gasoline': { factor: 0.21, unit: 'km', translationKey: 'carGasoline' },
      'Average Diesel': { factor: 0.20, unit: 'km', translationKey: 'carDiesel' },
      'Electric': { factor: 0.05, unit: 'km', translationKey: 'carElectric' }, // Using an average grid factor
    },
    PersonalCar: { 
      'Average Gasoline': { factor: 0.19, unit: 'km', translationKey: 'personalCarGasoline' },
      'Average Diesel': { factor: 0.18, unit: 'km', translationKey: 'personalCarDiesel' },
      'Electric': { factor: 0.05, unit: 'km', translationKey: 'carElectric' },
    },
    Hotel: {
      'National': { factor: 25.0, unit: 'night', translationKey: 'hotelNational' },
      'International': { factor: 35.0, unit: 'night', translationKey: 'hotelInternational' },
    }
  },
  spend: [
    { name: 'Air Travel (spend)', translationKey: 'airTravelSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.6, 'KRW': 0.0005 } },
    { name: 'Rail Travel (spend)', translationKey: 'railTravelSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.2, 'KRW': 0.00016 } },
    { name: 'Ground Transport (spend)', translationKey: 'groundTransportSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.35, 'KRW': 0.00028 } },
    { name: 'Hotel Accommodation (spend)', translationKey: 'hotelSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.15, 'KRW': 0.00012 } },
  ]
};
