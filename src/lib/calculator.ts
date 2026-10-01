/**
 * TripProfitabilityCalculator — the single source of truth for every
 * profitability formula in RideProfit.
 *
 * This module is pure (no I/O, no DB, no framework imports) and fully
 * unit-testable. The API layer calls it and returns its output verbatim;
 * the frontend only renders what the API returns. No calculation logic is
 * duplicated anywhere else in the codebase.
 */

export type ReturnType = "NONE" | "EMPTY" | "PAID";
export type ProfitMode = "fixed" | "margin";
export type ProfitabilityStatus = "PROFITABLE" | "LOW_PROFIT" | "LOSS";

export interface TripProfitabilityInput {
  /** Fare agreed/offered by the passenger for the outbound ride. */
  offerPrice: number;
  /** Distance driven empty to reach the passenger (optional, default 0). */
  pickupDistanceKm?: number;
  /** Distance of the paid outbound ride itself. */
  passengerDistanceKm: number;

  /** How the return leg should be treated. */
  returnType: ReturnType;
  /** Distance of the return leg. Ignored when returnType is NONE. */
  returnDistanceKm?: number;
  /** Fare for the return leg. Only used when returnType is PAID. */
  returnOfferPrice?: number;

  outboundToll?: number;
  returnToll?: number;

  fuelPrice: number; // DH per liter
  consumption: number; // liters per 100km

  maintenancePerKm?: number;
  tireCostPerKm?: number;
  oilServicePerKm?: number;
  depreciationPerKm?: number;
  otherCostPerKm?: number;

  // Individual cost-component toggles. All default to true (full operating
  // cost). Setting all of maintenance/tire/oil/depreciation/other to false
  // reproduces the "basic cost" mode (fuel + tolls only).
  maintenanceEnabled?: boolean;
  tireEnabled?: boolean;
  oilServiceEnabled?: boolean;
  depreciationEnabled?: boolean;
  otherEnabled?: boolean;
  tollEnabled?: boolean;

  desiredProfit?: number; // fixed-mode target profit amount
  desiredMargin?: number; // margin-mode target profit, as a percent of revenue (0-100)
  profitMode?: ProfitMode;

  // Optional time tracking, for profit/hour.
  pickupTimeMinutes?: number;
  waitingTimeMinutes?: number;
  tripDurationMinutes?: number;
}

export interface TripLegBreakdown {
  distanceKm: number;
  toll: number;
  fuelCost: number;
  variableCost: number;
  totalCost: number;
  revenue: number;
}

export interface TripProfitabilityResult {
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
  profitMargin: number; // profit / revenue, as a fraction (not *100)

  /** Cost that must be charged just to break even (profit = 0). */
  breakEvenPrice: number;
  /** Cost + desired profit — the price to counter-offer. */
  targetPrice: number;
  /** Alias of targetPrice using the wording from the "counteroffer" spec. */
  minimumAcceptablePrice: number;
  /** How far the passenger's offer is from the target (positive = below target). */
  offerShortfall: number;

  fuelCostPerKm: number;
  fullCostPerKm: number;
  revenuePerKm: number;
  costPerKm: number;

  status: ProfitabilityStatus;

  legs: {
    outbound: TripLegBreakdown;
    return: TripLegBreakdown | null;
  };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// Per-km rates are small numbers where 2 decimals loses meaningful
// precision (e.g. 0.992 DH/km fuel cost), so they're rounded to 3 places.
function round3(n: number): number {
  return Math.round((n + Number.EPSILON) * 1000) / 1000;
}

export function calculateTripProfitability(
  input: TripProfitabilityInput
): TripProfitabilityResult {
  const pickupDistanceKm = input.pickupDistanceKm ?? 0;
  const passengerDistanceKm = input.passengerDistanceKm;
  const returnType = input.returnType;
  const returnDistanceKm =
    returnType === "NONE" ? 0 : input.returnDistanceKm ?? 0;
  const returnOfferPrice =
    returnType === "PAID" ? input.returnOfferPrice ?? 0 : 0;

  const outboundToll = input.outboundToll ?? 0;
  const returnToll = returnType === "NONE" ? 0 : input.returnToll ?? 0;
  const tollEnabled = input.tollEnabled ?? true;

  const fuelPrice = input.fuelPrice;
  const consumption = input.consumption;

  const maintenanceEnabled = input.maintenanceEnabled ?? true;
  const tireEnabled = input.tireEnabled ?? true;
  const oilServiceEnabled = input.oilServiceEnabled ?? true;
  const depreciationEnabled = input.depreciationEnabled ?? true;
  const otherEnabled = input.otherEnabled ?? true;

  const maintenancePerKm = input.maintenancePerKm ?? 0;
  const tireCostPerKm = input.tireCostPerKm ?? 0;
  const oilServicePerKm = input.oilServicePerKm ?? 0;
  const depreciationPerKm = input.depreciationPerKm ?? 0;
  const otherCostPerKm = input.otherCostPerKm ?? 0;

  const profitMode: ProfitMode = input.profitMode ?? "fixed";
  const desiredProfit = input.desiredProfit ?? 0;
  const desiredMargin = input.desiredMargin ?? 0;

  // --- Distances ---
  const outboundDistanceKm = pickupDistanceKm + passengerDistanceKm;
  const totalDistanceKm = outboundDistanceKm + returnDistanceKm;

  // --- Fuel ---
  const fuelLiters = (totalDistanceKm * consumption) / 100;
  const fuelCost = fuelLiters * fuelPrice;

  const outboundFuelLiters = (outboundDistanceKm * consumption) / 100;
  const outboundFuelCost = outboundFuelLiters * fuelPrice;
  const returnFuelLiters = (returnDistanceKm * consumption) / 100;
  const returnFuelCost = returnFuelLiters * fuelPrice;

  // --- Tolls ---
  const tollCost = tollEnabled ? outboundToll + returnToll : 0;

  // --- Variable per-km costs (full operating cost components) ---
  const maintenanceCost = maintenanceEnabled
    ? totalDistanceKm * maintenancePerKm
    : 0;
  const tireCost = tireEnabled ? totalDistanceKm * tireCostPerKm : 0;
  const oilServiceCost = oilServiceEnabled
    ? totalDistanceKm * oilServicePerKm
    : 0;
  const depreciationCost = depreciationEnabled
    ? totalDistanceKm * depreciationPerKm
    : 0;
  const otherCost = otherEnabled ? totalDistanceKm * otherCostPerKm : 0;

  const totalCost =
    fuelCost +
    tollCost +
    maintenanceCost +
    tireCost +
    oilServiceCost +
    depreciationCost +
    otherCost;

  // --- Revenue ---
  const revenue =
    returnType === "PAID"
      ? input.offerPrice + returnOfferPrice
      : input.offerPrice;

  // --- Profit ---
  const profit = revenue - totalCost;
  const profitPerKm = totalDistanceKm > 0 ? profit / totalDistanceKm : 0;
  const profitMargin = revenue > 0 ? profit / revenue : 0;

  const totalTimeMinutes =
    (input.pickupTimeMinutes ?? 0) +
    (input.waitingTimeMinutes ?? 0) +
    (input.tripDurationMinutes ?? 0);
  const hasTimeData =
    input.pickupTimeMinutes != null ||
    input.waitingTimeMinutes != null ||
    input.tripDurationMinutes != null;
  const profitPerHour =
    hasTimeData && totalTimeMinutes > 0
      ? profit / (totalTimeMinutes / 60)
      : null;

  // --- Break-even / target / minimum acceptable price ---
  const breakEvenPrice = totalCost;
  let targetPrice: number;
  if (profitMode === "margin") {
    const marginFraction = Math.min(Math.max(desiredMargin, 0), 99.999) / 100;
    targetPrice = totalCost / (1 - marginFraction);
  } else {
    targetPrice = totalCost + desiredProfit;
  }
  const minimumAcceptablePrice = targetPrice;
  const offerShortfall = targetPrice - revenue;

  // Desired profit expressed as an absolute DH amount, used for status
  // thresholds regardless of which mode produced it.
  const desiredProfitDollar =
    profitMode === "margin" ? targetPrice - totalCost : desiredProfit;

  let status: ProfitabilityStatus;
  if (profit < 0) {
    status = "LOSS";
  } else if (profit < desiredProfitDollar) {
    status = "LOW_PROFIT";
  } else {
    status = "PROFITABLE";
  }

  // --- Per-km analysis ---
  const fuelCostPerKm = (consumption / 100) * fuelPrice;
  const variableCostPerKmSum =
    (maintenanceEnabled ? maintenancePerKm : 0) +
    (tireEnabled ? tireCostPerKm : 0) +
    (oilServiceEnabled ? oilServicePerKm : 0) +
    (depreciationEnabled ? depreciationPerKm : 0) +
    (otherEnabled ? otherCostPerKm : 0);
  const fullCostPerKm = fuelCostPerKm + variableCostPerKmSum;
  const revenuePerKm = totalDistanceKm > 0 ? revenue / totalDistanceKm : 0;
  const costPerKm = totalDistanceKm > 0 ? totalCost / totalDistanceKm : 0;

  // --- Per-leg breakdown (for "show individual rides" display) ---
  const outboundVariableCost =
    outboundDistanceKm *
    (maintenanceEnabled ? maintenancePerKm : 0) +
    outboundDistanceKm * (tireEnabled ? tireCostPerKm : 0) +
    outboundDistanceKm * (oilServiceEnabled ? oilServicePerKm : 0) +
    outboundDistanceKm * (depreciationEnabled ? depreciationPerKm : 0) +
    outboundDistanceKm * (otherEnabled ? otherCostPerKm : 0);
  const outboundTollCost = tollEnabled ? outboundToll : 0;
  const outboundLeg: TripLegBreakdown = {
    distanceKm: outboundDistanceKm,
    toll: outboundTollCost,
    fuelCost: outboundFuelCost,
    variableCost: outboundVariableCost,
    totalCost: outboundFuelCost + outboundTollCost + outboundVariableCost,
    revenue: input.offerPrice,
  };

  let returnLeg: TripLegBreakdown | null = null;
  if (returnType !== "NONE") {
    const returnVariableCost =
      returnDistanceKm * (maintenanceEnabled ? maintenancePerKm : 0) +
      returnDistanceKm * (tireEnabled ? tireCostPerKm : 0) +
      returnDistanceKm * (oilServiceEnabled ? oilServicePerKm : 0) +
      returnDistanceKm * (depreciationEnabled ? depreciationPerKm : 0) +
      returnDistanceKm * (otherEnabled ? otherCostPerKm : 0);
    const returnTollCost = tollEnabled ? returnToll : 0;
    returnLeg = {
      distanceKm: returnDistanceKm,
      toll: returnTollCost,
      fuelCost: returnFuelCost,
      variableCost: returnVariableCost,
      totalCost: returnFuelCost + returnTollCost + returnVariableCost,
      revenue: returnType === "PAID" ? returnOfferPrice : 0,
    };
  }

  return {
    totalDistanceKm: round2(totalDistanceKm),
    fuelLiters: round2(fuelLiters),
    fuelCost: round2(fuelCost),
    tollCost: round2(tollCost),
    maintenanceCost: round2(maintenanceCost),
    tireCost: round2(tireCost),
    oilServiceCost: round2(oilServiceCost),
    depreciationCost: round2(depreciationCost),
    otherCost: round2(otherCost),
    totalCost: round2(totalCost),

    revenue: round2(revenue),
    profit: round2(profit),
    profitPerKm: round3(profitPerKm),
    profitPerHour: profitPerHour != null ? round2(profitPerHour) : null,
    profitMargin: profitMargin,

    breakEvenPrice: round2(breakEvenPrice),
    targetPrice: round2(targetPrice),
    minimumAcceptablePrice: round2(minimumAcceptablePrice),
    offerShortfall: round2(offerShortfall),

    fuelCostPerKm: round3(fuelCostPerKm),
    fullCostPerKm: round3(fullCostPerKm),
    revenuePerKm: round3(revenuePerKm),
    costPerKm: round3(costPerKm),

    status,

    legs: {
      outbound: {
        ...outboundLeg,
        distanceKm: round2(outboundLeg.distanceKm),
        toll: round2(outboundLeg.toll),
        fuelCost: round2(outboundLeg.fuelCost),
        variableCost: round2(outboundLeg.variableCost),
        totalCost: round2(outboundLeg.totalCost),
        revenue: round2(outboundLeg.revenue),
      },
      return: returnLeg
        ? {
            ...returnLeg,
            distanceKm: round2(returnLeg.distanceKm),
            toll: round2(returnLeg.toll),
            fuelCost: round2(returnLeg.fuelCost),
            variableCost: round2(returnLeg.variableCost),
            totalCost: round2(returnLeg.totalCost),
            revenue: round2(returnLeg.revenue),
          }
        : null,
    },
  };
}
