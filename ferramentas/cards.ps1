# Render the demo test cards to PNG with headless Edge (one unique profile per run).
$demo = 'D:\DRIVE\IA\antigravity\vmixtwste\obs-vmix\demo'
$edge = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
$cards = @(
  @{ f = 'cam1'; q = 'n=CAM%201&s=Plano%20geral&c=2f5f8f' }, @{ f = 'cam2'; q = 'n=CAM%202&s=Apresentador&c=2f7a52' },
  @{ f = 'cam3'; q = 'n=CAM%203&s=Convidado&c=8a5a2b' }, @{ f = 'cam4'; q = 'n=CAM%204&s=Plateia&c=6a3f8a' },
  @{ f = 'vt'; q = 'n=VT&s=Abertura&c=8a2f3a' }, @{ f = 'placar'; q = 'n=PLACAR&s=Gr%C3%A1fico&c=3c4858' },
  @{ f = 'entrevista'; q = 'n=ENTREV&s=Duas%20c%C3%A2meras&c=2b6f7a' }, @{ f = 'encerramento'; q = 'n=FIM&s=Encerramento&c=555b63' },
  @{ f = 'gc-tarja'; q = 'gc=1'; alpha = $true }
)
foreach ($c in $cards) {
  $out = "$demo\$($c.f).png"
  $prof = Join-Path $env:TEMP ("edge-card-" + [guid]::NewGuid().ToString('N'))
  $a = @('--headless', '--disable-gpu', '--no-first-run', '--hide-scrollbars', "--user-data-dir=$prof", '--window-size=1920,1080', '--force-device-scale-factor=1', "--screenshot=$out")
  if ($c.alpha) { $a += '--default-background-color=00000000' }
  $a += "file:///$($demo -replace '\\','/')/cartao.html?$($c.q)"
  Start-Process -FilePath $edge -ArgumentList $a -Wait -WindowStyle Hidden
  Remove-Item -Recurse -Force $prof -ErrorAction SilentlyContinue
  if (Test-Path $out) { "{0,-18} {1,8} bytes" -f "$($c.f).png", (Get-Item $out).Length } else { "$($c.f).png NAO GERADO" }
}
