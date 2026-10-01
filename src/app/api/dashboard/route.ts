import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function startOfDay(d: Date) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}
function startOfWeek(d: Date) {
  const r = startOfDay(d);
  const day = r.getDay(); // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1) - day; // Monday as start of week
  r.setDate(r.getDate() + diff);
  return r;
}
function startOfMonth(d: Date) {
  const r = startOfDay(d);
  r.setDate(1);
  return r;
}

async function aggregate(where: { date: { gte: Date } }) {
  const agg = await prisma.trip.aggregate({
    where,
    _sum: {
      revenue: true,
      totalCost: true,
      profit: true,
      totalDistanceKm: true,
      fuelLiters: true,
    },
    _count: { _all: true },
  });
  const revenue = agg._sum.revenue ?? 0;
  const cost = agg._sum.totalCost ?? 0;
  const profit = agg._sum.profit ?? 0;
  const trips = agg._count._all;
  return {
    revenue,
    cost,
    profit,
    trips,
    totalDistanceKm: agg._sum.totalDistanceKm ?? 0,
    fuelLiters: agg._sum.fuelLiters ?? 0,
    avgProfitPerTrip: trips > 0 ? profit / trips : 0,
    avgProfitPerKm:
      (agg._sum.totalDistanceKm ?? 0) > 0
        ? profit / (agg._sum.totalDistanceKm ?? 1)
        : 0,
  };
}

export async function GET() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const [today, week, month] = await Promise.all([
    aggregate({ date: { gte: todayStart } }),
    aggregate({ date: { gte: weekStart } }),
    aggregate({ date: { gte: monthStart } }),
  ]);

  // Last 14 days, for the daily charts (revenue vs cost, daily profit).
  const chartStart = startOfDay(now);
  chartStart.setDate(chartStart.getDate() - 13);
  const recentTrips = await prisma.trip.findMany({
    where: { date: { gte: chartStart } },
    orderBy: { date: "asc" },
    select: {
      date: true,
      revenue: true,
      totalCost: true,
      profit: true,
      totalDistanceKm: true,
      fuelLiters: true,
    },
  });

  const dayBuckets = new Map<
    string,
    { revenue: number; cost: number; profit: number; distance: number; fuel: number; trips: number }
  >();
  for (let i = 0; i < 14; i++) {
    const d = new Date(chartStart);
    d.setDate(d.getDate() + i);
    dayBuckets.set(d.toISOString().slice(0, 10), {
      revenue: 0,
      cost: 0,
      profit: 0,
      distance: 0,
      fuel: 0,
      trips: 0,
    });
  }
  for (const t of recentTrips) {
    const key = t.date.toISOString().slice(0, 10);
    const bucket = dayBuckets.get(key);
    if (!bucket) continue;
    bucket.revenue += t.revenue;
    bucket.cost += t.totalCost;
    bucket.profit += t.profit;
    bucket.distance += t.totalDistanceKm;
    bucket.fuel += t.fuelLiters;
    bucket.trips += 1;
  }

  const dailySeries = Array.from(dayBuckets.entries()).map(([date, v]) => ({
    date,
    ...v,
  }));

  const recentIndividualTrips = await prisma.trip.findMany({
    where: { date: { gte: chartStart } },
    orderBy: { date: "asc" },
    select: { id: true, date: true, origin: true, destination: true, profit: true },
    take: 50,
  });

  return NextResponse.json({
    today,
    week: { ...week, avgProfitPerTrip: week.avgProfitPerTrip, avgProfitPerKm: week.avgProfitPerKm },
    month,
    charts: {
      dailySeries,
      profitPerTrip: recentIndividualTrips,
    },
  });
}
