# ==============================================================================
# FreeMix Studio — Gerenciador e Auditor de Complementos e Atualizações
# Monitora versões de plugins e do motor OBS diretamente nas fontes oficiais
# ==============================================================================

param(
    [switch]$CheckOnly,
    [switch]$ExportJson,
    [string]$DownloadPlugin = ""
)

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
$binDir = Join-Path $root "bin\64bit"
$pluginDir = Join-Path $root "obs-plugins\64bit"
$dataDir = Join-Path $root "data\obs-plugins"
$cfgDir = Join-Path $root "config"

# Catálogo oficial de componentes essenciais do FreeMix
$components = @(
    @{
        Id = "obs-core"
        Name = "Motor Broadcast Core (libobs / OBS Studio)"
        Repo = "obsproject/obs-studio"
        Dll = "$binDir\obs.dll"
        Type = "Engine"
        Required = $true
    },
    @{
        Id = "downstream-keyer"
        Name = "Downstream Keyer (Overlays DSK Independentes)"
        Repo = "Exeldro/obs-downstream-keyer"
        Dll = "$pluginDir\downstream-keyer.dll"
        Type = "Overlay"
        Required = $true
    },
    @{
        Id = "source-record"
        Name = "Source Record (Gravação ISO MultiCorder)"
        Repo = "Exeldro/obs-source-record"
        Dll = "$pluginDir\source-record.dll"
        Type = "ISO Recording"
        Required = $true
    },
    @{
        Id = "replay-source"
        Name = "Replay Source (Buffer de Câmera Lenta Instantâneo)"
        Repo = "Exeldro/obs-replay-source"
        Dll = "$pluginDir\replay-source.dll"
        Type = "Replay"
        Required = $true
    },
    @{
        Id = "move-transition"
        Name = "Move Transition (Animações e DVE Dinâmicos)"
        Repo = "Exeldro/obs-move-transition"
        Dll = "$pluginDir\move-transition.dll"
        Type = "Transitions"
        Required = $false
    },
    @{
        Id = "source-dock"
        Name = "Source Dock (Monitores e Docks de Fontes)"
        Repo = "Exeldro/obs-source-dock"
        Dll = "$pluginDir\source-dock.dll"
        Type = "Monitoring"
        Required = $false
    },
    @{
        Id = "media-playlist"
        Name = "Media Playlist Source (Listas de Reprodução)"
        Repo = "norihiro/obs-media-playlist-source"
        Dll = "$pluginDir\media-playlist-source.dll"
        Type = "Media"
        Required = $false
    },
    @{
        Id = "distroav"
        Name = "DistroAV (NDI Broadcast com Alpha Channel)"
        Repo = "DistroAV/DistroAV"
        Dll = "$pluginDir\distroav.dll"
        Type = "NDI IP"
        Required = $false
    },
    @{
        Id = "multi-rtmp"
        Name = "obs-multi-rtmp (MultiStream com NVENC Compartilhado)"
        Repo = "sorayuki/obs-multi-rtmp"
        Dll = "$pluginDir\obs-multi-rtmp.dll"
        Type = "Streaming"
        Required = $false
    }
)

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " FreeMix Studio - Auditoria e Atualizacoes de Complementos       " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$results = @()

foreach ($comp in $components) {
    $dllPath = $comp.Dll
    $installed = Test-Path $dllPath
    $localVersion = "Nao instalado"
    $localSize = 0

    if ($installed) {
        $item = Get-Item $dllPath
        $localSize = [math]::Round($item.Length / 1024)
        if ($item.VersionInfo.ProductVersion) {
            $localVersion = $item.VersionInfo.ProductVersion.Trim()
        } elseif ($item.VersionInfo.FileVersion) {
            $localVersion = $item.VersionInfo.FileVersion.Trim()
        } else {
            $localVersion = "Instalado (" + $localSize + " KB)"
        }
    }

    $remoteVersion = "Consultando..."
    $remoteTag = ""
    $releaseUrl = ""
    $assetUrl = ""

    # Consulta GitHub Releases API
    try {
        $repoName = $comp.Repo
        $uri = "https://api.github.com/repos/$repoName/releases/latest"
        $rel = Invoke-RestMethod -Uri $uri -Headers @{'User-Agent'='FreeMix-Updater'} -TimeoutSec 4
        if ($rel) {
            $remoteTag = [string]$rel.tag_name
            $remoteVersion = $remoteTag.TrimStart('v')
            $releaseUrl = [string]$rel.html_url
            foreach ($asset in $rel.assets) {
                $aName = [string]$asset.name
                if ($aName -like "*windows*" -or $aName -like "*win64*" -or $aName -like "*.zip") {
                    $assetUrl = [string]$asset.browser_download_url
                    break
                }
            }
        }
    } catch {
        $remoteVersion = "Falha de rede/limite GitHub"
    }

    $status = "OK"
    if (-not $installed) {
        if ($comp.Required) {
            $status = "AUSENTE (OBRIGATORIO)"
        } else {
            $status = "OPCIONAL (NAO INSTALADO)"
        }
    } elseif ($remoteTag -and ($localVersion -notlike "*$remoteVersion*")) {
        $status = "NOVA VERSAO ($remoteTag)"
    } else {
        $status = "ATUALIZADO"
    }

    $resObj = [PSCustomObject]@{
        Id = $comp.Id
        Name = $comp.Name
        Tipo = $comp.Type
        Instalado = $installed
        VersaoLocal = $localVersion
        VersaoRemota = $remoteVersion
        Status = $status
        ReleaseUrl = $releaseUrl
        AssetUrl = $assetUrl
        Path = $dllPath
    }
    $results += $resObj

    $color = "Green"
    if ($status -like "*AUSENTE*") { $color = "Red" }
    elseif ($status -like "*NOVA*") { $color = "Yellow" }

    Write-Host "[$status] $($comp.Name)" -ForegroundColor $color
    Write-Host "   Local: $localVersion | Remoto: $remoteVersion" -ForegroundColor Gray
}

# Download opcional
if ($DownloadPlugin -ne "") {
    $targetComp = $results | Where-Object { $_.Id -ieq $DownloadPlugin -or $_.Name -like "*$DownloadPlugin*" } | Select-Object -First 1
    if ($targetComp -and $targetComp.AssetUrl) {
        Write-Host "`nBaixando $($targetComp.Name)..." -ForegroundColor Cyan
        $tempZip = Join-Path $env:TEMP "$($targetComp.Id)-update.zip"
        Invoke-WebRequest -Uri $targetComp.AssetUrl -OutFile $tempZip -UserAgent "FreeMix-Updater"
        Write-Host "Descompactando em $root..." -ForegroundColor Cyan
        & "$env:SystemRoot\System32\tar.exe" -xf $tempZip -C $root
        Remove-Item -Path $tempZip -Force -ErrorAction SilentlyContinue
        Write-Host "Componente $($targetComp.Id) atualizado com sucesso!" -ForegroundColor Green
    }
}

# Salva JSON de status
$jsonFile = Join-Path $cfgDir "plugins-status.json"
$results | ConvertTo-Json -Depth 3 | Set-Content -Path $jsonFile -Encoding UTF8
Write-Host "`nStatus salvo em $jsonFile" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
