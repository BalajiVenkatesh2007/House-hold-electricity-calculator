// Pre-configured Household Appliances Catalog and Preset Profiles
const ROOM_CATEGORIES = {
  hvac: { name: 'Heating & Cooling', icon: 'zap', color: '#ff5e57' },
  kitchen: { name: 'Kitchen & Cooking', icon: 'utensils', color: '#ffdd59' },
  laundry: { name: 'Laundry & Cleaning', icon: 'shirt', color: '#0fbcf9' },
  lighting: { name: 'Lighting & Water', icon: 'lightbulb', color: '#4bcffa' },
  entertainment: { name: 'Electronics & Work', icon: 'tv', color: '#575fcf' },
  garage: { name: 'EV & Heavy Loads', icon: 'car', color: '#0be881' }
};

const DEFAULT_APPLIANCES = [
  {
    id: 'ac_split',
    name: '1.5 Ton Inverter AC',
    room: 'hvac',
    watts: 1400,
    hoursPerDay: 7,
    daysPerWeek: 7,
    icon: 'wind',
    tip: 'Setting thermostat to 24°C (75°F) instead of 18°C saves up to 24% electricity.'
  },
  {
    id: 'ceiling_fan',
    name: 'Ceiling Fan (x3)',
    room: 'hvac',
    watts: 180,
    hoursPerDay: 12,
    daysPerWeek: 7,
    icon: 'fan',
    tip: 'Turn off fans when leaving the room; fans cool people, not empty space.'
  },
  {
    id: 'refrigerator',
    name: 'Double-Door Refrigerator',
    room: 'kitchen',
    watts: 180,
    hoursPerDay: 24,
    daysPerWeek: 7,
    isDutyCycle: true, // actual active compressor run ~50%
    dutyCycleRatio: 0.45,
    icon: 'refrigerator',
    tip: 'Ensure door seals are airtight and keep coils free of dust to maintain efficiency.'
  },
  {
    id: 'microwave',
    name: 'Microwave Oven',
    room: 'kitchen',
    watts: 1200,
    hoursPerDay: 0.5,
    daysPerWeek: 7,
    icon: 'microwave',
    tip: 'Microwaves use up to 80% less energy than standard conventional ovens for reheating.'
  },
  {
    id: 'induction_cooktop',
    name: 'Induction Cooktop',
    room: 'kitchen',
    watts: 1800,
    hoursPerDay: 1.5,
    daysPerWeek: 7,
    icon: 'flame',
    tip: 'Induction transfers 90% of heat directly to cookware compared to 40% on gas.'
  },
  {
    id: 'washing_machine',
    name: 'Front Load Washer',
    room: 'laundry',
    watts: 800,
    hoursPerDay: 1,
    daysPerWeek: 4,
    icon: 'shirt',
    tip: 'Washing clothes at 30°C or cold water uses 60% less energy than hot washes.'
  },
  {
    id: 'water_heater',
    name: 'Storage Water Heater (Geyser)',
    room: 'lighting',
    watts: 2000,
    hoursPerDay: 1.5,
    daysPerWeek: 7,
    icon: 'droplet',
    tip: 'Set water heater thermostat to 50-55°C (120-130°F) and use a timer switch.'
  },
  {
    id: 'led_bulbs',
    name: 'LED Bulbs (10x 10W)',
    room: 'lighting',
    watts: 100,
    hoursPerDay: 6,
    daysPerWeek: 7,
    icon: 'sun',
    tip: 'LEDs consume 85% less electricity than traditional incandescent bulbs.'
  },
  {
    id: 'smart_tv',
    name: '55" 4K Smart TV',
    room: 'entertainment',
    watts: 120,
    hoursPerDay: 5,
    daysPerWeek: 7,
    icon: 'tv',
    tip: 'Enable auto-brightness ambient light sensing to reduce panel power consumption.'
  },
  {
    id: 'desktop_pc',
    name: 'Gaming Desktop PC & Monitor',
    room: 'entertainment',
    watts: 350,
    hoursPerDay: 6,
    daysPerWeek: 7,
    icon: 'monitor',
    tip: 'Use sleep mode or power strip switches to eliminate phantom standby power draw.'
  }
];

const PRESET_PROFILES = {
  apartment_1bed: {
    name: '1-Bedroom Apartment',
    desc: 'Compact living space with basic essentials and LED lighting.',
    appliances: [
      { id: 'ac_split', name: '1.5 Ton Inverter AC', room: 'hvac', watts: 1200, hoursPerDay: 5, daysPerWeek: 7 },
      { id: 'refrigerator', name: 'Single Door Refrigerator', room: 'kitchen', watts: 120, hoursPerDay: 24, dutyCycleRatio: 0.4, daysPerWeek: 7 },
      { id: 'microwave', name: 'Microwave Oven', room: 'kitchen', watts: 1100, hoursPerDay: 0.3, daysPerWeek: 7 },
      { id: 'led_bulbs', name: 'LED Bulbs (5x 9W)', room: 'lighting', watts: 45, hoursPerDay: 5, daysPerWeek: 7 },
      { id: 'smart_tv', name: '43" LED TV', room: 'entertainment', watts: 75, hoursPerDay: 4, daysPerWeek: 7 },
      { id: 'laptop', name: 'Laptop Computer', room: 'entertainment', watts: 65, hoursPerDay: 8, daysPerWeek: 7 }
    ]
  },
  family_house: {
    name: '3-Bedroom Family House',
    desc: 'Typical family home with multiple AC units, laundry, and cooking gear.',
    appliances: [
      { id: 'ac_1', name: 'Main AC (Living Room)', room: 'hvac', watts: 1800, hoursPerDay: 7, daysPerWeek: 7 },
      { id: 'ac_2', name: 'Bedroom AC', room: 'hvac', watts: 1200, hoursPerDay: 8, daysPerWeek: 7 },
      { id: 'fans', name: 'Ceiling Fans (4x)', room: 'hvac', watts: 240, hoursPerDay: 10, daysPerWeek: 7 },
      { id: 'fridge', name: 'French Door Refrigerator', room: 'kitchen', watts: 220, hoursPerDay: 24, dutyCycleRatio: 0.45, daysPerWeek: 7 },
      { id: 'induction', name: 'Induction Cooktop', room: 'kitchen', watts: 1800, hoursPerDay: 1.5, daysPerWeek: 7 },
      { id: 'washer', name: 'Washing Machine', room: 'laundry', watts: 900, hoursPerDay: 1, daysPerWeek: 5 },
      { id: 'dryer', name: 'Clothes Dryer', room: 'laundry', watts: 2500, hoursPerDay: 0.75, daysPerWeek: 3 },
      { id: 'water_heater', name: 'Water Geyser 25L', room: 'lighting', watts: 2000, hoursPerDay: 2, daysPerWeek: 7 },
      { id: 'leds', name: 'LED Bulbs (15x)', room: 'lighting', watts: 150, hoursPerDay: 6, daysPerWeek: 7 },
      { id: 'tv', name: '65" Smart OLED TV', room: 'entertainment', watts: 160, hoursPerDay: 5, daysPerWeek: 7 }
    ]
  },
  eco_smart: {
    name: 'Eco-Optimized Smart House',
    desc: 'High-efficiency home with solar offset, inverter ACs, heat pumps, and LEDs.',
    appliances: [
      { id: 'inv_ac', name: '5-Star Heat Pump AC', room: 'hvac', watts: 900, hoursPerDay: 6, daysPerWeek: 7 },
      { id: 'bldc_fans', name: 'BLDC Energy Saving Fans (3x)', room: 'hvac', watts: 84, hoursPerDay: 8, daysPerWeek: 7 },
      { id: 'inv_fridge', name: 'Inverter Refrigerator', room: 'kitchen', watts: 110, hoursPerDay: 24, dutyCycleRatio: 0.35, daysPerWeek: 7 },
      { id: 'hp_water_heater', name: 'Heat Pump Water Heater', room: 'lighting', watts: 500, hoursPerDay: 2, daysPerWeek: 7 },
      { id: 'leds', name: 'Smart Dimming LEDs', room: 'lighting', watts: 60, hoursPerDay: 5, daysPerWeek: 7 },
      { id: 'washer_eco', name: 'Cold-Wash Smart Washer', room: 'laundry', watts: 400, hoursPerDay: 0.8, daysPerWeek: 4 }
    ]
  }
};

const CURRENCIES = {
  USD: { symbol: '$', code: 'USD', name: 'US Dollar', ratePerKwh: 0.16, co2Factor: 0.385 },
  EUR: { symbol: '€', code: 'EUR', name: 'Euro', ratePerKwh: 0.26, co2Factor: 0.255 },
  GBP: { symbol: '£', code: 'GBP', name: 'British Pound', ratePerKwh: 0.28, co2Factor: 0.210 },
  INR: { symbol: '₹', code: 'INR', name: 'Indian Rupee', ratePerKwh: 7.50, co2Factor: 0.710 },
  CAD: { symbol: 'CA$', code: 'CAD', name: 'Canadian Dollar', ratePerKwh: 0.14, co2Factor: 0.150 },
  AUD: { symbol: 'A$', code: 'AUD', name: 'Australian Dollar', ratePerKwh: 0.32, co2Factor: 0.650 }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ROOM_CATEGORIES, DEFAULT_APPLIANCES, PRESET_PROFILES, CURRENCIES };
}
