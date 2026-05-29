import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import type { TrafficFiltersResponse } from '@/types/traffic';
import { useTrafficFilters } from '@/context/TrafficFiltersContext';

type GlobalFiltersProps = {
  metadata: TrafficFiltersResponse | null;
};

export default function GlobalFilters({ metadata }: GlobalFiltersProps) {
  const { filters, setFilter, setFilters } = useTrafficFilters();
  const activeCountryRange = metadata?.countryYearRanges[filters.country];
  const minYear = activeCountryRange?.min || metadata?.yearRange.min || 1990;
  const maxYear = activeCountryRange?.max || metadata?.yearRange.max || new Date().getFullYear();
  const vehicleTypes = metadata?.topLevelVehicleTypes || [];

  const resetFilters = () => {
    setFilters({
      country: metadata?.countries[0]?.code || '',
      vehicleType: metadata?.topLevelVehicleTypes.find((vehicleType) => vehicleType.has_children)?.code
        || metadata?.topLevelVehicleTypes[0]?.code
        || 'LOR',
      startYear: minYear,
      endYear: maxYear,
    });
  };

  return (
    <section className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_150px_150px_auto]">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Select
            id="country"
            value={filters.country}
            onChange={(event) => setFilter('country', event.target.value)}
          >
            {metadata?.countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.label} ({country.code})
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehicleType">Vehicle focus</Label>
          <Select
            id="vehicleType"
            value={filters.vehicleType}
            onChange={(event) => setFilter('vehicleType', event.target.value)}
          >
            {vehicleTypes.map((vehicleType) => (
              <option key={vehicleType.code} value={vehicleType.code}>
                {vehicleType.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="startYear">Start year</Label>
          <Input
            id="startYear"
            type="number"
            min={minYear}
            max={filters.endYear}
            value={filters.startYear}
            onChange={(event) => setFilter('startYear', Number(event.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endYear">End year</Label>
          <Input
            id="endYear"
            type="number"
            min={filters.startYear}
            max={maxYear}
            value={filters.endYear}
            onChange={(event) => setFilter('endYear', Number(event.target.value))}
          />
        </div>

        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={resetFilters}
            aria-label="Reset filters"
            title="Reset filters"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
