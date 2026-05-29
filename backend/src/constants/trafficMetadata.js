export const COUNTRY_METADATA = {
  BE: { code: 'BE', label: 'Belgium' },
  BG: { code: 'BG', label: 'Bulgaria' },
  CZ: { code: 'CZ', label: 'Czechia' },
  DK: { code: 'DK', label: 'Denmark' },
  DE: { code: 'DE', label: 'Germany' },
  EE: { code: 'EE', label: 'Estonia' },
  IE: { code: 'IE', label: 'Ireland' },
  ES: { code: 'ES', label: 'Spain' },
  FR: { code: 'FR', label: 'France' },
  HR: { code: 'HR', label: 'Croatia' },
  IT: { code: 'IT', label: 'Italy' },
  CY: { code: 'CY', label: 'Cyprus' },
  LV: { code: 'LV', label: 'Latvia' },
  LT: { code: 'LT', label: 'Lithuania' },
  HU: { code: 'HU', label: 'Hungary' },
  MT: { code: 'MT', label: 'Malta' },
  NL: { code: 'NL', label: 'Netherlands' },
  AT: { code: 'AT', label: 'Austria' },
  PL: { code: 'PL', label: 'Poland' },
  PT: { code: 'PT', label: 'Portugal' },
  RO: { code: 'RO', label: 'Romania' },
  SI: { code: 'SI', label: 'Slovenia' },
  FI: { code: 'FI', label: 'Finland' },
  SE: { code: 'SE', label: 'Sweden' },
  IS: { code: 'IS', label: 'Iceland' },
  NO: { code: 'NO', label: 'Norway' },
  CH: { code: 'CH', label: 'Switzerland' },
  UK: { code: 'UK', label: 'United Kingdom' },
  MK: { code: 'MK', label: 'North Macedonia' },
  GE: { code: 'GE', label: 'Georgia' },
  TR: { code: 'TR', label: 'Türkiye' },
  UA: { code: 'UA', label: 'Ukraine' },
};

export const RAW_TOTAL_VEHICLE_LABEL = 'Other unidentified vehicles';
export const RAW_TOTAL_PARENT_VEHICLE_ID = 'RDMVEH_OTH';

export const VEHICLE_METADATA = {
  TOTAL: {
    code: 'TOTAL',
    label: 'Total vehicles',
    level: 'root',
    parent_code: null,
  },
  CAR: {
    code: 'CAR',
    label: 'Passenger cars',
    level: 'top-level',
    parent_code: null,
  },
  CAR_UNIDENTIFIED: {
    code: 'CAR_UNIDENTIFIED',
    label: 'Unidentified passenger cars',
    level: 'sub-category',
    parent_code: 'CAR',
  },
  LOR: {
    code: 'LOR',
    label: 'Lorries',
    level: 'top-level',
    parent_code: null,
  },
  LOR_UNIDENTIFIED: {
    code: 'LOR_UNIDENTIFIED',
    label: 'Unidentified lorries',
    level: 'sub-category',
    parent_code: 'LOR',
  },
  LOR_LE3P5: {
    code: 'LOR_LE3P5',
    label: 'Lorries <= 3.5 tonnes',
    level: 'sub-category',
    parent_code: 'LOR',
  },
  'LOR_GT3P5-6': {
    code: 'LOR_GT3P5-6',
    label: 'Lorries from > 3.5 to <= 6 tonnes',
    level: 'sub-category',
    parent_code: 'LOR',
  },
  LOR_GT6: {
    code: 'LOR_GT6',
    label: 'Lorries > 6 tonnes',
    level: 'sub-category',
    parent_code: 'LOR',
  },
  TRC: {
    code: 'TRC',
    label: 'Road tractors',
    level: 'sub-category',
    parent_code: 'LOR',
  },
  MOTO_MOP: {
    code: 'MOTO_MOP',
    label: 'Motorcycles and mopeds',
    level: 'sub-category',
    parent_code: 'MOTO',
  },
  MOP: {
    code: 'MOP',
    label: 'Mopeds',
    level: 'sub-category',
    parent_code: 'MOTO',
  },
  MOTO: {
    code: 'MOTO',
    label: 'Motorcycles',
    level: 'top-level',
    parent_code: null,
  },
  MOTO_UNIDENTIFIED: {
    code: 'MOTO_UNIDENTIFIED',
    label: 'Unidentified motorcycles',
    level: 'sub-category',
    parent_code: 'MOTO',
  },
  BUS_MCO_TRO: {
    code: 'BUS_MCO_TRO',
    label: 'Buses, motor coaches, and trolley buses',
    level: 'sub-category',
    parent_code: 'BUS',
  },
  BUS_MCO_MIN: {
    code: 'BUS_MCO_MIN',
    label: 'Mini-buses and mini-coaches',
    level: 'sub-category',
    parent_code: 'BUS',
  },
  BUS: {
    code: 'BUS',
    label: 'Buses',
    level: 'top-level',
    parent_code: null,
  },
  BUS_UNIDENTIFIED: {
    code: 'BUS_UNIDENTIFIED',
    label: 'Unidentified buses',
    level: 'sub-category',
    parent_code: 'BUS',
  },
  BUS_TRO: {
    code: 'BUS_TRO',
    label: 'Trolley buses',
    level: 'sub-category',
    parent_code: 'BUS',
  },
  MCO: {
    code: 'MCO',
    label: 'Motor coaches',
    level: 'sub-category',
    parent_code: 'BUS',
  },
  BIKE: {
    code: 'BIKE',
    label: 'Bicycles',
    level: 'top-level',
    parent_code: null,
  },
  BIKE_UNIDENTIFIED: {
    code: 'BIKE_UNIDENTIFIED',
    label: 'Unidentified bicycles',
    level: 'sub-category',
    parent_code: 'BIKE',
  },
  RDMVEH_OTH: {
    code: 'RDMVEH_OTH',
    label: 'Other road motor vehicles',
    level: 'top-level',
    parent_code: null,
  },
  RDMVEH_OTH_UNIDENTIFIED: {
    code: 'RDMVEH_OTH_UNIDENTIFIED',
    label: RAW_TOTAL_VEHICLE_LABEL,
    level: 'sub-category',
    parent_code: 'RDMVEH_OTH',
  },
};

export const TOP_LEVEL_VEHICLE_IDS = Object.values(VEHICLE_METADATA)
  .filter((vehicle) => vehicle.level === 'top-level')
  .map((vehicle) => vehicle.code);

export const SUB_CATEGORY_VEHICLE_IDS = Object.values(VEHICLE_METADATA)
  .filter((vehicle) => vehicle.level === 'sub-category')
  .map((vehicle) => vehicle.code);

export const UNIDENTIFIED_VEHICLE_ID_BY_PARENT = Object.fromEntries(
  TOP_LEVEL_VEHICLE_IDS.map((vehicleId) => [vehicleId, `${vehicleId}_UNIDENTIFIED`]),
);

export const VEHICLE_HIERARCHY_GROUPS = {
  mainGroups: TOP_LEVEL_VEHICLE_IDS,
  lorries: ['LOR_UNIDENTIFIED', 'LOR_LE3P5', 'LOR_GT3P5-6', 'LOR_GT6', 'TRC'],
  buses: ['BUS_UNIDENTIFIED', 'BUS_MCO_TRO', 'BUS_MCO_MIN', 'BUS_TRO', 'MCO'],
  motorcycles: ['MOTO_UNIDENTIFIED', 'MOTO_MOP', 'MOP'],
};

export const getCountryMetadata = (countryCode) => (
  COUNTRY_METADATA[countryCode] || { code: countryCode, label: countryCode }
);

export const getVehicleMetadata = (vehicleId) => (
  VEHICLE_METADATA[vehicleId] || {
    code: vehicleId,
    label: vehicleId,
    level: 'unknown',
    parent_code: null,
  }
);

export const getVehicleChildren = (parentVehicleId) => Object.values(VEHICLE_METADATA)
  .filter((vehicle) => vehicle.parent_code === parentVehicleId)
  .map((vehicle) => vehicle.code);

export const getReportedVehicleChildren = (parentVehicleId) => getVehicleChildren(parentVehicleId)
  .filter((vehicleId) => !vehicleId.endsWith('_UNIDENTIFIED'));

export const getUnidentifiedVehicleId = (parentVehicleId) => (
  UNIDENTIFIED_VEHICLE_ID_BY_PARENT[parentVehicleId]
);

export const getVehicleLabelForRow = (row) => {
  if (row.vehicle_id === 'TOTAL' && !row.is_calculated) {
    return RAW_TOTAL_VEHICLE_LABEL;
  }

  return getVehicleMetadata(row.vehicle_id).label;
};

export const enrichCountryRow = (row) => {
  const country = getCountryMetadata(row.country_code);

  return {
    ...row,
    country_label: country.label,
  };
};

export const enrichVehicleRow = (row) => {
  const vehicle = getVehicleMetadata(row.vehicle_id);
  const parent = vehicle.parent_code ? getVehicleMetadata(vehicle.parent_code) : null;

  return {
    ...row,
    vehicle_label: getVehicleLabelForRow(row),
    vehicle_level: vehicle.level,
    parent_vehicle_id: vehicle.parent_code,
    parent_vehicle_label: parent?.label || null,
  };
};

export const enrichTrafficRow = (row) => enrichVehicleRow(enrichCountryRow(row));

export const toCountryOption = (countryCode) => getCountryMetadata(countryCode);

export const toVehicleOption = (vehicleId) => {
  const vehicle = getVehicleMetadata(vehicleId);
  const parent = vehicle.parent_code ? getVehicleMetadata(vehicle.parent_code) : null;

  return {
    ...vehicle,
    parent_label: parent?.label || null,
    has_children: getReportedVehicleChildren(vehicleId).length > 0,
  };
};

export const toSourceVehicleOption = (vehicleId) => ({
  ...toVehicleOption(vehicleId),
  label: vehicleId === 'TOTAL' ? RAW_TOTAL_VEHICLE_LABEL : getVehicleMetadata(vehicleId).label,
});
