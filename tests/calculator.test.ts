import { describe, it, expect } from "vitest";
import {
  calculateTripProfitability,
  type TripProfitabilityInput,
} from "../src/lib/calculator";

/**
 * Shared "basic cost" baseline (fuel + tolls only, every variable cost
 * component disabled) — matches the worked examples in the spec exactly.
 */
const basic: Partial<TripProfitabilityInput> = {
  maintenanceEnabled: false,
  tireEnabled: false,
  oilServiceEnabled: false,
  depreciationEnabled: false,
  otherEnabled: false,
  tollEnabled: true,
};

describe("TripProfitabilityCalculator", () => {
  // 1. One-way profitable trip — spec section 5 (Casablanca → Essaouira)
  it("calculates a profitable one-way trip exactly as the spec example", () => {
    const r = calculateTripProfitability({
      ...basic,
      offerPrice: 600,
      passengerDistanceKm: 370,
      returnType: "NONE",
      outboundToll: 75,
      fuelPrice: 16,
      consumption: 6.2,
    });

    expect(r.fuelCost).toBeCloseTo(367.04, 2);
    expect(r.totalCost).toBeCloseTo(442.04, 2);
    expect(r.revenue).toBe(600);
    expect(r.profit).toBeCloseTo(157.96, 2);
    expect(r.profitPerKm).toBeCloseTo(0.43, 2);
    expect(r.status).not.toBe("LOSS");
  });

  // 2. One-way loss
  it("flags a one-way trip as a LOSS when revenue can't cover cost", () => {
    const r = calculateTripProfitability({
      ...basic,
      offerPrice: 50,
      passengerDistanceKm: 100,
      returnType: "NONE",
      outboundToll: 0,
      fuelPrice: 16,
      consumption: 6.2,
    });

    expect(r.fuelCost).toBeCloseTo(99.2, 2);
    expect(r.profit).toBeLessThan(0);
    expect(r.status).toBe("LOSS");
  });

  // 3. Empty return — spec section 6
  it("includes return-leg fuel/tolls in cost while revenue stays outbound-only (empty return)", () => {
    const r = calculateTripProfitability({
      ...basic,
      offerPrice: 600,
      passengerDistanceKm: 370,
      returnType: "EMPTY",
      returnDistanceKm: 370,
      outboundToll: 75,
      returnToll: 75,
      fuelPrice: 16,
      consumption: 6.2,
    });

    expect(r.totalDistanceKm).toBe(740);
    expect(r.fuelCost).toBeCloseTo(734.08, 2);
    expect(r.tollCost).toBe(150);
    expect(r.totalCost).toBeCloseTo(884.08, 2);
    expect(r.revenue).toBe(600); // tolls/return cost never counted as revenue
    expect(r.profit).toBeCloseTo(-284.08, 2);
    expect(r.status).toBe("LOSS");
  });

  // 4. Paid return — spec section 7
  it("adds the return passenger's fare to revenue for a paid return", () => {
    const r = calculateTripProfitability({
      ...basic,
      offerPrice: 600,
      passengerDistanceKm: 370,
      returnType: "PAID",
      returnDistanceKm: 370,
      returnOfferPrice: 500,
      outboundToll: 75,
      returnToll: 75,
      fuelPrice: 16,
      consumption: 6.2,
    });

    expect(r.revenue).toBe(1100);
    expect(r.totalCost).toBeCloseTo(884.08, 2);
    expect(r.profit).toBeCloseTo(215.92, 2);
    expect(r.status).not.toBe("LOSS");
    // Per-leg breakdown exposed for "individual rides + combined" display
    expect(r.legs.outbound.revenue).toBe(600);
    expect(r.legs.return?.revenue).toBe(500);
  });

  // 5. Zero / no return — return distance must be ignored when returnType is NONE
  it("ignores returnDistanceKm entirely when returnType is NONE", () => {
    const r = calculateTripProfitability({
      ...basic,
      offerPrice: 100,
      passengerDistanceKm: 100,
      returnType: "NONE",
      returnDistanceKm: 50, // should have zero effect
      fuelPrice: 16,
      consumption: 6.2,
    });

    expect(r.totalDistanceKm).toBe(100);
    expect(r.legs.return).toBeNull();
  });

  // 6. Pickup distance — spec section 24
  it("adds pickup distance to cost distance without inflating revenue", () => {
    const r = calculateTripProfitability({
      ...basic,
      offerPrice: 100,
      pickupDistanceKm: 20,
      passengerDistanceKm: 15,
      returnType: "NONE",
      fuelPrice: 16,
      consumption: 6.2,
    });

    expect(r.totalDistanceKm).toBe(35);
    expect(r.fuelLiters).toBeCloseTo(2.17, 2);
    expect(r.fuelCost).toBeCloseTo(34.72, 2);
    expect(r.revenue).toBe(100); // revenue is NOT scaled by pickup distance
  });

  // 7. Toll included
  it("includes outbound + return tolls in total cost when toll is enabled", () => {
    const r = calculateTripProfitability({
      ...basic,
      offerPrice: 600,
      passengerDistanceKm: 370,
      returnType: "EMPTY",
      returnDistanceKm: 370,
      outboundToll: 75,
      returnToll: 75,
      fuelPrice: 16,
      consumption: 6.2,
    });
    expect(r.tollCost).toBe(150);
  });

  // 8. No toll
  it("produces zero toll cost when tolls are disabled, regardless of input values", () => {
    const r = calculateTripProfitability({
      ...basic,
      tollEnabled: false,
      offerPrice: 600,
      passengerDistanceKm: 370,
      returnType: "EMPTY",
      returnDistanceKm: 370,
      outboundToll: 75,
      returnToll: 75,
      fuelPrice: 16,
      consumption: 6.2,
    });
    expect(r.tollCost).toBe(0);
    expect(r.totalCost).toBeCloseTo(734.08, 2);
  });

  // 9. Different fuel prices
  it("scales fuel cost linearly with fuel price", () => {
    const base: TripProfitabilityInput = {
      ...(basic as TripProfitabilityInput),
      offerPrice: 600,
      passengerDistanceKm: 370,
      returnType: "NONE",
      fuelPrice: 16,
      consumption: 6.2,
    };
    const cheap = calculateTripProfitability({ ...base, fuelPrice: 10 });
    const expensive = calculateTripProfitability({ ...base, fuelPrice: 20 });
    expect(cheap.fuelCost).toBeCloseTo((370 * 6.2) / 100 * 10, 2);
    expect(expensive.fuelCost).toBeCloseTo((370 * 6.2) / 100 * 20, 2);
    expect(expensive.fuelCost).toBeGreaterThan(cheap.fuelCost);
  });

  // 10. Different consumption
  it("scales fuel cost linearly with consumption", () => {
    const base: TripProfitabilityInput = {
      ...(basic as TripProfitabilityInput),
      offerPrice: 600,
      passengerDistanceKm: 370,
      returnType: "NONE",
      fuelPrice: 16,
      consumption: 6.2,
    };
    const efficient = calculateTripProfitability({ ...base, consumption: 5 });
    const thirsty = calculateTripProfitability({ ...base, consumption: 9 });
    expect(thirsty.fuelCost).toBeGreaterThan(efficient.fuelCost);
    expect(efficient.fuelCost).toBeCloseTo((370 * 5) / 100 * 16, 2);
  });

  // 11. Desired fixed profit — spec section 8
  it("computes the minimum acceptable price for fixed-profit mode", () => {
    const r = calculateTripProfitability({
      ...basic,
      offerPrice: 600,
      passengerDistanceKm: 370,
      returnType: "EMPTY",
      returnDistanceKm: 370,
      outboundToll: 75,
      returnToll: 75,
      fuelPrice: 16,
      consumption: 6.2,
      profitMode: "fixed",
      desiredProfit: 200,
    });

    expect(r.totalCost).toBeCloseTo(884.08, 2);
    expect(r.targetPrice).toBeCloseTo(1084.08, 2);
    expect(r.minimumAcceptablePrice).toBeCloseTo(1084.08, 2);
  });

  // 12. Desired margin
  it("computes target price so profit is the desired percentage of revenue (margin mode)", () => {
    const r = calculateTripProfitability({
      ...basic,
      offerPrice: 600,
      passengerDistanceKm: 370,
      returnType: "EMPTY",
      returnDistanceKm: 370,
      outboundToll: 75,
      returnToll: 75,
      fuelPrice: 16,
      consumption: 6.2,
      profitMode: "margin",
      desiredMargin: 20,
    });

    const expectedTarget = 884.08 / 0.8;
    expect(r.targetPrice).toBeCloseTo(expectedTarget, 1);
    // Profit at the target price should be ~20% of that target price
    const impliedProfit = r.targetPrice - r.totalCost;
    expect(impliedProfit / r.targetPrice).toBeCloseTo(0.2, 2);
  });

  // 13. Maintenance costs
  it("includes maintenance cost in total cost only when enabled", () => {
    const common: TripProfitabilityInput = {
      offerPrice: 600,
      passengerDistanceKm: 370,
      returnType: "NONE",
      fuelPrice: 16,
      consumption: 6.2,
      maintenanceEnabled: true,
      maintenancePerKm: 0.3,
      tireEnabled: false,
      oilServiceEnabled: false,
      depreciationEnabled: false,
      otherEnabled: false,
    };
    const r = calculateTripProfitability(common);
    expect(r.maintenanceCost).toBeCloseTo(370 * 0.3, 2);
    expect(r.totalCost).toBeCloseTo(r.fuelCost + r.tollCost + r.maintenanceCost, 2);
  });

  // 14. Depreciation
  it("includes depreciation cost in total cost only when enabled", () => {
    const r = calculateTripProfitability({
      offerPrice: 600,
      passengerDistanceKm: 370,
      returnType: "NONE",
      fuelPrice: 16,
      consumption: 6.2,
      depreciationEnabled: true,
      depreciationPerKm: 0.5,
      maintenanceEnabled: false,
      tireEnabled: false,
      oilServiceEnabled: false,
      otherEnabled: false,
    });
    expect(r.depreciationCost).toBeCloseTo(370 * 0.5, 2);
  });

  // 15. Profit/km — spec section 5
  it("computes profit per km as profit / total distance", () => {
    const r = calculateTripProfitability({
      ...basic,
      offerPrice: 600,
      passengerDistanceKm: 370,
      returnType: "NONE",
      outboundToll: 75,
      fuelPrice: 16,
      consumption: 6.2,
    });
    expect(r.profitPerKm).toBeCloseTo(r.profit / r.totalDistanceKm, 2);
    expect(r.profitPerKm).toBeCloseTo(0.43, 2);
  });

  // 16. Profit/hour — spec section 23
  it("computes profit per hour from total working time", () => {
    const r = calculateTripProfitability({
      offerPrice: 300,
      passengerDistanceKm: 0,
      returnType: "NONE",
      fuelPrice: 0,
      consumption: 0,
      maintenanceEnabled: false,
      tireEnabled: false,
      oilServiceEnabled: false,
      depreciationEnabled: false,
      otherEnabled: false,
      tollEnabled: false,
      tripDurationMinutes: 450, // 7h30
    });
    expect(r.profit).toBe(300);
    expect(r.profitPerHour).toBeCloseTo(40, 2);
  });

  it("returns null profitPerHour when no time data is provided", () => {
    const r = calculateTripProfitability({
      ...basic,
      offerPrice: 600,
      passengerDistanceKm: 370,
      returnType: "NONE",
      fuelPrice: 16,
      consumption: 6.2,
    });
    expect(r.profitPerHour).toBeNull();
  });

  // Status thresholds
  it("marks LOW_PROFIT when profit is positive but below the desired profit", () => {
    const r = calculateTripProfitability({
      ...basic,
      offerPrice: 600,
      passengerDistanceKm: 370,
      returnType: "NONE",
      outboundToll: 75,
      fuelPrice: 16,
      consumption: 6.2,
      profitMode: "fixed",
      desiredProfit: 200, // profit is 157.96, below 200
    });
    expect(r.profit).toBeGreaterThan(0);
    expect(r.status).toBe("LOW_PROFIT");
  });

  it("marks PROFITABLE when profit meets or exceeds the desired profit", () => {
    const r = calculateTripProfitability({
      ...basic,
      offerPrice: 600,
      passengerDistanceKm: 370,
      returnType: "NONE",
      outboundToll: 75,
      fuelPrice: 16,
      consumption: 6.2,
      profitMode: "fixed",
      desiredProfit: 100, // profit is 157.96, above 100
    });
    expect(r.status).toBe("PROFITABLE");
  });

  // Cost-per-km analysis — spec section 20/22
  it("computes fuel cost/km and full cost/km correctly", () => {
    const r = calculateTripProfitability({
      offerPrice: 600,
      passengerDistanceKm: 740,
      returnType: "NONE",
      fuelPrice: 16,
      consumption: 6.2,
      maintenanceEnabled: false,
      tireEnabled: false,
      oilServiceEnabled: false,
      depreciationEnabled: false,
      otherEnabled: false,
      tollEnabled: false,
    });
    expect(r.fuelCostPerKm).toBeCloseTo(0.992, 3);
    expect(r.revenuePerKm).toBeCloseTo(600 / 740, 3);
    expect(r.revenuePerKm).toBeLessThan(r.fuelCostPerKm);
  });
});
