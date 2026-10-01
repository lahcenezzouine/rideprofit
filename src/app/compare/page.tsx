"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { formatCurrency, formatNumber } from "@/lib/format";

export default function ComparePage() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [currency, setCurrency] = useState("DH");

  useEffect(() => {
    api.getRouteComparison().then(setRows);
    api.getSettings().then((s) => setCurrency(s.currency ?? "DH"));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 pb-28 sm:pb-10 space-y-5">
      <div>
        <h1 className="text-xl font-bold">Route Profitability Comparison</h1>
        <p className="text-sm text-muted mt-0.5">
          Factual averages from your saved trip history, grouped by route. No automatic &ldquo;best route&rdquo; ranking — you decide.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface overflow-x-auto">
        {!rows ? (
          <div className="p-6 text-muted text-sm">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-muted text-sm">
            No trips saved yet. Save trips from the calculator to see route comparisons here.
          </div>
        ) : (
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted border-b border-border">
                <th className="p-3">Route</th>
                <th className="p-3 text-right">Trips</th>
                <th className="p-3 text-right">Avg Revenue</th>
                <th className="p-3 text-right">Avg Distance</th>
                <th className="p-3 text-right">Avg Cost</th>
                <th className="p-3 text-right">Avg Profit</th>
                <th className="p-3 text-right">Profit/km</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.origin}-${r.destination}`} className="border-b border-border last:border-0">
                  <td className="p-3 whitespace-nowrap font-medium">
                    {r.origin} → {r.destination}
                  </td>
                  <td className="p-3 text-right">{r.trips}</td>
                  <td className="p-3 text-right">{formatCurrency(r.avgRevenue, currency)}</td>
                  <td className="p-3 text-right">{formatNumber(r.avgDistance, 0)} km</td>
                  <td className="p-3 text-right">{formatCurrency(r.avgCost, currency)}</td>
                  <td className="p-3 text-right font-semibold">{formatCurrency(r.avgProfit, currency)}</td>
                  <td className="p-3 text-right">{formatNumber(r.profitPerKm, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
