import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateTripProfitability } from "@/lib/calculator";
import {
  getOrCreateVehicleSettings,
  mergeWithSettings,
} from "@/lib/settingsService";
import { tripSaveRequestSchema } from "@/lib/validation";
import { buildTripSnapshot } from "@/lib/tripSnapshot";
import type { Prisma } from "@prisma/client";

/**
 * GET /api/trips — trip history, with optional filters for analytics
 * (section 17): date range, origin, destination, status, one-way/return.
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

  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 500) : 200;

  const trips = await prisma.trip.findMany({
    where,
    orderBy: { date: "desc" },
    take: limit,
  });

  return NextResponse.json(trips);
}

/**
 * POST /api/trips — calculate AND persist a trip. Freezes the current
 * VehicleSettings into the Trip row via buildTripSnapshot so later
 * settings edits never retroactively change this trip's numbers.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const parsed = tripSaveRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const req = parsed.data;
  const settings = await getOrCreateVehicleSettings();
  const calcInput = mergeWithSettings(req, settings);
  const result = calculateTripProfitability(calcInput);

  const costModeFull =
    (req.maintenanceEnabled ?? settings.maintenanceEnabled) ||
    (req.tireEnabled ?? settings.tireEnabled) ||
    (req.oilServiceEnabled ?? settings.oilServiceEnabled) ||
    (req.depreciationEnabled ?? settings.depreciationEnabled) ||
    (req.otherEnabled ?? settings.otherEnabled);

  const snapshot = buildTripSnapshot(
    {
      fuelPrice: calcInput.fuelPrice,
      consumption: calcInput.consumption,
      maintenancePerKm: calcInput.maintenancePerKm ?? 0,
      tireCostPerKm: calcInput.tireCostPerKm ?? 0,
      oilServicePerKm: calcInput.oilServicePerKm ?? 0,
      depreciationPerKm: calcInput.depreciationPerKm ?? 0,
      otherCostPerKm: calcInput.otherCostPerKm ?? 0,
    },
    {
      origin: req.origin,
      destination: req.destination,
      notes: req.notes,
      routeId: req.routeId ?? null,
      offerPrice: req.offerPrice,
      pickupDistanceKm: calcInput.pickupDistanceKm ?? 0,
      passengerDistanceKm: req.passengerDistanceKm,
      returnDistanceKm: calcInput.returnDistanceKm ?? 0,
      returnType: req.returnType,
      returnOfferPrice: calcInput.returnOfferPrice ?? 0,
      outboundToll: calcInput.outboundToll ?? 0,
      returnToll: calcInput.returnToll ?? 0,
      profitMode: calcInput.profitMode ?? "fixed",
      desiredProfit: calcInput.desiredProfit ?? 0,
      desiredMargin: calcInput.desiredMargin ?? 0,
      pickupTimeMinutes: calcInput.pickupTimeMinutes,
      waitingTimeMinutes: calcInput.waitingTimeMinutes,
      tripDurationMinutes: calcInput.tripDurationMinutes,
    },
    result,
    costModeFull
  );

  const trip = await prisma.trip.create({
    data: {
      ...snapshot,
      date: req.date ? new Date(req.date) : new Date(),
    },
  });

  return NextResponse.json({ trip, result });
}
