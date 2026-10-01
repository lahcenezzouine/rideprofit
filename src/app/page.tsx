"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import ResultCard, { type ResultCardData } from "@/components/ResultCard";

type ReturnType = "NONE" | "EMPTY" | "PAID";
type ProfitMode = "fixed" | "margin";

const RETURN_OPTIONS: { value: ReturnType; label: string }[] = [
  { value: "NONE", label: "None" },
  { value: "EMPTY", label: "Empty" },
  { value: "PAID", label: "Paid" },
];

export default function CalculatorPage() {
  const [settings, setSettings] = useState<any>(null);
  const [routes, setRoutes] = useState<any[]>([]);

  // Primary fields
  const [offerPrice, setOfferPrice] = useState("");
  const [distance, setDistance] = useState("");
  const [toll, setToll] = useState("");
  const [returnType, setReturnType] = useState<ReturnType>("NONE");

  // Advanced fields
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [pickupDistance, setPickupDistance] = useState("");
  const [returnDistance, setReturnDistance] = useState("");
  const [returnToll, setReturnToll] = useState("");
  const [returnOfferPrice, setReturnOfferPrice] = useState("");
  const [routeId, setRouteId] = useState<string>("");

  const [profitMode, setProfitMode] = useState<ProfitMode>("fixed");
  const [desiredProfit, setDesiredProfit] = useState("");
  const [desiredMargin, setDesiredMargin] = useState("");

  const [pickupTime, setPickupTime] = useState("");
  const [waitingTime, setWaitingTime] = useState("");
  const [tripDuration, setTripDuration] = useState("");

  const [result, setResult] = useState<ResultCardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getSettings().then((s) => {
      setSettings(s);
      setReturnType(s.defaultReturnType ?? "NONE");
      setProfitMode(s.profitMode ?? "fixed");
      setDesiredProfit(String(s.desiredProfitAmount ?? ""));
      setDesiredMargin(String(s.desiredProfitMargin ?? ""));
    });
    api.listRoutes().then(setRoutes).catch(() => {});
  }, []);

  function applyRoute(id: string) {
    setRouteId(id);
    const route = routes.find((r) => String(r.id) === id);
    if (route) {
      setOrigin(route.origin);
      setDestination(route.destination);
      setDistance(String(route.typicalDistanceKm));
      setToll(String(route.outboundToll));
      setReturnDistance(String(route.typicalDistanceKm));
      setReturnToll(String(route.returnToll));
    }
  }

  async function handleCalculate() {
    setError(null);
    setSaved(false);
    if (!offerPrice || !distance) {
      setError("Enter at least an offer price and distance.");
      return;
    }
    if (returnType === "PAID" && !returnOfferPrice) {
      setError("Enter the return offer price for a paid return trip.");
      return;
    }
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        offerPrice: Number(offerPrice),
        passengerDistanceKm: Number(distance),
        outboundToll: toll ? Number(toll) : 0,
        returnType,
        profitMode,
      };
      if (pickupDistance) payload.pickupDistanceKm = Number(pickupDistance);
      if (returnType !== "NONE" && returnDistance)
        payload.returnDistanceKm = Number(returnDistance);
      if (returnType !== "NONE" && returnToll)
        payload.returnToll = Number(returnToll);
      if (returnType === "PAID" && returnOfferPrice)
        payload.returnOfferPrice = Number(returnOfferPrice);
      if (profitMode === "fixed" && desiredProfit)
        payload.desiredProfit = Number(desiredProfit);
      if (profitMode === "margin" && desiredMargin)
        payload.desiredMargin = Number(desiredMargin);
      if (pickupTime) payload.pickupTimeMinutes = Number(pickupTime);
      if (waitingTime) payload.waitingTimeMinutes = Number(waitingTime);
      if (tripDuration) payload.tripDurationMinutes = Number(tripDuration);

      const res = await api.calculate(payload);
      setResult(res.result);
    } catch (e: any) {
      setError(e.message ?? "Calculation failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        origin: origin || "Unknown",
        destination: destination || "Unknown",
        routeId: routeId ? Number(routeId) : undefined,
        offerPrice: Number(offerPrice),
        passengerDistanceKm: Number(distance),
        outboundToll: toll ? Number(toll) : 0,
        returnType,
        profitMode,
      };
      if (pickupDistance) payload.pickupDistanceKm = Number(pickupDistance);
      if (returnType !== "NONE" && returnDistance)
        payload.returnDistanceKm = Number(returnDistance);
      if (returnType !== "NONE" && returnToll)
        payload.returnToll = Number(returnToll);
      if (returnType === "PAID" && returnOfferPrice)
        payload.returnOfferPrice = Number(returnOfferPrice);
      if (profitMode === "fixed" && desiredProfit)
        payload.desiredProfit = Number(desiredProfit);
      if (profitMode === "margin" && desiredMargin)
        payload.desiredMargin = Number(desiredMargin);
      if (pickupTime) payload.pickupTimeMinutes = Number(pickupTime);
      if (waitingTime) payload.waitingTimeMinutes = Number(waitingTime);
      if (tripDuration) payload.tripDurationMinutes = Number(tripDuration);

      const res = await api.saveTrip(payload);
      setResult(res.result);
      setSaved(true);
    } catch (e: any) {
      setError(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const currency = settings?.currency ?? "DH";

  return (
    <div className="max-w-xl mx-auto px-4 py-5 pb-28 sm:pb-10 space-y-5">
      <div>
        <h1 className="text-xl font-bold">inDrive Profit Calculator</h1>
        <p className="text-sm text-muted mt-0.5">
          Enter the offer, check profitability before you accept.
        </p>
      </div>

      {routes.length > 0 && (
        <select
          value={routeId}
          onChange={(e) => applyRoute(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base"
        >
          <option value="">Saved route (optional)...</option>
          {routes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.origin} → {r.destination} ({r.typicalDistanceKm} km)
            </option>
          ))}
        </select>
      )}

      <div className="rounded-2xl border border-border bg-surface p-4 space-y-4">
        <BigField
          label={`Offer Price (${currency})`}
          value={offerPrice}
          onChange={setOfferPrice}
          placeholder="600"
        />
        <BigField
          label="Distance (km)"
          value={distance}
          onChange={setDistance}
          placeholder="370"
        />
        <BigField
          label={`Toll (${currency})`}
          value={toll}
          onChange={setToll}
          placeholder="75"
        />

        <div>
          <div className="text-sm font-medium mb-1.5">Return trip</div>
          <div className="grid grid-cols-3 gap-2">
            {RETURN_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setReturnType(opt.value)}
                className={`rounded-xl py-3 text-sm font-semibold border transition-colors ${
                  returnType === opt.value
                    ? "bg-accent text-accent-foreground border-accent"
                    : "border-border text-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {returnType === "PAID" && (
          <BigField
            label={`Return Offer Price (${currency})`}
            value={returnOfferPrice}
            onChange={setReturnOfferPrice}
            placeholder="500"
          />
        )}

        <button
          onClick={() => setAdvancedOpen((v) => !v)}
          className="text-sm font-medium text-accent"
        >
          {advancedOpen ? "Hide advanced fields ▲" : "Advanced fields ▼"}
        </button>

        {advancedOpen && (
          <div className="space-y-4 pt-1 border-t border-border">
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Origin" value={origin} onChange={setOrigin} />
              <TextField
                label="Destination"
                value={destination}
                onChange={setDestination}
              />
            </div>
            <TextField
              label="Pickup distance (km)"
              value={pickupDistance}
              onChange={setPickupDistance}
              placeholder="Empty km to reach passenger"
            />
            {returnType !== "NONE" && (
              <div className="grid grid-cols-2 gap-3">
                <TextField
                  label="Return distance (km)"
                  value={returnDistance}
                  onChange={setReturnDistance}
                />
                <TextField
                  label={`Return toll (${currency})`}
                  value={returnToll}
                  onChange={setReturnToll}
                />
              </div>
            )}
            <div>
              <div className="text-sm font-medium mb-1.5">Desired profit</div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  onClick={() => setProfitMode("fixed")}
                  className={`rounded-xl py-2 text-sm font-semibold border ${
                    profitMode === "fixed"
                      ? "bg-accent text-accent-foreground border-accent"
                      : "border-border text-muted"
                  }`}
                >
                  Fixed amount
                </button>
                <button
                  onClick={() => setProfitMode("margin")}
                  className={`rounded-xl py-2 text-sm font-semibold border ${
                    profitMode === "margin"
                      ? "bg-accent text-accent-foreground border-accent"
                      : "border-border text-muted"
                  }`}
                >
                  Margin %
                </button>
              </div>
              {profitMode === "fixed" ? (
                <TextField
                  label={`Desired profit (${currency})`}
                  value={desiredProfit}
                  onChange={setDesiredProfit}
                />
              ) : (
                <TextField
                  label="Desired margin (%)"
                  value={desiredMargin}
                  onChange={setDesiredMargin}
                />
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <TextField
                label="Pickup time (min)"
                value={pickupTime}
                onChange={setPickupTime}
              />
              <TextField
                label="Waiting (min)"
                value={waitingTime}
                onChange={setWaitingTime}
              />
              <TextField
                label="Trip duration (min)"
                value={tripDuration}
                onChange={setTripDuration}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="text-sm text-[var(--status-bad-fg)] font-medium">
            {error}
          </div>
        )}

        <button
          onClick={handleCalculate}
          disabled={loading}
          className="w-full rounded-xl bg-accent text-accent-foreground font-bold text-lg py-4 disabled:opacity-60"
        >
          {loading ? "Calculating..." : "CALCULATE"}
        </button>
      </div>

      {result && (
        <>
          <ResultCard result={result} currency={currency} />
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl border border-accent text-accent font-semibold py-3 disabled:opacity-60"
          >
            {saving ? "Saving..." : saved ? "Saved ✓ (save again?)" : "Save to trip history"}
          </button>
        </>
      )}
    </div>
  );
}

function BigField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium mb-1.5 block">{label}</label>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-background px-4 py-3.5 text-xl font-semibold"
      />
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium mb-1 block text-muted">
        {label}
      </label>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base"
      />
    </div>
  );
}
