export type CountryOption = {
  code: string;
  label: string;
};

export type VehicleOption = {
  code: string;
  label: string;
  level: 'root' | 'top-level' | 'sub-category' | 'unknown';
  parent_code: string | null;
  parent_label: string | null;
  has_children: boolean;
};

export type TrafficFiltersResponse = {
  countries: CountryOption[];
  sourceVehicleTypes: VehicleOption[];
  vehicleTypes: VehicleOption[];
  topLevelVehicleTypes: VehicleOption[];
  subCategoryVehicleTypes: VehicleOption[];
  yearRange: {
    min: number | null;
    max: number | null;
  };
  countryYearRanges: Record<string, {
    min: number;
    max: number;
  }>;
  recommendedDefaults: {
    country_code: string;
    vehicle_id: string;
    start_year: number | null;
    end_year: number | null;
  };
};

export type TrafficQuery = {
  country_code?: string;
  country_codes?: string;
  vehicle_id?: string;
  parent_vehicle_id?: string;
  year?: number;
  start_year?: number;
  end_year?: number;
  limit?: number;
};

export type TrendPoint = {
  year: number;
  traffic_volume: number;
  is_calculated?: boolean;
};

export type CountryTotal = {
  country_code: string;
  country_label: string;
  vehicle_id?: string;
  vehicle_label?: string;
  traffic_volume: number;
  is_calculated?: boolean;
};

export type VehicleTotal = {
  vehicle_id: string;
  vehicle_label: string;
  vehicle_level: string;
  parent_vehicle_id: string | null;
  parent_vehicle_label: string | null;
  traffic_volume: number;
  is_calculated?: boolean;
};

export type VehicleYearTotal = {
  year: number;
  vehicle_id: string;
  vehicle_label: string;
  vehicle_level: string;
  parent_vehicle_id: string | null;
  parent_vehicle_label: string | null;
  traffic_volume: number;
  is_calculated?: boolean;
};

export type CountryYearTotal = {
  year: number;
  country_code: string;
  country_label: string;
  traffic_volume: number;
  is_calculated?: boolean;
};

export type VehicleHierarchyGroup = {
  mainGroups: VehicleTotal[];
  lorries: VehicleTotal[];
  buses: VehicleTotal[];
  motorcycles: VehicleTotal[];
};

export type VehicleHierarchyYearGroup = {
  mainGroups: VehicleYearTotal[];
  lorries: VehicleYearTotal[];
  buses: VehicleYearTotal[];
  motorcycles: VehicleYearTotal[];
};
