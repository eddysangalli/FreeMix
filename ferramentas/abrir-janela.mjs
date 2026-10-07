// Test helper: open one of the panel's windows by id (ext, recset, streamset, presets, overlay...).
// The engine must be running with --remote-debugging-port=9333.
import { createRequire } from "node:module";
const require = createRequire("D:/DRIVE/IA/antigravity/vmixtwste/rea/package.json");
const WebSocket = require("ws");
const t = (await (await fetch("http://127.0.0.1:9333/json")).json()).find((x) => x.url.endsWith("painel/mesa.html"));
const c = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => c.on("open", r));
c.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: `st.pop = null; openPop(${JSON.stringify(process.argv[2] || "ext")})` } }));
setTimeout(() => c.close(), 1500);
