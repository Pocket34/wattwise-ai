// Common Device Model for WattWise AI
// Unified abstraction across Demo, Google Home, Matter, and Smart Device API

export const DeviceType = {
  AC: 'AC',
  FAN: 'FAN',
  LIGHT: 'LIGHT',
  TV: 'TV',
  REFRIGERATOR: 'REFRIGERATOR',
  WASHING_MACHINE: 'WASHING_MACHINE',
  WATER_HEATER: 'WATER_HEATER',
  SMART_PLUG: 'SMART_PLUG',
  OTHER: 'OTHER'
};

export const DeviceCapability = {
  POWER: 'power',
  SWITCH: 'switch',
  TEMPERATURE: 'temperature',
  BRIGHTNESS: 'brightness',
  FAN_SPEED: 'fanSpeed',
  ENERGY_MONITORING: 'energyMonitoring'
};

export const DeviceSource = {
  DEMO: 'demo',
  GOOGLE_HOME: 'google_home',
  MATTER: 'matter',
  DEVICE_API: 'device_api'
};

/**
 * Normalizes any external or internal device representation into the standard CommonDevice format
 */
export function normalizeDevice(raw) {
  const type = mapToDeviceType(raw.type || raw.category);
  const source = raw.source || raw.connection_type || DeviceSource.DEMO;

  return {
    id: String(raw.id),
    name: raw.name || 'Unnamed Device',
    nameHi: raw.name_hi || raw.nameHi || raw.name,
    room: raw.room || 'General',
    type,
    manufacturer: raw.manufacturer || getManufacturerForSource(source),
    online: Boolean(raw.online ?? raw.is_connected ?? true),
    powerWatts: Math.round(Number(raw.powerWatts ?? raw.power_watts ?? 0)),
    baselineWatts: Math.round(Number(raw.baselineWatts ?? raw.baseline_watts ?? raw.powerWatts ?? raw.power_watts ?? 0)),
    energyTodayKwh: Number(Number(raw.energyTodayKwh ?? raw.daily_hours ? ((raw.power_watts * raw.daily_hours) / 1000) : 0).toFixed(2)),
    state: {
      isOn: Boolean(raw.state?.isOn ?? raw.is_on),
      tempSetpoint: raw.state?.tempSetpoint ?? raw.temp_setpoint ?? (type === DeviceType.AC ? 24.0 : undefined),
      brightness: raw.state?.brightness ?? raw.brightness ?? (type === DeviceType.LIGHT ? 100 : undefined),
      fanSpeed: raw.state?.fanSpeed ?? raw.device_speed ?? (type === DeviceType.FAN ? 3 : undefined),
      waterTemp: raw.state?.waterTemp ?? raw.water_temp ?? (type === DeviceType.WATER_HEATER ? 55.0 : undefined),
      vampireActive: Boolean(raw.state?.vampireActive ?? raw.vampire_active),
      standbyWatts: Number(raw.state?.standbyWatts ?? raw.standby_watts ?? 0)
    },
    capabilities: raw.capabilities || getDefaultCapabilities(type),
    source,
    lastUpdated: raw.lastUpdated || raw.updated_at || new Date().toISOString()
  };
}

function mapToDeviceType(typeOrCategory) {
  if (!typeOrCategory) return DeviceType.OTHER;
  const str = String(typeOrCategory).toUpperCase();
  if (str.includes('AC') || str.includes('COOLING') || str.includes('AIR_CONDITIONER')) return DeviceType.AC;
  if (str.includes('FAN') || str.includes('COMFORT')) return DeviceType.FAN;
  if (str.includes('LIGHT') || str.includes('LED') || str.includes('BULB')) return DeviceType.LIGHT;
  if (str.includes('TV') || str.includes('TELEVISION') || str.includes('ENTERTAINMENT')) return DeviceType.TV;
  if (str.includes('FRIDGE') || str.includes('REFRIGERAT')) return DeviceType.REFRIGERATOR;
  if (str.includes('WASH') || str.includes('LAUNDRY')) return DeviceType.WASHING_MACHINE;
  if (str.includes('GEYSER') || str.includes('WATER_HEATER') || str.includes('HEATER')) return DeviceType.WATER_HEATER;
  if (str.includes('PLUG') || str.includes('OUTLET') || str.includes('SWITCH')) return DeviceType.SMART_PLUG;
  return DeviceType.OTHER;
}

function getDefaultCapabilities(type) {
  const common = [DeviceCapability.POWER, DeviceCapability.SWITCH, DeviceCapability.ENERGY_MONITORING];
  switch (type) {
    case DeviceType.AC:
      return [...common, DeviceCapability.TEMPERATURE];
    case DeviceType.FAN:
      return [...common, DeviceCapability.FAN_SPEED];
    case DeviceType.LIGHT:
      return [...common, DeviceCapability.BRIGHTNESS];
    case DeviceType.WATER_HEATER:
      return [...common, DeviceCapability.TEMPERATURE];
    default:
      return common;
  }
}

function getManufacturerForSource(source) {
  switch (source) {
    case DeviceSource.GOOGLE_HOME:
      return 'Google Home Ecosystem';
    case DeviceSource.MATTER:
      return 'Matter Certified Protocol';
    case DeviceSource.DEVICE_API:
      return 'Cloud Device Gateway';
    default:
      return 'WattWise Local Simulator';
  }
}
