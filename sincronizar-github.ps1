# Sincroniza fontes da entrega assinada para este checkout; não faz commit/push.
param([string]$Workspace = (Split-Path -Parent $PSScriptRoot))
$ErrorActionPreference = 'Stop'
$syncNode = Join-Path $Workspace 'node24\node.exe'
if (-not (Test-Path -LiteralPath $syncNode)) { $syncNode = 'node' }
& $syncNode (Join-Path $PSScriptRoot 'scripts\sincronizar-fontes.mjs') --workspace $Workspace
exit $LASTEXITCODE
