export type Svc = { id: string; name: string; up: boolean; ms: number | null };

export type Telemetry = {
  updatedAt: number;
  node: { name: string; arch: string; os: string | null; kernel: string; docker: string | null };
  uptime30d: number | null;
  hostUptimeSec: number;
  cpu: { percent: number; cores: number[]; load1: number; tempC?: number | null };
  memory: { usedGB: number; totalGB: number; percent: number; cachedGB: number; availableGB: number };
  swap: { usedMB: number; totalGB: number };
  disk: { usedGB: number; totalGB: number; percent: number };
  containers: number | null;
  containersTotal?: number | null;
  services: Svc[];
};

// Bisa di-override lewat .env, kalau tidak pakai URL asli ini
export const TELEMETRY_URL =
  import.meta.env.PUBLIC_TELEMETRY_URL || "https://telemetry.satriaimaniar.my.id/api/telemetry";

export function fmtUptime(sec: number) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

// Ambil data tiap `every` ms. Mengembalikan fungsi untuk refresh manual.
export function startTelemetry(onData: (d: Telemetry) => void, onOffline: () => void, every = 30_000) {
  let busy = false;
  const tick = async () => {
    if (busy || document.hidden) return;      // hemat request kalau tab tidak dilihat
    busy = true;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    try {
      const r = await fetch(TELEMETRY_URL, { signal: ctrl.signal, cache: "no-store" });
      if (!r.ok) throw new Error(String(r.status));
      onData(await r.json());
    } catch {
      onOffline();                            // offline = tampil "—", bukan angka palsu
    } finally {
      clearTimeout(timer);
      busy = false;
    }
  };
  tick();
  setInterval(tick, every);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) tick(); });
  return tick;
}