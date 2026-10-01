"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";

export default function SettingsPage() {
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getSettings().then(setForm);
  }, []);

  function set<K extends string>(key: K, value: any) {
    setForm((f: any) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateSettings({
        vehicleName: form.vehicleName,
        fuelType: form.fuelType,
        currency: form.currency,
        fuelPricePerLiter: Number(form.fuelPricePerLiter),
        avgConsumptionPer100: Number(form.avgConsumptionPer100),
        maintenancePerKm: Number(form.maintenancePerKm),
        maintenanceEnabled: form.maintenanceEnabled,
        tireCostPerKm: Number(form.tireCostPerKm),
        tireEnabled: form.tireEnabled,
        oilServicePerKm: Number(form.oilServicePerKm),
        oilServiceEnabled: form.oilServiceEnabled,
        depreciationPerKm: Number(form.depreciationPerKm),
        depreciationEnabled: form.depreciationEnabled,
        otherCostPerKm: Number(form.otherCostPerKm),
        otherEnabled: form.otherEnabled,
        tollEnabled: form.tollEnabled,
        desiredProfitAmount: Number(form.desiredProfitAmount),
        desiredProfitMargin: Number(form.desiredProfitMargin),
        profitMode: form.profitMode,
        defaultReturnType: form.defaultReturnType,
        defaultTollEnabled: form.defaultTollEnabled,
      });
      setForm(updated);
      setSavedAt(Date.now());
    } catch (e: any) {
      setError(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!form) {
    return <div className="p-6 text-muted">Loading settings...</div>;
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-5 pb-28 sm:pb-10 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Vehicle Settings</h1>
        <p className="text-sm text-muted mt-0.5">
          These values feed every calculation. Fuel price changes often — update it here, not in code.
        </p>
      </div>

      <Section title="Vehicle">
        <Field label="Vehicle name">
          <input
            className="input"
            value={form.vehicleName}
            onChange={(e) => set("vehicleName", e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fuel type">
            <input
              className="input"
              value={form.fuelType}
              onChange={(e) => set("fuelType", e.target.value)}
            />
          </Field>
          <Field label="Currency">
            <input
              className="input"
              value={form.currency}
              onChange={(e) => set("currency", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="Fuel">
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Fuel price (${form.currency}/L)`}>
            <input
              type="number"
              className="input"
              value={form.fuelPricePerLiter}
              onChange={(e) => set("fuelPricePerLiter", e.target.value)}
            />
          </Field>
          <Field label="Consumption (L/100km)">
            <input
              type="number"
              className="input"
              value={form.avgConsumptionPer100}
              onChange={(e) => set("avgConsumptionPer100", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="Operating cost components (per km)">
        <CostRow
          label="Maintenance"
          value={form.maintenancePerKm}
          enabled={form.maintenanceEnabled}
          onValue={(v) => set("maintenancePerKm", v)}
          onEnabled={(v) => set("maintenanceEnabled", v)}
          currency={form.currency}
        />
        <CostRow
          label="Tires"
          value={form.tireCostPerKm}
          enabled={form.tireEnabled}
          onValue={(v) => set("tireCostPerKm", v)}
          onEnabled={(v) => set("tireEnabled", v)}
          currency={form.currency}
        />
        <CostRow
          label="Oil / service"
          value={form.oilServicePerKm}
          enabled={form.oilServiceEnabled}
          onValue={(v) => set("oilServicePerKm", v)}
          onEnabled={(v) => set("oilServiceEnabled", v)}
          currency={form.currency}
        />
        <CostRow
          label="Depreciation"
          value={form.depreciationPerKm}
          enabled={form.depreciationEnabled}
          onValue={(v) => set("depreciationPerKm", v)}
          onEnabled={(v) => set("depreciationEnabled", v)}
          currency={form.currency}
        />
        <CostRow
          label="Other"
          value={form.otherCostPerKm}
          enabled={form.otherEnabled}
          onValue={(v) => set("otherCostPerKm", v)}
          onEnabled={(v) => set("otherEnabled", v)}
          currency={form.currency}
        />
        <label className="flex items-center justify-between py-2">
          <span className="text-sm font-medium">Count tolls as cost</span>
          <input
            type="checkbox"
            checked={form.tollEnabled}
            onChange={(e) => set("tollEnabled", e.target.checked)}
            className="h-5 w-5"
          />
        </label>
        <p className="text-xs text-muted">
          Disabling a component leaves it visible in results but excludes it
          from Total Cost — use this to switch between &ldquo;basic&rdquo;
          (fuel+toll only) and &ldquo;full&rdquo; operating cost.
        </p>
      </Section>

      <Section title="Desired profit">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => set("profitMode", "fixed")}
            className={`rounded-xl py-2 text-sm font-semibold border ${
              form.profitMode === "fixed"
                ? "bg-accent text-accent-foreground border-accent"
                : "border-border text-muted"
            }`}
          >
            Fixed amount
          </button>
          <button
            onClick={() => set("profitMode", "margin")}
            className={`rounded-xl py-2 text-sm font-semibold border ${
              form.profitMode === "margin"
                ? "bg-accent text-accent-foreground border-accent"
                : "border-border text-muted"
            }`}
          >
            Margin %
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Field label={`Fixed profit (${form.currency})`}>
            <input
              type="number"
              className="input"
              value={form.desiredProfitAmount}
              onChange={(e) => set("desiredProfitAmount", e.target.value)}
            />
          </Field>
          <Field label="Margin (%)">
            <input
              type="number"
              className="input"
              value={form.desiredProfitMargin}
              onChange={(e) => set("desiredProfitMargin", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="Defaults">
        <Field label="Default return behavior">
          <select
            className="input"
            value={form.defaultReturnType}
            onChange={(e) => set("defaultReturnType", e.target.value)}
          >
            <option value="NONE">No return calculation</option>
            <option value="EMPTY">Empty return</option>
            <option value="PAID">Paid return</option>
          </select>
        </Field>
      </Section>

      {error && (
        <div className="text-sm text-[var(--status-bad-fg)] font-medium">
          {error}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-xl bg-accent text-accent-foreground font-bold text-lg py-4 disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save settings"}
      </button>
      {savedAt && (
        <p className="text-center text-sm text-[var(--status-good-fg)] font-medium">
          Settings saved.
        </p>
      )}

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid var(--border);
          background: var(--background);
          padding: 0.65rem 0.9rem;
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium mb-1 block text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

function CostRow({
  label,
  value,
  enabled,
  onValue,
  onEnabled,
  currency,
}: {
  label: string;
  value: number;
  enabled: boolean;
  onValue: (v: string) => void;
  onEnabled: (v: boolean) => void;
  currency: string;
}) {
  return (
    <div className="flex items-center gap-3 py-1">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => onEnabled(e.target.checked)}
        className="h-5 w-5 shrink-0"
      />
      <span className="text-sm flex-1">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onValue(e.target.value)}
        className="input w-28 text-right"
      />
      <span className="text-xs text-muted w-16">{currency}/km</span>
    </div>
  );
}
