$ErrorActionPreference='Stop'
$qaCefEvidenceRoot=Join-Path $PSScriptRoot 'cef-native'
$qaCefSamples=@()
for($qaCefIndex=0;$qaCefIndex -lt 60;$qaCefIndex++){
 $qaCefProgress=Get-Content (Join-Path $qaCefEvidenceRoot 'progress.json') -Raw | ConvertFrom-Json
 $qaCefParent=Get-CimInstance Win32_Process -Filter "ProcessId=$($qaCefProgress.pid)"
 if(!$qaCefParent){break}
 if($qaCefParent.ExecutablePath -ne "$($qaCefProgress.root)\bin\64bit\FreeMix.exe"){throw 'Own QA process path changed'}
 $qaCefIds=@([int]$qaCefProgress.pid)
 for($qaCefDepth=0;$qaCefDepth -lt 3;$qaCefDepth++){
  $qaCefChildren=Get-CimInstance Win32_Process | Where-Object {$_.ParentProcessId -in $qaCefIds -and $_.ExecutablePath -and $_.ExecutablePath.StartsWith($qaCefProgress.root+'\',[StringComparison]::OrdinalIgnoreCase)}
  $qaCefIds=@($qaCefIds+$qaCefChildren.ProcessId | Select-Object -Unique)
 }
 $qaCefProcesses=@(Get-Process -Id $qaCefIds -ErrorAction SilentlyContinue)
 $qaCefSamples+= [ordered]@{at=[DateTime]::UtcNow.ToString('o');nativePid=$qaCefProgress.pid;wallMs=$qaCefProgress.last.wall;cursor=$qaCefProgress.last.cursor;processes=@($qaCefProcesses | ForEach-Object {[ordered]@{pid=$_.Id;name=$_.ProcessName;workingSetBytes=$_.WorkingSet64;privateBytes=$_.PrivateMemorySize64;cpuSeconds=$_.CPU;threads=$_.Threads.Count}})}
 $qaCefSamples | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $qaCefEvidenceRoot 'resource-samples.json') -Encoding utf8
 if(Test-Path (Join-Path $qaCefEvidenceRoot 'resultado-cef-native.json')){break}
 Start-Sleep -Seconds 20
}
