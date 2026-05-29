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
import { Select } from '@/components/ui/select';
import { ChartContainer, ChartLegendContent, ChartTooltipContent } from '@/components/ui/chart';
import { useTrafficFilters } from '@/context/TrafficFiltersContext';
import { getSeriesKeys, pivotByYear } from '@/lib/chartTransforms';
import { formatCompactNumber } from '@/lib/format';
import { useTrafficQuery } from '@/hooks/useTrafficQuery';
import { trafficApi } from '@/services/trafficApi';
import { colorForIndex } from './chartPalette';

type CountryComparisonGroupedProps = {
  countries: string[];
};

export default function CountryComparisonGrouped({ countries }: CountryComparisonGroupedProps) {
  const { filters } = useTrafficFilters();
  const fallbackCountry = countries.find((country) => country !== filters.country) || countries[0] || '';
  const [compareCountry, setCompareCountry] = useState(fallbackCountry);

  useEffect(() => {
    if (!compareCountry || compareCountry === filters.country) {
      setCompareCountry(fallbackCountry);
    }
  }, [compareCountry, fallbackCountry, filters.country]);

  const enabled = Boolean(filters.country && compareCountry && filters.country !== compareCountry);
  const query = useTrafficQuery(
    () => trafficApi.getComparison(filters.country, compareCountry, filters.startYear, filters.endYear),
    [filters.country, compareCountry, filters.startYear, filters.endYear],
    enabled,
  );

  const series = useMemo(() => getSeriesKeys(query.data || [], 'country_code'), [query.data]);
  const data = useMemo(() => pivotByYear(query.data || [], 'country_code'), [query.data]);
  const config = Object.fromEntries(series.map((key, index) => [
    key,
    { label: key, color: colorForIndex(index) },
  ]));

  return (
    <ChartCard
      title="Country comparison"
      description="Total traffic side by side across the selected years"
      isLoading={query.isLoading}
      error={query.error}
      action={(
        <Select
          aria-label="Comparison country"
          className="w-28"
          value={compareCountry}
          onChange={(event) => setCompareCountry(event.target.value)}
        >
          {countries
            .filter((country) => country !== filters.country)
            .map((country) => (
              <option key={country} value={country}>{country}</option>
            ))}
        </Select>
      )}
    >
      <ChartContainer config={config}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 8, right: 20, top: 12, bottom: 8 }}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="year" tickLine={false} axisLine={false} />
            <YAxis tickFormatter={formatCompactNumber} tickLine={false} axisLine={false} width={70} />
            <Tooltip content={<ChartTooltipContent />} />
            <Legend content={<ChartLegendContent />} />
            {series.map((key, index) => (
              <Bar key={key} dataKey={key} fill={colorForIndex(index)} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </ChartCard>
  );
}
