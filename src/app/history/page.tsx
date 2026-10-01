"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/apiClient";
import { formatCurrency, formatNumber, statusLabel } from "@/lib/format";

export default function HistoryPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("DH");

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [status, setStatus] = useState("");
  const [returnType, setReturnType] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (from) params.from = new Date(from).toISOString();
    if (to) params.to = new Date(to).toISOString();
    if (origin) params.origin = origin;
    if (destination) params.destination = destination;
    if (status) params.status = status;
    if (returnType) params.returnType = returnType;

    const [tripList, summaryData] = await Promise.all([
      api.listTrips(params),
      api.getAnalyticsSummary(params),
    ]);
    setTrips(tripList);
    setSummary(summaryData);
    setLoading(false);
  }, [from, to, origin, destination, status, returnType]);

  useEffect(() => {
    // Intentional: (re-)fetch whenever a filter changes. `load` itself
    // sets loading/trips/summary state once its data arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  useEffect(() => {
    api.getSettings().then((s) => setCurrency(s.currency ?? "DH"));
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("Delete this trip from history?")) return;
    await api.deleteTrip(id);
    load();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 pb-28 sm:pb-10 space-y-5">
      <div>
        <h1 className="text-xl font-bold">Trip History</h1>
        <p className="text-sm text-muted mt-0.5">
          Every saved trip keeps the fuel price and settings used at the time — editing settings later never changes these numbers.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <FilterField label="From">
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </FilterField>
        <FilterField label="To">
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        </FilterField>
        <FilterField label="Status">
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="PROFITABLE">Profitable</option>
            <option value="LOW_PROFIT">Low profit</option>
            <option value="LOSS">Loss</option>
          </select>
        </FilterField>
        <FilterField label="Return type">
          <select className="input" value={returnType} onChange={(e) => setReturnType(e.target.value)}>
            <option value="">All</option>
            <option value="NONE">One-way</option>
            <option value="EMPTY">Empty return</option>
            <option value="PAID">Paid return</option>
          </select>
        </FilterField>
        <FilterField label="Origin">
          <input className="input" value={origin} onChange={(e) => setOrigin(e.target.value)} />
        </FilterField>
        <FilterField label="Destination">
          <input className="input" value={destination} onChange={(e) => setDestination(e.target.value)} />
        </FilterField>
      </div>

      {summary && (
        <div className="rounded-2xl border border-border bg-surface p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <Stat label="Trips" value={summary.totalTrips} />
          <Stat label="Revenue" value={formatCurrency(summary.totalRevenue, currency)} />
          <Stat label="Cost" value={formatCurrency(summary.totalCost, currency)} />
          <Stat label="Profit" value={formatCurrency(summary.totalProfit, currency)} />
          <Stat label="Avg profit" value={formatCurrency(summary.avgProfit, currency)} />
          <Stat label="Avg profit/km" value={`${formatNumber(summary.avgProfitPerKm, 2)}`} />
          <Stat label="Total distance" value={`${formatNumber(summary.totalDistanceKm, 0)} km`} />
          <Stat label="Fuel used" value={`${formatNumber(summary.totalFuelLiters, 1)} L`} />
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface overflow-x-auto">
        {loading ? (
          <div className="p-6 text-muted text-sm">Loading...</div>
        ) : trips.length === 0 ? (
          <div className="p-6 text-muted text-sm">No trips found.</div>
        ) : (
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted border-b border-border">
                <th className="p-3">Date</th>
                <th className="p-3">Route</th>
                <th className="p-3">Return</th>
                <th className="p-3 text-right">Distance</th>
                <th className="p-3 text-right">Revenue</th>
                <th className="p-3 text-right">Cost</th>
                <th className="p-3 text-right">Profit</th>
                <th className="p-3">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {trips.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="p-3 whitespace-nowrap">
                    {new Date(t.date).toLocaleDateString()}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {t.origin} → {t.destination}
                  </td>
                  <td className="p-3">{t.returnType}</td>
                  <td className="p-3 text-right">{formatNumber(t.totalDistanceKm, 0)} km</td>
                  <td className="p-3 text-right">{formatCurrency(t.revenue, currency)}</td>
                  <td className="p-3 text-right">{formatCurrency(t.totalCost, currency)}</td>
                  <td className="p-3 text-right font-semibold">{formatCurrency(t.profit, currency)}</td>
                  <td className="p-3 whitespace-nowrap">{statusLabel(t.status)}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="text-xs text-muted hover:text-[var(--status-bad-fg)]"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.6rem;
          border: 1px solid var(--border);
          background: var(--background);
          padding: 0.5rem 0.7rem;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium mb-1 block text-muted">{label}</label>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}
