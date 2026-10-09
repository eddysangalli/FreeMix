param([switch]$Check)
$ErrorActionPreference = 'Stop'
$workspace = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$deliveries = Join-Path $workspace 'entregas'
$pointer = Join-Path $deliveries 'INSTALADOR-ATUAL.json'
if (Test-Path -LiteralPath $pointer) {
    $receipt = Get-Content -LiteralPath $pointer -Raw | ConvertFrom-Json
    $name = [string]$receipt.file
    if ($name -notmatch '^FreeMix-Studio-Setup-0\.1\.0-local\.\d{14}\.exe$' -or $receipt.status -ne 'VERIFIED') { throw 'O apontador do instalador atual é inválido.' }
} else {
    $name = 'FreeMix-Studio-Setup-0.1.0-local.20261009153453.exe'
}
$installer = Join-Path $deliveries $name
if (-not (Test-Path -LiteralPath $installer -PathType Leaf)) { throw 'Instalador completo não encontrado na pasta entregas.' }
if ($Check) { Write-Output $installer; exit 0 }
$result = Start-Process -FilePath $installer -Wait -PassThru
exit $result.ExitCode
