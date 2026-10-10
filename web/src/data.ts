/**
 * Data layer. Two modes, same screens:
 *  - live   : local API (fork + proxy) answers and the fork is at the source block
 *  - static : replay of results/ exported as scripts in ./data (no fork, no proxy, no network)
 * Static data is loaded with <script> tags so the site also works opened from disk (file://).
 */
export type Mode = "live" | "static";
export type Status = { api: boolean; proxy: { mode: string } | null; fork: { head: string; sourceBlock: string } | null };

declare global { interface Window { __EXITPROOF__?: Record<string, any> } }

const loadScript = (src: string) => new Promise<void>((resolve, reject) => {
  const s = document.createElement("script");
  s.src = src;
  s.onload = () => resolve();
  s.onerror = () => reject(new Error(`not measured: ${src} is missing from this build`));
  document.head.appendChild(s);
});

async function staticGet<T>(key: string, file: string): Promise<T> {
  if (!window.__EXITPROOF__?.[key]) await loadScript(`./data/${file}`);
  const v = window.__EXITPROOF__?.[key];
  if (v === undefined) throw new Error(`not measured: ${key}`);
  return v as T;
}

async function getJson<T>(path: string, timeoutMs = 4000): Promise<T> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(path, { signal: ctl.signal });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error ?? r.statusText);
    return j as T;
  } finally { clearTimeout(t); }
}

export async function readStatus(): Promise<Status> {
  if (location.protocol === "file:") return { api: false, proxy: null, fork: null };
  try {
    const j = await getJson<{ proxy: any; fork: any }>("/api/status", 2500);
    return { api: true, proxy: j.proxy && j.proxy.mode ? j.proxy : null, fork: j.fork };
  } catch { return { api: false, proxy: null, fork: null }; }
}

export const liveUsable = (s: Status) => s.api && !!s.fork && s.fork.head === s.fork.sourceBlock;

export type IndexEntry = { vault: string; name: string; asset: string; version?: string; catalog?: string;
  manifest?: { sha256: string; createdAt: string; scenarios: number; cushionProbes: number; file: string };
  replay?: { verdict: string; at: string; hashOk: boolean; cushionOk: boolean; scenarios: number; okScenarios: number } | null };

export async function getIndex(mode: Mode): Promise<IndexEntry[]> {
  const stat = await staticGet<{ vaults: IndexEntry[] }>("index", "index.js").then((x) => x.vaults).catch(() => [] as IndexEntry[]);
  if (mode === "static") return stat;
  try {
    const live = await getJson<{ vault: string; name: string; asset: string; catalog: string }[]>("/api/reports");
    const known = new Map(stat.map((x) => [x.vault, x]));
    return live.map((x) => known.get(x.vault) ?? { ...x }).sort((a, b) => (a.name === "Steakhouse ETH" ? -1 : b.name === "Steakhouse ETH" ? 1 : a.name.localeCompare(b.name)));
  } catch { return stat; }
}

export const getReport = (mode: Mode, v: string) =>
  mode === "live" ? getJson<any>(`/api/report?vault=${v}`, 15000) : staticGet<any>(`report:${v}`, `report-${v}.js`);
export const getGraph = (mode: Mode, v: string) =>
  mode === "live" ? getJson<any>(`/api/graph/${v}`, 30000) : staticGet<any>(`graph:${v}`, `graph-${v}.js`);

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? r.statusText);
  return j as T;
}
