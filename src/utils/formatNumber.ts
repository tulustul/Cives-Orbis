const formatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

export function formatValue(value: number): string {
  return formatter.format(value);
}

export function formatValueWithSign(value: number): string {
  const displayValue = formatter.format(Math.abs(value));
  return value < 0 ? `-${displayValue}` : `+${displayValue}`;
}

export function formatPctWithSign(value: number) {
  return `${value < 0 ? "-" : "+"}${(value * 100).toFixed(0)}%`;
}

export function formatPct(value: number) {
  return `${(value * 100).toFixed(0)}%`;
}
