param([switch]$Aplicar)
$ErrorActionPreference = 'Stop'
$taskWorkspace = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..')).TrimEnd('\')
$archive = 'archived/limpeza-demo-20261009'
$moves = [ordered]@{}
foreach ($name in 'CONTINUAR.md','ENTREGA-ATUAL.md','PENDENCIAS.md','PENDENCIAS-REAIS.md','COMO-TESTAR-SRT.md','SRT-VMIX.md') { $moves[$name] = "docs/$name" }
$moves['ANALISE-BRIDGES-CHARGEXDEV.md'] = 'docs/referencias/ANALISE-BRIDGES-CHARGEXDEV.md'
foreach ($name in 'RELATORIO-ADVANCED-MASKS.md','RELATORIO-BONDING-AGREGACAO-FEC.md','RELATORIO-MACROS-CONTROLADORES-FEEDBACK.md','RELATORIO-NDI-OMT-INDEPENDENTES.md','RELATORIO-NDI-OMT-MULTIPLOS.md','design-qa.md') { $moves[$name] = "$archive/documentos/$name" }
foreach ($name in 'VIDEO-ALPHA-UMA-ENTRADA.md','ABRIR-RECEPTOR-ALPHA.cmd') { $moves[$name] = "$archive/experimento-alpha-web/$name" }
$moves['entregas/FreeMix-alpha-web-addon-20261009.zip'] = "$archive/experimento-alpha-web/FreeMix-alpha-web-addon-20261009.zip"
foreach ($name in 'freemix-build-2026.log','freemix-build-interface.log') { $moves[$name] = "$archive/logs-build/$name" }
foreach ($name in 'audio-routing-fixture-1791484592096','audio-routing-fixture-1791484623717','bonding-ui-private','controllers-feedback-private','controllers-feedback-ui-private','gtzip-ampliado-fixture','js-syntax','network-multiple-failure-190425','source-record-private','composicao-estilos-evidencias','compositor-galeria-evidencias','compositor-advanced-masks-evidencias') { $moves["qa-portatil/$name"] = "$archive/qa-portatil/$name" }
foreach ($name in 'incremento-0.1.0-local.20261008125128','preset-gt','segmentos-1791424487866') { $moves["qa-finalizacao/$name"] = "$archive/qa-finalizacao/$name" }
$moves['qa-replay/consoles-antes-finalizacao'] = "$archive/qa-replay/consoles-antes-finalizacao"
$moves['abrir-freemix-atualizado.mjs'] = 'scripts/inicializacao/abrir-freemix-atualizado.mjs'
$moves['Abrir-FreeMix.ps1'] = 'scripts/inicializacao/Abrir-FreeMix.ps1'
foreach ($name in 'APLICAR-ULTIMA-ATUALIZACAO.cmd','CONFIGURAR-REDE-FREEMIX.cmd','PREPARAR-SERVIDOR.cmd') { $moves[$name] = "scripts/manutencao/$name" }
foreach ($name in 'compilar-2026.ps1','sincronizar-github.ps1') { $moves[$name] = "scripts/build/$name" }
foreach ($name in 'rea.cmd','rea-ghidra.cmd') { $moves[$name] = "scripts/rea/$name" }
$receipt = @()
foreach ($entry in $moves.GetEnumerator()) {
    $source = [IO.Path]::GetFullPath((Join-Path $taskWorkspace $entry.Key))
    $dest = [IO.Path]::GetFullPath((Join-Path $taskWorkspace $entry.Value))
    foreach ($candidate in $source,$dest) {
        if (-not $candidate.StartsWith($taskWorkspace + '\', [StringComparison]::OrdinalIgnoreCase)) { throw "Caminho fora do workspace: $candidate" }
    }
    if (-not (Test-Path -LiteralPath $source)) { continue }
    if ((Get-Item -LiteralPath $source -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Nao mover link: $source" }
    if (Test-Path -LiteralPath $dest) { throw "Destino ja existe: $dest" }
    $receipt += [pscustomobject]@{ source=$entry.Key; destination=$entry.Value; kind=if((Get-Item -LiteralPath $source) -is [IO.DirectoryInfo]){'directory'}else{'file'} }
    if ($Aplicar) {
        New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($dest)) -Force | Out-Null
        Move-Item -LiteralPath $source -Destination $dest
    }
}
if ($Aplicar) {
    $receiptPath = Join-Path $taskWorkspace "$archive/movimentos.json"
    New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($receiptPath)) -Force | Out-Null
    [pscustomobject]@{ at=(Get-Date).ToString('o'); workspace=$taskWorkspace; deleted=$false; moves=$receipt } | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $receiptPath -Encoding utf8
}
$receipt | Format-Table -AutoSize
