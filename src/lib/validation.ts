import { z } from "zod";

export const returnTypeSchema = z.enum(["NONE", "EMPTY", "PAID"]);
export const profitModeSchema = z.enum(["fixed", "margin"]);

/**
 * Shared shape for "calculate a trip" requests. Every cost-model field is
 * optional — when omitted, the API route fills it in from the driver's
 * current VehicleSettings. This lets the quick calculator send just
 * {offerPrice, passengerDistanceKm, outboundToll, returnType} while still
 * allowing power users / tests to override any individual input.
 */
export const tripCalcRequestSchema = z.object({
  offerPrice: z.number().min(0),
  pickupDistanceKm: z.number().min(0).optional(),
  passengerDistanceKm: z.number().min(0),

  returnType: returnTypeSchema.default("NONE"),
  returnDistanceKm: z.number().min(0).optional(),
  returnOfferPrice: z.number().min(0).optional(),

  outboundToll: z.number().min(0).optional(),
  returnToll: z.number().min(0).optional(),

  // Overrides — all optional, fall back to current VehicleSettings.
  fuelPrice: z.number().positive().optional(),
  consumption: z.number().positive().optional(),
  maintenancePerKm: z.number().min(0).optional(),
  tireCostPerKm: z.number().min(0).optional(),
  oilServicePerKm: z.number().min(0).optional(),
  depreciationPerKm: z.number().min(0).optional(),
  otherCostPerKm: z.number().min(0).optional(),

  maintenanceEnabled: z.boolean().optional(),
  tireEnabled: z.boolean().optional(),
  oilServiceEnabled: z.boolean().optional(),
  depreciationEnabled: z.boolean().optional(),
  otherEnabled: z.boolean().optional(),
  tollEnabled: z.boolean().optional(),

  profitMode: profitModeSchema.optional(),
  desiredProfit: z.number().optional(),
  desiredMargin: z.number().min(0).max(99.999).optional(),

  pickupTimeMinutes: z.number().min(0).optional(),
  waitingTimeMinutes: z.number().min(0).optional(),
  tripDurationMinutes: z.number().min(0).optional(),
});

export type TripCalcRequest = z.infer<typeof tripCalcRequestSchema>;

/** Extends the calc request with the metadata needed to save a Trip. */
export const tripSaveRequestSchema = tripCalcRequestSchema.extend({
  origin: z.string().min(1),
  destination: z.string().min(1),
  notes: z.string().optional(),
  routeId: z.number().int().optional().nullable(),
  date: z.string().datetime().optional(), // ISO date, defaults to now
});

export type TripSaveRequest = z.infer<typeof tripSaveRequestSchema>;

export const vehicleSettingsUpdateSchema = z.object({
  vehicleName: z.string().min(1).optional(),
  fuelType: z.string().min(1).optional(),
  currency: z.string().min(1).optional(),
  fuelPricePerLiter: z.number().positive().optional(),
  avgConsumptionPer100: z.number().positive().optional(),
  maintenancePerKm: z.number().min(0).optional(),
  maintenanceEnabled: z.boolean().optional(),
  tireCostPerKm: z.number().min(0).optional(),
  tireEnabled: z.boolean().optional(),
  oilServicePerKm: z.number().min(0).optional(),
  oilServiceEnabled: z.boolean().optional(),
  depreciationPerKm: z.number().min(0).optional(),
  depreciationEnabled: z.boolean().optional(),
  otherCostPerKm: z.number().min(0).optional(),
  otherEnabled: z.boolean().optional(),
  tollEnabled: z.boolean().optional(),
  desiredProfitAmount: z.number().optional(),
  desiredProfitMargin: z.number().min(0).max(99.999).optional(),
  profitMode: profitModeSchema.optional(),
  defaultReturnType: returnTypeSchema.optional(),
  defaultTollEnabled: z.boolean().optional(),
});

export const routeUpsertSchema = z.object({
  origin: z.string().min(1),
  destination: z.string().min(1),
  typicalDistanceKm: z.number().positive(),
  outboundToll: z.number().min(0).default(0),
  returnToll: z.number().min(0).default(0),
  notes: z.string().optional().nullable(),
});

export const fuelPriceEntrySchema = z.object({
  fuelType: z.string().min(1),
  pricePerLiter: z.number().positive(),
  station: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  date: z.string().datetime().optional(),
});
