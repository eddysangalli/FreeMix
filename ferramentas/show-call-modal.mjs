// Opens the Input Select dialog and selects Call (VDO.Ninja) for visual capture
import { connect, sleep } from "./obsws.mjs";
import { createRequire } from "node:module";

const require = createRequire("D:/DRIVE/IA/antigravity/vmixtwste/rea/package.json");
const WebSocket = require("ws");

const target = (await (await fetch("http://127.0.0.1:9333/json")).json()).find((t) => t.url.endsWith("painel/mesa.html"));
const cdp = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => cdp.on("open", r));

let id = 0;
const evalJs = (expr) => new Promise((res) => {
  const i = ++id;
  const handler = (raw) => {
    const m = JSON.parse(String(raw));
    if (m.id === i) { cdp.off("message", handler); res(m.result?.result?.value); }
  };
  cdp.on("message", handler);
  cdp.send(JSON.stringify({ id: i, method: "Runtime.evaluate", params: { expression: expr, returnByValue: true } }));
});

await evalJs(`(() => {
  openPop("add");
  st.addType = "call";
  renderPop();
})()`);

await sleep(500);
console.log("Modal de Call aberto no painel");
cdp.close();
process.exit(0);
