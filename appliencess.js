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
