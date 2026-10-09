# Restore only the FreeMix visual layout, keeping production, sources and devices.
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
if(Get-Process FreeMix,obs64 -ErrorAction SilentlyContinue|Where-Object {$_.Path -and $_.Path.StartsWith($root+'\',[StringComparison]::OrdinalIgnoreCase)}){throw 'Feche esta cópia do FreeMix antes de restaurar o visual'}
$cfg=Join-Path $root 'config/obs-studio'
$file=Join-Path $cfg 'user.ini'
$visual=Get-Content -LiteralPath (Join-Path $root 'painel/layout-padrao.json') -Raw|ConvertFrom-Json
$backup=Join-Path $root ('originais/layout-'+(Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $backup -Force|Out-Null
Copy-Item -LiteralPath $file -Destination (Join-Path $backup 'user.ini')
$text=[IO.File]::ReadAllText($file)
function SetVisual([string]$section,[string]$key,[string]$value){
 $pattern='(?ms)(^\['+[regex]::Escape($section)+'\]\r?\n)(.*?)(?=^\[|\z)'
 if($script:text -notmatch $pattern){$script:text += "`n[$section]`n$key=$value`n";return}
 $script:text=[regex]::Replace($script:text,$pattern,{param($m)
  $body=$m.Groups[2].Value;$line='(?m)^'+[regex]::Escape($key)+'=[^\r\n]*'
  if($body -match $line){$body=[regex]::Replace($body,$line,{param($unused)$key+'='+$value})}else{$body=$key+'='+$value+"`n"+$body}
  $m.Groups[1].Value+$body
 })
}
SetVisual 'BasicWindow' 'DockState' $visual.dockState
SetVisual 'BasicWindow' 'geometry' $visual.geometry
SetVisual 'BasicWindow' 'ShowContextToolbars' 'false'
SetVisual 'BasicWindow' 'ShowStatusBar' 'false'
SetVisual 'BasicWindow' 'SideDocks' 'false'
SetVisual 'BasicWindow' 'DocksLocked' 'true'
SetVisual 'Appearance' 'Theme' 'local.mesadecorte.Yami'
New-Item -ItemType Directory -Path (Join-Path $cfg 'themes') -Force|Out-Null
Copy-Item -LiteralPath (Join-Path $root 'painel/tema-padrao.ovt') -Destination (Join-Path $cfg 'themes/Yami_MesaDeCorte.ovt')
$utf8=New-Object System.Text.UTF8Encoding $false
[IO.File]::WriteAllText($file,$text,$utf8)
'Visual FreeMix restaurado; configurações anteriores preservadas em originais.'
