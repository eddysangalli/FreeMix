param(
 [Parameter(Mandatory)][string]$SourceDir,
 [Parameter(Mandatory)][string]$BuildDir,
 [Parameter(Mandatory)][string]$NativeRoot,
 [Parameter(Mandatory)][string]$CMake,
 [Parameter(Mandatory)][string]$NativeBuildDir,
 [Parameter(Mandatory)][string]$ObsDepsRoot,
 [Parameter(Mandatory)][string]$QtDepsRoot,
 [string]$Generator='Visual Studio 17 2022',
 [string]$Git='git',
 [int]$Parallel=2
)
$ErrorActionPreference='Stop'
$SourceDir=[IO.Path]::GetFullPath($SourceDir).Replace('\','/')
$BuildDir=[IO.Path]::GetFullPath($BuildDir).Replace('\','/')
$NativeRoot=[IO.Path]::GetFullPath($NativeRoot).Replace('\','/')
$NativeBuildDir=[IO.Path]::GetFullPath($NativeBuildDir).Replace('\','/')
$ObsDepsRoot=[IO.Path]::GetFullPath($ObsDepsRoot).Replace('\','/')
$QtDepsRoot=[IO.Path]::GetFullPath($QtDepsRoot).Replace('\','/')
if($SourceDir -eq $BuildDir -or $SourceDir -eq $NativeRoot -or $BuildDir -eq $NativeRoot){throw 'Use distinct source/build/native directories'}
if(Test-Path -LiteralPath $SourceDir){throw 'SourceDir must be new; existing source is never overwritten'}
foreach($qaSsRequired in @($CMake,"$NativeBuildDir/libobs/libobsConfig.cmake","$NativeBuildDir/frontend/api/obs-frontend-apiConfig.cmake","$ObsDepsRoot/share/obs-deps/VERSION","$QtDepsRoot/lib/cmake/Qt6/Qt6Config.cmake")){if(!(Test-Path -LiteralPath $qaSsRequired -PathType Leaf)){throw "Missing SDK/tool: $qaSsRequired"}}
$qaSsProvenance=Join-Path $BuildDir 'provenance'
New-Item -ItemType Directory -Path $qaSsProvenance -Force | Out-Null
$qaSsZip=Join-Path $qaSsProvenance 'SceneSwitcher-1.36.1.zip'
if(!(Test-Path -LiteralPath $qaSsZip)){Invoke-WebRequest 'https://codeload.github.com/WarmUpTill/SceneSwitcher/zip/refs/tags/1.36.1' -OutFile $qaSsZip}
if((Get-FileHash -LiteralPath $qaSsZip).Hash -ne 'C3CB9D64D9BB9A15B0880A8B6E734EE20368F533FB5FB2AEB40B60AA77B66B2B'){throw 'Official source SHA256 mismatch'}
$qaSsExtraction=Join-Path $qaSsProvenance ('source-'+[guid]::NewGuid().ToString('N'))
Expand-Archive -LiteralPath $qaSsZip -DestinationPath $qaSsExtraction
New-Item -ItemType Directory -Path (Split-Path $SourceDir -Parent) -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $qaSsExtraction 'SceneSwitcher-1.36.1') -Destination $SourceDir -Recurse
$qaSsPatch=Join-Path $PSScriptRoot 'freemix-sceneswitcher-shutdown.patch'
& $Git -C $SourceDir apply --check $qaSsPatch
if($LASTEXITCODE -ne 0){throw 'Patch mismatch'}
& $Git -C $SourceDir apply $qaSsPatch
if($LASTEXITCODE -ne 0){throw 'Patch failed'}
# Rebuild only the module/core DLLs. Keep the original 1.36.1 subplugins at deployment.
# No exported class layout or headers are changed by the patch.
$qaSsOptions=@('base','http','midi','mqtt','openvr','schedule','scripting','speech','stream-deck','twitch','usb','video') | ForEach-Object {"-DENABLE_${_}_PLUGIN=OFF"}
& $CMake -S $SourceDir -B $BuildDir -G $Generator -A x64 '-DFREEMIX_REUSE_OBS_IMPORTS=ON' "-Dlibobs_DIR=$NativeBuildDir/libobs" "-Dobs-frontend-api_DIR=$NativeBuildDir/frontend/api" "-Dw32-pthreads_DIR=$NativeBuildDir/deps/w32-pthreads" "-DCMAKE_MODULE_PATH=$NativeRoot/cmake/finders" "-DCMAKE_PREFIX_PATH=$ObsDepsRoot;$QtDepsRoot" @qaSsOptions
if($LASTEXITCODE -ne 0){throw 'SceneSwitcher configuration failed'}
& $CMake --build $BuildDir --config RelWithDebInfo --target advanced-scene-switcher --parallel $Parallel -- "/p:CL_MPCount=$Parallel"
if($LASTEXITCODE -ne 0){throw 'SceneSwitcher build failed'}
# No installation, process launch, configuration mutation or hardware access.
