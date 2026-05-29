import * as React from 'react';
import { cn } from '@/lib/utils';

export type ChartConfig = Record<string, {
  label: string;
  color: string;
}>;

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);

export function ChartContainer({
  config,
  className,
  children,
}: {
  config: ChartConfig;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <ChartContext.Provider value={{ config }}>
      <div className={cn('h-[320px] w-full', className)}>
        {children}
      </div>
    </ChartContext.Provider>
  );
}

const useChart = () => {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error('Chart components must be rendered inside ChartContainer');
  }

  return context;
};

export function ChartTooltipContent({ active, payload, label }: any) {
  const { config } = useChart();

  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="min-w-36 rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
      {label !== undefined && (
        <div className="mb-1 font-medium">{label}</div>
      )}
      <div className="space-y-1">
        {payload.map((item: any) => {
          const key = String(item.name || item.dataKey);
          const itemConfig = config[key];
          const color = item.color || itemConfig?.color || 'hsl(var(--primary))';

          return (
            <div key={key} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                {itemConfig?.label || key}
              </span>
              <span className="font-medium">
                {Number(item.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ChartLegendContent({ payload }: any) {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-xs text-muted-foreground">
      {payload.map((item: any) => {
        const key = String(item.dataKey || item.value);
        const itemConfig = config[key];

        return (
          <div key={key} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: item.color || itemConfig?.color }}
            />
            <span>{itemConfig?.label || key}</span>
          </div>
        );
      })}
    </div>
  );
}
