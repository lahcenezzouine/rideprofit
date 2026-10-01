import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fuelPriceEntrySchema } from "@/lib/validation";
import { getOrCreateVehicleSettings } from "@/lib/settingsService";

export async function GET() {
  const history = await prisma.fuelPriceHistory.findMany({
    orderBy: { date: "desc" },
    take: 100,
  });
  return NextResponse.json(history);
}

/**
 * Logs a new fuel price entry AND updates the "current" price on
 * VehicleSettings, since that's what every new calculation reads.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const parsed = fuelPriceEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const entry = await prisma.fuelPriceHistory.create({
    data: {
      fuelType: data.fuelType,
      pricePerLiter: data.pricePerLiter,
      station: data.station ?? null,
      city: data.city ?? null,
      date: data.date ? new Date(data.date) : new Date(),
    },
  });

  const settings = await getOrCreateVehicleSettings();
  await prisma.vehicleSettings.update({
    where: { id: settings.id },
    data: { fuelPricePerLiter: data.pricePerLiter, fuelType: data.fuelType },
  });

  return NextResponse.json(entry, { status: 201 });
}
