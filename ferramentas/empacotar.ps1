# Empacotador Oficial do FreeMix Studio
# 1. Compila o aplicativo a partir do código-fonte (.NET 7 x64)
# 2. Instala na pasta de distribuição com runtime libobs e plugins
# 3. Compacta o pacote autônomo oficial

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$parentDir = Split-Path -Parent $root
$obsVmixDir = Join-Path $parentDir "obs-vmix"
$binDir = Join-Path $obsVmixDir "bin\64bit"
$projectPath = Join-Path $root "src\FreeMixApp\FreeMixApp.csproj"

Write-Host "=== 1. COMPILANDO APLICATIVO NATIVO FREEMIX.EXE ===" -ForegroundColor Cyan
if (Test-Path $projectPath) {
    & dotnet publish $projectPath -c Release -r win-x64 --no-self-contained -o $binDir
    if ($LASTEXITCODE -ne 0) {
        throw "Falha na compilação do executável FreeMix.exe (código $LASTEXITCODE)"
    }
} else {
    throw "Arquivo de projeto não encontrado: $projectPath"
}

$exePath = Join-Path $binDir "FreeMix.exe"
if (-not (Test-Path $exePath)) {
    throw "Executável compilado não encontrado em $exePath"
}

Write-Host "=== 2. VERIFICANDO INTEGRIDADE DO BINÁRIO COMPILADO ===" -ForegroundColor Cyan
$fileInfo = Get-Item $exePath
Write-Host "-> Executável: $($fileInfo.FullName)"
Write-Host "-> Tamanho: $([math]::Round($fileInfo.Length / 1KB)) KB"
Write-Host "-> Versão: $($fileInfo.VersionInfo.ProductVersion)"

Write-Host "=== 3. EMPACOTANDO DISTRIBUIÇÃO OFICIAL ===" -ForegroundColor Cyan
$name = Split-Path -Leaf $obsVmixDir
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
    throw "tar falhou ao gerar o pacote com código $LASTEXITCODE"
}

Write-Host "SUCESSO: Pacote oficial gerado com sucesso:" -ForegroundColor Green
Write-Host "-> $zip ($([math]::Round((Get-Item $zip).Length / 1MB)) MB)"
