"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import ResultCard, { type ResultCardData } from "@/components/ResultCard";

/**
 * City Ride Calculator — the fastest possible check for an in-town ride.
 * City rides typically have no highway tolls and no "return trip" to
 * account for (you just move on to the next passenger), so this screen
 * only asks for the two numbers that actually vary: the offer and the
 * distance.
 *
 * No calculation logic lives here — it reuses the exact same
 * /api/calculate endpoint (and the same business layer,
 * src/lib/calculator.ts) and the same ResultCard as the main calculator,
 * just with returnType fixed to NONE and no toll field.
 */
export default function CityCalculatorPage() {
  const [settings, setSettings] = useState<any>(null);
  const [offerPrice, setOfferPrice] = useState("");
  const [distance, setDistance] = useState("");
  const [result, setResult] = useState<ResultCardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getSettings().then(setSettings);
  }, []);

  async function handleCalculate() {
    setError(null);
    setSaved(false);
    if (!offerPrice || !distance) {
      setError("Enter the offer price and the distance.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.calculate({
        offerPrice: Number(offerPrice),
        passengerDistanceKm: Number(distance),
        returnType: "NONE",
      });
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
      const res = await api.saveTrip({
        origin: "City",
        destination: "City",
        offerPrice: Number(offerPrice),
        passengerDistanceKm: Number(distance),
        returnType: "NONE",
      });
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
        <h1 className="text-xl font-bold">City Ride Calculator</h1>
        <p className="text-sm text-muted mt-0.5">
          For in-town rides: no tolls, no return trip. Just the offer and the km.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 space-y-4">
        <BigField
          label={`Offer Price (${currency})`}
          value={offerPrice}
          onChange={setOfferPrice}
          placeholder="35"
        />
        <BigField
          label="Distance (km)"
          value={distance}
          onChange={setDistance}
          placeholder="12"
        />

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
