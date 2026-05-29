import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type TrafficFilters = {
  country: string;
  vehicleType: string;
  startYear: number;
  endYear: number;
};

type TrafficFiltersContextValue = {
  filters: TrafficFilters;
  setFilter: <K extends keyof TrafficFilters>(key: K, value: TrafficFilters[K]) => void;
  setFilters: (filters: Partial<TrafficFilters>) => void;
};

const currentYear = new Date().getFullYear();

const defaultFilters: TrafficFilters = {
  country: '',
  vehicleType: 'LOR',
  startYear: currentYear - 10,
  endYear: currentYear,
};

const TrafficFiltersContext = createContext<TrafficFiltersContextValue | null>(null);

export function TrafficFiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilterState] = useState(defaultFilters);

  const value = useMemo<TrafficFiltersContextValue>(() => ({
    filters,
    setFilter: (key, nextValue) => {
      setFilterState((current) => ({
        ...current,
        [key]: nextValue,
      }));
    },
    setFilters: (nextFilters) => {
      setFilterState((current) => ({
        ...current,
        ...nextFilters,
      }));
    },
  }), [filters]);

  return (
    <TrafficFiltersContext.Provider value={value}>
      {children}
    </TrafficFiltersContext.Provider>
  );
}

export const useTrafficFilters = () => {
  const context = useContext(TrafficFiltersContext);
  if (!context) {
    throw new Error('useTrafficFilters must be used inside TrafficFiltersProvider');
  }

  return context;
};
