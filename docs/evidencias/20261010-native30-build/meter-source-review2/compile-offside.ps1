$ErrorActionPreference='Stop'
$taskRoot=$PSScriptRoot
$compiler='C:/Program Files/Microsoft Visual Studio/18/Community/VC/Tools/MSVC/14.51.36231/bin/Hostx64/x64/cl.exe'
$vcvars='C:/Program Files/Microsoft Visual Studio/18/Community/VC/Auxiliary/Build/vcvars64.bat'
$depInclude='D:/DRIVE/IA/antigravity/vmixtwste/freemix-app/.deps/obs-deps-2026-07-15-x64/include'
$outRoot=Join-Path $taskRoot 'model-build'
if(Test-Path -LiteralPath $outRoot){throw 'Own CPU model output already exists; preserve and do not rerun'}
if(!(Test-Path -LiteralPath $compiler)){throw 'Pinned compiler absent'}
New-Item -ItemType Directory -Path $outRoot | Out-Null
$cmdFile=Join-Path $outRoot 'compile.cmd'
$lines=@('@echo off',('call "'+$vcvars+'" >nul'),('cd /d "'+$outRoot+'"'),
('"'+$compiler+'" /nologo /std:c++17 /EHsc /Od /fp:precise /W4 /Fo:model.obj /Fe:model.exe /Fd:model-compile.pdb /I"'+$depInclude+'" "'+(Join-Path $taskRoot 'model/model.cpp')+'" /link /PDB:model-link.pdb'),'if errorlevel 1 exit /b 1',
'model.exe > result.json','if errorlevel 1 exit /b 1',
('"'+$compiler+'" /nologo /std:c++17 /EHsc /Od /fp:precise /W4 /fsanitize=address /Zi /Fo:model-asan.obj /Fe:model-asan.exe /Fd:model-asan-compile.pdb /I"'+$depInclude+'" "'+(Join-Path $taskRoot 'model/model.cpp')+'" /link /PDB:model-asan-link.pdb'),'if errorlevel 1 exit /b 1',
'model-asan.exe > result-asan.json','if errorlevel 1 exit /b 1')
[IO.File]::WriteAllLines($cmdFile,$lines,[Text.ASCIIEncoding]::new())
cmd /d /c $cmdFile 2>&1 | Tee-Object -FilePath (Join-Path $taskRoot 'compile.log')
if($LASTEXITCODE -ne 0){throw 'Own CPU model compile/test failed; preserve all results, no Native executed'}
$receipt=[ordered]@{status='PASS_CPU_MODEL_AND_MSVC_ASAN_ONLY';compiler=$compiler;compilerSha256=(Get-FileHash -LiteralPath $compiler -Algorithm SHA256).Hash.ToLower();normal=(Get-Content -LiteralPath (Join-Path $outRoot 'result.json') -Raw | ConvertFrom-Json);asan=(Get-Content -LiteralPath (Join-Path $outRoot 'result-asan.json') -Raw | ConvertFrom-Json);nativeStarted=$false;canonicalChanged=$false;limits=@('ASan checks bounds, not uninitialized float values','No MemorySanitizer/UndefinedBehaviorSanitizer tool available on PATH','Models never execute indeterminate reads','No audio/GPU/callback/lifecycle or causal qualification')}
[IO.File]::WriteAllText((Join-Path $taskRoot 'CPP-RECEIPT.json'),($receipt | ConvertTo-Json -Depth 8)+[Environment]::NewLine,[Text.UTF8Encoding]::new($false))
$receipt | ConvertTo-Json -Depth 4
