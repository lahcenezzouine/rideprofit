// UI-only formatting helpers. No calculation logic lives here — this file
// only decides how numbers the backend already computed are displayed.

export function formatCurrency(value: number, currency = "DH"): string {
  const rounded = Math.round(value * 100) / 100;
  const sign = rounded < 0 ? "-" : "";
  return `${sign}${Math.abs(rounded).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

export function formatNumber(value: number, decimals = 1): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(fraction: number, decimals = 0): string {
  return `${(fraction * 100).toFixed(decimals)}%`;
}

export function statusLabel(status: string): string {
  switch (status) {
    case "PROFITABLE":
      return "🟢 PROFITABLE";
    case "LOW_PROFIT":
      return "🟠 LOW PROFIT";
    case "LOSS":
      return "🔴 LOSS";
    default:
      return status;
  }
}
