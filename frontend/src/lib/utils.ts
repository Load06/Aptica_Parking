export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString('es-ES', opts ?? { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function isWeekend(d: Date) {
  const day = d.getDay();
  return day === 0 || day === 6;
}

export const HALF_DAY_LABELS = {
  full: 'Día completo',
  am:   'Solo mañana (8–14h)',
  pm:   'Solo tarde (14–19h)',
} as const;
