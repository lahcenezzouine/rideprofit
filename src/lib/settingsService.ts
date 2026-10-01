import { prisma } from "./prisma";
import type { TripCalcRequest } from "./validation";
import type { TripProfitabilityInput } from "./calculator";

/**
 * There is exactly one active VehicleSettings row for this driver/vehicle.
 * Created lazily with the spec's defaults if it doesn't exist yet (e.g. a
 * fresh database that wasn't seeded).
 */
export async function getOrCreateVehicleSettings() {
  const existing = await prisma.vehicleSettings.findFirst();
  if (existing) return existing;

  return prisma.vehicleSettings.create({
    data: {
      vehicleName: "Seat Leon FR 2025",
      fuelType: "Diesel",
      currency: "MAD",
      fuelPricePerLiter: 16,
      avgConsumptionPer100: 6.2,
      maintenancePerKm: 0.3,
      tireCostPerKm: 0.15,
      oilServicePerKm: 0.2,
      depreciationPerKm: 0.5,
      otherCostPerKm: 0.1,
      desiredProfitAmount: 200,
      desiredProfitMargin: 20,
    },
  });
}

export type VehicleSettingsRecord = Awaited<
  ReturnType<typeof getOrCreateVehicleSettings>
>;

/**
 * Merges a calc request's optional overrides with the driver's current
 * VehicleSettings to produce the full input the pure calculator needs.
 * This is the ONLY place request overrides are combined with settings —
 * both /api/calculate and /api/trips use it, so they can never drift.
 */
export function mergeWithSettings(
  req: TripCalcRequest,
  settings: VehicleSettingsRecord
): TripProfitabilityInput {
  return {
    offerPrice: req.offerPrice,
    pickupDistanceKm: req.pickupDistanceKm ?? 0,
    passengerDistanceKm: req.passengerDistanceKm,

    returnType: req.returnType,
    returnDistanceKm: req.returnDistanceKm ?? 0,
    returnOfferPrice: req.returnOfferPrice ?? 0,

    outboundToll: req.outboundToll ?? 0,
    returnToll: req.returnToll ?? 0,

    fuelPrice: req.fuelPrice ?? settings.fuelPricePerLiter,
    consumption: req.consumption ?? settings.avgConsumptionPer100,

    maintenancePerKm: req.maintenancePerKm ?? settings.maintenancePerKm,
    tireCostPerKm: req.tireCostPerKm ?? settings.tireCostPerKm,
    oilServicePerKm: req.oilServicePerKm ?? settings.oilServicePerKm,
    depreciationPerKm: req.depreciationPerKm ?? settings.depreciationPerKm,
    otherCostPerKm: req.otherCostPerKm ?? settings.otherCostPerKm,

    maintenanceEnabled: req.maintenanceEnabled ?? settings.maintenanceEnabled,
    tireEnabled: req.tireEnabled ?? settings.tireEnabled,
    oilServiceEnabled: req.oilServiceEnabled ?? settings.oilServiceEnabled,
    depreciationEnabled:
      req.depreciationEnabled ?? settings.depreciationEnabled,
    otherEnabled: req.otherEnabled ?? settings.otherEnabled,
    tollEnabled: req.tollEnabled ?? settings.tollEnabled,

    profitMode: req.profitMode ?? (settings.profitMode as "fixed" | "margin"),
    desiredProfit: req.desiredProfit ?? settings.desiredProfitAmount,
    desiredMargin: req.desiredMargin ?? settings.desiredProfitMargin,

    pickupTimeMinutes: req.pickupTimeMinutes,
    waitingTimeMinutes: req.waitingTimeMinutes,
    tripDurationMinutes: req.tripDurationMinutes,
  };
}
