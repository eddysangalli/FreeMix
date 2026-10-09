$ErrorActionPreference='Stop'
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$native=Join-Path $taskRoot 'freemix-app'
$target=Join-Path $env:TEMP 'FreeMix-QA-SdiHdr-Syntax'
New-Item -ItemType Directory -Force -Path $target | Out-Null
$vs=& "${env:ProgramFiles(x86)}/Microsoft Visual Studio/Installer/vswhere.exe" -latest -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
$vc=Join-Path $vs 'VC/Auxiliary/Build/vcvars64.bat'
[xml]$proj=Get-Content -LiteralPath (Join-Path $native 'build_2026/frontend/obs-studio.vcxproj')
$ns=New-Object Xml.XmlNamespaceManager($proj.NameTable);$ns.AddNamespace('m','http://schemas.microsoft.com/developer/msbuild/2003')
$includes=$proj.SelectSingleNode('//m:ClCompile/m:AdditionalIncludeDirectories',$ns).InnerText.Split(';') | Where-Object {$_ -notmatch '%'}
$includeArgs=($includes | ForEach-Object {' /I"'+$_+'"'}) -join ''
$includeArgs+=' /I"'+$native+'/.deps/obs-deps-2026-07-15-x64/include"'
$source=Join-Path $target 'check-sdi-frontend.cpp'
'#include "FreeMixSdiOutput.hpp"' | Set-Content -LiteralPath $source -Encoding ascii
$recipe=Join-Path $target 'compile-frontend.cmd'
@"
@echo off
call "$vc" >nul
cl /nologo /Zs /std:c++20 /EHsc /MD /utf-8 /DNOMINMAX /DUNICODE /D_UNICODE /DQT_CORE_LIB /DQT_GUI_LIB /DQT_WIDGETS_LIB /I"$native/frontend/widgets" $includeArgs "$source"
"@ | Set-Content -LiteralPath $recipe -Encoding ascii
& cmd /c $recipe
if($LASTEXITCODE -ne 0){throw 'Frontend syntax compilation failed'}
@{result='PASS';checkedAt=[DateTime]::UtcNow.ToString('o');file='FreeMixSdiOutput.hpp';sharedBuildUsed=$false} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'resultado-frontend-syntax.json') -Encoding utf8
