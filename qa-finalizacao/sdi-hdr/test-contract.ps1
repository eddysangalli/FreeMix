$ErrorActionPreference='Stop'
$taskRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$target=[IO.Path]::GetFullPath("$env:TEMP/FreeMix-QA-SdiHdr-Contract")
if(-not $target.StartsWith([IO.Path]::GetFullPath($env:TEMP)+[IO.Path]::DirectorySeparatorChar)){throw 'QA target escaped TEMP'}
New-Item -ItemType Directory -Path $target -Force | Out-Null
$vs=& "${env:ProgramFiles(x86)}/Microsoft Visual Studio/Installer/vswhere.exe" -latest -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
$vc=Join-Path $vs 'VC/Auxiliary/Build/vcvars64.bat'
$source=Join-Path $PSScriptRoot 'test-contract.cpp'
$sdk=Join-Path $taskRoot 'freemix-app/build_2026/plugins/decklink'
$recipe=Join-Path $target 'compile.cmd'
@"
@echo off
call "$vc" >nul
cl /nologo /std:c++17 /O2 /EHsc /MD "$source" /I"$sdk" /Fo"$target/test.obj" /Fe"$target/test-contract.exe"
"@ | Set-Content -LiteralPath $recipe -Encoding ascii
& cmd /c $recipe
if($LASTEXITCODE -ne 0){throw 'Contract compilation failed'}
$output=& "$target/test-contract.exe"
if($LASTEXITCODE -ne 0){throw 'Contract test failed'}
$receipt=$output | ConvertFrom-Json
$receipt | Add-Member -NotePropertyName checkedAt -NotePropertyValue ([DateTime]::UtcNow.ToString('o'))
$receipt | Add-Member -NotePropertyName executableSha256 -NotePropertyValue (Get-FileHash -LiteralPath "$target/test-contract.exe").Hash
$receipt | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'resultado-contract.json') -Encoding utf8
$receipt | ConvertTo-Json -Depth 6
