export const formatCompactNumber = (value: number) => (
  new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
);

export const formatFullNumber = (value: number) => (
  new Intl.NumberFormat('en', {
    maximumFractionDigits: 0,
  }).format(value)
);
