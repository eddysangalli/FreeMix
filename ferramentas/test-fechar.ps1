# Test of the exit question and of the preset as a document: "Descartar alteracoes e Fechar" really brings the
# preset back, "Salvar e fechar" keeps the changes, and the Save request moves the point that discarding goes back
# to. Closes and reopens the program several times (about two minutes). Leaves the preset as it found it.
$root = Split-Path -Parent $PSScriptRoot; $bin = Join-Path $root 'bin\64bit'
$node = Join-Path (Split-Path -Parent $root) 'node24\node.exe'; $aux = Join-Path $PSScriptRoot 'preset-teste.mjs'
$ini = Get-Content (Join-Path $root 'config\obs-studio\user.ini') -Raw
$file = Join-Path $root ('config\obs-studio\basic\scenes\' + (([regex]::Match($ini, '(?m)^SceneCollectionFile=(.+?)\r?$').Groups[1].Value) -replace '\.json$', '') + '.json')
if (-not (Test-Path -LiteralPath $file)) { "arquivo do preset nao encontrado: $file"; exit 1 }
$pass = 0; $total = 0
function Check([string]$name, [bool]$ok, [string]$detail = '') { $script:total++; if ($ok) { $script:pass++ }; "$(if ($ok) { 'OK   ' } else { 'FALHA' }) $name$(if ($detail) { "  ($detail)" })" }
function Open-Program {
  powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'preparar.ps1')
  $p = Start-Process -FilePath (Join-Path $bin 'FreeMix.exe') -WorkingDirectory $bin -ArgumentList '--portable', '--multi', '--disable-updater', '--disable-missing-files-check', '--enable-media-stream' -PassThru
  $s = 0; do { Start-Sleep -Seconds 3; $s += 3; $q = Get-Process -Id $p.Id -ErrorAction SilentlyContinue } while ($q -and -not $q.MainWindowTitle -and $s -lt 60); Start-Sleep -Seconds 9
}
function Close-Program([switch]$Discard) { if ($Discard) { powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'fechar.ps1') -Descartar } else { powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'fechar.ps1') } }
function In-File([string]$scene) { (Get-Content -LiteralPath $file -Raw).Contains('"' + $scene + '"') }

if (-not (Get-Process FreeMix -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "$root\*" })) { Open-Program }
& $node $aux add 'TESTE DESCARTE' | Out-Null; Start-Sleep -Seconds 2
$r = Close-Program -Discard; $r
Check 'a pergunta de saida tem as tres respostas da referencia' ($r -match 'Salvar e fechar' -and $r -match 'Descartar altera' -and $r -match 'Cancelar')
Check 'Descartar alteracoes e Fechar devolve o preset como estava ao abrir' (-not (In-File 'TESTE DESCARTE'))
Open-Program
Check 'ao reabrir, a entrada criada e descartada nao existe' ((& $node $aux has 'TESTE DESCARTE') -eq 'nao')
& $node $aux add 'TESTE SALVO' | Out-Null; Start-Sleep -Seconds 1
$saved = & $node $aux save
& $node $aux add 'TESTE DEPOIS' | Out-Null; Start-Sleep -Seconds 2
Close-Program -Discard | Out-Null
Check 'Salvar grava o estado; descartar depois volta ate esse ponto, nao ate a abertura' ($saved -eq 'salvo' -and (In-File 'TESTE SALVO') -and -not (In-File 'TESTE DEPOIS')) "pedido de salvar: $saved"
Open-Program
& $node $aux del 'TESTE SALVO' | Out-Null; Start-Sleep -Seconds 2
$r = Close-Program;
Check 'Salvar e fechar mantem as alteracoes' (-not (In-File 'TESTE SALVO'))
"$pass/$total verificacoes passaram"
