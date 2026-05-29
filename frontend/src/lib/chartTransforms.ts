export type LongChartRow = {
  year: number;
  traffic_volume: number;
  [key: string]: string | number | boolean | null | undefined;
};

export type PivotRow = {
  year: number;
  [key: string]: string | number;
};

export const getSeriesKeys = <T extends Record<string, unknown>>(rows: T[], key: keyof T) => (
  [...new Set(rows.map((row) => String(row[key])).filter(Boolean))].sort()
);

export const pivotByYear = <T extends LongChartRow>(
  rows: T[],
  seriesKey: keyof T,
  valueKey: keyof T = 'traffic_volume',
) => {
  const grouped = new Map<number, PivotRow>();

  rows.forEach((row) => {
    const year = Number(row.year);
    const series = String(row[seriesKey]);
    const value = Number(row[valueKey]);
    const current = grouped.get(year) || { year };

    current[series] = Number(current[series] || 0) + value;
    grouped.set(year, current);
  });

  return [...grouped.values()].sort((a, b) => Number(a.year) - Number(b.year));
};
