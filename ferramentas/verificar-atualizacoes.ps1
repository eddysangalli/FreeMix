# ==============================================================================
# FreeMix Studio — Gerenciador e Auditor de Complementos e Atualizações
# Monitora versões de plugins e do motor OBS diretamente nas fontes oficiais
# Atualização transacional sem malabarismos com backup preventivo
# ==============================================================================

param(
    [switch]$CheckOnly,
    [switch]$AtualizarTudo,
    [switch]$ExportJson,
    [string]$DownloadPlugin = ""
)

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
$binDir = Join-Path $root "bin\64bit"
$pluginDir = Join-Path $root "obs-plugins\64bit"
$dataDir = Join-Path $root "data\obs-plugins"
$cfgDir = Join-Path $root "config"
$backupDir = Join-Path $root "backup-plugins"

# Catálogo oficial de componentes essenciais do FreeMix Studio
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
        Name = "Downstream Keyer (8 Overlays DSK Independentes)"
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
        Name = "Replay Source (Buffer de Câmera Lenta Multi-Cam)"
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
Write-Host " FreeMix Studio — Auditoria e Atualizacao de Complementos        " -ForegroundColor Cyan
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

    # Consulta GitHub Releases API com timeout seguro
    try {
        $repoName = $comp.Repo
        $uri = "https://api.github.com/repos/$repoName/releases/latest"
        $rel = Invoke-RestMethod -Uri $uri -Headers @{'User-Agent'='FreeMix-Updater'} -TimeoutSec 5
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
        $remoteVersion = "Falha de conexao / Rate Limit"
    }

    $status = "OK"
    if (-not $installed) {
        if ($comp.Required) {
            $status = "AUSENTE (OBRIGATORIO)"
        } else {
            $status = "OPCIONAL (NAO INSTALADO)"
        }
    } elseif ($remoteTag -and ($localVersion -notlike "*$remoteVersion*") -and ($remoteVersion -notlike "*Rate*")) {
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

# Rotina de Download Individual ou Geral Automático
$toDownload = @()
if ($DownloadPlugin -ne "") {
    $target = $results | Where-Object { $_.Id -ieq $DownloadPlugin -or $_.Name -like "*$DownloadPlugin*" } | Select-Object -First 1
    if ($target) { $toDownload += $target }
} elseif ($AtualizarTudo) {
    $toDownload = $results | Where-Object { $_.Status -like "*NOVA*" -or $_.Status -like "*AUSENTE*" }
}

if ($toDownload.Count -gt 0) {
    if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir -Force | Out-Null }
    $todayBackup = Join-Path $backupDir (Get-Date -Format "yyyy-MM-dd_HH-mm")
    New-Item -ItemType Directory -Path $todayBackup -Force | Out-Null

    foreach ($item in $toDownload) {
        if (-not $item.AssetUrl) {
            Write-Host "Asset de download nao encontrado para $($item.Name)." -ForegroundColor Yellow
            continue
        }

        Write-Host "`nBaixando atualizacao para: $($item.Name)..." -ForegroundColor Cyan
        
        # Backup prévio se arquivo já existe
        if (Test-Path $item.Path) {
            Copy-Item -Path $item.Path -Destination $todayBackup -Force
            Write-Host "   Backup preventivo criado em: $todayBackup" -ForegroundColor Gray
        }

        $tempZip = Join-Path $env:TEMP "$($item.Id)-update.zip"
        try {
            Invoke-WebRequest -Uri $item.AssetUrl -OutFile $tempZip -UserAgent "FreeMix-Updater"
            Write-Host "   Extraindo pacote em $root..." -ForegroundColor Cyan
            & "$env:SystemRoot\System32\tar.exe" -xf $tempZip -C $root
            Remove-Item -Path $tempZip -Force -ErrorAction SilentlyContinue
            Write-Host "   ✓ Atualizacao de $($item.Name) concluida com sucesso!" -ForegroundColor Green
        } catch {
            Write-Host "   ✗ Erro ao atualizar $($item.Name): $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# Salva JSON de status para leitura da UI do FreeMix
if (-not (Test-Path $cfgDir)) { New-Item -ItemType Directory -Path $cfgDir -Force | Out-Null }
$jsonFile = Join-Path $cfgDir "plugins-status.json"
$results | ConvertTo-Json -Depth 3 | Set-Content -Path $jsonFile -Encoding UTF8
Write-Host "`nRelatorio de integridade exportado para: $jsonFile" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
