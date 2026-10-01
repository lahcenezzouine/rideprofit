/**
 * Builds the persistence snapshot for a Trip.
 *
 * Trips must NEVER be silently recalculated with today's settings — the
 * fuel price, consumption and per-km rates that were actually used at
 * calculation time are frozen into the Trip row. This module is the single
 * place that decides what gets frozen, so history stays historically
 * accurate even after the driver edits VehicleSettings later.
 */
import type {
  ReturnType,
  ProfitMode,
  ProfitabilityStatus,
} from "./calculator";

export interface CostSnapshotInputs {
  fuelPrice: number;
  consumption: number;
  maintenancePerKm: number;
  tireCostPerKm: number;
  oilServicePerKm: number;
  depreciationPerKm: number;
  otherCostPerKm: number;
}

export interface TripFormInput {
  origin: string;
  destination: string;
  notes?: string;
  routeId?: number | null;
  offerPrice: number;
  pickupDistanceKm: number;
  passengerDistanceKm: number;
  returnDistanceKm: number;
  returnType: ReturnType;
  returnOfferPrice: number;
  outboundToll: number;
  returnToll: number;
  profitMode: ProfitMode;
  desiredProfit: number;
  desiredMargin: number;
  pickupTimeMinutes?: number | null;
  waitingTimeMinutes?: number | null;
  tripDurationMinutes?: number | null;
}

export interface TripCalcResultForSnapshot {
  totalDistanceKm: number;
  fuelLiters: number;
  fuelCost: number;
  tollCost: number;
  maintenanceCost: number;
  tireCost: number;
  oilServiceCost: number;
  depreciationCost: number;
  otherCost: number;
  totalCost: number;
  revenue: number;
  profit: number;
  profitPerKm: number;
  profitPerHour: number | null;
  profitMargin: number;
  breakEvenPrice: number;
  targetPrice: number;
  status: ProfitabilityStatus;
}

/**
 * Pure function: combines the settings snapshot used for the calculation,
 * the driver's trip-form input, and the calculator's output into exactly
 * the shape that gets written to the Trip table. Nothing here reads "live"
 * settings — everything is frozen the moment this is called.
 */
export function buildTripSnapshot(
  settingsUsed: CostSnapshotInputs,
  form: TripFormInput,
  result: TripCalcResultForSnapshot,
  costModeFull: boolean
) {
  return {
    origin: form.origin,
    destination: form.destination,
    notes: form.notes ?? null,
    routeId: form.routeId ?? null,

    offerPrice: form.offerPrice,
    pickupDistanceKm: form.pickupDistanceKm,
    passengerDistanceKm: form.passengerDistanceKm,
    returnDistanceKm: form.returnDistanceKm,
    returnType: form.returnType,
    returnOfferPrice: form.returnOfferPrice,
    outboundToll: form.outboundToll,
    returnToll: form.returnToll,

    // --- Frozen settings snapshot (the whole point of this module) ---
    fuelPriceUsed: settingsUsed.fuelPrice,
    consumptionUsed: settingsUsed.consumption,
    maintenancePerKmUsed: settingsUsed.maintenancePerKm,
    tireCostPerKmUsed: settingsUsed.tireCostPerKm,
    oilServicePerKmUsed: settingsUsed.oilServicePerKm,
    depreciationPerKmUsed: settingsUsed.depreciationPerKm,
    otherCostPerKmUsed: settingsUsed.otherCostPerKm,
    costModeFull,

    desiredProfitAmount: form.desiredProfit,
    desiredProfitMargin: form.desiredMargin,
    profitMode: form.profitMode,

    pickupTimeMinutes: form.pickupTimeMinutes ?? null,
    waitingTimeMinutes: form.waitingTimeMinutes ?? null,
    tripDurationMinutes: form.tripDurationMinutes ?? null,

    // --- Frozen computed outputs ---
    totalDistanceKm: result.totalDistanceKm,
    fuelLiters: result.fuelLiters,
    fuelCost: result.fuelCost,
    tollCost: result.tollCost,
    maintenanceCost: result.maintenanceCost,
    tireCost: result.tireCost,
    oilServiceCost: result.oilServiceCost,
    depreciationCost: result.depreciationCost,
    otherCost: result.otherCost,
    totalCost: result.totalCost,

    revenue: result.revenue,
    profit: result.profit,
    profitPerKm: result.profitPerKm,
    profitPerHour: result.profitPerHour,
    profitMargin: result.profitMargin,

    breakEvenPrice: result.breakEvenPrice,
    targetPrice: result.targetPrice,
    status: result.status,
  };
}
