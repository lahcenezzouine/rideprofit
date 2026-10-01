"use client";

import { useState } from "react";
import clsx from "clsx";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";

type Status = "PROFITABLE" | "LOW_PROFIT" | "LOSS";

export interface ResultCardData {
  totalDistanceKm: number;
  fuelLiters: number;
  fuelCost: number;
  tollCost: number;
  maintenanceCost: number;
  tireCost: number;
  oilServiceCost: number;
  depreciationCost: number;
  otherCost: number;
  totalCost: number;
  revenue: number;
  profit: number;
  profitPerKm: number;
  profitPerHour: number | null;
  profitMargin: number;
  breakEvenPrice: number;
  targetPrice: number;
  minimumAcceptablePrice: number;
  offerShortfall: number;
  fuelCostPerKm: number;
  fullCostPerKm: number;
  revenuePerKm: number;
  costPerKm: number;
  status: Status;
}

const STATUS_STYLE: Record<
  Status,
  { bg: string; fg: string; border: string; label: string }
> = {
  PROFITABLE: {
    bg: "var(--status-good-bg)",
    fg: "var(--status-good-fg)",
    border: "var(--status-good-border)",
    label: "🟢 PROFITABLE",
  },
  LOW_PROFIT: {
    bg: "var(--status-warn-bg)",
    fg: "var(--status-warn-fg)",
    border: "var(--status-warn-border)",
    label: "🟠 LOW PROFIT",
  },
  LOSS: {
    bg: "var(--status-bad-bg)",
    fg: "var(--status-bad-fg)",
    border: "var(--status-bad-border)",
    label: "🔴 LOSS",
  },
};

export default function ResultCard({
  result,
  currency = "DH",
  title,
}: {
  result: ResultCardData;
  currency?: string;
  title?: string;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const style = STATUS_STYLE[result.status];

  const shortfallIsPositive = result.offerShortfall > 0;

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
      {title && (
        <div className="px-5 pt-4 text-xs font-semibold uppercase tracking-wide text-muted">
          {title}
        </div>
      )}

      {/* Status banner — the single most visible element */}
      <div
        className="mx-4 mt-3 rounded-xl px-4 py-3 flex items-center justify-between"
        style={{
          backgroundColor: style.bg,
          color: style.fg,
          border: `1px solid ${style.border}`,
        }}
      >
        <span className="font-bold text-base">{style.label}</span>
        <span className="font-bold text-xl">
          {formatCurrency(result.profit, currency)}
        </span>
      </div>

      {/* Primary numbers */}
      <div className="grid grid-cols-3 gap-2 px-4 py-4 text-center">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted">
            Revenue
          </div>
          <div className="text-lg font-semibold">
            {formatCurrency(result.revenue, currency)}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted">
            Total Cost
          </div>
          <div className="text-lg font-semibold">
            {formatCurrency(result.totalCost, currency)}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted">
            Profit
          </div>
          <div className="text-lg font-semibold" style={{ color: style.fg }}>
            {formatCurrency(result.profit, currency)}
          </div>
        </div>
      </div>

      <div className="h-px bg-border mx-4" />

      {/* Break-even / target */}
      <div className="grid grid-cols-2 gap-2 px-4 py-3 text-center">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted">
            Break-even
          </div>
          <div className="text-base font-medium">
            {formatCurrency(result.breakEvenPrice, currency)}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted">
            Target Price
          </div>
          <div className="text-base font-medium">
            {formatCurrency(result.targetPrice, currency)}
          </div>
        </div>
      </div>

      <div className="px-4 pb-3 text-sm text-center text-muted">
        {shortfallIsPositive ? (
          <>
            Passenger offer is{" "}
            <span className="font-semibold" style={{ color: style.fg }}>
              {formatCurrency(result.offerShortfall, currency)}
            </span>{" "}
            below your target.
          </>
        ) : (
          <>
            Passenger offer is{" "}
            <span className="font-semibold text-[var(--status-good-fg)]">
              {formatCurrency(-result.offerShortfall, currency)}
            </span>{" "}
            above your target. 🎉
          </>
        )}
      </div>

      <div className="h-px bg-border mx-4" />

      {/* Per-km analysis — highlighted per spec section 22 */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3 text-center">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted">
            Revenue/km
          </div>
          <div
            className={clsx(
              "text-sm font-semibold",
              result.revenuePerKm < result.fuelCostPerKm &&
                "text-[var(--status-bad-fg)]"
            )}
          >
            {formatNumber(result.revenuePerKm, 2)} {currency}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted">
            Fuel/km
          </div>
          <div className="text-sm font-semibold">
            {formatNumber(result.fuelCostPerKm, 2)} {currency}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted">
            Profit/km
          </div>
          <div className="text-sm font-semibold" style={{ color: style.fg }}>
            {formatNumber(result.profitPerKm, 2)} {currency}
          </div>
        </div>
      </div>

      {result.revenuePerKm < result.fuelCostPerKm && (
        <div className="px-4 pb-2 text-xs text-center font-medium text-[var(--status-bad-fg)]">
          ⚠️ Offer is already below fuel cost per km
        </div>
      )}

      {result.profitPerHour != null && (
        <div className="px-4 pb-3 text-sm text-center text-muted">
          Profit/hour:{" "}
          <span className="font-semibold text-foreground">
            {formatCurrency(result.profitPerHour, currency)}/h
          </span>
        </div>
      )}

      {/* Expandable full breakdown */}
      <button
        onClick={() => setShowDetails((v) => !v)}
        className="w-full px-4 py-3 text-sm font-medium text-accent border-t border-border"
      >
        {showDetails ? "Hide details ▲" : "Show full breakdown ▼"}
      </button>

      {showDetails && (
        <div className="px-5 pb-5 text-sm">
          <Row label="Total distance" value={`${formatNumber(result.totalDistanceKm, 0)} km`} />
          <Row label="Fuel consumed" value={`${formatNumber(result.fuelLiters, 2)} L`} />
          <Row label="Fuel cost" value={formatCurrency(result.fuelCost, currency)} />
          <Row label="Toll cost" value={formatCurrency(result.tollCost, currency)} />
          <Row label="Maintenance" value={formatCurrency(result.maintenanceCost, currency)} />
          <Row label="Tires" value={formatCurrency(result.tireCost, currency)} />
          <Row label="Oil/service" value={formatCurrency(result.oilServiceCost, currency)} />
          <Row label="Depreciation" value={formatCurrency(result.depreciationCost, currency)} />
          <Row label="Other costs" value={formatCurrency(result.otherCost, currency)} />
          <div className="h-px bg-border my-2" />
          <Row label="TOTAL COST" value={formatCurrency(result.totalCost, currency)} bold />
          <Row label="Cost/km" value={`${formatNumber(result.costPerKm, 2)} ${currency}`} />
          <Row label="Full cost/km" value={`${formatNumber(result.fullCostPerKm, 2)} ${currency}`} />
          <Row label="Profit margin" value={formatPercent(result.profitMargin)} />
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between py-1",
        bold && "font-semibold"
      )}
    >
      <span className="text-muted">{label}</span>
      <span>{value}</span>
    </div>
  );
}
