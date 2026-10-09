$ErrorActionPreference='Stop'
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$native=Join-Path $taskRoot 'freemix-app'
$target=Join-Path $env:TEMP 'FreeMix-QA-SdiHdr-Syntax'
New-Item -ItemType Directory -Force -Path $target | Out-Null
$vs=& "${env:ProgramFiles(x86)}/Microsoft Visual Studio/Installer/vswhere.exe" -latest -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
$vc=Join-Path $vs 'VC/Auxiliary/Build/vcvars64.bat'
[xml]$proj=Get-Content -LiteralPath (Join-Path $native 'build_2026/plugins/decklink/decklink.vcxproj')
$ns=New-Object Xml.XmlNamespaceManager($proj.NameTable);$ns.AddNamespace('m','http://schemas.microsoft.com/developer/msbuild/2003')
$includes=$proj.SelectSingleNode('//m:ClCompile/m:AdditionalIncludeDirectories',$ns).InnerText.Split(';') | Where-Object {$_ -notmatch '%'}
$includeArgs=($includes | ForEach-Object {' /I"'+$_+'"'}) -join ''
$includeArgs+=' /I"'+$native+'/.deps/obs-deps-2026-07-15-x64/include"'
$source=Join-Path $PSScriptRoot 'test-sdk-frame.cpp'
$original=Join-Path $native 'plugins/decklink/OBSVideoFrame.cpp'
$guids=Join-Path $native 'build_2026/plugins/decklink/DeckLinkAPI_i.c'
$library=Join-Path $native 'build_2026/libobs/RelWithDebInfo/obs.lib'
$recipe=Join-Path $target 'compile-sdk-frame.cmd'
@"
@echo off
call "$vc" >nul
cd /d "$target"
cl /nologo /std:c++17 /O2 /EHsc /MD /utf-8 /DNOMINMAX /DUNICODE /D_UNICODE $includeArgs "$source" "$original" "$guids" "$library" /Fe"$target/test-sdk-frame.exe"
"@ | Set-Content -LiteralPath $recipe -Encoding ascii
& cmd /c $recipe
if($LASTEXITCODE -ne 0){throw 'SDK-frame compilation failed'}
$env:PATH=(Join-Path $native 'build_2026/rundir/RelWithDebInfo/bin/64bit')+';'+$env:PATH
$output=& "$target/test-sdk-frame.exe"
if($LASTEXITCODE -ne 0){throw 'SDK-frame test failed'}
$receipt=$output | ConvertFrom-Json
$receipt | Add-Member checkedAt ([DateTime]::UtcNow.ToString('o'))
$receipt | Add-Member executableSha256 (Get-FileHash -LiteralPath "$target/test-sdk-frame.exe").Hash
$receipt | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'resultado-sdk-frame.json') -Encoding utf8
$output
