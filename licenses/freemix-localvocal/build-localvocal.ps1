param(
 [Parameter(Mandatory)][string]$SourceDir,
 [Parameter(Mandatory)][string]$BuildDir,
 [Parameter(Mandatory)][string]$NativeRoot,
 [Parameter(Mandatory)][string]$CMake,
 [string]$NativeBuildDir,
 [string]$ObsDepsRoot,
 [string]$QtDepsRoot,
 [string]$Generator = 'Visual Studio 17 2022',
 [string]$Git = 'git',
 [int]$Parallel = 2
)
$ErrorActionPreference='Stop'
$SourceDir=[IO.Path]::GetFullPath($SourceDir).Replace('\','/')
$BuildDir=[IO.Path]::GetFullPath($BuildDir).Replace('\','/')
$NativeRoot=[IO.Path]::GetFullPath($NativeRoot).Replace('\','/')
if($SourceDir -eq $BuildDir -or $SourceDir -eq $NativeRoot -or $BuildDir -eq $NativeRoot){throw 'Use distinct source/build/native directories'}
if(Test-Path -LiteralPath $SourceDir){throw 'SourceDir must be new; existing source is never overwritten'}
if(!(Test-Path -LiteralPath $CMake -PathType Leaf)){throw 'Pass an explicit existing cmake.exe path'}
if(!$NativeBuildDir){$NativeBuildDir=Join-Path $NativeRoot 'build_2026'}
if(!$ObsDepsRoot){$ObsDepsRoot=(Get-ChildItem -LiteralPath (Join-Path $NativeRoot '.deps') -Directory | Where-Object {$_.Name -match '^obs-deps-\d.*-x64$'} | Sort-Object Name | Select-Object -Last 1).FullName}
if(!$QtDepsRoot){$QtDepsRoot=(Get-ChildItem -LiteralPath (Join-Path $NativeRoot '.deps') -Directory | Where-Object {$_.Name -match '^obs-deps-qt6-\d.*-x64$'} | Sort-Object Name | Select-Object -Last 1).FullName}
$NativeBuildDir=[IO.Path]::GetFullPath($NativeBuildDir).Replace('\','/')
$ObsDepsRoot=[IO.Path]::GetFullPath($ObsDepsRoot).Replace('\','/')
$QtDepsRoot=[IO.Path]::GetFullPath($QtDepsRoot).Replace('\','/')
foreach($qaLvRequired in @((Join-Path $NativeBuildDir 'libobs/libobsConfig.cmake'),(Join-Path $NativeBuildDir 'frontend/api/obs-frontend-apiConfig.cmake'),(Join-Path $ObsDepsRoot 'share/obs-deps/VERSION'),(Join-Path $QtDepsRoot 'lib/cmake/Qt6/Qt6Config.cmake'))){if(!(Test-Path -LiteralPath $qaLvRequired)){throw "Missing native SDK/dependency: $qaLvRequired"}}
$qaLvProvenance=Join-Path $BuildDir 'provenance'
New-Item -ItemType Directory -Path $qaLvProvenance -Force | Out-Null
function Get-PinnedArchive([string]$Url,[string]$File,[string]$Sha256){
 if(!(Test-Path -LiteralPath $File)){Invoke-WebRequest -Uri $Url -OutFile $File}
 if((Get-FileHash -LiteralPath $File -Algorithm SHA256).Hash -ne $Sha256){throw "SHA256 mismatch: $File"}
}
$qaLvOfficialZip=Join-Path $qaLvProvenance 'obs-localvocal-0.6.2.zip'
$qaLvCorrosionZip=Join-Path $qaLvProvenance 'corrosion-v0.5.zip'
Get-PinnedArchive 'https://codeload.github.com/royshil/obs-localvocal/zip/refs/tags/0.6.2' $qaLvOfficialZip '9BF8AB8B3FA913718CFF29147958D8A4DDC75ADB4EF1A7B5811C3119180AD319'
Get-PinnedArchive 'https://codeload.github.com/corrosion-rs/corrosion/zip/refs/tags/v0.5' $qaLvCorrosionZip 'AD854FCC34C78DAD5DBB53829B62685D7465CA915F56E09C2E84D7D8D4DE005B'
$qaLvExtraction=Join-Path $qaLvProvenance ('source-'+[guid]::NewGuid().ToString('N'))
Expand-Archive -LiteralPath $qaLvOfficialZip -DestinationPath $qaLvExtraction
New-Item -ItemType Directory -Path (Split-Path $SourceDir -Parent) -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $qaLvExtraction 'obs-localvocal-0.6.2') -Destination $SourceDir -Recurse
$qaLvPatch=Join-Path $PSScriptRoot 'freemix-localvocal-shutdown.patch'
if(!(Test-Path -LiteralPath $qaLvPatch)){throw 'Keep this recipe beside freemix-localvocal-shutdown.patch'}
& $Git -C $SourceDir apply --check $qaLvPatch
if($LASTEXITCODE -ne 0){throw 'Patch does not match pinned official source'}
& $Git -C $SourceDir apply $qaLvPatch
if($LASTEXITCODE -ne 0){throw 'Patch application failed'}
$qaLvCorrosionRoot=Join-Path $qaLvProvenance 'corrosion'
if(!(Test-Path -LiteralPath $qaLvCorrosionRoot)){Expand-Archive -LiteralPath $qaLvCorrosionZip -DestinationPath $qaLvCorrosionRoot}
$qaLvCorrosionRoot=$qaLvCorrosionRoot.Replace('\','/')
& $CMake -S $SourceDir -B $BuildDir -G $Generator -A x64 '-DFREEMIX_REUSE_OBS_IMPORTS=ON' '-DENABLE_WEBVTT=ON' "-Dlibobs_DIR=$NativeBuildDir/libobs" "-Dobs-frontend-api_DIR=$NativeBuildDir/frontend/api" "-Dw32-pthreads_DIR=$NativeBuildDir/deps/w32-pthreads" "-DCMAKE_MODULE_PATH=$NativeRoot/cmake/finders" "-DCMAKE_PREFIX_PATH=$ObsDepsRoot;$QtDepsRoot" "-DFETCHCONTENT_SOURCE_DIR_CORROSION=$qaLvCorrosionRoot/corrosion-0.5"
if($LASTEXITCODE -ne 0){throw 'LocalVocal configuration failed'}
& $CMake --build $BuildDir --config RelWithDebInfo --parallel $Parallel -- "/p:CL_MPCount=$Parallel"
if($LASTEXITCODE -ne 0){throw 'LocalVocal build failed'}
# Never installs, copies to the operator installation, or starts hardware.
