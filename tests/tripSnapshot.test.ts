import { describe, it, expect } from "vitest";
import { calculateTripProfitability } from "../src/lib/calculator";
import { buildTripSnapshot, type CostSnapshotInputs, type TripFormInput } from "../src/lib/tripSnapshot";

// 17. Historical trip preserving old fuel price
describe("Trip snapshot preserves historical settings", () => {
  const form: TripFormInput = {
    origin: "Casablanca",
    destination: "Essaouira",
    routeId: null,
    offerPrice: 600,
    pickupDistanceKm: 0,
    passengerDistanceKm: 370,
    returnDistanceKm: 0,
    returnType: "NONE",
    returnOfferPrice: 0,
    outboundToll: 75,
    returnToll: 0,
    profitMode: "fixed",
    desiredProfit: 200,
    desiredMargin: 0,
  };

  it("freezes the fuel price and consumption used at calculation time", () => {
    const oldSettings: CostSnapshotInputs = {
      fuelPrice: 16,
      consumption: 6.2,
      maintenancePerKm: 0,
      tireCostPerKm: 0,
      oilServicePerKm: 0,
      depreciationPerKm: 0,
      otherCostPerKm: 0,
    };

    const oldResult = calculateTripProfitability({
      offerPrice: form.offerPrice,
      passengerDistanceKm: form.passengerDistanceKm,
      returnType: form.returnType,
      outboundToll: form.outboundToll,
      fuelPrice: oldSettings.fuelPrice,
      consumption: oldSettings.consumption,
      maintenanceEnabled: false,
      tireEnabled: false,
      oilServiceEnabled: false,
      depreciationEnabled: false,
      otherEnabled: false,
      profitMode: form.profitMode,
      desiredProfit: form.desiredProfit,
    });

    const oldTrip = buildTripSnapshot(oldSettings, form, oldResult, false);

    // Fuel price later rises to 18 DH/L — this must NEVER retroactively
    // change the stored trip.
    const newSettings: CostSnapshotInputs = { ...oldSettings, fuelPrice: 18 };
    const newResult = calculateTripProfitability({
      offerPrice: form.offerPrice,
      passengerDistanceKm: form.passengerDistanceKm,
      returnType: form.returnType,
      outboundToll: form.outboundToll,
      fuelPrice: newSettings.fuelPrice,
      consumption: newSettings.consumption,
      maintenanceEnabled: false,
      tireEnabled: false,
      oilServiceEnabled: false,
      depreciationEnabled: false,
      otherEnabled: false,
      profitMode: form.profitMode,
      desiredProfit: form.desiredProfit,
    });
    const newTrip = buildTripSnapshot(newSettings, form, newResult, false);

    // The old trip's stored fuel price/cost must remain exactly what it was.
    expect(oldTrip.fuelPriceUsed).toBe(16);
    expect(oldTrip.fuelCost).toBeCloseTo(367.04, 2);
    expect(oldTrip.totalCost).toBeCloseTo(442.04, 2);

    // The new trip reflects the new price — proving the two are independent.
    expect(newTrip.fuelPriceUsed).toBe(18);
    expect(newTrip.fuelCost).toBeGreaterThan(oldTrip.fuelCost);

    // Re-running history logic never reaches for "current" settings: the
    // old snapshot's own fields are self-sufficient to reproduce its cost.
    const recomputedFromSnapshot = calculateTripProfitability({
      offerPrice: form.offerPrice,
      passengerDistanceKm: form.passengerDistanceKm,
      returnType: oldTrip.returnType as "NONE",
      outboundToll: oldTrip.outboundToll,
      fuelPrice: oldTrip.fuelPriceUsed,
      consumption: oldTrip.consumptionUsed,
      maintenanceEnabled: false,
      tireEnabled: false,
      oilServiceEnabled: false,
      depreciationEnabled: false,
      otherEnabled: false,
    });
    expect(recomputedFromSnapshot.fuelCost).toBeCloseTo(oldTrip.fuelCost, 2);
  });
});
