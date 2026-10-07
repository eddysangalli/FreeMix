# Compilação oficial do binário FreeMix.exe
$ErrorActionPreference = 'Stop'
$csc = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (-not (Test-Path $csc)) {
    throw "Compilador csc.exe não encontrado em $csc"
}

$root = Split-Path -Parent $PSScriptRoot
$binDir = Join-Path $root "bin\64bit"
$icoPath = Join-Path $PSScriptRoot "freemix.ico"
$srcPath = Join-Path $PSScriptRoot "FreeMixApp.cs"
$targetExe = Join-Path $binDir "FreeMix.exe"

$dllCore = Join-Path $binDir "Microsoft.Web.WebView2.Core.dll"
$dllForms = Join-Path $binDir "Microsoft.Web.WebView2.WinForms.dll"

Write-Host "Compilando executável nativo FreeMix.exe a partir de $srcPath..."
$compileArgs = @(
    "/target:winexe",
    "/optimize+",
    "/platform:x64",
    "/win32icon:$icoPath",
    "/r:System.dll,System.Drawing.dll,System.Windows.Forms.dll,System.Core.dll,$dllCore,$dllForms",
    "/out:$targetExe",
    $srcPath
)

& $csc $compileArgs
if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCESSO: FreeMix.exe compilado com ícone oficial e janela própria em $targetExe" -ForegroundColor Green
} else {
    throw "Falha na compilação do FreeMix.exe (código $LASTEXITCODE)"
}
