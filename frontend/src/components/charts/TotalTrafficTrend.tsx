import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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
import { pivotByYear, getSeriesKeys } from '@/lib/chartTransforms';
import { defaultCountry } from '@/lib/filterDefaults';
import { formatCompactNumber } from '@/lib/format';
import { trafficApi } from '@/services/trafficApi';
import type { TrafficFiltersResponse } from '@/types/traffic';
import { colorForIndex } from './chartPalette';

type TotalTrafficTrendProps = {
  metadata: TrafficFiltersResponse | null;
};

export default function TotalTrafficTrend({ metadata }: TotalTrafficTrendProps) {
  const firstCountry = defaultCountry(metadata);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

  useEffect(() => {
    if (firstCountry && !selectedCountries.length) {
      setSelectedCountries([firstCountry.code]);
    }
  }, [firstCountry, selectedCountries.length]);

  const enabled = selectedCountries.length > 0;
  const query = useTrafficQuery(
    () => trafficApi.getMultiCountryTrend(selectedCountries),
    [selectedCountries.join(',')],
    enabled,
  );
  const series = useMemo(() => getSeriesKeys(query.data || [], 'country_label'), [query.data]);
  const data = useMemo(() => pivotByYear(query.data || [], 'country_label'), [query.data]);
  const config = Object.fromEntries(series.map((key, index) => [
    key,
    { label: key, color: colorForIndex(index) },
  ]));

  return (
    <ChartCard
      title="Total traffic trend"
      description="Calculated absolute totals, one line per selected country"
      isLoading={query.isLoading}
      error={query.error}
      action={(
        <div className="w-full max-w-72 space-y-2">
          <Label htmlFor="trendCountries">Countries</Label>
          <Select
            id="trendCountries"
            multiple
            value={selectedCountries}
            className="h-28"
            onChange={(event) => {
              const values = Array.from(event.target.selectedOptions).map((option) => option.value);
              if (values.length) {
                setSelectedCountries(values);
              }
            }}
          >
            {metadata?.countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.label}
              </option>
            ))}
          </Select>
        </div>
      )}
    >
      <ChartContainer config={config}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 8, right: 20, top: 12, bottom: 8 }}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="year" tickLine={false} axisLine={false} />
            <YAxis tickFormatter={formatCompactNumber} tickLine={false} axisLine={false} width={70} />
            <Tooltip content={<ChartTooltipContent />} />
            <Legend content={<ChartLegendContent />} />
            {series.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colorForIndex(index)}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </ChartCard>
  );
}
