param([switch]$Verificar)
$ErrorActionPreference = 'Stop'
$workspace = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$taskRoot = Join-Path $workspace 'obs-vmix'
$taskNode = Join-Path $taskRoot 'runtime\node.exe'
$taskStart = Join-Path $taskRoot 'ferramentas\iniciar-freemix.mjs'
$env:FREEMIX_ROOT = $taskRoot
if ($Verificar) { & $taskNode $taskStart --check } else {
    if (Test-Path (Join-Path $workspace 'node24\node.exe')) { $taskNode = Join-Path $workspace 'node24\node.exe' }
    & $taskNode (Join-Path $PSScriptRoot 'abrir-freemix-atualizado.mjs')
}
exit $LASTEXITCODE
