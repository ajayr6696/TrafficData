import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type ChartCardProps = {
  title: string;
  description: string;
  isLoading?: boolean;
  error?: string | null;
  children: React.ReactNode;
  action?: React.ReactNode;
};

export default function ChartCard({
  title,
  description,
  isLoading,
  error,
  children,
  action,
}: ChartCardProps) {
  return (
    <Card className="min-h-[430px] overflow-hidden">
      <CardHeader className="flex-col items-start justify-between gap-4 xl:flex-row">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {action}
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-[320px] w-full" />}
        {!isLoading && error && (
          <div className="flex h-[320px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
            {error}
          </div>
        )}
        {!isLoading && !error && children}
      </CardContent>
    </Card>
  );
}
