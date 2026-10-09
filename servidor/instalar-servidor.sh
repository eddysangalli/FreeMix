#!/usr/bin/env bash
set -euo pipefail
kit_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)
if [[ ${1:-} != --config || ! -f ${2:-} ]]; then
  echo 'Uso: sudo bash instalar-servidor.sh --config servidor.json [--check]'
  exit 2
fi
server_input=$(realpath -- "$2")
if ! command -v node >/dev/null; then echo 'Instale Node.js 20 ou superior no VPS antes de continuar.'; exit 2; fi
node --input-type=module -e 'import {readFileSync} from "node:fs";import {pathToFileURL} from "node:url";const {serverConfig}=await import(pathToFileURL(process.argv[2]));serverConfig(JSON.parse(readFileSync(process.argv[1])));' "$server_input" "$kit_root/servidor-kit.mjs"
if [[ ${3:-} == --check ]]; then
  node "$kit_root/feed-servidor.mjs" --config "$kit_root/feed-config.json" --check
  echo 'Pacote conferido; nenhum serviço iniciado.'
  exit 0
fi
if [[ $EUID -ne 0 ]]; then echo 'Execute com sudo no VPS dedicado.'; exit 2; fi
for name in freemix-feed freemix-turn freemix-caddy; do
  if [[ -e /etc/systemd/system/$name.service ]]; then echo "Serviço $name já existe; instalação preservada."; exit 2; fi
done
if ss -H -lntu | awk '{print $5}' | grep -Eq ':(80|443|3478|18400); then echo 'Porta web em uso; não alterei o serviço existente.'; exit 2; fi
command -v caddy >/dev/null || { echo 'Instale o Caddy oficial no VPS antes de continuar.'; exit 2; }
command -v turnserver >/dev/null || { echo 'Instale coturn no VPS antes de continuar.'; exit 2; }
target_dir=/opt/freemix-services
if [[ -e $target_dir ]]; then echo 'Pasta de serviços já existe; preservada.'; exit 2; fi
install -d -m 700 "$target_dir"
cp -a -- "$kit_root/." "$target_dir/"
node "$target_dir/servidor-kit.mjs" --config "$server_input" --dest "$target_dir/private"
cp -- "$target_dir/private/feed-config.json" "$target_dir/feed-config.json"
node "$target_dir/feed-servidor.mjs" --config "$target_dir/feed-config.json" --check
caddy validate --config "$target_dir/private/Caddyfile" --adapter caddyfile
install -d -m 700 "$target_dir/caddy-data" "$target_dir/caddy-config"
for name in feed turn caddy; do
  if [[ $name == feed ]]; then exec_line="$(command -v node) $target_dir/feed-servidor.mjs --config $target_dir/feed-config.json"; fi
  if [[ $name == turn ]]; then exec_line="$(command -v turnserver) -c $target_dir/private/turnserver.conf"; fi
  if [[ $name == caddy ]]; then exec_line="$(command -v caddy) run --config $target_dir/private/Caddyfile --adapter caddyfile"; fi
  cat >"/etc/systemd/system/freemix-$name.service" <<UNIT
[Unit]
Description=FreeMix $name
After=network-online.target
Wants=network-online.target
[Service]
Type=simple
WorkingDirectory=$target_dir
Environment=XDG_DATA_HOME=$target_dir/caddy-data
Environment=XDG_CONFIG_HOME=$target_dir/caddy-config
ExecStart=$exec_line
Restart=on-failure
RestartSec=5
UMask=0077
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=full
[Install]
WantedBy=multi-user.target
UNIT
done
systemctl daemon-reload
systemctl enable --now freemix-feed freemix-turn freemix-caddy
echo "Serviços instalados. ICE privado: $target_dir/private/ice-import.json. Portas: $target_dir/private/PORTAS.txt."
echo 'O receptor bonding deve ser iniciado separadamente com o arquivo privado exportado pela mesa.'
; then echo 'Porta web em uso; não alterei o serviço existente.'; exit 2; fi
command -v caddy >/dev/null || { echo 'Instale o Caddy oficial no VPS antes de continuar.'; exit 2; }
command -v turnserver >/dev/null || { echo 'Instale coturn no VPS antes de continuar.'; exit 2; }
target_dir=/opt/freemix-services
if [[ -e $target_dir ]]; then echo 'Pasta de serviços já existe; preservada.'; exit 2; fi
install -d -m 700 "$target_dir"
cp -a -- "$kit_root/." "$target_dir/"
node "$target_dir/servidor-kit.mjs" --config "$server_input" --dest "$target_dir/private"
cp -- "$target_dir/private/feed-config.json" "$target_dir/feed-config.json"
node "$target_dir/feed-servidor.mjs" --config "$target_dir/feed-config.json" --check
caddy validate --config "$target_dir/private/Caddyfile" --adapter caddyfile
install -d -m 700 "$target_dir/caddy-data" "$target_dir/caddy-config"
for name in feed turn caddy; do
  if [[ $name == feed ]]; then exec_line="$(command -v node) $target_dir/feed-servidor.mjs --config $target_dir/feed-config.json"; fi
  if [[ $name == turn ]]; then exec_line="$(command -v turnserver) -c $target_dir/private/turnserver.conf"; fi
  if [[ $name == caddy ]]; then exec_line="$(command -v caddy) run --config $target_dir/private/Caddyfile --adapter caddyfile"; fi
  cat >"/etc/systemd/system/freemix-$name.service" <<UNIT
[Unit]
Description=FreeMix $name
After=network-online.target
Wants=network-online.target
[Service]
Type=simple
WorkingDirectory=$target_dir
Environment=XDG_DATA_HOME=$target_dir/caddy-data
Environment=XDG_CONFIG_HOME=$target_dir/caddy-config
ExecStart=$exec_line
Restart=on-failure
RestartSec=5
UMask=0077
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=full
[Install]
WantedBy=multi-user.target
UNIT
done
systemctl daemon-reload
systemctl enable --now freemix-feed freemix-turn freemix-caddy
echo "Serviços instalados. ICE privado: $target_dir/private/ice-import.json. Portas: $target_dir/private/PORTAS.txt."
echo 'O receptor bonding deve ser iniciado separadamente com o arquivo privado exportado pela mesa.'
