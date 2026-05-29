export const chartPalette = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#0f766e',
  '#c2410c',
  '#7c3aed',
  '#be123c',
  '#2563eb',
];

export const colorForIndex = (index: number) => chartPalette[index % chartPalette.length];
