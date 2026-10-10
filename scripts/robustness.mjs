// Robustness bench for /api/analyze (needs npm run proxy, npm run fork, npm run api). Usage: node scripts/robustness.mjs [filter]
// Robustness harness: hits the real /api/analyze path with vaults never analysed before + invalid inputs.
const cases = [
  ["V1.0 USDT 71%", "0xbEef047a543E45807105E51A8BBEFCc5950fcfBa"],
  ["V1.1 USDT 57%", "0xA0804346780b4c2e3bE118ac957D1DB82F9d7484"],
  ["V1.1 USDC ~100%", "0x974c8FBf4fd795F66B85B73ebC988A51F1A040a9"],
  ["V1.1 USDC 0% (illiquid)", "0x9B5E92fd227876b4C07a8c02367E2CB23c639DfA"],
  ["V1.1 USDC 0% huge (Adpend)", "0x55555815a5595991C3A0Ff119B59AEF6C8B55555"],
  ["V1.0 DAI 10%", "0x500331c9fF24D9d11aee6B07734Aa72343EA74a5"],
  ["V1.0 msETH 32%", "0x78B18E07dc43017fcEaabaD0751d6464c0F56b25"],
  ["invalid: garbage", "hello"],
  ["invalid: short hex", "0x1234"],
  ["invalid: EOA", "0x000000000000000000000000000000000000dEaD"],
  ["invalid: ERC-20 (USDC)", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"],
  ["invalid: Morpho Blue", "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb"],
];
const only = process.argv.slice(2);
for (const [label, vault] of cases) {
  if (only.length && !only.some((o) => label.includes(o))) continue;
  const t0 = Date.now();
  let status, body;
  try {
    const r = await fetch('http://127.0.0.1:8700/api/analyze', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ vault }) });
    status = r.status; body = await r.json();
    if (r.status === 202) {
      for (;;) {
        await new Promise((res) => setTimeout(res, 3000));
        body = await (await fetch('http://127.0.0.1:8700/api/analyze?vault=' + body.vault)).json();
        if (body.state !== 'running') break;
      }
      status = body.state === 'done' ? 'DONE' : body.error.status;
      if (body.state === 'done') body = { ...body.result, warnings: undefined }; else body = { error: body.error.message };
    }
  } catch (e) { status = 'FETCH-ERR'; body = { error: String(e) }; }
  const s = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(`${label.padEnd(30)} ${String(status).padEnd(5)} ${s.padStart(4)}s  ${body.error ? "ERR " + String(body.error).slice(0, 220) : `${body.name} nodes=${body.nodes} reads=${body.reads}${body.warnings ? " warnings=" + JSON.stringify(body.warnings).slice(0, 200) : ""}`}`);
}
