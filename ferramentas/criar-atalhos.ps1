$root = Split-Path -Parent $PSScriptRoot
$desktop = [Environment]::GetFolderPath("Desktop")
$targetExe = Join-Path $root "bin\64bit\FreeMix.exe"
$workDir = Join-Path $root "bin\64bit"
$ico = Join-Path $PSScriptRoot "freemix.ico"

$WshShell = New-Object -ComObject WScript.Shell

# 1. Atalho na Área de Trabalho (Desktop)
$shortcutDesktop = $WshShell.CreateShortcut((Join-Path $desktop "FreeMix Studio.lnk"))
$shortcutDesktop.TargetPath = $targetExe
$shortcutDesktop.WorkingDirectory = $workDir
$shortcutDesktop.IconLocation = "$targetExe,0"
$shortcutDesktop.Description = "FreeMix Studio - Broadcast Video Production Suite"
$shortcutDesktop.Save()

# 2. Atalho na pasta raiz do projeto
$shortcutFolder = $WshShell.CreateShortcut((Join-Path (Split-Path -Parent $root) "FreeMix Studio.lnk"))
$shortcutFolder.TargetPath = $targetExe
$shortcutFolder.WorkingDirectory = $workDir
$shortcutFolder.IconLocation = "$targetExe,0"
$shortcutFolder.Description = "FreeMix Studio - Broadcast Video Production Suite"
$shortcutFolder.Save()

Write-Output "Atalhos criados com sucesso apontando diretamente para FreeMix.exe!"
