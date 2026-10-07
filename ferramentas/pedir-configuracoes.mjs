// Test helper: leave the same request the Configurar button leaves, so the local helper opens the full Settings window.
import { connect } from "./obsws.mjs";
const obs = await connect();
await obs.req("SetPersistentData", { realm: "OBS_WEBSOCKET_DATA_REALM_GLOBAL", slotName: "freemix_cmd", slotValue: { id: Date.now(), cmd: "settings" } });
console.log("pedido deixado"); obs.close();
