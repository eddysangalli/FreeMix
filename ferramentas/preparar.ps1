# Runs before OBS starts. If this folder was moved, or copied to another machine, the absolute paths saved in the
# portable config (panel address, demo images, recording folder) are pointed at where the folder is now, and the
# control server gets a new random password. Does nothing when the folder is where it was last time.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$cfg = Join-Path $root 'config\obs-studio'
$mark = Join-Path $cfg 'raiz.txt'
$old = if (Test-Path $mark) { (Get-Content $mark -Raw).Trim() } else { 'D:\DRIVE\IA\antigravity\vmixtwste\obs-vmix' }

# The bundled FreeMix theme is maintained by the application. Keep its previous bytes before an update;
# other themes and all profile/preset choices remain owned by the operator.
if (-not (Get-Process obs64, FreeMix -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "$root\*" })) {
  $taskThemeSource=Join-Path $root 'painel\tema-padrao.ovt'
  $taskThemeFolder=Join-Path $cfg 'themes'
  $taskThemeTarget=Join-Path $taskThemeFolder 'Yami_MesaDeCorte.ovt'
  if(Test-Path -LiteralPath $taskThemeSource){
    if(-not(Test-Path -LiteralPath $taskThemeFolder)){New-Item -ItemType Directory -Path $taskThemeFolder | Out-Null}
    if(-not(Test-Path -LiteralPath $taskThemeTarget) -or (Get-FileHash -LiteralPath $taskThemeSource).Hash -ne (Get-FileHash -LiteralPath $taskThemeTarget).Hash){
      if((Test-Path -LiteralPath $taskThemeTarget) -and -not(Test-Path -LiteralPath ($taskThemeTarget+'.anterior'))){Copy-Item -LiteralPath $taskThemeTarget -Destination ($taskThemeTarget+'.anterior')}
      Copy-Item -LiteralPath $taskThemeSource -Destination $taskThemeTarget -Force
    }
  }
}

# Every start: the keyer plugin (Downstream Keyer 0.4.4) leaves the "hide after" time of a keyer created at run
# time uninitialised and saves that garbage with the preset. On the next start such a keyer drops its scene right
# after showing it: an overlay that will not stay on, or the audio buses going off air (no sound on Master).
# No request can set that value, so it is zeroed in the preset files here.
try {
  if (-not (Get-Process obs64, FreeMix -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "$root\*" })) {
    $enc = New-Object System.Text.UTF8Encoding $false
    foreach ($f in Get-ChildItem (Join-Path $cfg 'basic\scenes\*') -Include *.json, *.bak, *.salvo -File -ErrorAction SilentlyContinue) {
      $t = [System.IO.File]::ReadAllText($f.FullName, $enc)
      $n = [regex]::Replace($t, '("hide_after":\s*)[1-9]\d*', '${1}0')
      if ($n -ne $t) { [System.IO.File]::WriteAllText($f.FullName, $n, $enc) }
    }
  }
} catch { }

if ($old -ieq $root) { exit 0 }
if (Get-Process obs64, FreeMix -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "$root\*" }) { exit 0 }

$utf8 = New-Object System.Text.UTF8Encoding $false
function Swap([string]$text, [string]$from, [string]$to) { [regex]::Replace($text, [regex]::Escape($from), { param($m) $to }, 'IgnoreCase') }
$files = @(Join-Path $cfg 'user.ini') + @(Get-ChildItem (Join-Path $cfg 'basic\scenes') -Filter *.json -ErrorAction SilentlyContinue | ForEach-Object FullName) + @(Get-ChildItem (Join-Path $cfg 'basic\profiles') -Recurse -Filter basic.ini -ErrorAction SilentlyContinue | ForEach-Object FullName)
foreach ($f in $files) {
  if (-not (Test-Path $f)) { continue }
  $t = [System.IO.File]::ReadAllText($f, $utf8)
  $n = Swap $t $old.Replace('\', '\\') $root.Replace('\', '\\')      # escaped form used in .ini values
  $n = Swap $n $old.Replace('\', '/') $root.Replace('\', '/')        # forward-slash form used in the scene collection and the panel address
  $n = Swap $n $old $root
  if ($n -ne $t) { [System.IO.File]::WriteAllText($f, $n, $utf8) }
}
# The panel address is a file URL: spaces and accents in the new path have to be encoded.
$ini = Join-Path $cfg 'user.ini'
$t = [System.IO.File]::ReadAllText($ini, $utf8)
$url = 'file:///' + [uri]::EscapeUriString($root.Replace('\', '/')) + '/painel/mesa.html'
$n = [regex]::Replace($t, '"url":\s*"file:///[^"]*/painel/mesa\.html"', { param($m) '"url": "' + $url + '"' })
if ($n -ne $t) { [System.IO.File]::WriteAllText($ini, $n, $utf8) }

# New password for the control server in the new place; the panel reads it from painel\local.js.
$wsFile = Join-Path $cfg 'plugin_config\obs-websocket\config.json'
if (Test-Path $wsFile) {
  $bytes = New-Object byte[] 18; [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $pass = [Convert]::ToBase64String($bytes).Replace('+', '-').Replace('/', '_')
  $ws = Get-Content $wsFile -Raw | ConvertFrom-Json
  $ws.server_password = $pass
  [System.IO.File]::WriteAllText($wsFile, ($ws | ConvertTo-Json), $utf8)
  $local = "// Gerado por ferramentas\preparar.ps1 a partir da configuracao do servidor WebSocket deste OBS.`nwindow.MESA_LOCAL = " + (@{ url = "ws://127.0.0.1:$($ws.server_port)"; password = $pass } | ConvertTo-Json -Compress) + ";`n"
  [System.IO.File]::WriteAllText((Join-Path $root 'painel\local.js'), $local, $utf8)
}
New-Item -ItemType Directory -Force (Join-Path $root 'gravacoes\iso') | Out-Null
[System.IO.File]::WriteAllText($mark, $root, $utf8)
