// Read-only: asks the sandbox's program which outputs are active and which windows are open — the things that make
// it refuse a QA shutdown request or end badly.
//   node scripts/qa/diagnostico-ocioso.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
const ws = path.resolve(import.meta.dirname, "../.."), sandbox = JSON.parse(await fs.readFile(path.join(ws, "qa-finalizacao/sandbox-telas/sandbox.json"), "utf8"));
const { connect } = await import(pathToFileURL(path.join(sandbox.installed, "ferramentas/obsws.mjs"))), obs = await connect({ root: sandbox.installed });
const outputs = (await obs.req("GetOutputList")).outputs.map((o) => ({ name: o.outputName, kind: o.outputKind, active: o.outputActive }));
const virtual = await obs.req("GetVirtualCamStatus").catch((e) => ({ error: e.message })), iface = (await obs.req("CallVendorRequest", { vendorName: "freemix", requestType: "get_interface", requestData: {} })).responseData;
const state = await (await fetch(sandbox.base + "/api/json")).json().catch(() => ({})), o = (await (await fetch(sandbox.base + "/api/outputs")).json().catch(() => ({}))).outputs || {};
console.log(JSON.stringify({ activeOutputs: outputs.filter((x) => x.active), allOutputs: outputs.map((x) => x.name + (x.active ? "*" : "")), virtualCam: virtual.outputActive ?? virtual, recording: state.recording, streaming: state.streaming, ndiSending: (o.ndi?.senders || []).filter((s) => s.active).length, omtSending: (o.omt?.senders || []).filter((s) => s.active).length, destinationsActive: (o.destinations || []).filter((d) => d.active).length, panels: (iface.panels || []).map((p) => `${p.title} ${p.width}x${p.height}${p.visible ? "" : " (oculta)"}`), nativeSettingsOpen: iface.nativeSettingsOpen }, null, 1));
obs.close?.();
