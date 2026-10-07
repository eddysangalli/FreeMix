// Small obs-websocket 5 client for the portable build. Reads the port and password from the portable config file.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire("D:/DRIVE/IA/antigravity/vmixtwste/rea/package.json");
const WebSocket = require("ws");

export const ROOT = "D:/DRIVE/IA/antigravity/vmixtwste/obs-vmix";
const sha = (text) => createHash("sha256").update(text).digest("base64");

// opts.events: obs-websocket event subscription mask; opts.onEvent(type, data) receives them.
export async function connect(opts = {}) {
  const cfg = JSON.parse(readFileSync(`${ROOT}/config/obs-studio/plugin_config/obs-websocket/config.json`, "utf8"));
  const ws = new WebSocket(`ws://127.0.0.1:${cfg.server_port}`);
  const pending = new Map();
  let seq = 0;
  await new Promise((resolve, reject) => {
    ws.on("error", reject);
    ws.on("message", (raw) => {
      const m = JSON.parse(String(raw));
      if (m.op === 0) {
        const a = m.d.authentication;
        ws.send(JSON.stringify({ op: 1, d: { rpcVersion: 1, eventSubscriptions: opts.events || 0, ...(a ? { authentication: sha(sha(cfg.server_password + a.salt) + a.challenge) } : {}) } }));
      } else if (m.op === 2) resolve();
      else if (m.op === 5) opts.onEvent?.(m.d.eventType, m.d.eventData);
      else if (m.op === 7) { const p = pending.get(m.d.requestId); pending.delete(m.d.requestId); p?.(m.d); }
    });
    ws.on("close", (code) => reject(new Error(`conexão fechada (${code})`)));
  });
  const raw = (requestType, requestData) => new Promise((resolve) => { const requestId = String(++seq); pending.set(requestId, resolve); ws.send(JSON.stringify({ op: 6, d: { requestType, requestId, requestData } })); });
  const req = async (requestType, requestData) => {
    const r = await raw(requestType, requestData);
    if (!r.requestStatus.result) throw new Error(`${requestType}: ${r.requestStatus.code} ${r.requestStatus.comment ?? ""}`);
    return r.responseData ?? {};
  };
  const tryReq = async (requestType, requestData) => { const r = await raw(requestType, requestData); return r.requestStatus.result ? (r.responseData ?? {}) : null; };
  return { req, tryReq, close: () => ws.close() };
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
