param([switch]$Aplicar,[switch]$Remover,[switch]$ControleLAN,[switch]$NDI,[switch]$OMT,[int]$Porta=8088,[string]$Root)
$ErrorActionPreference='Stop'
if(-not $Root){$Root=Split-Path -Parent $PSScriptRoot}
$taskRoot=(Resolve-Path -LiteralPath $Root).Path
if($Porta -lt 1024 -or $Porta -gt 65535){throw 'Porta deve estar entre 1024 e 65535'}
$taskNode=Join-Path $taskRoot 'runtime\node.exe';$taskMotor=Join-Path $taskRoot 'bin\64bit\FreeMix.exe'
foreach($file in @($taskNode,$taskMotor)){if(-not(Test-Path -LiteralPath $file -PathType Leaf)){throw "Arquivo ausente: $file"}}
$sha=[System.Security.Cryptography.SHA256]::Create();$id=([BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($taskRoot.ToLowerInvariant())))).Replace('-','').Substring(0,12)
$group="FreeMix-$id";$rules=@()
if($ControleLAN){$rules+=@{Name="$group-Control";Program=$taskNode;Protocol='TCP';LocalPort="$Porta"}}
if($NDI){$rules+=@{Name="$group-NDI-Discovery";Program=$taskMotor;Protocol='UDP';LocalPort='5353'};$rules+=@{Name="$group-NDI-TCP";Program=$taskMotor;Protocol='TCP';LocalPort='5960-5999'};$rules+=@{Name="$group-NDI-UDP";Program=$taskMotor;Protocol='UDP';LocalPort='5960-5999'}}
if($OMT){$rules+=@{Name="$group-OMT-TCP";Program=$taskMotor;Protocol='TCP';LocalPort='6400-6600'}}
$plan=@{root=$taskRoot;group=$group;privateNetworkOnly=$true;remoteAddress='LocalSubnet';controlLAN=[bool]$ControleLAN;rules=$rules;remove=[bool]$Remover;applied=$false}
if(-not $Aplicar){$plan|ConvertTo-Json -Depth 8;exit 0}
$principal=New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if(-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)){throw 'Execute esta configuração como administrador. A instalação pede elevação uma vez.'}
Get-NetFirewallRule -Group $group -ErrorAction SilentlyContinue|Remove-NetFirewallRule
if(-not $Remover){foreach($rule in $rules){New-NetFirewallRule -Name $rule.Name -DisplayName $rule.Name -Group $group -Direction Inbound -Action Allow -Enabled True -Profile Private -RemoteAddress LocalSubnet -Program $rule.Program -Protocol $rule.Protocol -LocalPort $rule.LocalPort|Out-Null}}
$folder=Join-Path $taskRoot 'config\obs-studio\plugin_config\freemix-control';New-Item -ItemType Directory -Path $folder -Force|Out-Null
$settings=@{format=1;allowLan=[bool]($ControleLAN -and -not $Remover);port=$Porta;firewallGroup=$group;configuredAt=[DateTime]::UtcNow.ToString('o')}
$settings|ConvertTo-Json|Set-Content -LiteralPath (Join-Path $folder 'network.json') -Encoding UTF8
$plan.applied=$true;$plan|ConvertTo-Json -Depth 8
