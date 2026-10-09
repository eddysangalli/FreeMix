param([string]$Destination="$env:TEMP/FreeMix-QA-OmtHdr-Syntax")
$ErrorActionPreference='Stop'
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$target=[IO.Path]::GetFullPath($Destination)
if(-not $target.StartsWith([IO.Path]::GetFullPath($env:TEMP)+[IO.Path]::DirectorySeparatorChar) -or -not (Split-Path $target -Leaf).StartsWith('FreeMix-QA-')){throw 'Own TEMP QA target required'}
New-Item -ItemType Directory -Path $target -Force | Out-Null
$vs=& "${env:ProgramFiles(x86)}/Microsoft Visual Studio/Installer/vswhere.exe" -latest -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
$vc=Join-Path $vs 'VC/Auxiliary/Build/vcvars64.bat'
$src=Join-Path $target 'check.cpp'
'#include "FreeMixOmtHdrOutput.hpp"'|Set-Content -LiteralPath $src -Encoding ascii
$base=Join-Path $taskRoot 'freemix-app'
$qt=Join-Path $base '.deps/obs-deps-qt6-2026-07-15-x64'
$includes=@('frontend/widgets','libobs','build_2026/config','frontend/api','deps/w32-pthreads','.deps/obs-deps-2026-07-15-x64/include')|ForEach-Object{'/I"'+(Join-Path $base $_)+'"'}
$includes+=@('include','include/QtCore','mkspecs/win32-msvc')|ForEach-Object{'/I"'+(Join-Path $qt $_)+'"'}
$recipe=Join-Path $target 'check.cmd'
@"
@echo off
call "$vc" >nul
cl /nologo /std:c++17 /Zc:__cplusplus /permissive- /Zs /EHsc /MD /DNOMINMAX /DUNICODE /D_UNICODE "$src" $($includes -join ' ')
"@|Set-Content -LiteralPath $recipe -Encoding ascii
& cmd /c $recipe
if($LASTEXITCODE -ne 0){throw 'HDR header syntax failed'}
