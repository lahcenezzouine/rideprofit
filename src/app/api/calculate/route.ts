import { NextResponse } from "next/server";
import { calculateTripProfitability } from "@/lib/calculator";
import { getOrCreateVehicleSettings, mergeWithSettings } from "@/lib/settingsService";
import { tripCalcRequestSchema } from "@/lib/validation";

/**
 * Stateless profitability calculation — does not persist anything.
 * This is the endpoint the Quick Calculator and main Trip Calculator call.
 * The backend is the single source of truth: the frontend only renders
 * whatever this returns, it never recomputes the formulas itself.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const parsed = tripCalcRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const settings = await getOrCreateVehicleSettings();
  const calcInput = mergeWithSettings(parsed.data, settings);
  const result = calculateTripProfitability(calcInput);

  return NextResponse.json({ input: calcInput, result, settingsUsed: settings });
}
