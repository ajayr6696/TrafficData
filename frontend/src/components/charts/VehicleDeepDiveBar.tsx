import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ChartCard from '@/components/dashboard/ChartCard';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useTrafficFilters } from '@/context/TrafficFiltersContext';
import { formatCompactNumber } from '@/lib/format';
import { useTrafficQuery } from '@/hooks/useTrafficQuery';
import { trafficApi } from '@/services/trafficApi';
import type { VehicleOption } from '@/types/traffic';

type VehicleDeepDiveBarProps = {
  vehicleTypes: VehicleOption[];
};

export default function VehicleDeepDiveBar({ vehicleTypes }: VehicleDeepDiveBarProps) {
  const { filters } = useTrafficFilters();
  const selectedVehicle = vehicleTypes.find((vehicleType) => vehicleType.code === filters.vehicleType);
  const enabled = Boolean(filters.country && filters.endYear && filters.vehicleType);
  const query = useTrafficQuery(
    () => trafficApi.getDeepDive({
      country_code: filters.country,
      year: filters.endYear,
      parent_vehicle_id: filters.vehicleType,
    }),
    [filters.country, filters.endYear, filters.vehicleType],
    enabled,
  );

  return (
    <ChartCard
      title="Vehicle deep dive"
      description={`${selectedVehicle?.label || filters.vehicleType || 'Vehicle'} subcategories in ${filters.endYear || 'selected year'}`}
      isLoading={query.isLoading}
      error={query.error}
    >
      <ChartContainer config={{ traffic_volume: { label: 'Traffic volume', color: 'hsl(var(--chart-4))' } }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={query.data || []}
            layout="vertical"
            margin={{ left: 16, right: 20, top: 12, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="4 4" horizontal={false} />
            <XAxis type="number" tickFormatter={formatCompactNumber} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="vehicle_label"
              tickLine={false}
              axisLine={false}
              width={150}
            />
            <Tooltip content={<ChartTooltipContent />} />
            <Bar dataKey="traffic_volume" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </ChartCard>
  );
}
