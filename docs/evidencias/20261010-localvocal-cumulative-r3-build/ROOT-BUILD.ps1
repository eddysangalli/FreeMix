$ErrorActionPreference = 'Stop'
$qaLvWorkspace = 'D:/DRIVE/IA/antigravity/vmixtwste'
$qaLvJob = "$qaLvWorkspace/qa-finalizacao/LocalVocal-GovBuild-4fe1e45cd2e14822bcf9dea86ac01251"
$qaLvNative = "$qaLvWorkspace/freemix-app"
$qaLvCmake = 'C:/Program Files (x86)/Microsoft Visual Studio/2022/BuildTools/Common7/IDE/CommonExtensions/Microsoft/CMake/CMake/bin/cmake.exe'
$qaLvPlan = "$qaLvWorkspace/qa-finalizacao/localvocal-governance-build-plan-r3"
$qaLvPins = Get-Content -LiteralPath "$qaLvPlan/DEPENDENCIES.json" -Raw | ConvertFrom-Json
function Test-LvPins {
 foreach ($qaLvPin in @($qaLvPins.tools) + @($qaLvPins.nativeImportsAndQtSentinels)) {
  if ((Get-Item -LiteralPath $qaLvPin.path).Length -ne $qaLvPin.bytes -or (Get-FileHash -LiteralPath $qaLvPin.path -Algorithm SHA256).Hash.ToLowerInvariant() -ne $qaLvPin.sha256) { throw "Changed tool/import: $($qaLvPin.path)" }
 }
}
Test-LvPins
$qaLvLifecycle = Get-Content -LiteralPath "$qaLvJob/ROOT-LIFECYCLE-STAGED.json" -Raw | ConvertFrom-Json
foreach ($qaLvTarget in $qaLvLifecycle.targets) {
 if ((Get-FileHash -LiteralPath "$qaLvJob/source/$($qaLvTarget.path)" -Algorithm SHA256).Hash.ToLowerInvariant() -ne $qaLvTarget.after.sha256) { throw 'Changed lifecycle source' }
}
$qaLvPriorCargoHome=$env:CARGO_HOME; $qaLvPriorOffline=$env:CARGO_NET_OFFLINE; $qaLvPriorAcceleration=$env:ACCELERATION
$qaLvReceipt = [ordered]@{ status='ROOT_BUILD_STARTED_CUMULATIVE_R3_LIFECYCLE'; startedAt=[datetime]::UtcNow.ToString('o'); job=$qaLvJob; buildPlanSha256='f9fe95319671e9db68228961e2dffcc2a391b3c46a1b5791cb53611ed8404a9e'; lifecycleAllowlistSha256=$qaLvLifecycle.allowlistSha256; modelGovernanceAllowlistSha256='41a6501e0cdfb82ccf1d04183bedef6856d303e5c9e527e9c7c4248525e68331'; captionOwnershipAllowlistSha256='d2b2d940968c2406e2ba0b7ff9aee6433d3786ce828f0364c2ffa7506d6ae1d1'; installed=$false; NativeStarted=$false; operatorTouched=$false; networkPolicy='FETCHCONTENT_DISCONNECTED_CARGO_OFFLINE_FROZEN_NO_TRACE_CLAIM' }
try {
 $env:CARGO_HOME="$qaLvJob/cargo-home"; $env:CARGO_NET_OFFLINE='true'; $env:ACCELERATION='generic'
 $qaLvArgs=@('-S',"$qaLvJob/source",'-B',"$qaLvJob/build",'-G','Visual Studio 17 2022','-A','x64','-DFREEMIX_REUSE_OBS_IMPORTS=ON','-DCMAKE_BUILD_TYPE=RelWithDebInfo','-DENABLE_QT=ON','-DENABLE_FRONTEND_API=ON','-DENABLE_WEBVTT=ON','-DENABLE_TESTS=OFF','-DFETCHCONTENT_FULLY_DISCONNECTED=ON','-DFETCHCONTENT_UPDATES_DISCONNECTED=ON','-DACCELERATION=generic',"-DCMAKE_INSTALL_PREFIX=$qaLvJob/not-installed","-Dlibobs_DIR=$qaLvNative/build_2026/libobs","-Dobs-frontend-api_DIR=$qaLvNative/build_2026/frontend/api","-Dw32-pthreads_DIR=$qaLvNative/build_2026/deps/w32-pthreads","-DCMAKE_MODULE_PATH=$qaLvNative/cmake/finders","-DCMAKE_PREFIX_PATH=$qaLvNative/.deps/obs-deps-2026-07-15-x64;$qaLvNative/.deps/obs-deps-qt6-2026-07-15-x64",'-DRust_COMPILER=C:/Users/eddyr/.rustup/toolchains/stable-x86_64-pc-windows-msvc/bin/rustc.exe','-DRust_CARGO=C:/Users/eddyr/.rustup/toolchains/stable-x86_64-pc-windows-msvc/bin/cargo.exe')
 foreach($qaLvDependency in @('WHISPERCPP_FETCH','CTRANSLATE2_FETCH','SENTENCEPIECE_FETCH','ONNXRUNTIME','LIBCURL_FETCH','ICU_BUILD','CORROSION')) { $qaLvArgs+="-DFETCHCONTENT_SOURCE_DIR_$qaLvDependency=$qaLvJob/dependencies/$($qaLvDependency.ToLowerInvariant())" }
 & $qaLvCmake @qaLvArgs *> "$qaLvJob/ROOT-configure.log"
 $qaLvReceipt.configureExit=$LASTEXITCODE
 if ($LASTEXITCODE -ne 0) { throw 'Offline configure failed; preserved log' }
 Write-Output 'ROOT_CONFIGURE_PASS_START_BUILD'
 & $qaLvCmake --build "$qaLvJob/build" --config RelWithDebInfo --target obs-localvocal --parallel 2 -- '/p:CL_MPCount=2' *> "$qaLvJob/ROOT-build.log"
 $qaLvReceipt.buildExit=$LASTEXITCODE
 if ($LASTEXITCODE -ne 0) { throw 'Build failed; preserved log' }
 $qaLvDll="$qaLvJob/build/RelWithDebInfo/obs-localvocal.dll"
 $qaLvReceipt.dll=[ordered]@{path=$qaLvDll;bytes=(Get-Item -LiteralPath $qaLvDll).Length;sha256=(Get-FileHash -LiteralPath $qaLvDll -Algorithm SHA256).Hash.ToLowerInvariant()}
 $qaLvPdb="$qaLvJob/build/RelWithDebInfo/obs-localvocal.pdb"
 $qaLvReceipt.pdb=[ordered]@{path=$qaLvPdb;bytes=(Get-Item -LiteralPath $qaLvPdb).Length;sha256=(Get-FileHash -LiteralPath $qaLvPdb -Algorithm SHA256).Hash.ToLowerInvariant()}
 Test-LvPins
 $qaLvReceipt.status='ROOT_COMPILED_LOCALVOCAL_CUMULATIVE_R3_LIFECYCLE'
} catch {
 $qaLvReceipt.status='FAIL_ROOT_BUILD_CUMULATIVE_R3_LIFECYCLE';$qaLvReceipt.error=$_.Exception.Message
} finally {
 $env:CARGO_HOME=$qaLvPriorCargoHome;$env:CARGO_NET_OFFLINE=$qaLvPriorOffline;$env:ACCELERATION=$qaLvPriorAcceleration
 $qaLvReceipt.finishedAt=[datetime]::UtcNow.ToString('o')
 $qaLvReceipt | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath "$qaLvJob/ROOT-BUILD-RECEIPT.json" -Encoding utf8
}
$qaLvReceipt | ConvertTo-Json -Depth 12
if ($qaLvReceipt.status -like 'FAIL*') { exit 1 }
