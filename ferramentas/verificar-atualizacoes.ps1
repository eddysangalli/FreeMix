param([switch]$CheckOnly,[switch]$AtualizarTudo,[switch]$ExportJson,[string]$DownloadPlugin='')
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
if($AtualizarTudo -or $DownloadPlugin){throw 'Instale uma entrega FreeMix assinada pelo Atualizar FreeMix.cmd; componentes avulsos nao preservam o motor compilado.'}
$node=Join-Path $root 'runtime/node.exe'
if(-not(Test-Path -LiteralPath $node)){$node=Join-Path $root '../node24/node.exe'}
& $node (Join-Path $PSScriptRoot 'verificar-atualizacoes.mjs')
exit $LASTEXITCODE
