# Installs into this portable copy what was built from the fork (freemix-app\build_2026, made by compilar-2026.ps1):
# the program, the engine libraries, the modules and their data. Run with the program closed.
# Not touched: third-party plugins that exist only as binaries (they are not in the build), the settings folder,
# the panel, and the language files (the copy here carries FreeMix label changes).
# The previous program file is kept as FreeMix.anterior.exe.
param([switch]$ExeOnly)
$root = Split-Path -Parent $PSScriptRoot
$build = Join-Path (Split-Path -Parent $root) 'freemix-app\build_2026\rundir\RelWithDebInfo'
$exe = Join-Path $build 'bin\64bit\FreeMix.exe'; $dest = Join-Path $root 'bin\64bit\FreeMix.exe'
if (-not (Test-Path -LiteralPath $exe)) { 'Nao ha compilacao em freemix-app\build_2026. Rode compilar-2026.ps1.'; exit 1 }
if (Get-Process obs64, FreeMix -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "$root\*" }) { 'Feche o FreeMix antes de instalar.'; exit 1 }
if (Test-Path -LiteralPath $dest) { Copy-Item -LiteralPath $dest -Destination (Join-Path $root 'bin\64bit\FreeMix.anterior.exe') -Force }
if ($ExeOnly) { Copy-Item -LiteralPath $exe -Destination $dest -Force }
else {
  $quiet = @('/E', '/NFL', '/NDL', '/NJH', '/NJS', '/NP', '/R:1', '/W:1', '/XF', '*.pdb')
  robocopy (Join-Path $build 'bin') (Join-Path $root 'bin') @quiet | Out-Null; $a = $LASTEXITCODE
  robocopy (Join-Path $build 'obs-plugins') (Join-Path $root 'obs-plugins') @quiet | Out-Null; $b = $LASTEXITCODE
  robocopy (Join-Path $build 'data') (Join-Path $root 'data') @quiet '/XD' 'locale' | Out-Null; $c = $LASTEXITCODE
  if ($a -ge 8 -or $b -ge 8 -or $c -ge 8) { "Falha ao copiar (codigos $a, $b, $c)."; exit 1 }
}
$f = Get-Item -LiteralPath $dest
"Instalado: compilacao de $($f.LastWriteTime.ToString('dd/MM HH:mm:ss')), FreeMix.exe com $($f.Length) bytes$(if ($ExeOnly) { ' (so o programa)' } else { ', bibliotecas, modulos e dados' }). O programa anterior ficou em FreeMix.anterior.exe."
