"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";

const EMPTY_FORM = {
  origin: "",
  destination: "",
  typicalDistanceKm: "",
  outboundToll: "",
  returnToll: "",
  notes: "",
};

export default function RoutesPage() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    api.listRoutes().then(setRoutes);
  }

  useEffect(load, []);

  function startEdit(route: any) {
    setEditingId(route.id);
    setForm({
      origin: route.origin,
      destination: route.destination,
      typicalDistanceKm: String(route.typicalDistanceKm),
      outboundToll: String(route.outboundToll),
      returnToll: String(route.returnToll),
      notes: route.notes ?? "",
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit() {
    setError(null);
    if (!form.origin || !form.destination || !form.typicalDistanceKm) {
      setError("Origin, destination and distance are required.");
      return;
    }
    const payload = {
      origin: form.origin,
      destination: form.destination,
      typicalDistanceKm: Number(form.typicalDistanceKm),
      outboundToll: Number(form.outboundToll || 0),
      returnToll: Number(form.returnToll || 0),
      notes: form.notes || null,
    };
    try {
      if (editingId) {
        await api.updateRoute(editingId, payload);
      } else {
        await api.createRoute(payload);
      }
      resetForm();
      load();
    } catch (e: any) {
      setError(e.message ?? "Save failed");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this saved route?")) return;
    await api.deleteRoute(id);
    load();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 pb-28 sm:pb-10 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Saved Routes</h1>
        <p className="text-sm text-muted mt-0.5">
          Quick presets for recurring routes. Distances and tolls are editable — they drift over time.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          {editingId ? "Edit route" : "Add route"}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <input
            className="input"
            placeholder="Origin"
            value={form.origin}
            onChange={(e) => setForm({ ...form, origin: e.target.value })}
          />
          <input
            className="input"
            placeholder="Destination"
            value={form.destination}
            onChange={(e) => setForm({ ...form, destination: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <input
            className="input"
            type="number"
            placeholder="Distance (km)"
            value={form.typicalDistanceKm}
            onChange={(e) => setForm({ ...form, typicalDistanceKm: e.target.value })}
          />
          <input
            className="input"
            type="number"
            placeholder="Outbound toll"
            value={form.outboundToll}
            onChange={(e) => setForm({ ...form, outboundToll: e.target.value })}
          />
          <input
            className="input"
            type="number"
            placeholder="Return toll"
            value={form.returnToll}
            onChange={(e) => setForm({ ...form, returnToll: e.target.value })}
          />
        </div>
        <input
          className="input"
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        {error && <p className="text-sm text-[var(--status-bad-fg)]">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            className="flex-1 rounded-xl bg-accent text-accent-foreground font-semibold py-2.5"
          >
            {editingId ? "Update route" : "Add route"}
          </button>
          {editingId && (
            <button onClick={resetForm} className="rounded-xl border border-border px-4 font-medium">
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface divide-y divide-border">
        {routes.length === 0 ? (
          <div className="p-4 text-sm text-muted">No saved routes yet.</div>
        ) : (
          routes.map((r) => (
            <div key={r.id} className="p-4 flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">
                  {r.origin} → {r.destination}
                </div>
                <div className="text-xs text-muted">
                  {r.typicalDistanceKm} km · toll {r.outboundToll}/{r.returnToll}
                  {r.notes ? ` · ${r.notes}` : ""}
                </div>
              </div>
              <div className="flex gap-3 text-sm shrink-0">
                <button onClick={() => startEdit(r)} className="text-accent font-medium">
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-muted hover:text-[var(--status-bad-fg)]"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.6rem;
          border: 1px solid var(--border);
          background: var(--background);
          padding: 0.55rem 0.8rem;
          font-size: 0.95rem;
        }
      `}</style>
    </div>
  );
}
