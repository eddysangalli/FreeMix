// Seed the portable OBS config so the first launch skips the wizards and opens in studio mode with our theme.
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const CFG = "D:/DRIVE/IA/antigravity/vmixtwste/obs-vmix/config/obs-studio";
const VERSION = (32 << 24) | (2 << 16) | 2; // 32.2.2

const general = [
  "[General]", "FirstRun=true", `LastVersion=${VERSION}`, "InfoIncrement=999", "EnableAutoUpdates=false",
  "ConfirmOnExit=false", "Language=pt-BR", "",
].join("\n");
const user = [
  general,
  "[BasicWindow]", "PreviewProgramMode=true", "gridMode=true", "VerticalVolControl=true", "ShowContextToolbars=false",
  "ShowStatusBar=true", "SceneDuplicationMode=true", "SwapScenesMode=true", "EditPropertiesMode=false", "PreviewEnabled=true", "",
  "[Appearance]", "Theme=local.mesadecorte.Yami", "",
].join("\n");

for (const [file, body] of [["global.ini", general], ["user.ini", user]]) {
  if (existsSync(`${CFG}/${file}`)) { console.log(`${file}: já existe, mantido`); continue; }
  writeFileSync(`${CFG}/${file}`, body);
  console.log(`${file}: criado`);
}

// Control server on a port other than the stock 4455, password required. The password is random and stays in this file.
const wsDir = `${CFG}/plugin_config/obs-websocket`;
mkdirSync(wsDir, { recursive: true });
if (existsSync(`${wsDir}/config.json`)) console.log("obs-websocket/config.json: já existe, mantido");
else {
  writeFileSync(`${wsDir}/config.json`, JSON.stringify({
    alerts_enabled: false, auth_required: true, first_load: false, server_enabled: true,
    server_password: randomBytes(18).toString("base64url"), server_port: 4466,
  }, null, 2));
  console.log("obs-websocket/config.json: criado (porta 4466, senha aleatória)");
}
