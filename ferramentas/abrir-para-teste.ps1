# Opens the program the way the launcher does, plus the debug port the click tests of the panel need (9333), and
# returns when the control server answers, i.e. when the program has finished loading. Does not start the helper
# (ajudante.ps1): test-barra.mjs needs it started by hand.
# Close afterwards with fechar.ps1.
param([int]$TimeoutSec = 120)
$root = Split-Path -Parent $PSScriptRoot; $bin = Join-Path $root 'bin\64bit'
if (Get-Process obs64, FreeMix -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "$root\*" }) { 'ja estava aberto'; exit 0 }
powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'preparar.ps1') | Out-Null
Start-Process -FilePath (Join-Path $bin 'FreeMix.exe') -WorkingDirectory $bin -ArgumentList '--portable', '--multi', '--disable-updater', '--disable-missing-files-check', '--enable-media-stream', '--remote-debugging-port=9333'
$port = (Get-Content -LiteralPath (Join-Path $root 'config\obs-studio\plugin_config\obs-websocket\config.json') -Raw | ConvertFrom-Json).server_port
$until = (Get-Date).AddSeconds($TimeoutSec)
while ((Get-Date) -lt $until) {
  Start-Sleep -Seconds 2
  $client = New-Object System.Net.Sockets.TcpClient
  try { $client.Connect('127.0.0.1', $port); $client.Close(); Start-Sleep -Seconds 4; "aberto em $([int]((Get-Date) - $until.AddSeconds(-$TimeoutSec)).TotalSeconds) s"; exit 0 } catch { } finally { $client.Dispose() }
}
'nao respondeu a tempo'; exit 1
