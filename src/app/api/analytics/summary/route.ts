import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * Trip History Analytics (section 17) — same filter set as /api/trips
 * (date range, origin, destination, status, return type) but returns
 * aggregated totals instead of the row list.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const where: Prisma.TripWhereInput = {};

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (from || to) {
    where.date = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }
  const origin = searchParams.get("origin");
  if (origin) where.origin = { contains: origin };
  const destination = searchParams.get("destination");
  if (destination) where.destination = { contains: destination };
  const status = searchParams.get("status");
  if (status) where.status = status;
  const returnType = searchParams.get("returnType");
  if (returnType) where.returnType = returnType;

  const agg = await prisma.trip.aggregate({
    where,
    _sum: {
      revenue: true,
      totalCost: true,
      profit: true,
      totalDistanceKm: true,
      fuelLiters: true,
    },
    _avg: { profit: true, profitPerKm: true },
    _count: { _all: true },
  });

  return NextResponse.json({
    totalTrips: agg._count._all,
    totalRevenue: agg._sum.revenue ?? 0,
    totalCost: agg._sum.totalCost ?? 0,
    totalProfit: agg._sum.profit ?? 0,
    totalDistanceKm: agg._sum.totalDistanceKm ?? 0,
    totalFuelLiters: agg._sum.fuelLiters ?? 0,
    avgProfit: agg._avg.profit ?? 0,
    avgProfitPerKm: agg._avg.profitPerKm ?? 0,
  });
}
