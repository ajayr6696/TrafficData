import { Activity, BarChart3, Database, Route } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useTrafficQuery } from '@/hooks/useTrafficQuery';
import { trafficApi } from '@/services/trafficApi';
import TotalTrafficTrend from '../charts/TotalTrafficTrend';
import TopCountriesBar from '../charts/TopCountriesBar';
import VehicleDistributionDonut from '../charts/VehicleDistributionDonut';
import YearlyStackedTraffic from '../charts/YearlyStackedTraffic';
import CumulativeCompositionArea from '../charts/CumulativeCompositionArea';

export default function Dashboard() {
  const metadataQuery = useTrafficQuery(() => trafficApi.getFilters(), []);
  const metadata = metadataQuery.data;
  const countryHoverList = metadata?.countries
    .map((country) => `${country.label} (${country.code})`)
    .join('\n') || 'No countries loaded';
  const vehicleHoverList = metadata?.sourceVehicleTypes
    .map((vehicle) => `${vehicle.label} (${vehicle.code})`)
    .join('\n') || 'No vehicle categories loaded';

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="w-fit gap-2">
              <Activity className="h-3.5 w-3.5" />
              Traffic analytics
            </Badge>
            <div>
              <h1 className="text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
                Traffic Data Dashboard
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Country trends, parent vehicle composition, and focused subcategory breakdowns from CSV-backed traffic records.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:min-w-[440px]">
            <Card title={countryHoverList}>
              <CardContent className="flex items-center gap-3 p-4">
                <Database className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Countries</p>
                  <p className="text-lg font-semibold">{metadata?.countries.length || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card title={vehicleHoverList}>
              <CardContent className="flex items-center gap-3 p-4">
                <Route className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Vehicle categories</p>
                  <p className="text-lg font-semibold">{metadata?.sourceVehicleTypes.length || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <BarChart3 className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Years</p>
                  <p className="text-lg font-semibold">
                    {metadata?.yearRange.min && metadata?.yearRange.max
                      ? `${metadata.yearRange.min}-${metadata.yearRange.max}`
                      : '0'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </header>

        {metadataQuery.error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {metadataQuery.error}
          </div>
        )}

        <section className="grid gap-5">
          <CumulativeCompositionArea metadata={metadata} mode="growth" />
          <TotalTrafficTrend metadata={metadata} />
          <VehicleDistributionDonut metadata={metadata} />
          <YearlyStackedTraffic metadata={metadata} />
          <TopCountriesBar metadata={metadata} />
          <CumulativeCompositionArea metadata={metadata} mode="mix" />
        </section>
      </div>
    </main>
  );
}
