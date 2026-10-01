import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Route profitability comparison (section 18) — aggregates saved trip
 * history by origin/destination pair. Purely factual metrics; no
 * "best route" ranking is produced, per spec.
 */
export async function GET() {
  const trips = await prisma.trip.findMany({
    select: {
      origin: true,
      destination: true,
      revenue: true,
      totalCost: true,
      profit: true,
      totalDistanceKm: true,
    },
  });

  const byRoute = new Map<
    string,
    {
      origin: string;
      destination: string;
      trips: number;
      revenue: number;
      cost: number;
      profit: number;
      distance: number;
    }
  >();

  for (const t of trips) {
    const key = `${t.origin} -> ${t.destination}`;
    const bucket =
      byRoute.get(key) ??
      {
        origin: t.origin,
        destination: t.destination,
        trips: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        distance: 0,
      };
    bucket.trips += 1;
    bucket.revenue += t.revenue;
    bucket.cost += t.totalCost;
    bucket.profit += t.profit;
    bucket.distance += t.totalDistanceKm;
    byRoute.set(key, bucket);
  }

  const rows = Array.from(byRoute.values()).map((b) => ({
    ...b,
    avgRevenue: b.revenue / b.trips,
    avgDistance: b.distance / b.trips,
    avgCost: b.cost / b.trips,
    avgProfit: b.profit / b.trips,
    profitPerKm: b.distance > 0 ? b.profit / b.distance : 0,
  }));

  return NextResponse.json(rows);
}
