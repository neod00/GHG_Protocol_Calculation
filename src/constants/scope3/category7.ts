// Category 7: Employee Commuting - Detailed factors based on DEFRA, EPA.
export const EMPLOYEE_COMMUTING_FACTORS_DETAILED = {
  activity: {
    PersonalCar: {
      'Gasoline': { factor: 0.17, unit: 'km', translationKey: 'personalCarGasoline' },
      'Diesel': { factor: 0.165, unit: 'km', translationKey: 'personalCarDiesel' },
      'Hybrid': { factor: 0.12, unit: 'km', translationKey: 'personalCarHybrid' },
      'Electric': { factor: 0.05, unit: 'km', translationKey: 'personalCarElectric' }, // Represents upstream emissions from grid electricity
      'LPG': { factor: 0.15, unit: 'km', translationKey: 'personalCarLPG' },
    },
    PublicTransport: {
      'Bus': { factor: 0.103, unit: 'passenger-km', translationKey: 'bus' },
      'Subway': { factor: 0.028, unit: 'passenger-km', translationKey: 'subway' },
    },
    Motorbike: {
      'Average Motorbike': { factor: 0.08, unit: 'km', translationKey: 'motorbike' },
    },
    BicycleWalking: {
      'Active Commute': { factor: 0, unit: 'km', translationKey: 'bicycleWalking' },
    },
  },
  spend: [
    { name: 'Employee Fuel Spend', translationKey: 'employeeFuelSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.4, 'KRW': 0.00032 } },
    { name: 'Public Transport Spend', translationKey: 'publicTransportSpend', units: ['USD', 'KRW'], factors: { 'USD': 0.2, 'KRW': 0.00016 } },
  ]
};
