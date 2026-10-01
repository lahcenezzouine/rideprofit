import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateVehicleSettings } from "@/lib/settingsService";
import { vehicleSettingsUpdateSchema } from "@/lib/validation";

export async function GET() {
  const settings = await getOrCreateVehicleSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const parsed = vehicleSettingsUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await getOrCreateVehicleSettings();
  const updated = await prisma.vehicleSettings.update({
    where: { id: existing.id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}
