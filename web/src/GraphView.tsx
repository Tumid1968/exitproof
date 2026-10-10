import { Fragment, useMemo, useState } from "react";
import { etherscan, short, type Graph } from "./lib";

type N = { id: string; kind: string; layer: number; label: string; address?: string; data: Record<string, unknown>; prov: string[] };
type E = { from: string; to: string; rel: string; prov: string[] };

const COLW = 250, BOXW = 205, BOXH = 30, ROWH = 38, PAD = 16;
const COLS = ["Settlement", "Vault, governance & peer vaults", "Morpho Blue markets", "Oracles, collateral, IRM, borrowers", "Feeds, yield source, admins", "Aggregators & upstream owners"];
const COLOR: Record<string, string> = {
  chain: "#8b98a5", vault: "#4ea1ff", governance: "#6e7681", allocator: "#6e7681", peerVault: "#a371f7", market: "#3fb950",
  oracle: "#d29922", feed: "#e3b341", aggregator: "#bb8009", irm: "#8b98a5", token: "#f778ba", yieldSource: "#ff7b72", borrowers: "#56d4dd",
};

const fmtVal = (v: unknown): string => {
  if (typeof v === "string" && /^\d{19,}$/.test(v)) return `${v} (${(Number(v) / 1e18).toLocaleString("en-US", { maximumFractionDigits: 4 })} ×1e18)`;
  if (typeof v === "object" && v !== null) return JSON.stringify(v);
  return String(v);
};

export function GraphView({ g, highlight, onSelect }: { g: Graph; highlight?: Set<string>; onSelect?: (id: string) => void }) {
  const [exposedOnly, setExposedOnly] = useState(true);
  const [sel, setSel] = useState<string>(`vault:${g.target.vault}`);
  const nodes: N[] = g.nodes, edges: E[] = g.edges;

  const { placed, visEdges, height } = useMemo(() => {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const hidden = new Set(
      exposedOnly ? nodes.filter((n) => n.kind === "market" && BigInt((n.data.vaultSupplyAssets as string) ?? "0") === 0n).map((n) => n.id) : [],
    );
    const vis = new Set<string>([`vault:${g.target.vault}`, "chain:1"]);
    const stack = [`vault:${g.target.vault}`];
    while (stack.length) {
      const cur = stack.pop()!;
      for (const e of edges) if (e.from === cur && !hidden.has(e.to) && !vis.has(e.to) && byId.has(e.to)) { vis.add(e.to); stack.push(e.to); }
    }
    for (const n of nodes) if (n.kind === "peerVault" && edges.some((e) => e.from === n.id && vis.has(e.to))) vis.add(n.id);
    const col = (n: N) => (n.kind === "peerVault" ? 1 : n.kind === "chain" ? 0 : Math.min(n.layer, 5));
    const cols: N[][] = [[], [], [], [], [], []];
    for (const n of nodes) if (vis.has(n.id)) cols[col(n)].push(n);
    const y = new Map<string, number>();
    cols.forEach((c, ci) => {
      if (ci > 0) {
        const bary = (n: N) => {
          const ys = edges.filter((e) => (e.to === n.id && y.has(e.from)) || (e.from === n.id && y.has(e.to))).map((e) => y.get(e.to === n.id ? e.from : e.to)!);
          return ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : 1e9;
        };
        c.sort((a, b) => (a.kind === "peerVault" ? 1 : 0) - (b.kind === "peerVault" ? 1 : 0) || bary(a) - bary(b));
      }
      c.forEach((n, i) => y.set(n.id, i));
    });
    const placed = new Map<string, { x: number; y: number; n: N }>();
    cols.forEach((c, ci) => c.forEach((n, i) => placed.set(n.id, { x: PAD + ci * COLW, y: 40 + i * ROWH, n })));
    const visEdges = edges.filter((e) => placed.has(e.from) && placed.has(e.to) && e.from !== e.to);
    return { placed, visEdges, height: 60 + Math.max(...cols.map((c) => c.length)) * ROWH };
  }, [g, exposedOnly]);

  const selNode = nodes.find((n) => n.id === sel);
  const reads = new Map((g.reads as { id: string }[]).map((r) => [r.id, r]));
  const touches = (e: E) => e.from === sel || e.to === sel;

  return (
    <div className="split">
      <div>
        <div className="row" style={{ marginBottom: 8 }}>
          <label><input type="checkbox" checked={exposedOnly} onChange={(e) => setExposedOnly(e.target.checked)} /> only markets where the vault has funds</label>
          <span className="muted">{placed.size} nodes shown · {g.nodes.length} discovered · {g.reads.length} recorded reads · click a node for its provenance</span>
        </div>
        <div className="graph-wrap">
          <svg width={PAD * 2 + 6 * COLW} height={height}>
            {COLS.map((c, i) => <text key={c} x={PAD + i * COLW} y={20} fill="#8b98a5" fontSize={11} fontWeight={700}>{`L${i} · ${c}`}</text>)}
            {visEdges.map((e, i) => {
              const a = placed.get(e.from)!, b = placed.get(e.to)!;
              const back = b.x <= a.x;
              const x1 = back ? a.x : a.x + BOXW, y1 = a.y + BOXH / 2, x2 = back ? b.x + BOXW : b.x, y2 = b.y + BOXH / 2;
              const dx = Math.max(30, Math.abs(x2 - x1) / 2);
              const shock = highlight && highlight.has(e.from) && highlight.has(e.to);
              return (
                <path key={i} className={`gedge ${shock ? "shock" : touches(e) ? "hi" : ""}`}
                  d={back ? `M${x1},${y1} C${x1 - 40},${y1} ${x2 + 40},${y2} ${x2},${y2}` : `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`}>
                  <title>{e.rel}</title>
                </path>
              );
            })}
            {[...placed.values()].map(({ x, y, n }) => (
              <g key={n.id} className="gnode" transform={`translate(${x},${y})`} onClick={() => { setSel(n.id); onSelect?.(n.id); }}>
                <rect width={BOXW} height={BOXH} rx={6} fill={n.id === sel ? "#1f3b5c" : highlight?.has(n.id) ? "#3d1d1d" : "#161b22"} stroke={COLOR[n.kind] ?? "#555"} />
                <rect width={4} height={BOXH} rx={2} fill={COLOR[n.kind] ?? "#555"} />
                <text x={10} y={19}>{n.label.length > 31 ? n.label.slice(0, 30) + "…" : n.label}</text>
                <title>{n.label}</title>
              </g>
            ))}
          </svg>
        </div>
      </div>
      <div className="details">
        {selNode ? (
          <>
            <h3>{selNode.label}</h3>
            <div className="muted" style={{ marginBottom: 8 }}>
              {selNode.kind} · layer {selNode.layer}
              {selNode.address && <> · <a href={etherscan(selNode.address)} target="_blank" rel="noreferrer" className="mono">{short(selNode.address)}</a></>}
            </div>
            <div className="kv">
              {Object.entries(selNode.data).filter(([, v]) => v !== null && v !== undefined).map(([k, v]) => (
                <Fragment key={k}><div className="k">{k}</div><div className="mono">{fmtVal(v)}</div></Fragment>
              ))}
            </div>
            <div style={{ marginTop: 10 }}>
              <b>Links</b>
              {edges.filter((e) => e.from === sel || e.to === sel).map((e, i) => {
                const other = nodes.find((n) => n.id === (e.from === sel ? e.to : e.from));
                return <div key={i} className="muted">{e.from === sel ? "→" : "←"} <span style={{ color: "#e6edf3" }}>{other?.label ?? "self"}</span> · {e.rel}</div>;
              })}
            </div>
            <div className="prov">
              <b>Provenance ({selNode.prov.length} reads at block {g.source.block})</b>
              {[...new Set(selNode.prov)].slice(0, 25).map((id) => {
                const r = reads.get(id) as Record<string, unknown> | undefined;
                if (!r) return null;
                const off = r.method === "offchain-candidates";
                return (
                  <div key={id} className="mono">
                    <span className={`chip ${off ? "offchain" : "onchain"}`}>{off ? "candidates" : String(r.method)}</span>{" "}
                    {r.to ? <a href={etherscan(String(r.to))} target="_blank" rel="noreferrer">{short(String(r.to))}</a> : null} {String(r.fn ?? "")}
                    {Array.isArray(r.args) && r.args.length > 0 && !off && <span className="muted"> ({JSON.stringify(r.args).slice(0, 90)})</span>}
                    <div className="muted">→ {JSON.stringify(r.result).slice(0, 160)}</div>
                  </div>
                );
              })}
            </div>
          </>
        ) : <span className="muted">Select a node</span>}
      </div>
    </div>
  );
}
