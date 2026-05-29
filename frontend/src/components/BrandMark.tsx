import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

type BrandMarkProps = {
  className?: string;
  iconClassName?: string;
};

/** Same Activity pulse icon used in the header badge and browser favicon. */
export default function BrandMark({ className, iconClassName }: BrandMarkProps) {
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center', className)}>
      <Activity className={cn('h-3.5 w-3.5', iconClassName)} aria-hidden />
    </span>
  );
}
