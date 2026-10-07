$bin = 'D:\DRIVE\IA\antigravity\vmixtwste\obs-vmix\bin\64bit'
$p = Start-Process -FilePath "$bin\FreeMix.exe" -WorkingDirectory $bin -ArgumentList '--portable', '--multi', '--disable-updater', '--disable-missing-files-check', '--enable-media-stream', '--remote-debugging-port=9333' -PassThru
Start-Sleep -Seconds 6
if ($p.HasExited) {
    Write-Output "SAIU_COM_CODIGO: $($p.ExitCode)"
} else {
    Write-Output "RODANDO_PID: $($p.Id)"
}
