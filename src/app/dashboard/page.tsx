"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { api } from "@/lib/apiClient";
import { formatCurrency, formatNumber } from "@/lib/format";

const COLORS = {
  revenue: "#2563eb",
  cost: "#f97316",
  profit: "#16a34a",
  profitNeg: "#dc2626",
  grid: "var(--border)",
};

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [currency, setCurrency] = useState("DH");

  useEffect(() => {
    api.getDashboard().then(setData);
    api.getSettings().then((s) => setCurrency(s.currency ?? "DH"));
  }, []);

  if (!data) {
    return <div className="p-6 text-muted">Loading dashboard...</div>;
  }

  const dailySeries = data.charts.dailySeries.map((d: any) => ({
    ...d,
    label: d.date.slice(5),
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-5 pb-28 sm:pb-10 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted mt-0.5">Revenue, cost and profit at a glance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <PeriodCard title="Today" period={data.today} currency={currency} />
        <PeriodCard title="This week" period={data.week} currency={currency} />
        <PeriodCard title="This month" period={data.month} currency={currency} showDistance />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted mb-3">
          Revenue vs Cost (last 14 days)
        </h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={dailySeries}>
            <CartesianGrid stroke={COLORS.grid} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={40} />
            <Tooltip formatter={(v: any) => formatCurrency(Number(v), currency)} />
            <Legend />
            <Bar dataKey="revenue" name="Revenue" fill={COLORS.revenue} radius={[4, 4, 0, 0]} />
            <Bar dataKey="cost" name="Cost" fill={COLORS.cost} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted mb-3">
          Daily profit (last 14 days)
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={dailySeries}>
            <CartesianGrid stroke={COLORS.grid} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={40} />
            <Tooltip formatter={(v: any) => formatCurrency(Number(v), currency)} />
            <Line type="monotone" dataKey="profit" name="Profit" stroke={COLORS.profit} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted mb-3">
            Profit per trip (recent)
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.charts.profitPerTrip}>
              <CartesianGrid stroke={COLORS.grid} vertical={false} />
              <XAxis dataKey="id" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} width={40} />
              <Tooltip formatter={(v: any) => formatCurrency(Number(v), currency)} />
              <Bar dataKey="profit" name="Profit" radius={[4, 4, 0, 0]}>
                {data.charts.profitPerTrip.map((entry: any, i: number) => (
                  <Cell
                    key={i}
                    fill={entry.profit >= 0 ? COLORS.profit : COLORS.profitNeg}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted mb-3">
            Distance & fuel (last 14 days)
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dailySeries}>
              <CartesianGrid stroke={COLORS.grid} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={40} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="distance" name="Distance (km)" stroke={COLORS.revenue} dot={false} />
              <Line type="monotone" dataKey="fuel" name="Fuel (L)" stroke={COLORS.cost} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function PeriodCard({
  title,
  period,
  currency,
  showDistance,
}: {
  title: string;
  period: any;
  currency: string;
  showDistance?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted mb-3">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3 text-center">
        <MiniStat label="Revenue" value={formatCurrency(period.revenue, currency)} />
        <MiniStat label="Cost" value={formatCurrency(period.cost, currency)} />
        <MiniStat label="Profit" value={formatCurrency(period.profit, currency)} />
        <MiniStat label="Trips" value={String(period.trips)} />
        <MiniStat label="Avg/trip" value={formatCurrency(period.avgProfitPerTrip, currency)} />
        <MiniStat label="Avg/km" value={formatNumber(period.avgProfitPerKm, 2)} />
        {showDistance && (
          <>
            <MiniStat label="Distance" value={`${formatNumber(period.totalDistanceKm, 0)} km`} />
            <MiniStat label="Fuel" value={`${formatNumber(period.fuelLiters, 1)} L`} />
          </>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}
