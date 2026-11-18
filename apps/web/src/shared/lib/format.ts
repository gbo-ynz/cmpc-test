const priceFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' });

export const formatPrice = (amount: number): string => priceFormatter.format(amount);

export const formatDate = (iso: string): string => dateFormatter.format(new Date(iso));
