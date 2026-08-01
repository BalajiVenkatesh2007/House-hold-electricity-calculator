/**
 * Household Energy Calculator - Appliances Database & Presets
 */

const ROOM_CATEGORIES = {
  hvac: { id: 'hvac', name: 'Heating & Cooling', icon: 'thermometer-sun', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.12)' },
  kitchen: { id: 'kitchen', name: 'Kitchen & Cooking', icon: 'utensils', color: '#eab308', bg: 'rgba(234, 179, 8, 0.12)' },
  laundry: { id: 'laundry', name: 'Laundry & Cleaning', icon: 'washing-machine', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)' },
  lighting: { id: 'lighting', name: 'Lighting & Water', icon: 'lightbulb', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
  entertainment: { id: 'entertainment', name: 'Electronics & Work', icon: 'tv', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)' },
  heavy: { id: 'heavy', name: 'EV & Heavy Duty', icon: 'zap', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' }
};

const DEFAULT_APPLIANCES = [
  {
    id: 'app_ac_inverter',
    name: '1.5 Ton Inverter Air Conditioner',
    room: 'hvac',
    watts: 1400,
    quantity: 1,
    hoursPerDay: 8,
    daysPerWeek: 7,
    dutyCycleRatio: 0.65,
    icon: 'wind',
    energyRating: '5-Star Inverter',
    standbyWatts: 5,
    tip: 'Set thermostat to 24°C (75°F). Every +1°C increases efficiency by 6%.'
  },
  {
    id: 'app_ceiling_fan',
    name: 'BLDC Energy Saving Ceiling Fan',
    room: 'hvac',
    watts: 32,
    quantity: 3,
    hoursPerDay: 12,
    daysPerWeek: 7,
    dutyCycleRatio: 1.0,
    icon: 'fan',
    energyRating: '5-Star BLDC',
    standbyWatts: 1,
    tip: 'Turn off fans in empty rooms. Fans cool people, not ambient air.'
  },
  {
    id: 'app_refrigerator',
    name: 'Double Door Refrigerator (350L)',
    room: 'kitchen',
    watts: 160,
    quantity: 1,
    hoursPerDay: 24,
    daysPerWeek: 7,
    dutyCycleRatio: 0.42,
    icon: 'refrigerator',
    energyRating: '4-Star',
    standbyWatts: 0,
    tip: 'Keep condenser coils dust-free and maintain a 2-inch gap behind the fridge.'
  },
  {
    id: 'app_microwave',
    name: 'Convection Microwave Oven',
    room: 'kitchen',
    watts: 1200,
    quantity: 1,
    hoursPerDay: 0.4,
    daysPerWeek: 7,
    dutyCycleRatio: 1.0,
    icon: 'microwave',
    energyRating: 'Standard',
    standbyWatts: 4,
    tip: 'Microwaves use up to 80% less energy than standard electric ovens.'
  },
  {
    id: 'app_induction',
    name: 'Dual Induction Cooktop',
    room: 'kitchen',
    watts: 1800,
    quantity: 1,
    hoursPerDay: 1.2,
    daysPerWeek: 7,
    dutyCycleRatio: 1.0,
    icon: 'flame',
    energyRating: 'High Efficiency',
    standbyWatts: 2,
    tip: 'Match pan size to burner size to eliminate waste heat dispersion.'
  },
  {
    id: 'app_washer',
    name: 'Front Load Washing Machine',
    room: 'laundry',
    watts: 850,
    quantity: 1,
    hoursPerDay: 1.0,
    daysPerWeek: 4,
    dutyCycleRatio: 1.0,
    icon: 'shirt',
    energyRating: '5-Star',
    standbyWatts: 3,
    tip: 'Wash with cold water (30°C) to save 60% heater power per cycle.'
  },
  {
    id: 'app_water_geyser',
    name: 'Storage Water Heater / Geyser',
    room: 'lighting',
    watts: 2000,
    quantity: 1,
    hoursPerDay: 1.5,
    daysPerWeek: 7,
    dutyCycleRatio: 1.0,
    icon: 'droplet',
    energyRating: '3-Star',
    standbyWatts: 15,
    tip: 'Use a digital timer switch to heat water only 30 minutes before showers.'
  },
  {
    id: 'app_led_bulbs',
    name: 'Smart LED Bulbs Pack (9W)',
    room: 'lighting',
    watts: 9,
    quantity: 12,
    hoursPerDay: 6,
    daysPerWeek: 7,
    dutyCycleRatio: 1.0,
    icon: 'sun',
    energyRating: 'A+++ LED',
    standbyWatts: 0.5,
    tip: 'LEDs consume 85% less energy than old incandescent bulbs and last 25,000 hrs.'
  },
  {
    id: 'app_smart_tv',
    name: '55" 4K Smart OLED TV',
    room: 'entertainment',
    watts: 130,
    quantity: 1,
    hoursPerDay: 5,
    daysPerWeek: 7,
    dutyCycleRatio: 1.0,
    icon: 'tv',
    energyRating: 'Smart Ambient',
    standbyWatts: 6,
    tip: 'Turn off OLED screen when streaming music or audio podcasts.'
  },
  {
    id: 'app_gaming_pc',
    name: 'Desktop Workstation & Dual Monitors',
    room: 'entertainment',
    watts: 380,
    quantity: 1,
    hoursPerDay: 6,
    daysPerWeek: 7,
    dutyCycleRatio: 1.0,
    icon: 'monitor',
    energyRating: '80-Plus Gold',
    standbyWatts: 8,
    tip: 'Use smart surge protector power strips to eliminate phantom standby power.'
  }
];

const PRESET_HOMES = {
  studio_apt: {
    name: '1-Bedroom Compact Apartment',
    description: 'Essential appliances, LED lighting, inverter AC, and smart TV.',
    appliances: [
      { id: 'app_ac', name: '1.0 Ton Inverter AC', room: 'hvac', watts: 950, quantity: 1, hoursPerDay: 6, daysPerWeek: 7, dutyCycleRatio: 0.6 },
      { id: 'app_fridge', name: 'Single Door Fridge (190L)', room: 'kitchen', watts: 110, quantity: 1, hoursPerDay: 24, daysPerWeek: 7, dutyCycleRatio: 0.4 },
      { id: 'app_leds', name: 'LED Bulbs (9W)', room: 'lighting', watts: 9, quantity: 6, hoursPerDay: 5, daysPerWeek: 7, dutyCycleRatio: 1.0 },
      { id: 'app_tv', name: '43" LED TV', room: 'entertainment', watts: 70, quantity: 1, hoursPerDay: 4, daysPerWeek: 7, dutyCycleRatio: 1.0 },
      { id: 'app_laptop', name: 'Laptop Workstation', room: 'entertainment', watts: 65, quantity: 1, hoursPerDay: 8, daysPerWeek: 7, dutyCycleRatio: 1.0 }
    ]
  },
  family_home: {
    name: '3-Bedroom Family House',
    description: 'Multiple AC units, laundry suite, kitchen appliances, and water heating.',
    appliances: [
      { id: 'app_ac1', name: 'Living Room 1.5T AC', room: 'hvac', watts: 1500, quantity: 1, hoursPerDay: 7, daysPerWeek: 7, dutyCycleRatio: 0.65 },
      { id: 'app_ac2', name: 'Master Bed 1.2T AC', room: 'hvac', watts: 1200, quantity: 1, hoursPerDay: 8, daysPerWeek: 7, dutyCycleRatio: 0.6 },
      { id: 'app_fans', name: 'Ceiling Fans (35W)', room: 'hvac', watts: 35, quantity: 4, hoursPerDay: 10, daysPerWeek: 7, dutyCycleRatio: 1.0 },
      { id: 'app_fridge', name: 'French Door Fridge (500L)', room: 'kitchen', watts: 210, quantity: 1, hoursPerDay: 24, daysPerWeek: 7, dutyCycleRatio: 0.45 },
      { id: 'app_cooktop', name: 'Induction Cooktop', room: 'kitchen', watts: 1800, quantity: 1, hoursPerDay: 1.5, daysPerWeek: 7, dutyCycleRatio: 1.0 },
      { id: 'app_washer', name: 'Front Load Washer', room: 'laundry', watts: 900, quantity: 1, hoursPerDay: 1.0, daysPerWeek: 5, dutyCycleRatio: 1.0 },
      { id: 'app_geyser', name: 'Water Heater Geyser', room: 'lighting', watts: 2000, quantity: 1, hoursPerDay: 2.0, daysPerWeek: 7, dutyCycleRatio: 1.0 },
      { id: 'app_leds', name: 'LED Bulbs (9W)', room: 'lighting', watts: 9, quantity: 16, hoursPerDay: 6, daysPerWeek: 7, dutyCycleRatio: 1.0 },
      { id: 'app_tv', name: '65" OLED TV', room: 'entertainment', watts: 150, quantity: 1, hoursPerDay: 5, daysPerWeek: 7, dutyCycleRatio: 1.0 }
    ]
  },
  eco_smart: {
    name: 'Zero-Emission Eco Smart Home',
    description: 'High-efficiency heat pump, BLDC fans, solar offset, and A+++ rated appliances.',
    appliances: [
      { id: 'app_hp_ac', name: 'Heat Pump Inverter AC', room: 'hvac', watts: 800, quantity: 2, hoursPerDay: 6, daysPerWeek: 7, dutyCycleRatio: 0.5 },
      { id: 'app_bldc', name: 'BLDC Ceiling Fans', room: 'hvac', watts: 28, quantity: 4, hoursPerDay: 8, daysPerWeek: 7, dutyCycleRatio: 1.0 },
      { id: 'app_eco_fridge', name: 'A+++ Smart Refrigerator', room: 'kitchen', watts: 90, quantity: 1, hoursPerDay: 24, daysPerWeek: 7, dutyCycleRatio: 0.35 },
      { id: 'app_hp_water', name: 'Heat Pump Water Heater', room: 'lighting', watts: 450, quantity: 1, hoursPerDay: 2.0, daysPerWeek: 7, dutyCycleRatio: 1.0 },
      { id: 'app_smart_leds', name: 'Smart Dimming LEDs (7W)', room: 'lighting', watts: 7, quantity: 15, hoursPerDay: 5, daysPerWeek: 7, dutyCycleRatio: 1.0 },
      { id: 'app_ev', name: 'EV Home Wallbox Charger', room: 'heavy', watts: 3300, quantity: 1, hoursPerDay: 2.5, daysPerWeek: 4, dutyCycleRatio: 1.0 }
    ]
  }
};

const CURRENCY_DATABASE = {
  USD: { symbol: '$', code: 'USD', name: 'US Dollar', rate: 0.16, co2: 0.385, flag: '🇺🇸' },
  EUR: { symbol: '€', code: 'EUR', name: 'Euro', rate: 0.26, co2: 0.255, flag: '🇪🇺' },
  GBP: { symbol: '£', code: 'GBP', name: 'British Pound', rate: 0.28, co2: 0.210, flag: '🇬🇧' },
  INR: { symbol: '₹', code: 'INR', name: 'Indian Rupee', rate: 7.50, co2: 0.710, flag: '🇮🇳' },
  CAD: { symbol: 'CA$', code: 'CAD', name: 'Canadian Dollar', rate: 0.14, co2: 0.150, flag: '🇨🇦' },
  AUD: { symbol: 'A$', code: 'AUD', name: 'Australian Dollar', rate: 0.32, co2: 0.650, flag: '🇦🇺' }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ROOM_CATEGORIES, DEFAULT_APPLIANCES, PRESET_HOMES, CURRENCY_DATABASE };
}
