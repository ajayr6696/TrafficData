import { useEffect, useMemo, useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useTrafficQuery } from '@/hooks/useTrafficQuery';
import { yearsBetween } from '@/lib/filterDefaults';
import { formatCompactNumber } from '@/lib/format';
import { trafficApi } from '@/services/trafficApi';
import type { TrafficFiltersResponse } from '@/types/traffic';

type TopCountriesBarProps = {
  metadata: TrafficFiltersResponse | null;
};

export default function TopCountriesBar({ metadata }: TopCountriesBarProps) {
  const [year, setYear] = useState<number | ''>('');
  const [vehicleId, setVehicleId] = useState('TOTAL');
  const yearOptions = useMemo(
    () => yearsBetween(metadata?.yearRange.min, metadata?.yearRange.max),
    [metadata],
  );

  useEffect(() => {
    if (metadata?.yearRange.max && !year) {
      setYear(metadata.yearRange.max);
    }
  }, [metadata, year]);

  const enabled = Boolean(year);
  const query = useTrafficQuery(
    () => trafficApi.getTopCountries(Number(year), 15, vehicleId),
    [year, vehicleId],
    enabled,
  );
  const vehicleOptions = [
    { code: 'TOTAL', label: 'Calculated total' },
    ...(metadata?.topLevelVehicleTypes || []),
    ...(metadata?.subCategoryVehicleTypes || []),
  ];
  const selectedVehicle = vehicleOptions.find((vehicle) => vehicle.code === vehicleId);

  return (
    <ChartCard
      title="Country ranking"
      description={`Eurostat-style bar ranking for ${selectedVehicle?.label || vehicleId}`}
      isLoading={query.isLoading}
      error={query.error}
      action={(
        <div className="grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="rankYear">Year</Label>
            <Select id="rankYear" value={year} onChange={(event) => setYear(Number(event.target.value))}>
              {yearOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rankVehicle">Vehicle</Label>
            <Select id="rankVehicle" value={vehicleId} onChange={(event) => setVehicleId(event.target.value)}>
              {vehicleOptions.map((vehicle) => (
                <option key={vehicle.code} value={vehicle.code}>{vehicle.label}</option>
              ))}
            </Select>
          </div>
        </div>
      )}
    >
      <ChartContainer config={{ traffic_volume: { label: 'Traffic volume', color: 'hsl(var(--chart-2))' } }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={query.data || []}
            layout="vertical"
            margin={{ left: 24, right: 20, top: 12, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="4 4" horizontal={false} />
            <XAxis type="number" tickFormatter={formatCompactNumber} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="country_label" tickLine={false} axisLine={false} width={130} />
            <Tooltip content={<ChartTooltipContent />} />
            <Bar dataKey="traffic_volume" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </ChartCard>
  );
}
