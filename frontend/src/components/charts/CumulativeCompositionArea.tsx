import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
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
import type { TrafficFiltersResponse } from '@/types/traffic';
import { colorForIndex } from './chartPalette';

type CumulativeCompositionAreaProps = {
  metadata: TrafficFiltersResponse | null;
  mode: 'growth' | 'mix';
};

export default function CumulativeCompositionArea({ metadata, mode }: CumulativeCompositionAreaProps) {
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
    () => (mode === 'growth'
      ? trafficApi.getCumulative({
          country_code: country,
          start_year: Number(startYear),
          end_year: Number(endYear),
        })
      : trafficApi.getStacked({
          country_code: country,
          start_year: Number(startYear),
          end_year: Number(endYear),
        })),
    [country, startYear, endYear, mode],
    enabled,
  );

  const series = useMemo(() => getSeriesKeys(query.data || [], 'vehicle_label'), [query.data]);
  const data = useMemo(() => pivotByYear(query.data || [], 'vehicle_label'), [query.data]);
  const config = Object.fromEntries(series.map((key, index) => [
    key,
    { label: key, color: colorForIndex(index) },
  ]));
  const isGrowth = mode === 'growth';

  return (
    <ChartCard
      title={isGrowth ? 'Cumulative growth' : 'Vehicle mix'}
      description={isGrowth
        ? 'Cumulative parent-group growth using calculated parent totals'
        : 'Yearly parent-group mix using calculated parent totals'}
      isLoading={query.isLoading}
      error={query.error}
      action={(
        <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor={`${mode}Country`}>Country</Label>
            <Select id={`${mode}Country`} value={country} onChange={(event) => setCountry(event.target.value)}>
              {metadata?.countries.map((item) => (
                <option key={item.code} value={item.code}>{item.label}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${mode}StartYear`}>From</Label>
            <Select id={`${mode}StartYear`} value={startYear} onChange={(event) => setStartYear(Number(event.target.value))}>
              {yearOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${mode}EndYear`}>To</Label>
            <Select id={`${mode}EndYear`} value={endYear} onChange={(event) => setEndYear(Number(event.target.value))}>
              {yearOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>
          </div>
        </div>
      )}
    >
      <ChartContainer config={config}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 8, right: 20, top: 12, bottom: 8 }}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="year" tickLine={false} axisLine={false} />
            <YAxis tickFormatter={formatCompactNumber} tickLine={false} axisLine={false} width={70} />
            <Tooltip content={<ChartTooltipContent />} />
            <Legend content={<ChartLegendContent />} />
            {series.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId={isGrowth ? undefined : 'mix'}
                stroke={colorForIndex(index)}
                fill={colorForIndex(index)}
                fillOpacity={isGrowth ? 0.18 : 0.35}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </ChartCard>
  );
}
