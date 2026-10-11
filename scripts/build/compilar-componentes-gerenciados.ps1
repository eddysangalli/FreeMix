# Offline developer recipe. Produces internal FreeMix DLLs; never installs or
# launches them, changes operator settings, downloads SDKs or accepts licences.
param(
 [Parameter(Mandatory)][string]$SceneArchive,
 [Parameter(Mandatory)][string]$DistroArchive,
 [Parameter(Mandatory)][string]$WorkDir,
 [Parameter(Mandatory)][string]$NativeRoot,
 [Parameter(Mandatory)][string]$NativeBuildDir,
 [Parameter(Mandatory)][string]$ObsDepsRoot,
 [Parameter(Mandatory)][string]$QtDepsRoot,
 [Parameter(Mandatory)][string]$CMake,
 [string]$Git='git',
 [string]$Generator='Visual Studio 17 2022'
)
$ErrorActionPreference='Stop'
$product=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$WorkDir=[IO.Path]::GetFullPath($WorkDir)
if(Test-Path -LiteralPath $WorkDir){throw 'WorkDir must be new; existing builds are preserved'}
foreach($path in @($NativeRoot,$NativeBuildDir,$ObsDepsRoot,$QtDepsRoot)){
 $absolute=[IO.Path]::GetFullPath($path)
 if($absolute -eq $WorkDir -or $absolute.StartsWith($WorkDir+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw 'Build workspace must be distinct from existing dependency trees'}
 if(!(Test-Path -LiteralPath $absolute -PathType Container)){throw 'Existing dependency directory required'}
}
foreach($path in @($CMake,$SceneArchive,$DistroArchive,(Join-Path $NativeBuildDir 'libobs/libobsConfig.cmake'),(Join-Path $NativeBuildDir 'frontend/api/obs-frontend-apiConfig.cmake'),(Join-Path $QtDepsRoot 'lib/cmake/Qt6/Qt6Config.cmake'))){if(!(Test-Path -LiteralPath $path -PathType Leaf)){throw 'Required local source/tool/import missing'}}
if((Get-FileHash -LiteralPath $SceneArchive).Hash.ToLowerInvariant() -ne 'c3cb9d64d9bb9a15b0880a8b6e734ee20368f533fb5fb2aeb40b60aa77b66b2b'){throw 'SceneSwitcher official source archive mismatch'}
if((Get-FileHash -LiteralPath $DistroArchive).Hash.ToLowerInvariant() -ne '6da38f422c6dc826165a7462b4496f967ed7f948bd6a97ba3e0e3143193625e4'){throw 'DistroAV official source archive mismatch'}
New-Item -ItemType Directory -Path $WorkDir | Out-Null
Expand-Archive -LiteralPath $SceneArchive -DestinationPath (Join-Path $WorkDir 'scene')
Expand-Archive -LiteralPath $DistroArchive -DestinationPath (Join-Path $WorkDir 'distro')
$scene=Join-Path $WorkDir 'scene/SceneSwitcher-1.36.1'
$distro=Join-Path $WorkDir 'distro/DistroAV-6.2.1'
function Apply-ManagedPatch([string]$source,[string]$patch){
 & $Git -C $source apply --check --ignore-space-change --whitespace=nowarn $patch
 if($LASTEXITCODE -ne 0){throw 'Source patch preflight failed'}
 & $Git -C $source apply --ignore-space-change --whitespace=nowarn $patch
 if($LASTEXITCODE -ne 0){throw 'Source patch application failed'}
}
Apply-ManagedPatch $scene (Join-Path $product 'licenses/freemix-sceneswitcher/freemix-sceneswitcher-shutdown.patch')
Apply-ManagedPatch $scene (Join-Path $product 'licenses/freemix-sceneswitcher-managed/managed-release.patch')
Apply-ManagedPatch $distro (Join-Path $product 'licenses/freemix-distroav-managed/managed-release.patch')
function Check-ManagedSource([string]$source,[string]$group){
 $metadata=Get-Content -Raw -LiteralPath (Join-Path $product ('licenses/'+$group+'/PROVENANCE.json')) | ConvertFrom-Json
 foreach($file in $metadata.sourceFiles){
  $body=[IO.File]::ReadAllText((Join-Path $source $file.path)).Replace("`r`n","`n")
  $sha=[Security.Cryptography.SHA256]::Create()
  try{$hash=[BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($body))).Replace('-','').ToLowerInvariant()}finally{$sha.Dispose()}
  if($hash -ne $file.normalizedTextSHA){throw 'Reconstructed source mismatch'}
 }
}
Check-ManagedSource $scene 'freemix-sceneswitcher-managed'
Check-ManagedSource $distro 'freemix-distroav-managed'
$imports=@('-DFREEMIX_REUSE_OBS_IMPORTS=ON',('-Dlibobs_DIR='+$NativeBuildDir.Replace('\','/')+'/libobs'),('-Dobs-frontend-api_DIR='+$NativeBuildDir.Replace('\','/')+'/frontend/api'),('-Dw32-pthreads_DIR='+$NativeBuildDir.Replace('\','/')+'/deps/w32-pthreads'),('-DCMAKE_MODULE_PATH='+$NativeRoot.Replace('\','/')+'/cmake/finders'),('-DCMAKE_PREFIX_PATH='+$ObsDepsRoot.Replace('\','/')+';'+$QtDepsRoot.Replace('\','/')))
$disabled=@('base','http','midi','mqtt','openvr','schedule','scripting','speech','stream-deck','twitch','usb','video') | ForEach-Object {'-DENABLE_'+$_+'_PLUGIN=OFF'}
foreach($job in @(@{name='scene';source=$scene;extra=$disabled;target='advanced-scene-switcher'},@{name='distro';source=$distro;extra=@();target='distroav'})){
 $build=Join-Path $WorkDir ($job.name+'-build')
 $jobOptions=@($job.extra)
 & $CMake -S $job.source -B $build -G $Generator -A x64 @imports @jobOptions *> (Join-Path $WorkDir ($job.name+'-configure.log'))
 if($LASTEXITCODE -ne 0){throw 'Managed component configuration failed; inspect retained log'}
 & $CMake --build $build --config RelWithDebInfo --target $job.target --parallel 2 -- /p:CL_MPCount=2 *> (Join-Path $WorkDir ($job.name+'-build.log'))
 if($LASTEXITCODE -ne 0){throw 'Managed component compilation failed; inspect retained log'}
}
$built=@((Join-Path $WorkDir 'scene-build/RelWithDebInfo/advanced-scene-switcher.dll'),(Join-Path $WorkDir 'scene-build/RelWithDebInfo/advanced-scene-switcher-lib.dll'),(Join-Path $WorkDir 'distro-build/RelWithDebInfo/distroav.dll'))
$files=@($built | ForEach-Object {[pscustomobject]@{path=$_;bytes=(Get-Item -LiteralPath $_).Length;sha256=(Get-FileHash -LiteralPath $_).Hash.ToLowerInvariant()}})
@{status='COMPILED_NOT_INSTALLED_OR_RUNTIME_QUALIFIED';files=$files;operatorTouched=$false;sdkDownloaded=$false} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $WorkDir 'build-receipt.json') -Encoding utf8
