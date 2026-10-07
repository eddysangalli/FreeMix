// Minimal RTMP sink for tests: accepts one publisher after another on a local port, answers the handshake and the
// connect / createStream / publish commands, and counts what arrives. It stores nothing and serves no viewers.
// Lets the streaming functions be tested for real without sending anything to the internet.
//   const sink = await startSink(19351); ... sink.stats -> { connections, published, key, bytes, video, audio, open }
import { createServer } from "node:net";

const amfString = (s) => { const b = Buffer.from(s, "utf8"), h = Buffer.alloc(3); h[0] = 2; h.writeUInt16BE(b.length, 1); return Buffer.concat([h, b]); };
const amfNumber = (n) => { const b = Buffer.alloc(9); b[0] = 0; b.writeDoubleBE(n, 1); return b; };
const amfNull = () => Buffer.from([5]);
const amfObject = (o) => Buffer.concat([Buffer.from([3]), ...Object.entries(o).flatMap(([k, v]) => { const kb = Buffer.from(k, "utf8"), kl = Buffer.alloc(2); kl.writeUInt16BE(kb.length); return [kl, kb, typeof v === "number" ? amfNumber(v) : amfString(String(v))]; }), Buffer.from([0, 0, 9])]);
// Reads the leading values of a command message: strings, numbers, null; objects are skipped.
function amfRead(buf) {
  const out = []; let p = 0;
  const skipObject = () => { for (;;) { const kl = buf.readUInt16BE(p); p += 2; if (kl === 0 && buf[p] === 9) { p += 1; return; } p += kl; value(true); } };
  const value = (skip) => { const t = buf[p++]; let v;
    if (t === 0) { v = buf.readDoubleBE(p); p += 8; } else if (t === 1) { v = !!buf[p++]; } else if (t === 2) { const l = buf.readUInt16BE(p); p += 2; v = buf.toString("utf8", p, p + l); p += l; }
    else if (t === 3) { skipObject(); v = {}; } else if (t === 5 || t === 6) { v = null; } else if (t === 8) { p += 4; skipObject(); v = {}; } else throw new Error("tipo AMF " + t);
    if (!skip) out.push(v); };
  try { while (p < buf.length) value(false); } catch { /* enough was read */ }
  return out;
}

export function startSink(port) {
  const stats = { connections: 0, published: 0, key: "", bytes: 0, video: 0, audio: 0, open: 0 };
  const server = createServer((sock) => {
    stats.connections++; stats.open++;
    let buf = Buffer.alloc(0), stage = 0, inChunk = 128, acked = 0, received = 0;
    const streams = new Map();   // chunk stream id -> { ts, len, type, sid, got, parts, ext }
    const send = (csid, type, sid, payload) => {
      const h = Buffer.alloc(12); h[0] = csid & 0x3f; h.writeUIntBE(0, 1, 3); h.writeUIntBE(payload.length, 4, 3); h[7] = type; h.writeUInt32LE(sid, 8);
      const parts = [h];
      for (let o = 0; o < payload.length || o === 0; o += 128) { if (o) parts.push(Buffer.from([0xc0 | (csid & 0x3f)])); parts.push(payload.subarray(o, o + 128)); if (!payload.length) break; }
      sock.write(Buffer.concat(parts));
    };
    const u32 = (n) => { const b = Buffer.alloc(4); b.writeUInt32BE(n); return b; };
    const command = (msg, sid) => {
      const [name, tx, , arg] = amfRead(msg);
      if (name === "connect") {
        send(2, 5, 0, u32(5000000)); send(2, 6, 0, Buffer.concat([u32(5000000), Buffer.from([2])]));
        send(3, 20, 0, Buffer.concat([amfString("_result"), amfNumber(tx), amfObject({ fmsVer: "FMS/3,0,1,123", capabilities: 31 }), amfObject({ level: "status", code: "NetConnection.Connect.Success", description: "Connection succeeded.", objectEncoding: 0 })]));
      } else if (name === "createStream") send(3, 20, 0, Buffer.concat([amfString("_result"), amfNumber(tx), amfNull(), amfNumber(1)]));
      else if (name === "releaseStream" || name === "FCPublish") send(3, 20, 0, Buffer.concat([amfString("_result"), amfNumber(tx), amfNull(), amfNull()]));
      else if (name === "publish") { stats.published++; stats.key = String(arg ?? ""); send(5, 20, sid || 1, Buffer.concat([amfString("onStatus"), amfNumber(0), amfNull(), amfObject({ level: "status", code: "NetStream.Publish.Start", description: "Publishing." })])); }
    };
    const message = (m) => {
      if (m.type === 1) inChunk = m.data.readUInt32BE(0) & 0x7fffffff;
      else if (m.type === 20) command(m.data, m.sid);
      else if (m.type === 17) command(m.data.subarray(1), m.sid);
      else if (m.type === 9) { stats.video += m.data.length; stats.bytes += m.data.length; }
      else if (m.type === 8) { stats.audio += m.data.length; stats.bytes += m.data.length; }
    };
    const parse = () => {
      for (;;) {
        if (stage === 0) { if (buf.length < 1537) return; const c1 = buf.subarray(1, 1537); sock.write(Buffer.concat([Buffer.from([3]), Buffer.alloc(1536), c1])); buf = buf.subarray(1537); stage = 1; }
        if (stage === 1) { if (buf.length < 1536) return; buf = buf.subarray(1536); stage = 2; }
        if (buf.length < 1) return;
        let p = 0; const fmt = buf[0] >> 6; let csid = buf[0] & 0x3f; p = 1;
        if (csid === 0) { if (buf.length < 2) return; csid = 64 + buf[1]; p = 2; } else if (csid === 1) { if (buf.length < 3) return; csid = 64 + buf[1] + buf[2] * 256; p = 3; }
        const need = [11, 7, 3, 0][fmt]; if (buf.length < p + need) return;
        const s = streams.get(csid) || { ts: 0, len: 0, type: 0, sid: 0, got: 0, parts: [], ext: false };
        let ts = null;
        if (fmt <= 2) ts = buf.readUIntBE(p, 3);
        if (fmt <= 1) { s.len = buf.readUIntBE(p + 3, 3); s.type = buf[p + 6]; }
        if (fmt === 0) s.sid = buf.readUInt32LE(p + 7);
        p += need;
        if (fmt <= 2) s.ext = ts === 0xffffff;
        if (s.ext) { if (buf.length < p + 4) return; p += 4; }
        const take = Math.min(inChunk, s.len - s.got); if (buf.length < p + take) return;
        s.parts.push(buf.subarray(p, p + take)); s.got += take; buf = buf.subarray(p + take); streams.set(csid, s);
        received += take; if (received - acked > 2000000) { acked = received; send(2, 3, 0, u32(received >>> 0)); }
        if (s.got >= s.len) { const data = Buffer.concat(s.parts); s.parts = []; s.got = 0; message({ type: s.type, sid: s.sid, data }); }
      }
    };
    sock.on("data", (d) => { buf = buf.length ? Buffer.concat([buf, d]) : d; try { parse(); } catch { sock.destroy(); } });
    sock.on("close", () => { stats.open--; }); sock.on("error", () => {});
  });
  return new Promise((resolve, reject) => { server.on("error", reject); server.listen(port, "127.0.0.1", () => resolve({ stats, port, close: () => new Promise((r) => { server.close(() => r()); server.closeAllConnections?.(); }) })); });
}

// Run directly: node rtmp-teste.mjs 19351  -> prints the counters once per second.
if (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("/rtmp-teste.mjs")) {
  const sink = await startSink(+process.argv[2] || 1935);
  console.log(`recebendo em rtmp://127.0.0.1:${sink.port}/live`);
  setInterval(() => console.log(JSON.stringify(sink.stats)), 1000);
}
