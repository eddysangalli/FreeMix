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
$files=@('decklink-output.cpp','decklink-device.cpp','decklink-device-instance.cpp','OBSVideoFrame.cpp')
$checks=@()
foreach($file in $files){
 $source=Join-Path $native ('plugins/decklink/'+$file)
 $recipe=Join-Path $target 'compile.cmd'
 @"
@echo off
call "$vc" >nul
cl /nologo /Zs /std:c++17 /EHsc /MD /utf-8 /DNOMINMAX /DUNICODE /D_UNICODE /D_WIN32_WINNT=0x0601 $includeArgs "$source"
"@ | Set-Content -LiteralPath $recipe -Encoding ascii
 & cmd /c $recipe
 $checks+=@{file=$file;exitCode=$LASTEXITCODE}
 if($LASTEXITCODE -ne 0){throw "Syntax failed: $file"}
}
@{result='PASS';checkedAt=[DateTime]::UtcNow.ToString('o');checks=$checks;sharedBuildUsed=$false} | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'resultado-syntax.json') -Encoding utf8
