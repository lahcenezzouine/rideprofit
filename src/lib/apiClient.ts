// Thin client-side fetch wrappers. No business logic here — every number
// shown in the UI comes from one of these calls to the backend.

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getSettings: () => fetch("/api/settings").then((r) => handle<any>(r)),
  updateSettings: (data: any) =>
    fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => handle<any>(r)),

  calculate: (data: any) =>
    fetch("/api/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => handle<any>(r)),

  saveTrip: (data: any) =>
    fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => handle<any>(r)),

  listTrips: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`/api/trips${qs ? `?${qs}` : ""}`).then((r) => handle<any[]>(r));
  },
  deleteTrip: (id: number) =>
    fetch(`/api/trips/${id}`, { method: "DELETE" }).then((r) => handle<any>(r)),

  listRoutes: () => fetch("/api/routes").then((r) => handle<any[]>(r)),
  createRoute: (data: any) =>
    fetch("/api/routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => handle<any>(r)),
  updateRoute: (id: number, data: any) =>
    fetch(`/api/routes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => handle<any>(r)),
  deleteRoute: (id: number) =>
    fetch(`/api/routes/${id}`, { method: "DELETE" }).then((r) => handle<any>(r)),

  getDashboard: () => fetch("/api/dashboard").then((r) => handle<any>(r)),
  getRouteComparison: () =>
    fetch("/api/analytics/routes").then((r) => handle<any[]>(r)),
  getAnalyticsSummary: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`/api/analytics/summary${qs ? `?${qs}` : ""}`).then((r) =>
      handle<any>(r)
    );
  },

  listFuelPrices: () => fetch("/api/fuel-prices").then((r) => handle<any[]>(r)),
  addFuelPrice: (data: any) =>
    fetch("/api/fuel-prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => handle<any>(r)),
};
