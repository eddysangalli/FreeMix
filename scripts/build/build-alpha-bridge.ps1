param([string]$Destination = "$env:TEMP/FreeMix-QA-NativeAlpha-Build")
$ErrorActionPreference='Stop'
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$target=[IO.Path]::GetFullPath($Destination)
if (-not $target.StartsWith([IO.Path]::GetFullPath($env:TEMP)+[IO.Path]::DirectorySeparatorChar) -or -not (Split-Path $target -Leaf).StartsWith('FreeMix-QA-')) {throw 'Build destination must be a FreeMix-QA directory under TEMP'}
New-Item -ItemType Directory -Path $target -Force | Out-Null
$deps=Join-Path $root 'freemix-app/.deps/obs-deps-2026-07-15-x64'
$ndi=Join-Path $root 'freemix-app/frontend/widgets/vendor/freemix-ndi'
$source=Join-Path $root 'obs-vmix/ferramentas/native-alpha-bridge/main.cpp'
$vs=& "${env:ProgramFiles(x86)}/Microsoft Visual Studio/Installer/vswhere.exe" -latest -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
if (-not $vs) {throw 'MSVC x64 not installed'}
$vc=Join-Path $vs 'VC/Auxiliary/Build/vcvars64.bat'
$recipe=Join-Path $target 'compile.cmd'
@"
@echo off
call "$vc" >nul
cl /nologo /std:c++17 /O2 /EHsc /MD "$source" /I"$deps/include" /I"$ndi" /Fo"$target/main.obj" /Fe"$target/FreeMix-Alpha-Bridge.exe" /link /LIBPATH:"$deps/lib" avformat.lib avcodec.lib avutil.lib swscale.lib swresample.lib
"@ | Set-Content -LiteralPath $recipe -Encoding ascii
& cmd /c $recipe
if ($LASTEXITCODE -ne 0) {throw 'Native bridge compilation failed'}
Get-ChildItem -LiteralPath "$deps/bin" -Filter '*.dll' | ForEach-Object {Copy-Item -LiteralPath $_.FullName -Destination $target}
Get-FileHash -LiteralPath "$target/FreeMix-Alpha-Bridge.exe"
