# Empacota o FreeMix Studio em um pacote portátil pronto para distribuição limpa.
# Exclui logs, caches de navegador, gravações locais e dados temporários.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
if (Get-Process obs64, FreeMix -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "$root\*" }) {
    Write-Error 'Feche a aplicação FreeMix desta pasta antes de empacotar para gravar configurações e liberar arquivos.'
    exit 1
}

$binExe = Join-Path $root 'bin\64bit\FreeMix.exe'
if (-not (Test-Path $binExe)) {
    Write-Warning "FreeMix.exe não encontrado em bin\64bit. Criando a partir dos binários..."
    Copy-Item (Join-Path $root 'bin\64bit\obs64.exe') $binExe -Force
}

$parentDir = Split-Path -Parent $root
$name = Split-Path -Leaf $root
$zip = Join-Path $parentDir ("FreeMix-Studio-" + (Get-Date -Format 'yyyy-MM-dd') + ".zip")
if (Test-Path $zip) { Remove-Item -LiteralPath $zip -Force }

$skip = @(
    'config/obs-studio/logs',
    'config/obs-studio/crashes',
    'config/obs-studio/profiler_data',
    'config/obs-studio/updates',
    'config/obs-studio/plugin_config/obs-browser',
    'gravacoes/*',
    'capturas'
) | ForEach-Object { '--exclude'; "$name/$_" }

& "$env:SystemRoot\System32\tar.exe" -a -c -f $zip @skip -C $parentDir $name
if ($LASTEXITCODE -ne 0) {
    Write-Error "tar falhou com código $LASTEXITCODE ao gerar pacote."
    exit 1
}

Write-Output "Pacote de distribuição FreeMix Studio criado com sucesso:"
Write-Output "-> $zip ($([math]::Round((Get-Item $zip).Length / 1MB)) MB)"
