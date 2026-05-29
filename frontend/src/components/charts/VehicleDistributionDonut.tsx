import { useEffect, useMemo, useState } from 'react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import ChartCard from '@/components/dashboard/ChartCard';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useTrafficQuery } from '@/hooks/useTrafficQuery';
import { defaultCountry, yearRangeForCountry, yearsBetween } from '@/lib/filterDefaults';
import { trafficApi } from '@/services/trafficApi';
import type { TrafficFiltersResponse, VehicleTotal } from '@/types/traffic';
import { colorForIndex } from './chartPalette';

type VehicleDistributionDonutProps = {
  metadata: TrafficFiltersResponse | null;
};

type PiePanelProps = {
  title: string;
  rows: VehicleTotal[];
};

function PiePanel({ title, rows }: PiePanelProps) {
  const config = Object.fromEntries(rows.map((row, index) => [
    row.vehicle_label,
    { label: row.vehicle_label, color: colorForIndex(index) },
  ]));

  return (
    <div className="rounded-md border p-3">
      <h4 className="text-sm font-semibold">{title}</h4>
      <ChartContainer config={config} className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<ChartTooltipContent />} />
            <Pie
              data={rows}
              dataKey="traffic_volume"
              nameKey="vehicle_label"
              innerRadius={48}
              outerRadius={86}
              paddingAngle={2}
            >
              {rows.map((entry, index) => (
                <Cell key={entry.vehicle_id} fill={colorForIndex(index)} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}

export default function VehicleDistributionDonut({ metadata }: VehicleDistributionDonutProps) {
  const firstCountry = defaultCountry(metadata);
  const [country, setCountry] = useState('');
  const [year, setYear] = useState<number | ''>('');

  useEffect(() => {
    if (firstCountry && !country) {
      setCountry(firstCountry.code);
    }
  }, [country, firstCountry]);

  useEffect(() => {
    const range = yearRangeForCountry(metadata, country);
    if (range.max && (!year || year > range.max || year < (range.min || range.max))) {
      setYear(range.max);
    }
  }, [country, metadata, year]);

  const yearOptions = useMemo(() => {
    const range = yearRangeForCountry(metadata, country);
    return yearsBetween(range.min, range.max);
  }, [country, metadata]);
  const enabled = Boolean(country && year);
  const query = useTrafficQuery(
    () => trafficApi.getHierarchyDistribution({
      country_code: country,
      year: Number(year),
    }),
    [country, year],
    enabled,
  );

  return (
    <ChartCard
      title="Vehicle distribution"
      description="Main groups include reported parent values as unidentified subsets plus their available subcategories"
      isLoading={query.isLoading}
      error={query.error}
      action={(
        <div className="grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pieCountry">Country</Label>
            <Select id="pieCountry" value={country} onChange={(event) => setCountry(event.target.value)}>
              {metadata?.countries.map((item) => (
                <option key={item.code} value={item.code}>{item.label}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pieYear">Year</Label>
            <Select id="pieYear" value={year} onChange={(event) => setYear(Number(event.target.value))}>
              {yearOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>
          </div>
        </div>
      )}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <PiePanel title="Main groups" rows={query.data?.mainGroups || []} />
        <PiePanel title="Lorries" rows={query.data?.lorries || []} />
        <PiePanel title="Buses" rows={query.data?.buses || []} />
        <PiePanel title="Motorcycles" rows={query.data?.motorcycles || []} />
      </div>
    </ChartCard>
  );
}
