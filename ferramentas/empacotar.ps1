$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$node=Join-Path $root 'runtime/node.exe'
if(-not(Test-Path -LiteralPath $node)){$node=Join-Path $root '../node24/node.exe'}
& $node (Join-Path $PSScriptRoot 'empacotar-limpo.mjs')
exit $LASTEXITCODE
