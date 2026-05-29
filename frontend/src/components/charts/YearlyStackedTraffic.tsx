import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ChartCard from '@/components/dashboard/ChartCard';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { ChartContainer, ChartLegendContent, ChartTooltipContent } from '@/components/ui/chart';
import { useTrafficQuery } from '@/hooks/useTrafficQuery';
import { getSeriesKeys, pivotByYear } from '@/lib/chartTransforms';
import { defaultCountry, yearRangeForCountry, yearsBetween } from '@/lib/filterDefaults';
import { formatCompactNumber } from '@/lib/format';
import { trafficApi } from '@/services/trafficApi';
import type { TrafficFiltersResponse, VehicleYearTotal } from '@/types/traffic';
import { colorForIndex } from './chartPalette';

type YearlyStackedTrafficProps = {
  metadata: TrafficFiltersResponse | null;
};

type YearlyBarPanelProps = {
  title: string;
  rows: VehicleYearTotal[];
};

function YearlyBarPanel({ title, rows }: YearlyBarPanelProps) {
  const series = useMemo(() => getSeriesKeys(rows, 'vehicle_label'), [rows]);
  const data = useMemo(() => pivotByYear(rows, 'vehicle_label'), [rows]);
  const config = Object.fromEntries(series.map((key, index) => [
    key,
    { label: key, color: colorForIndex(index) },
  ]));

  return (
    <div className="rounded-md border p-3">
      <h4 className="text-sm font-semibold">{title}</h4>
      <ChartContainer config={config} className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 8, right: 20, top: 12, bottom: 8 }}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="year" tickLine={false} axisLine={false} />
            <YAxis tickFormatter={formatCompactNumber} tickLine={false} axisLine={false} width={70} />
            <Tooltip content={<ChartTooltipContent />} />
            <Legend content={<ChartLegendContent />} />
            {series.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="traffic"
                fill={colorForIndex(index)}
                radius={index === series.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}

export default function YearlyStackedTraffic({ metadata }: YearlyStackedTrafficProps) {
  const firstCountry = defaultCountry(metadata);
  const [country, setCountry] = useState('');
  const [startYear, setStartYear] = useState<number | ''>('');
  const [endYear, setEndYear] = useState<number | ''>('');

  useEffect(() => {
    if (firstCountry && !country) {
      setCountry(firstCountry.code);
    }
  }, [country, firstCountry]);

  useEffect(() => {
    const range = yearRangeForCountry(metadata, country);
    if (range.min && range.max && (!startYear || !endYear)) {
      setStartYear(range.min);
      setEndYear(range.max);
    }
  }, [country, endYear, metadata, startYear]);

  const yearOptions = useMemo(() => {
    const range = yearRangeForCountry(metadata, country);
    return yearsBetween(range.min, range.max);
  }, [country, metadata]);
  const enabled = Boolean(country && startYear && endYear);
  const query = useTrafficQuery(
    () => trafficApi.getHierarchyYearly({
      country_code: country,
      start_year: Number(startYear),
      end_year: Number(endYear),
    }),
    [country, startYear, endYear],
    enabled,
  );

  return (
    <ChartCard
      title="Vehicle bars by year"
      description="Four yearly bar charts with calculated parent totals"
      isLoading={query.isLoading}
      error={query.error}
      action={(
        <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="barCountry">Country</Label>
            <Select id="barCountry" value={country} onChange={(event) => setCountry(event.target.value)}>
              {metadata?.countries.map((item) => (
                <option key={item.code} value={item.code}>{item.label}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="barStartYear">From</Label>
            <Select id="barStartYear" value={startYear} onChange={(event) => setStartYear(Number(event.target.value))}>
              {yearOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="barEndYear">To</Label>
            <Select id="barEndYear" value={endYear} onChange={(event) => setEndYear(Number(event.target.value))}>
              {yearOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>
          </div>
        </div>
      )}
    >
      <div className="grid gap-4">
        <YearlyBarPanel title="Main groups" rows={query.data?.mainGroups || []} />
        <YearlyBarPanel title="Lorries" rows={query.data?.lorries || []} />
        <YearlyBarPanel title="Buses" rows={query.data?.buses || []} />
        <YearlyBarPanel title="Motorcycles" rows={query.data?.motorcycles || []} />
      </div>
    </ChartCard>
  );
}
