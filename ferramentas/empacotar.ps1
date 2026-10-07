# Pack this folder into a zip ready to be unzipped on another machine (run "Iniciar Mesa.cmd" there).
# Leaves out logs, crash reports, the browser cache, recordings and screenshots. Close OBS before packing.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
if (Get-Process obs64 -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "$root\*" }) { 'Feche o OBS desta pasta antes de empacotar (ele grava a configuracao ao fechar).'; exit 1 }
$name = Split-Path -Leaf $root
$zip = Join-Path (Split-Path -Parent $root) ("mesa-obs-" + (Get-Date -Format 'yyyy-MM-dd') + ".zip")
if (Test-Path $zip) { Remove-Item -LiteralPath $zip -Force }
$skip = @('config/obs-studio/logs', 'config/obs-studio/crashes', 'config/obs-studio/profiler_data', 'config/obs-studio/updates', 'config/obs-studio/plugin_config/obs-browser', 'gravacoes/*', 'capturas') | ForEach-Object { '--exclude'; "$name/$_" }
& "$env:SystemRoot\System32\tar.exe" -a -c -f $zip @skip -C (Split-Path -Parent $root) $name
if ($LASTEXITCODE -ne 0) { "tar falhou (codigo $LASTEXITCODE)"; exit 1 }
"Pacote criado: $zip ($([math]::Round((Get-Item $zip).Length / 1MB)) MB)"
