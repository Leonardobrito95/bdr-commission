export type Period =
  | 'this_month'
  | 'last_month'
  | 'last_3months'
  | 'last_6months'
  | 'this_year'
  | 'custom_month';

export const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'this_month',   label: 'Este mês'         },
  { value: 'last_month',   label: 'Mês anterior'     },
  { value: 'last_3months', label: 'Últimos 3 meses'  },
  { value: 'last_6months', label: 'Últimos 6 meses'  },
  { value: 'this_year',    label: 'Este ano'          },
  { value: 'custom_month', label: 'Mês específico...' },
];

function iso(d: Date): string { return d.toISOString().slice(0, 10); }

export function getPeriodRange(
  period: Period,
  customYear?: number,
  customMonth?: number,   // 0-based (0 = Janeiro)
): { dateFrom: string; dateTo: string } {
  const now   = new Date();
  const today = iso(now);

  switch (period) {
    case 'this_month': {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      return { dateFrom: iso(first), dateTo: today };
    }
    case 'last_month': {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last  = new Date(now.getFullYear(), now.getMonth(), 0);
      return { dateFrom: iso(first), dateTo: iso(last) };
    }
    case 'last_3months': {
      const first = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return { dateFrom: iso(first), dateTo: today };
    }
    case 'last_6months': {
      const first = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      return { dateFrom: iso(first), dateTo: today };
    }
    case 'this_year': {
      return { dateFrom: `${now.getFullYear()}-01-01`, dateTo: today };
    }
    case 'custom_month': {
      const y = customYear  ?? now.getFullYear();
      const m = customMonth ?? now.getMonth();
      const first = new Date(y, m, 1);
      const last  = new Date(y, m + 1, 0);
      // Se for o mês atual, usa hoje como dateTo
      const isCurrentMonth = y === now.getFullYear() && m === now.getMonth();
      return { dateFrom: iso(first), dateTo: isCurrentMonth ? today : iso(last) };
    }
  }
}

export function currentMonthRange(): { dateFrom: string; dateTo: string } {
  return getPeriodRange('this_month');
}

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/** Anos disponíveis: do atual até 3 anos atrás */
export function availableYears(): number[] {
  const current = new Date().getFullYear();
  return [current, current - 1, current - 2, current - 3];
}
